import React, { useState } from 'react';
import {
  Newspaper,
  BookOpen,
  Volume2,
  Eye,
  EyeOff,
  MessageSquare,
} from 'lucide-react';
import { NEWS_ARTICLES, MANGA_EPISODES, NewsArticle, MangaEpisode } from '../data/deutschData';
import { speechEngine } from '../utils/speech';

interface NewsMangaReaderViewProps {
  onSelectWord: (word: string, sentence: string) => void;
}

export const NewsMangaReaderView: React.FC<NewsMangaReaderViewProps> = ({ onSelectWord }) => {
  const [readerMode, setReaderMode] = useState<'news' | 'manga'>('news');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(NEWS_ARTICLES[0].id);
  const [selectedMangaId, setSelectedMangaId] = useState<string>(MANGA_EPISODES[0].id);
  const [showVietnamese, setShowVietnamese] = useState<boolean>(true);
  const [showGrammarNotes, setShowGrammarNotes] = useState<boolean>(true);
  const [mangaLangMode, setMangaLangMode] = useState<'bilingual' | 'de_only' | 'vi_only'>('bilingual');

  const currentArticle: NewsArticle =
    NEWS_ARTICLES.find((a) => a.id === selectedArticleId) || NEWS_ARTICLES[0];
  const currentManga: MangaEpisode =
    MANGA_EPISODES.find((m) => m.id === selectedMangaId) || MANGA_EPISODES[0];

  const renderClickableGerman = (text: string) => {
    return text.split(/\s+/).map((token, idx) => (
      <React.Fragment key={idx}>
        <span
          onClick={() => onSelectWord(token, text)}
          className="cursor-pointer rounded-xs px-0.5 transition-colors hover:bg-emerald-500/25 hover:text-emerald-200"
          title="Nhấp để tra từ & lưu vào Kho B1–C1"
        >
          {token}
        </span>{' '}
      </React.Fragment>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher & Reader Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
          <button
            type="button"
            onClick={() => setReaderMode('news')}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 sm:flex-initial ${
              readerMode === 'news'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Newspaper className="h-4 w-4" />
            <span>Báo Đức Song Ngữ (B1–C1)</span>
          </button>
          <button
            type="button"
            onClick={() => setReaderMode('manga')}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 sm:flex-initial ${
              readerMode === 'manga'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Manga & Hội Thoại Đời Thường</span>
          </button>
        </div>

        {readerMode === 'news' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVietnamese((p) => !p)}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                showVietnamese
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-800 bg-[#080d1a] text-slate-400 hover:text-slate-200'
              }`}
            >
              {showVietnamese ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span>Bản dịch tiếng Việt</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGrammarNotes((p) => !p)}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                showGrammarNotes
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                  : 'border-slate-800 bg-[#080d1a] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Điểm ngữ pháp báo chí</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
            {[
              { id: 'bilingual', label: 'Song Ngữ' },
              { id: 'de_only', label: 'Chỉ Tiếng Đức' },
              { id: 'vi_only', label: 'Chỉ Tiếng Việt' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setMangaLangMode(mode.id as 'bilingual' | 'de_only' | 'vi_only')}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  mangaLangMode === mode.id
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODE 1: GERMAN BILINGUAL NEWS READER */}
      {readerMode === 'news' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Article Body (8 cols on lg) */}
          <article className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-5 sm:p-8 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-emerald-400">{currentArticle.source}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">CEFR {currentArticle.level}</span>
              <span aria-hidden="true">·</span>
              <span>{currentArticle.publishedDate}</span>
              <span aria-hidden="true">·</span>
              <span>{currentArticle.readTime}</span>
            </div>

            <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-slate-100 sm:text-3xl">
              {renderClickableGerman(currentArticle.titleDe)}
            </h2>
            {showVietnamese && (
              <p className="mt-2 text-base font-medium text-emerald-300">
                {currentArticle.titleVi}
              </p>
            )}

            {/* Lead Paragraph */}
            <div className="mt-6 rounded-xl border border-slate-800/90 bg-[#080d1a] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-400">Tóm tắt mở đầu (Vorspann)</span>
                <button
                  type="button"
                  onClick={() => speechEngine.speak(currentArticle.leadDe, { rate: 0.95 })}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-slate-700 whitespace-nowrap shrink-0"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Nghe đoạn mở đầu</span>
                </button>
              </div>
              <p className="mt-2.5 text-base font-semibold leading-relaxed text-slate-100 sm:text-lg">
                {renderClickableGerman(currentArticle.leadDe)}
              </p>
              {showVietnamese && (
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {currentArticle.leadVi}
                </p>
              )}
            </div>

            {/* Article Paragraphs */}
            <div className="mt-6 space-y-6">
              {currentArticle.paragraphs.map((para, idx) => (
                <div
                  key={idx}
                  className="border-b border-slate-800/70 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      Đoạn 0{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => speechEngine.speak(para.de, { rate: 0.95 })}
                      className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Đọc đoạn này</span>
                    </button>
                  </div>

                  <p className="mt-2 text-base leading-relaxed text-slate-100 sm:text-lg">
                    {renderClickableGerman(para.de)}
                  </p>

                  {showVietnamese && (
                    <p className="mt-2.5 text-sm leading-relaxed text-emerald-300/90">
                      {para.vi}
                    </p>
                  )}

                  {showGrammarNotes && (
                    <div className="mt-3 rounded-lg border border-slate-800/80 bg-[#080d1a] px-3.5 py-2 text-xs text-slate-400">
                      <span className="font-semibold text-sky-400">Cấu trúc báo chí: </span>
                      {para.grammarHighlight}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </article>

          {/* Sidebar Article Selector (4 cols on lg) */}
          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 sm:p-5">
              <h3 className="text-base font-bold text-slate-100">Chuyên Mục Báo Đức Hôm Nay</h3>
              <p className="mt-1 text-xs text-slate-400">
                Chọn bài báo theo cấp độ B1–C1. Nhấp vào bất kỳ từ nào trong bài để tra giống danh từ.
              </p>

              <div className="mt-4 space-y-3">
                {NEWS_ARTICLES.map((art) => {
                  const active = art.id === currentArticle.id;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        speechEngine.stop();
                        setSelectedArticleId(art.id);
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-emerald-500/60 bg-emerald-950/25'
                          : 'border-slate-800/80 bg-[#080d1a] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono font-semibold text-emerald-400">{art.level}</span>
                        <span aria-hidden="true">·</span>
                        <span>{art.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span>{art.readTime}</span>
                      </div>
                      <div className="mt-1.5 text-sm font-bold text-slate-100">
                        {art.titleDe}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{art.titleVi}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* MODE 2: MANGA / GRAPHIC DIALOGUE READER */}
      {readerMode === 'manga' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-mono font-semibold text-emerald-400">
                  CEFR {currentManga.level}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentManga.location}</span>
              </div>
              <h2 className="mt-1.5 text-xl font-bold text-slate-100 sm:text-2xl">
                {currentManga.titleDe}
              </h2>
              <p className="mt-1 text-sm text-emerald-300">{currentManga.titleVi}</p>
              <div className="mt-3 rounded-lg border border-slate-800 bg-[#080d1a] p-3.5 text-xs text-slate-300">
                <span className="font-semibold text-amber-400">Bối cảnh văn hoá Đức: </span>
                {currentManga.culturalNote}
              </div>
            </div>

            {/* Comic Panels Grid */}
            <div className="space-y-6">
              {currentManga.panels.map((panel) => (
                <div
                  key={panel.panelNumber}
                  className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0d1424]"
                >
                  {/* Visual Manga Scene Header Banner (Custom Illustrated Scene) */}
                  <div className="relative border-b border-slate-800 bg-gradient-to-r from-[#0c192e] via-[#11223d] to-[#0b1526] p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                        KHUNG TRUYỆN #{panel.panelNumber}
                      </span>
                      <span className="text-xs text-slate-400">{currentManga.location}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-200">
                      {panel.sceneCaptionDe}
                    </p>
                    {mangaLangMode !== 'de_only' && (
                      <p className="mt-0.5 text-xs text-slate-400">{panel.sceneCaptionVi}</p>
                    )}
                  </div>

                  {/* Speech Bubbles */}
                  <div className="space-y-4 p-4 sm:p-6">
                    {panel.dialogues.map((dlg, dIdx) => (
                      <div
                        key={dIdx}
                        className={`rounded-xl border p-4 ${
                          dIdx % 2 === 0
                            ? 'border-slate-800 bg-[#080d1a] sm:mr-8'
                            : 'border-emerald-500/30 bg-emerald-950/15 sm:ml-8'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-bold text-slate-100">{dlg.speaker}</span>
                            <span aria-hidden="true" className="text-slate-500">·</span>
                            <span className="text-slate-400">{dlg.role}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => speechEngine.speak(dlg.de, { rate: 0.95 })}
                            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-slate-700 whitespace-nowrap shrink-0"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>Nghe thoại</span>
                          </button>
                        </div>

                        {mangaLangMode !== 'vi_only' && (
                          <p className="mt-2.5 text-base font-semibold leading-relaxed text-slate-100 sm:text-lg">
                            {renderClickableGerman(dlg.de)}
                          </p>
                        )}

                        {mangaLangMode !== 'de_only' && (
                          <p className="mt-1.5 text-sm text-emerald-300/95">{dlg.vi}</p>
                        )}

                        <div className="mt-3 border-t border-slate-800/80 pt-2 text-xs text-slate-400">
                          <span className="font-semibold text-amber-300">Mẹo giao tiếp bản xứ: </span>
                          {dlg.particleNote}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Manga Episode Selector */}
          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 sm:p-5">
              <h3 className="text-base font-bold text-slate-100">Danh Sách Tập Truyện Đời Thường</h3>
              <p className="mt-1 text-xs text-slate-400">
                Học các trợ từ tình thái (doch, mal, bloß, halt) trong hội thoại thực tế của sinh viên và người đi làm tại Đức.
              </p>

              <div className="mt-4 space-y-3">
                {MANGA_EPISODES.map((ep) => {
                  const active = ep.id === currentManga.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        speechEngine.stop();
                        setSelectedMangaId(ep.id);
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-emerald-500/60 bg-emerald-950/25'
                          : 'border-slate-800/80 bg-[#080d1a] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono font-semibold text-emerald-400">{ep.level}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{ep.location}</span>
                      </div>
                      <div className="mt-1.5 text-sm font-bold text-slate-100">{ep.titleDe}</div>
                      <p className="mt-1 text-xs text-slate-400">{ep.titleVi}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
