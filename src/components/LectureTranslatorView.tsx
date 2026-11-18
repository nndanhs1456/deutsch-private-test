import React, { useState } from 'react';
import {
  Volume2,
  Square,
  Sparkles,
  BookOpen,
  Languages,
  BookmarkPlus,
  Check,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
} from 'lucide-react';
import { LectureItem, PRELOADED_LECTURES, VocabItem } from '../data/deutschData';
import { speechEngine } from '../utils/speech';

interface LectureTranslatorViewProps {
  onSelectWord: (word: string, sentence: string) => void;
  onSaveVocab: (item: VocabItem) => void;
  savedVocab: VocabItem[];
}

export const LectureTranslatorView: React.FC<LectureTranslatorViewProps> = ({
  onSelectWord,
  onSaveVocab,
  savedVocab,
}) => {
  const [lectures, setLectures] = useState<LectureItem[]>(PRELOADED_LECTURES);
  const [selectedLectureId, setSelectedLectureId] = useState<string>(PRELOADED_LECTURES[0].id);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [showLiteralChunk, setShowLiteralChunk] = useState<boolean>(true);
  const [showGrammarNote, setShowGrammarNote] = useState<boolean>(true);

  // Custom Lecture / Live Transcript Input state
  const [customText, setCustomText] = useState<string>('');
  const [targetLevel, setTargetLevel] = useState<'B1' | 'B2' | 'C1'>('B2');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [isListeningDictation, setIsListeningDictation] = useState<boolean>(false);

  const currentLecture = lectures.find((l) => l.id === selectedLectureId) || lectures[0];

  const handlePlaySegment = (segmentId: string, textDe: string) => {
    if (activeSegmentId === segmentId && speechEngine.isSpeaking()) {
      speechEngine.stop();
      setActiveSegmentId(null);
      setIsPlayingAll(false);
      return;
    }

    setIsPlayingAll(false);
    setActiveSegmentId(segmentId);
    speechEngine.speak(textDe, {
      rate: speechRate,
      onEnd: () => {
        setActiveSegmentId(null);
      },
    });
  };

  const handlePlayEntireLecture = () => {
    if (isPlayingAll) {
      speechEngine.stop();
      setIsPlayingAll(false);
      setActiveSegmentId(null);
      return;
    }

    const segments = currentLecture.segments;
    if (!segments.length) return;

    setIsPlayingAll(true);
    let index = 0;

    const playNext = () => {
      if (index >= segments.length) {
        setIsPlayingAll(false);
        setActiveSegmentId(null);
        return;
      }
      const seg = segments[index];
      setActiveSegmentId(seg.id);
      speechEngine.speak(seg.de, {
        rate: speechRate,
        onEnd: () => {
          index += 1;
          playNext();
        },
      });
    };

    playNext();
  };

  const handleVoiceDictation = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      // Populate a realistic live lecture snippet if browser lacks SpeechRecognition
      setCustomText(
        'In der heutigen Vorlesung untersuchen wir, wie erneuerbare Energien und digitale Stromnetze die deutsche Wirtschaft langfristig verändern. Wer Fragen hat, kann sich jederzeit melden.'
      );
      return;
    }

    if (isListeningDictation) {
      setIsListeningDictation(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningDictation(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setCustomText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListeningDictation(false);
      recognition.onend = () => setIsListeningDictation(false);
      recognition.start();
    } catch {
      setIsListeningDictation(false);
    }
  };

  const handleTranslateCustomLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;

    setIsTranslating(true);
    setTranslateError(null);

    try {
      const response = await fetch('/api/translate-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          germanText: customText.trim(),
          level: targetLevel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Không thể phân tích bài giảng.');
      }

      const newId = `lec-custom-${Date.now()}`;
      const newLecture: LectureItem = {
        id: newId,
        title: data.title || 'Bài giảng tiếng Đức tự nhập (Phân tích SLA)',
        speaker: 'Trình phân tích SLA trực tiếp',
        institution: `Phân tích ngữ pháp & ngữ cảnh ${targetLevel}`,
        level: targetLevel,
        duration: `${Math.max(1, Math.ceil((data.segments?.length || 1) * 0.4))}:00`,
        topic: 'Bài giảng tuỳ chỉnh',
        summaryVi: data.summaryVi || 'Bản dịch và phân tích cấu trúc câu theo phương pháp tiếp thu tự nhiên.',
        segments: (data.segments || []).map((seg: any, idx: number) => ({
          id: `${newId}-seg-${idx}`,
          timestamp: `00:${String(idx * 18).padStart(2, '0')}`,
          de: seg.de,
          vi: seg.vi,
          literalChunk: seg.literalChunk || seg.vi,
          grammarNote: seg.grammarNote || 'Cấu trúc câu tiếng Đức tiêu chuẩn.',
          cefr: ['B1', 'B2', 'C1'].includes(seg.cefr) ? seg.cefr : targetLevel,
        })),
        keyVocab: (data.keyVocab || []).map((v: any, idx: number) => ({
          id: `${newId}-voc-${idx}`,
          word: v.word,
          article: ['der', 'die', 'das'].includes(v.article) ? v.article : '',
          plural: v.plural || '',
          ipa: v.ipa || '',
          meaningVi: v.meaningVi,
          level: ['B1', 'B2', 'C1'].includes(v.level) ? v.level : targetLevel,
          category: 'Bài giảng trực tiếp',
          collocation: v.exampleDe || v.word,
          exampleDe: v.exampleDe || '',
          exampleVi: v.exampleVi || '',
          mastery: 50,
        })),
      };

      setLectures((prev) => [newLecture, ...prev]);
      setSelectedLectureId(newId);
      setCustomText('');
    } catch (err: any) {
      setTranslateError(err.message || 'Đã xảy ra lỗi khi gọi Gemini API.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Interactive Stage (7 cols on lg): Active Lecture Breakdown */}
      <div className="space-y-6 lg:col-span-8">
        {/* Lecture Header & Playback Bar */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{currentLecture.institution}</span>
            <span aria-hidden="true">·</span>
            <span>Giảng viên: {currentLecture.speaker}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">Trình độ {currentLecture.level}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{currentLecture.duration}</span>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
            {currentLecture.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {currentLecture.summaryVi}
          </p>

          {/* Controls Toolbar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePlayEntireLecture}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isPlayingAll
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {isPlayingAll ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Dừng phát bài giảng</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>Nghe toàn bộ bài giảng</span>
                  </>
                )}
              </button>

              {/* Speed Segmented Control */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
                {[0.8, 0.95, 1.1].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      speechRate === rate
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Display Layer Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLiteralChunk((prev) => !prev)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  showLiteralChunk
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tách cụm tư duy Đức (Word-Chunking)
              </button>
              <button
                type="button"
                onClick={() => setShowGrammarNote((prev) => !prev)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  showGrammarNote
                    ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                Giải thích Ngữ pháp SLA
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Sentence-by-Sentence SLA Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Nhấp vào bất kỳ từ tiếng Đức nào để mở từ điển giống từ (der/die/das) & lưu vào Kho B1–C1</span>
            <span className="font-mono tabular-nums">{currentLecture.segments.length} phân đoạn</span>
          </div>

          {currentLecture.segments.map((seg, idx) => {
            const isSegmentActive = activeSegmentId === seg.id;
            const words = seg.de.split(/\s+/);

            return (
              <div
                key={seg.id}
                className={`rounded-xl border p-5 transition-colors ${
                  isSegmentActive
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-slate-800/90 bg-[#0d1424] hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{seg.timestamp}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">CEFR {seg.cefr}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlaySegment(seg.id, seg.de)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isSegmentActive
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{isSegmentActive ? 'Đang đọc...' : 'Phát câu'}</span>
                  </button>
                </div>

                {/* Clickable German Sentence */}
                <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-100">
                  {words.map((token, wIdx) => (
                    <React.Fragment key={wIdx}>
                      <span
                        onClick={() => onSelectWord(token, seg.de)}
                        className="cursor-pointer rounded-xs px-0.5 transition-colors hover:bg-emerald-500/25 hover:text-emerald-200"
                        title="Nhấn để tra cứu từ này"
                      >
                        {token}
                      </span>{' '}
                    </React.Fragment>
                  ))}
                </p>

                {/* Natural Vietnamese Translation */}
                <p className="mt-2 text-sm font-medium text-emerald-300/95">
                  {seg.vi}
                </p>

                {/* SLA Literal Chunking */}
                {showLiteralChunk && (
                  <div className="mt-3 rounded-lg border border-slate-800/80 bg-[#080d1a] px-3.5 py-2.5">
                    <div className="text-xs font-medium text-slate-400">
                      Tư duy trật tự từ tiếng Đức (Word-by-Word Chunking):
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-slate-300">{seg.literalChunk}</p>
                  </div>
                )}

                {/* Grammar Point */}
                {showGrammarNote && (
                  <div className="mt-2.5 flex items-baseline gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-sky-400 shrink-0">Cấu trúc:</span>
                    <span>{seg.grammarNote}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Control & Input Deck (4 cols on lg) */}
      <div className="space-y-6 lg:col-span-4">
        {/* Selector for Preloaded Lectures */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Thư Viện Bài Giảng Mẫu</h3>
            <span className="font-mono text-xs text-slate-400 tabular-nums">{lectures.length} bài</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Chọn bài giảng đại học hoặc hội thoại tâm lý học để nghe và mổ xẻ cấu trúc câu.
          </p>

          <div className="mt-4 space-y-2.5">
            {lectures.map((lec) => {
              const isSelected = lec.id === selectedLectureId;
              return (
                <button
                  key={lec.id}
                  type="button"
                  onClick={() => {
                    speechEngine.stop();
                    setIsPlayingAll(false);
                    setActiveSegmentId(null);
                    setSelectedLectureId(lec.id);
                  }}
                  className={`w-full rounded-lg border p-3.5 text-left transition-colors ${
                    isSelected
                      ? 'border-emerald-500/60 bg-emerald-950/25'
                      : 'border-slate-800/80 bg-[#080d1a] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono font-semibold text-emerald-400">{lec.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lec.topic}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{lec.duration}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100 line-clamp-2">
                    {lec.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Lecture / Transcript Translator Input Box */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Dịch Bài Giảng Trực Tiếp (AI SLA)</h3>
            <Languages className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Dán phụ đề bài giảng trên lớp, đoạn ghi âm tiếng Đức hoặc thu âm giọng nói để tách câu, dịch song ngữ và rút trích từ vựng B1–C1.
          </p>

          <form onSubmit={handleTranslateCustomLecture} className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-300">Mức độ phân tích:</span>
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
                {(['B1', 'B2', 'C1'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setTargetLevel(lvl)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                      targetLevel === lvl
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Ví dụ: Obwohl die Digitalisierung an deutschen Hochschulen schnell voranschreitet, bleibt das persönliche Gespräch im Seminar unverzichtbar..."
              className="w-full rounded-lg border border-slate-800 bg-[#080d1a] p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleVoiceDictation}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isListeningDictation
                    ? 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                    : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isListeningDictation ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-emerald-400" />}
                <span>{isListeningDictation ? 'Đang nghe...' : 'Thu âm / Điền mẫu'}</span>
              </button>

              {customText && (
                <button
                  type="button"
                  onClick={() => setCustomText('')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Xoá</span>
                </button>
              )}
            </div>

            {translateError && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300">
                {translateError}
              </p>
            )}

            <button
              type="submit"
              disabled={isTranslating || !customText.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tách câu & phân tích ngữ pháp...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Phân Tích & Dịch Bài Giảng</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Key Vocabulary from Active Lecture */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Từ Vựng Trọng Tâm Bài Giảng</h3>
            <BookOpen className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 space-y-2.5">
            {currentLecture.keyVocab.map((voc) => {
              const isSaved = savedVocab.some((v) => v.word.toLowerCase() === voc.word.toLowerCase());
              return (
                <div
                  key={voc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-[#080d1a] p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                      {voc.article && (
                        <span
                          className={
                            voc.article === 'der'
                              ? 'text-sky-400'
                              : voc.article === 'die'
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }
                        >
                          {voc.article}
                        </span>
                      )}
                      <span className="truncate">{voc.word}</span>
                    </div>
                    <p className="truncate text-xs text-slate-400">{voc.meaningVi}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        speechEngine.speak(voc.article ? `${voc.article} ${voc.word}` : voc.word, {
                          rate: 0.9,
                        })
                      }
                      className="rounded-md border border-slate-800 p-1.5 text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSaveVocab(voc)}
                      disabled={isSaved}
                      className={`rounded-md border p-1.5 transition-colors ${
                        isSaved
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white'
                      }`}
                      title={isSaved ? 'Đã có trong Kho từ' : 'Lưu vào Kho từ'}
                    >
                      {isSaved ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
