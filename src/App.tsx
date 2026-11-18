/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Languages,
  Radio,
  Mic,
  Newspaper,
  BookMarked,
} from 'lucide-react';
import { INITIAL_VOCABULARY, VocabItem } from './data/deutschData';
import { LectureTranslatorView } from './components/LectureTranslatorView';
import { PlaylistRadioView } from './components/PlaylistRadioView';
import { ShadowingStudioView } from './components/ShadowingStudioView';
import { NewsMangaReaderView } from './components/NewsMangaReaderView';
import { VocabVaultView } from './components/VocabVaultView';
import { WordLookupModal } from './components/WordLookupModal';
import { speechEngine } from './utils/speech';

type ActiveTab = 'lecture' | 'playlist' | 'shadowing' | 'reader' | 'vocab';

const STORAGE_KEY_VOCAB = 'deutschmaster_vocab_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('lecture');
  const [vocabSubMode, setVocabSubMode] = useState<'vault' | 'srs' | 'artikel'>('vault');
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOCAB);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial vocabulary
    }
    return INITIAL_VOCABULARY;
  });

  // Global word lookup modal state
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const [lookupContext, setLookupContext] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(vocabList));
    } catch {
      // Ignore storage quota errors
    }
  }, [vocabList]);

  const handleSwitchTab = (tab: ActiveTab, subMode?: 'vault' | 'srs' | 'artikel') => {
    speechEngine.stop();
    if (subMode) {
      setVocabSubMode(subMode);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWord = (word: string, sentence: string) => {
    setLookupWord(word);
    setLookupContext(sentence);
  };

  const handleSaveVocab = (newItem: VocabItem) => {
    setVocabList((prev) => {
      const exists = prev.some((v) => v.word.toLowerCase() === newItem.word.toLowerCase());
      if (exists) return prev;
      return [newItem, ...prev];
    });
  };

  const handleRemoveVocab = (id: string) => {
    setVocabList((prev) => prev.filter((item) => item.id !== id));
  };

  const navItems: { id: ActiveTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'lecture', label: 'Dịch Bài Giảng', shortLabel: 'Bài giảng', icon: Languages },
    { id: 'playlist', label: 'Playlist & Đài Đức', shortLabel: 'Đài Đức', icon: Radio },
    { id: 'shadowing', label: 'Shadowing', shortLabel: 'Shadowing', icon: Mic },
    { id: 'reader', label: 'Đọc Báo & Manga', shortLabel: 'Đọc báo', icon: Newspaper },
    { id: 'vocab', label: 'Kho Từ B1–C1', shortLabel: 'Từ vựng', icon: BookMarked },
  ];

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 pb-20 md:pb-12">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080d1a]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#lecture"
            onClick={(e) => {
              e.preventDefault();
              handleSwitchTab('lecture');
            }}
            className="text-lg font-extrabold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
          >
            DeutschMaster
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSwitchTab(item.id, item.id === 'vocab' ? 'vault' : undefined)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-emerald-400 underline decoration-emerald-400 decoration-2 underline-offset-8'
                      : 'hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleSwitchTab('vocab', 'srs')}
              className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 whitespace-nowrap shrink-0"
            >
              Ôn Tập SRS ({vocabList.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Contextual SLA Banner */}
        <section className="mb-6 rounded-xl border border-slate-800/80 bg-[#0d1424] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>Phương pháp Tiếp thu Ngôn ngữ Tự nhiên (SLA Comprehensible Input)</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-emerald-400">Trình độ B1 – C1</span>
                <span aria-hidden="true">·</span>
                <span>Nhấp vào bất kỳ từ tiếng Đức nào để tra cứu ngay</span>
              </div>
              <h1
                className="mt-1 text-xl font-bold tracking-tight text-slate-100 sm:text-2xl"
                style={{ textWrap: 'balance' }}
              >
                {activeTab === 'lecture' && 'Dịch Bài Giảng Trực Tiếp & Mổ Xẻ Tư Duy Câu Tiếng Đức'}
                {activeTab === 'playlist' && 'Trình Phát Playlist & Đài Phát Thanh Quốc Gia Đức'}
                {activeTab === 'shadowing' && 'Phòng Luyện Phát Âm, Trọng Âm & Ngữ Điệu Shadowing'}
                {activeTab === 'reader' && 'Đọc Báo Chí Đức & Truyện Tranh Hội Thoại Đời Thường'}
                {activeTab === 'vocab' && 'Kho Từ Vựng B1–C1 & Phản Xạ Mạo Từ Der / Die / Das'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono tabular-nums">
              <div>
                Kho từ đã lưu: <strong className="text-slate-100">{vocabList.length} từ</strong>
              </div>
              <span aria-hidden="true">·</span>
              <div>
                Giọng đọc: <strong className="text-emerald-400">Standarddeutsch (de-DE)</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Active View Stage */}
        {activeTab === 'lecture' && (
          <LectureTranslatorView
            onSelectWord={handleSelectWord}
            onSaveVocab={handleSaveVocab}
            savedVocab={vocabList}
          />
        )}

        {activeTab === 'playlist' && (
          <PlaylistRadioView onSelectWord={handleSelectWord} />
        )}

        {activeTab === 'shadowing' && (
          <ShadowingStudioView onSelectWord={handleSelectWord} />
        )}

        {activeTab === 'reader' && (
          <NewsMangaReaderView onSelectWord={handleSelectWord} />
        )}

        {activeTab === 'vocab' && (
          <VocabVaultView
            key={vocabSubMode}
            vocabList={vocabList}
            onAddVocab={handleSaveVocab}
            onRemoveVocab={handleRemoveVocab}
            initialSubMode={vocabSubMode}
          />
        )}
      </main>

      {/* Desktop Footer */}
      <footer className="mx-auto mt-16 max-w-7xl border-t border-slate-800/80 px-4 py-6 text-xs text-slate-400 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <span>DeutschMaster — Nền tảng học tiếng Đức tự nhiên theo phương pháp SLA (B1–C1)</span>
          <span>Dịch bài giảng · Đài phát thanh Đức · Shadowing · Báo & Manga · Kho từ vựng</span>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar (Thumb-Zone Navigation for screens < md) */}
      <nav
        aria-label="Điều hướng di động"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-slate-800 bg-[#080d1a]/95 backdrop-blur-md md:hidden"
      >
        <div className="grid h-14 grid-cols-5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSwitchTab(item.id, item.id === 'vocab' ? 'vault' : undefined)}
                className={`flex min-h-[44px] flex-col items-center justify-center transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="mt-1 text-[10px] font-medium tracking-tight whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Interactive German Word Dictionary Modal */}
      <WordLookupModal
        selectedWord={lookupWord}
        contextSentence={lookupContext}
        onClose={() => setLookupWord(null)}
        onSaveVocab={handleSaveVocab}
        savedVocab={vocabList}
      />
    </div>
  );
};
