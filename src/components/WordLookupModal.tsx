import React, { useState, useEffect } from 'react';
import { Volume2, BookmarkPlus, Check, Sparkles, X, Loader2 } from 'lucide-react';
import { VocabItem, QUICK_WORD_DICTIONARY } from '../data/deutschData';
import { speechEngine } from '../utils/speech';

interface WordLookupModalProps {
  selectedWord: string | null;
  contextSentence?: string;
  onClose: () => void;
  onSaveVocab: (item: VocabItem) => void;
  savedVocab: VocabItem[];
}

export const WordLookupModal: React.FC<WordLookupModalProps> = ({
  selectedWord,
  contextSentence = '',
  onClose,
  onSaveVocab,
  savedVocab,
}) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [wordData, setWordData] = useState<{
    word: string;
    article: 'der' | 'die' | 'das' | '';
    plural: string;
    ipa: string;
    meaningVi: string;
    level: 'B1' | 'B2' | 'C1';
    collocation: string;
    exampleDe: string;
    exampleVi: string;
    etymologyNote: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedWord) {
      setWordData(null);
      setAiError(null);
      return;
    }

    const cleaned = selectedWord.replace(/[.,!?;:"„“”()[\]]/g, '').trim();
    const lower = cleaned.toLowerCase();

    // Check existing saved vocabulary first
    const fromVault = savedVocab.find((v) => v.word.toLowerCase() === lower);
    if (fromVault) {
      setWordData({
        word: fromVault.word,
        article: fromVault.article,
        plural: fromVault.plural,
        ipa: fromVault.ipa,
        meaningVi: fromVault.meaningVi,
        level: fromVault.level,
        collocation: fromVault.collocation,
        exampleDe: fromVault.exampleDe,
        exampleVi: fromVault.exampleVi,
        etymologyNote: `Chủ đề: ${fromVault.category}`,
      });
      return;
    }

    // Check quick local dictionary
    const fromQuick = QUICK_WORD_DICTIONARY[lower];
    if (fromQuick) {
      setWordData({
        word: fromQuick.word,
        article: fromQuick.article,
        plural: fromQuick.plural,
        ipa: fromQuick.ipa,
        meaningVi: fromQuick.meaningVi,
        level: fromQuick.level,
        collocation: contextSentence || `im Zusammenhang mit ${fromQuick.word}`,
        exampleDe: contextSentence || `Das Wort „${fromQuick.word}“ ist im Alltag sehr wichtig.`,
        exampleVi: 'Nhấn "Phân tích sâu AI" để xem thêm cấu trúc ghép từ và ví dụ mở rộng.',
        etymologyNote: fromQuick.grammarTip,
      });
      return;
    }

    // Heuristic instant entry + option to run deep Gemini analysis
    const isCapitalized = cleaned.length > 0 && cleaned[0] === cleaned[0].toUpperCase() && cleaned[0] !== cleaned[0].toLowerCase();
    let guessedArticle: 'der' | 'die' | 'das' | '' = '';
    let guessedTip = 'Từ xuất hiện trong ngữ cảnh bài học. Bấm "Phân tích sâu bằng Gemini" để tra cứu đầy đủ gốc từ.';

    if (isCapitalized) {
      if (lower.endsWith('ung') || lower.endsWith('heit') || lower.endsWith('keit') || lower.endsWith('schaft') || lower.endsWith('ion') || lower.endsWith('tät')) {
        guessedArticle = 'die';
        guessedTip = 'Quy tắc hậu tố: Danh từ tận cùng bằng -ung, -heit, -keit, -schaft, -ion, -tät luôn mang giống cái (die).';
      } else if (lower.endsWith('chen') || lower.endsWith('lein') || lower.endsWith('ment') || lower.endsWith('um') || lower.startsWith('ge')) {
        guessedArticle = 'das';
        guessedTip = 'Quy tắc hình thái: Danh từ có hậu tố -chen, -ment, -um hoặc tiền tố Ge- thường mang giống trung (das).';
      } else {
        guessedArticle = 'der';
      }
    }

    setWordData({
      word: cleaned,
      article: guessedArticle,
      plural: isCapitalized ? 'Substantiv' : 'Verb / Adjektiv',
      ipa: `/${lower}/`,
      meaningVi: 'Nhấn nút "Tra cứu chuyên sâu AI" bên dưới để phân tích chính xác nghĩa tiếng Việt & Rektion trong câu.',
      level: 'B2',
      collocation: contextSentence ? `Ngữ cảnh: „${contextSentence}“` : cleaned,
      exampleDe: contextSentence || `Hier steht das Wort „${cleaned}“ im Kontext.`,
      exampleVi: 'Câu ngữ cảnh gốc từ bài học.',
      etymologyNote: guessedTip,
    });
  }, [selectedWord, contextSentence, savedVocab]);

  if (!selectedWord || !wordData) return null;

  const isAlreadySaved = savedVocab.some((v) => v.word.toLowerCase() === wordData.word.toLowerCase());

  const handleDeepAiLookup = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/lookup-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: wordData.word,
          contextSentence,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gọi API tra cứu từ.');
      }
      setWordData({
        word: data.word || wordData.word,
        article: ['der', 'die', 'das'].includes(data.article) ? data.article : '',
        plural: data.plural || wordData.plural,
        ipa: data.ipa || wordData.ipa,
        meaningVi: data.meaningVi || wordData.meaningVi,
        level: ['B1', 'B2', 'C1'].includes(data.level) ? data.level : 'B2',
        collocation: data.collocation || wordData.collocation,
        exampleDe: data.exampleDe || wordData.exampleDe,
        exampleVi: data.exampleVi || wordData.exampleVi,
        etymologyNote: data.etymologyNote || wordData.etymologyNote,
      });
    } catch (err: any) {
      setAiError(err.message || 'Không thể kết nối máy chủ phân tích từ.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSave = () => {
    onSaveVocab({
      id: `v-custom-${Date.now()}`,
      word: wordData.word,
      article: wordData.article,
      plural: wordData.plural,
      ipa: wordData.ipa,
      meaningVi: wordData.meaningVi,
      level: wordData.level,
      category: 'Từ vựng lưu từ bài học',
      collocation: wordData.collocation,
      exampleDe: wordData.exampleDe,
      exampleVi: wordData.exampleVi,
      mastery: 50,
    });
  };

  const getArticleColor = (art: string) => {
    if (art === 'der') return 'text-sky-400';
    if (art === 'die') return 'text-rose-400';
    if (art === 'das') return 'text-emerald-400';
    return 'text-amber-400';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0d1424] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Từ điển SLA Đức – Việt</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">CEFR {wordData.level}</span>
              {wordData.plural && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{wordData.plural}</span>
                </>
              )}
            </div>
            <h3 className="mt-1 flex items-baseline gap-2 text-2xl font-bold tracking-tight text-slate-100">
              {wordData.article && (
                <span className={`font-semibold ${getArticleColor(wordData.article)}`}>
                  {wordData.article}
                </span>
              )}
              <span>{wordData.word}</span>
              <span className="font-mono text-sm font-normal text-slate-400">{wordData.ipa}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                speechEngine.speak(
                  wordData.article ? `${wordData.article} ${wordData.word}` : wordData.word,
                  { rate: 0.9 }
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-emerald-400 transition-colors hover:bg-slate-700"
              title="Nghe phát âm tiếng Đức"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="text-xs font-medium text-slate-400">Nghĩa tiếng Việt</div>
            <p className="mt-1 text-base font-semibold text-emerald-300">{wordData.meaningVi}</p>
          </div>

          <div className="rounded-lg border border-slate-800/90 bg-[#080d1a] p-3.5">
            <div className="text-xs font-medium text-slate-400">Cụm từ & Ngữ cảnh (Kollokation / Kontext)</div>
            <p className="mt-1 text-sm text-slate-200">{wordData.collocation}</p>
            <p className="mt-2 text-xs text-slate-400">{wordData.etymologyNote}</p>
          </div>

          <div className="rounded-lg border border-slate-800/90 bg-slate-900/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Câu ví dụ thực tế</span>
              <button
                type="button"
                onClick={() => speechEngine.speak(wordData.exampleDe, { rate: 0.92 })}
                className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Đọc câu</span>
              </button>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-100">{wordData.exampleDe}</p>
            <p className="mt-1 text-xs text-slate-400">{wordData.exampleVi}</p>
          </div>

          {aiError && (
            <p className="text-xs text-rose-400">{aiError}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleDeepAiLookup}
              disabled={loadingAi}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {loadingAi ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              ) : (
                <Sparkles className="h-4 w-4 text-emerald-400" />
              )}
              <span>{loadingAi ? 'Đang phân tích gốc từ...' : 'Tra cứu chuyên sâu AI'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isAlreadySaved}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isAlreadySaved
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isAlreadySaved ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Đã lưu trong Kho B1–C1</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4" />
                  <span>Lưu vào Kho Từ Vựng</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
