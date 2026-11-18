import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Volume2,
  User,
  Bot,
  SlidersHorizontal,
  Plus,
  Trash2,
  MoreVertical,
  Pencil,
  X,
} from 'lucide-react';
import { speechEngine } from '../utils/speech';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

type RoleKey = 'tutor' | 'partner' | 'exam';

const AI_INSTRUCTIONS_KEY = 'deutschprivate_ai_instructions_v1';
const AI_INSTRUCTIONS_ENABLED_KEY = 'deutschprivate_ai_instructions_enabled_v1';

const ROLE_CONFIG: Record<RoleKey, { label: string; desc: string; greeting: string; suggestions: string[] }> = {
  tutor: {
    label: 'Gia sư Tiếng Đức SLA',
    desc: 'Giải thích ngữ pháp, mạo từ der/die/das & cấu trúc câu',
    greeting:
      'Hallo! Tôi là Gia sư Tiếng Đức của DeutschPrivate (Gemini 3.1 Flash Lite). Bạn muốn hỏi về ngữ pháp (Konjunktiv II, Nebensatz, chia đuôi tính từ) hay phân biệt từ vựng nào hôm nay?',
    suggestions: [
      'Phân biệt weil, da và denn kèm ví dụ',
      'Mẹo nhớ giống der/die/das nhanh',
      'Giải thích cấu trúc Konjunktiv II trong giao tiếp lịch sự',
    ],
  },
  partner: {
    label: 'Bạn Hội Thoại Bản Ngữ (B1–B2)',
    desc: 'Trò chuyện thực tế B1–B2 bằng tiếng Đức và sửa lỗi nhẹ nhàng',
    greeting:
      'Hallo! Schön, dass du da bist. Wie läuft dein Tag heute? Worüber möchtest du auf Deutsch sprechen?',
    suggestions: [
      'Hallo! Heute war ich bei der Arbeit ziemlich beschäftigt.',
      'Ich möchte ein Vorstellungsgespräch auf Deutsch üben.',
      'Können wir darüber sprechen, wie man eine Wohnung in Deutschland sucht?',
    ],
  },
  exam: {
    label: 'Luyện thi Goethe / telc',
    desc: 'Chấm bài Schreiben, gợi ý Redemittel chuẩn B1–C1',
    greeting:
      'Chào bạn! Hãy dán đoạn văn Schreiben tiếng Đức hoặc chọn chủ đề Sprechen để tôi chấm lỗi, nâng cấp từ vựng và gợi ý Redemittel chuẩn kỳ thi Goethe/telc.',
    suggestions: [
      'Cho tôi bộ Redemittel mở đầu & kết bài Schreiben B2',
      'Sửa giúp tôi câu: Ich finde, dass Homeoffice hat viele Vorteile.',
      'Gợi ý dàn ý nói Teil 2 chủ đề Umweltschutz (B1)',
    ],
  },
};

interface GeminiChatViewProps {
  compactPopup?: boolean;
  onClose?: () => void;
}

