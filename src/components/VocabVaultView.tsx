import React, { useState } from 'react';
import {
  Search,
  Volume2,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BookMarked,
  Layers,
  Award,
} from 'lucide-react';
import { VocabItem } from '../data/deutschData';
import { speechEngine } from '../utils/speech';

interface VocabVaultViewProps {
  vocabList: VocabItem[];
  onAddVocab: (item: VocabItem) => void;
  onRemoveVocab: (id: string) => void;
  initialSubMode?: 'vault' | 'srs' | 'artikel';
}

export const VocabVaultView: React.FC<VocabVaultViewProps> = ({
  vocabList,
  onAddVocab,
  onRemoveVocab,
  initialSubMode = 'vault',
}) => {
  const [subMode, setSubMode] = useState<'vault' | 'srs' | 'artikel'>(initialSubMode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'B1' | 'B2' | 'C1'>('ALL');
  const [articleFilter, setArticleFilter] = useState<'ALL' | 'der' | 'die' | 'das'>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New custom vocab state
  const [newWord, setNewWord] = useState<string>('');
  const [newArticle, setNewArticle] = useState<'der' | 'die' | 'das' | ''>('die');
  const [newPlural, setNewPlural] = useState<string>('');
  const [newMeaning, setNewMeaning] = useState<string>('');
  const [newLevel, setNewLevel] = useState<'B1' | 'B2' | 'C1'>('B2');
  const [newCollocation, setNewCollocation] = useState<string>('');
  const [newExampleDe, setNewExampleDe] = useState<string>('');
  const [newExampleVi, setNewExampleVi] = useState<string>('');

  // SRS Flashcard state
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Der / Die / Das Artikel-Trainer state
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedGuess, setSelectedGuess] = useState<'der' | 'die' | 'das' | null>(null);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [correctTotal, setCorrectTotal] = useState<number>(0);

  const filteredVocab = vocabList.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaningVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.collocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || item.level === levelFilter;
    const matchesArt = articleFilter === 'ALL' || item.article === articleFilter;
    return matchesSearch && matchesLevel && matchesArt;
  });

  const nounsForQuiz = vocabList.filter((v) => v.article === 'der' || v.article === 'die' || v.article === 'das');
  const currentQuizItem = nounsForQuiz[quizIndex % Math.max(1, nounsForQuiz.length)];
  const currentSrsCard = filteredVocab[cardIndex % Math.max(1, filteredVocab.length)] || vocabList[0];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;

    onAddVocab({
      id: `v-user-${Date.now()}`,
      word: newWord.trim(),
      article: newArticle,
      plural: newPlural.trim() || 'Substantiv',
      ipa: `/${newWord.trim().toLowerCase()}/`,
      meaningVi: newMeaning.trim(),
      level: newLevel,
      category: 'Tự thêm',
      collocation: newCollocation.trim() || newWord.trim(),
      exampleDe: newExampleDe.trim() || `Das Wort „${newWord.trim()}“ wird im Alltag oft verwendet.`,
      exampleVi: newExampleVi.trim() || newMeaning.trim(),
      mastery: 60,
    });

    setNewWord('');
    setNewPlural('');
    setNewMeaning('');
    setNewCollocation('');
    setNewExampleDe('');
    setNewExampleVi('');
    setShowAddModal(false);
  };

  const handleArticleGuess = (guess: 'der' | 'die' | 'das') => {
    if (selectedGuess !== null || !currentQuizItem) return;
    setSelectedGuess(guess);
    speechEngine.speak(`${currentQuizItem.article} ${currentQuizItem.word}`, { rate: 0.95 });

    if (guess === currentQuizItem.article) {
      setStreakCount((s) => s + 1);
      setCorrectTotal((c) => c + 1);
    } else {
      setStreakCount(0);
    }
  };

  const getArticleColorClass = (art: string) => {
    if (art === 'der') return 'text-sky-400';
    if (art === 'die') return 'text-rose-400';
    if (art === 'das') return 'text-emerald-400';
    return 'text-amber-400';
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Mode Navigation & Summary */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
          <button
            type="button"
            onClick={() => setSubMode('vault')}
            className={`flex min-h-[40px] items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subMode === 'vault'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookMarked className="h-4 w-4" />
            <span>Kho Từ Vựng B1–C1 ({vocabList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubMode('srs');
              setIsFlipped(false);
            }}
            className={`flex min-h-[40px] items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subMode === 'srs'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Flashcard Ôn Tập SRS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubMode('artikel');
              setSelectedGuess(null);
            }}
            className={`flex min-h-[40px] items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subMode === 'artikel'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Luyện Phản Xạ Der / Die / Das</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              <strong className="text-sky-400">der</strong> Nam
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-rose-400">die</strong> Nữ
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-emerald-400">das</strong> Trung
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal((p) => !p)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Từ Mới</span>
          </button>
        </div>
      </div>

      {/* Add New Vocab Form Drawer */}
      {showAddModal && (
        <form
          onSubmit={handleAddSubmit}
          className="rounded-xl border border-slate-800 bg-[#0d1424] p-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100">Thêm Từ Vựng Mới Vào Kho B1–C1</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Đóng
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">Mạo từ (Artikel)</label>
              <select
                value={newArticle}
                onChange={(e) => setNewArticle(e.target.value as 'der' | 'die' | 'das' | '')}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="der">der (Giống đực)</option>
                <option value="die">die (Giống cái)</option>
                <option value="das">das (Giống trung)</option>
                <option value="">Động từ / Tính từ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400">Từ tiếng Đức *</label>
              <input
                type="text"
                required
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="VD: Verantwortung"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400">Số nhiều / Chia từ</label>
              <input
                type="text"
                value={newPlural}
                onChange={(e) => setNewPlural(e.target.value)}
                placeholder="VD: die Verantwortungen"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400">Trình độ CEFR</label>
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value as 'B1' | 'B2' | 'C1')}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="B1">B1 — Trung cấp</option>
                <option value="B2">B2 — Cận cao cấp</option>
                <option value="C1">C1 — Học thuật</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-400">Nghĩa tiếng Việt *</label>
              <input
                type="text"
                required
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                placeholder="VD: Trách nhiệm, sự chịu trách nhiệm"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">
                Cụm từ cố định (Kollokation / Rektion)
              </label>
              <input
                type="text"
                value={newCollocation}
                onChange={(e) => setNewCollocation(e.target.value)}
                placeholder="VD: Verantwortung übernehmen für (+ Akk.)"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-400">Câu ví dụ tiếng Đức</label>
              <input
                type="text"
                value={newExampleDe}
                onChange={(e) => setNewExampleDe(e.target.value)}
                placeholder="VD: Jeder trägt Verantwortung für seine Entscheidungen."
                className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Dịch câu ví dụ</label>
              <input
                type="text"
                value={newExampleVi}
                onChange={(e) => setNewExampleVi(e.target.value)}
                placeholder="VD: Mỗi người đều chịu trách nhiệm cho quyết định của mình."
                className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Lưu Từ Vựng
            </button>
          </div>
        </form>
      )}

      {/* SUBMODE 1: VOCABULARY VAULT GRID */}
      {subMode === 'vault' && (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ tiếng Đức, nghĩa tiếng Việt hoặc cụm giới từ (Rektion)..."
                className="w-full rounded-lg border border-slate-800 bg-[#080d1a] py-2.5 pr-4 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
                {(['ALL', 'B1', 'B2', 'C1'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl)}
                    className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      levelFilter === lvl
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl === 'ALL' ? 'Tất cả cấp' : lvl}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
                {(['ALL', 'der', 'die', 'das'] as const).map((art) => (
                  <button
                    key={art}
                    type="button"
                    onClick={() => setArticleFilter(art)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      articleFilter === art
                        ? 'bg-slate-800 text-slate-100'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {art === 'ALL' ? 'Mọi giống' : art}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vocabulary Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredVocab.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-[#0d1424] p-5 transition-colors hover:border-slate-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono font-semibold text-emerald-400">{item.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.plural}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          speechEngine.speak(
                            item.article ? `${item.article} ${item.word}` : item.word,
                            { rate: 0.9 }
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#080d1a] text-emerald-400 hover:bg-slate-800"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveVocab(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#080d1a] text-slate-500 hover:bg-rose-950/40 hover:text-rose-400"
                        title="Xoá từ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="mt-2 flex items-baseline gap-2 text-xl font-bold text-slate-100">
                    {item.article && (
                      <span className={getArticleColorClass(item.article)}>{item.article}</span>
                    )}
                    <span>{item.word}</span>
                    <span className="font-mono text-xs font-normal text-slate-400">{item.ipa}</span>
                  </h4>

                  <p className="mt-1 text-sm font-semibold text-emerald-300">{item.meaningVi}</p>

                  <div className="mt-3 rounded-lg border border-slate-800/80 bg-[#080d1a] p-3">
                    <div className="text-xs font-medium text-slate-400">Cụm từ (Kollokation):</div>
                    <p className="mt-0.5 text-xs font-medium text-slate-200">{item.collocation}</p>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-800/70 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Ví dụ ngữ cảnh</span>
                    <button
                      type="button"
                      onClick={() => speechEngine.speak(item.exampleDe, { rate: 0.94 })}
                      className="text-xs font-medium text-emerald-400 hover:underline"
                    >
                      Đọc câu
                    </button>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-200">{item.exampleDe}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.exampleVi}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SUBMODE 2: SRS FLASHCARD DECK */}
      {subMode === 'srs' && currentSrsCard && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#0d1424] p-6 sm:p-8">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Thẻ ghi nhớ chủ động (Active Recall SRS)</span>
            <span className="font-mono tabular-nums">
              Thẻ {(cardIndex % filteredVocab.length) + 1} / {filteredVocab.length}
            </span>
          </div>

          <div
            onClick={() => setIsFlipped((f) => !f)}
            className="mt-5 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#080d1a] p-6 text-center transition-colors hover:border-emerald-500/40"
          >
            {!isFlipped ? (
              <>
                <span className="font-mono text-xs text-emerald-400">
                  CEFR {currentSrsCard.level} · {currentSrsCard.category}
                </span>
                <h3 className="mt-3 text-3xl font-bold text-slate-100 sm:text-4xl">
                  {currentSrsCard.article && (
                    <span className={`${getArticleColorClass(currentSrsCard.article)} mr-2`}>
                      {currentSrsCard.article}
                    </span>
                  )}
                  {currentSrsCard.word}
                </h3>
                <p className="mt-2 font-mono text-sm text-slate-400">{currentSrsCard.ipa}</p>
                <p className="mt-6 text-xs text-slate-400">
                  Nhấp vào thẻ để lật xem nghĩa tiếng Việt, cụm từ đi kèm & câu ví dụ
                </p>
              </>
            ) : (
              <div className="space-y-3 text-left w-full">
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-300">
                    {currentSrsCard.meaningVi}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Số nhiều: {currentSrsCard.plural}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#0d1424] p-3.5">
                  <div className="text-xs text-slate-400">Cụm từ cố định:</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-100">
                    {currentSrsCard.collocation}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#0d1424] p-3.5">
                  <div className="text-xs text-slate-400">Ví dụ:</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-100">
                    {currentSrsCard.exampleDe}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{currentSrsCard.exampleVi}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                speechEngine.speak(
                  currentSrsCard.article
                    ? `${currentSrsCard.article} ${currentSrsCard.word}. ${currentSrsCard.exampleDe}`
                    : `${currentSrsCard.word}. ${currentSrsCard.exampleDe}`,
                  { rate: 0.92 }
                )
              }
              className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 text-xs font-semibold text-emerald-300 hover:bg-slate-700"
            >
              <Volume2 className="h-4 w-4" />
              <span>Phát âm từ & câu</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCardIndex((i) => i + 1);
                }}
                className="min-h-[44px] rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
              >
                Cần ôn lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCardIndex((i) => i + 1);
                }}
                className="min-h-[44px] rounded-lg bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Đã thuộc vững →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODE 3: DER / DIE / DAS ARTIKEL-TRAINER */}
      {subMode === 'artikel' && currentQuizItem && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#0d1424] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Phản xạ mạo từ danh từ tiếng Đức (Der / Die / Das)</span>
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className="text-emerald-400">Chuỗi đúng: {streakCount}</span>
              <span aria-hidden="true">·</span>
              <span>Tổng đúng: {correctTotal}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-[#080d1a] p-6 text-center">
            <span className="font-mono text-xs text-slate-400">
              CEFR {currentQuizItem.level} · Nghĩa: {currentQuizItem.meaningVi}
            </span>
            <h3 className="mt-3 text-3xl font-bold text-slate-100 sm:text-4xl">
              {selectedGuess ? (
                <span className={getArticleColorClass(currentQuizItem.article)}>
                  {currentQuizItem.article}{' '}
                </span>
              ) : (
                <span className="text-slate-500">___ </span>
              )}
              {currentQuizItem.word}
            </h3>
            <p className="mt-2 text-xs text-slate-400">Số nhiều: {currentQuizItem.plural}</p>

            {/* 3 Gender Buttons */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {(['der', 'die', 'das'] as const).map((art) => {
                const isSelected = selectedGuess === art;
                const isCorrectAnswer = currentQuizItem.article === art;

                let btnStyle =
                  'border-slate-800 bg-[#0d1424] text-slate-200 hover:border-slate-600';
                if (selectedGuess !== null) {
                  if (isCorrectAnswer) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300';
                  }
                }

                return (
                  <button
                    key={art}
                    type="button"
                    onClick={() => handleArticleGuess(art)}
                    className={`min-h-[52px] rounded-xl border text-base font-bold transition-colors ${btnStyle}`}
                  >
                    {art}
                  </button>
                );
              })}
            </div>

            {selectedGuess !== null && (
              <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0d1424] p-4 sm:flex-row">
                <div className="flex items-center gap-2 text-left text-xs">
                  {selectedGuess === currentQuizItem.article ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-semibold">
                        Chính xác! „{currentQuizItem.article} {currentQuizItem.word}“ —{' '}
                        {currentQuizItem.exampleDe}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                      <span className="text-rose-300 font-semibold">
                        Đáp án đúng là „{currentQuizItem.article} {currentQuizItem.word}“.
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedGuess(null);
                    setQuizIndex((q) => q + 1);
                  }}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Từ tiếp theo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