export const GeminiChatView: React.FC<GeminiChatViewProps> = ({ compactPopup = false, onClose }) => {
  const [roleKey, setRoleKey] = useState<RoleKey>('tutor');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init-0', role: 'model', text: ROLE_CONFIG.tutor.greeting },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // "Chỉ dẫn cho AI" state & localStorage persistence
  const [instructionsOpen, setInstructionsOpen] = useState<boolean>(false);
  const [instructionsEnabled, setInstructionsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AI_INSTRUCTIONS_ENABLED_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [instructionsList, setInstructionsList] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(AI_INSTRUCTIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((x) => String(x || '').trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newRuleText, setNewRuleText] = useState<string>('');
  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editRuleText, setEditRuleText] = useState<string>('');

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    try {
      localStorage.setItem(AI_INSTRUCTIONS_KEY, JSON.stringify(instructionsList));
      localStorage.setItem(AI_INSTRUCTIONS_ENABLED_KEY, String(instructionsEnabled));
    } catch {
      // Ignore storage quota errors
    }
  }, [instructionsList, instructionsEnabled]);

  const handleRoleChange = (nextRole: RoleKey) => {
    setRoleKey(nextRole);
    setErrorMsg('');
    setMessages([{ id: `init-${Date.now()}`, role: 'model', text: ROLE_CONFIG[nextRole].greeting }]);
  };

  const handleResetChat = () => {
    setErrorMsg('');
    setMessages([{ id: `init-${Date.now()}`, role: 'model', text: ROLE_CONFIG[roleKey].greeting }]);
  };

  const handleSaveNewRule = () => {
    const trimmed = newRuleText.trim();
    if (!trimmed) return;
    setInstructionsList((prev) => [trimmed, ...prev]);
    setNewRuleText('');
    setShowAddForm(false);
  };

  const handleSaveEditedRule = (idx: number) => {
    const trimmed = editRuleText.trim();
    if (trimmed) {
      setInstructionsList((prev) => prev.map((item, i) => (i === idx ? trimmed : item)));
    }
    setEditingIdx(null);
    setEditRuleText('');
  };

  const handleDeleteRule = (idx: number) => {
    setInstructionsList((prev) => prev.filter((_, i) => i !== idx));
    setOpenMenuIdx(null);
  };

  const speakGermanResponse = (text: string) => {
    const clean = text.replace(/[*_`#>]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean) {
      speechEngine.speak(clean, { rate: 0.92 });
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const content = (overrideText ?? inputText).trim();
    if (!content || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: content,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!overrideText) setInputText('');
    setErrorMsg('');
    setIsSending(true);

    try {
      // Sliding window: only send up to the 10 most recent messages
      const apiMessages = nextHistory
        .filter((m) => !m.id.startsWith('init-'))
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          roleKey,
          customInstructions: instructionsEnabled ? instructionsList : [],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Không thể nhận phản hồi từ trợ lý AI.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: String(data.reply || ''),
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi kết nối máy chủ AI.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={compactPopup ? 'flex h-full flex-col gap-2.5' : 'space-y-4'}>
      {/* Controls Card */}
      <div
        className={`flex flex-col gap-2 rounded-xl border border-slate-800/90 bg-[#0d1424] ${
          compactPopup ? 'p-3' : 'p-4 sm:flex-row sm:items-center sm:justify-between'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(ROLE_CONFIG) as RoleKey[]).map((key) => {
              const active = roleKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleChange(key)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-emerald-500/50 bg-emerald-600 text-white'
                      : 'border-slate-800 bg-[#080d1a] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {ROLE_CONFIG[key].label}
                </button>
              );
            })}
          </div>
          {compactPopup && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-400 hover:text-white"
              title="Thu gọn"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOpenMenuIdx(null);
              setEditingIdx(null);
              setInstructionsOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/20"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Chỉ dẫn cho AI</span>
            {instructionsList.length > 0 && (
              <span className={instructionsEnabled ? 'text-emerald-400' : 'text-slate-400'}>
                ({instructionsEnabled ? `${instructionsList.length} bật` : 'tắt'})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>
      </div>

      {/* Scrollable Chat Thread */}
      <div
        className={`flex flex-col rounded-xl border border-slate-800/90 bg-[#0d1424] ${
          compactPopup ? 'min-h-0 flex-1' : 'h-[540px]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-2 text-xs text-slate-400">
          <div className="truncate">
            Vai trò: <strong className="text-emerald-400">{ROLE_CONFIG[roleKey].label}</strong>
          </div>
          <span className="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] text-sky-300">
            gemini-3.1-flash-lite-preview · 10-msg
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'border-emerald-500/40 bg-emerald-600/20 text-slate-100'
                      : 'border-slate-800 bg-[#080d1a] text-slate-200'
                  }`}
                >
                  <div>{msg.text}</div>
                  {!isUser && (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => speakGermanResponse(msg.text)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-[11px] text-emerald-300 hover:bg-slate-700"
                        title="Nghe phát âm tiếng Đức (de-DE)"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>Nghe phát âm (de-DE)</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Bot className="h-4 w-4 text-emerald-400" />
              <span>Đang phản hồi (Gemini 3.1 Flash Lite)...</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2 border-t border-slate-800/80 px-4 py-2.5">
          {ROLE_CONFIG[roleKey].suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(s)}
              disabled={isSending}
              className="rounded-lg border border-slate-800 bg-[#080d1a] px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 border-t border-slate-800/90 p-3 sm:p-4"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập câu hỏi ngữ pháp hoặc luyện hội thoại bằng tiếng Đức..."
            className="flex-1 rounded-lg border border-slate-800 bg-[#080d1a] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500/60"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Gửi</span>
          </button>
        </form>
      </div>

      {/* Modal quản lý "Chỉ dẫn cho AI" */}
      {instructionsOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setInstructionsOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[86vh] w-full max-w-lg flex-col rounded-2xl border border-slate-700/80 bg-[#0b1120] p-5 shadow-2xl">
            {/* Thanh tiêu đề */}
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <h4 className="text-base font-bold text-slate-100">Chỉ dẫn cho AI</h4>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={instructionsEnabled}
                  onClick={() => setInstructionsEnabled((p) => !p)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    instructionsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  title={instructionsEnabled ? 'Đang bật chỉ dẫn' : 'Đang tắt chỉ dẫn'}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      instructionsEnabled ? 'left-5.5' : 'left-0.5'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setInstructionsOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white"
                  title="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Thanh công cụ */}
            <div className="mb-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true);
                  setNewRuleText('');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInstructionsList([]);
                  setOpenMenuIdx(null);
                  setEditingIdx(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa tất cả</span>
              </button>
            </div>

            {/* Form Thêm mới */}
            {showAddForm && (
              <div className="mb-4 rounded-xl border border-blue-500/40 bg-slate-900/90 p-3">
                <textarea
                  rows={2}
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  placeholder="Nhập quy tắc chỉ dẫn riêng cho trợ lý AI..."
                  className="w-full rounded-lg border border-slate-700 bg-[#080d1a] p-2.5 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewRule}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Lưu quy tắc
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách thẻ chỉ dẫn */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {instructionsList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
                  Chưa có chỉ dẫn nào. Nhấn nút <strong className="text-blue-400">+ Thêm</strong> để thêm quy tắc cho AI.
                </div>
              ) : (
                instructionsList.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-xl border border-slate-800 bg-[#0f172a] p-3.5 ${
                      instructionsEnabled ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    {editingIdx === idx ? (
                      <div>
                        <textarea
                          rows={2}
                          value={editRuleText}
                          onChange={(e) => setEditRuleText(e.target.value)}
                          className="w-full rounded-lg border border-sky-500/50 bg-[#080d1a] p-2 text-sm text-slate-100 outline-none"
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingIdx(null)}
                            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditedRule(idx)}
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                          {rule}
                        </p>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setOpenMenuIdx(openMenuIdx === idx ? null : idx)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                            title="Tùy chọn"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openMenuIdx === idx && (
                            <div className="absolute right-0 top-8 z-20 w-32 rounded-xl border border-slate-700 bg-slate-800 p-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuIdx(null);
                                  setEditingIdx(idx);
                                  setEditRuleText(rule);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-700"
                              >
                                <Pencil className="h-3.5 w-3.5 text-blue-400" />
                                <span>Chỉnh sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(idx)}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/20"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
