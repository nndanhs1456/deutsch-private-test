import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Download,
  Trash2,
  ClipboardPaste,
  Clock,
  Volume2,
  Loader2,
  X,
  FileText,
} from 'lucide-react';
import { speechEngine } from '../utils/speech';
import { VocabItem } from '../data/deutschData';

interface LectureSegment {
  id: string;
  de: string;
  vi: string;
  isNote?: boolean;
}

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
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const activeRecorderRef = useRef<MediaRecorder | null>(null);
  const rotationTimerRef = useRef<any>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const seqCounterRef = useRef<number>(0);
  const uploadQueueRef = useRef<Array<{ blob: Blob; mimeType: string; seqNum: number }>>([]);
  const isUploadingRef = useRef<boolean>(false);
  const [liveStatusText, setLiveStatusText] = useState<string>('');
  const [pendingSentences, setPendingSentences] = useState<string[]>([]);

  const [segments, setSegments] = useState<LectureSegment[]>([]);
  const [pasteModalOpen, setPasteModalOpen] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  // Tiến trình chạy nền độc lập xử lý dịch câu mới mà không làm chậm onresult của micro
  useEffect(() => {
    if (pendingSentences.length === 0) return;
    const queueCopy = [...pendingSentences];
    setPendingSentences([]);
    queueCopy.forEach((sentence) => {
      handleAddGermanSentence(sentence);
    });
  }, [pendingSentences]);

  // Screen Wake Lock
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {}
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {}
  };

  // Google Translate GTX helper with context
  const translateSentenceLive = async (text: string, contextPrevious: string[] = []) => {
    try {
      const clean = text.trim();
      if (!clean) return '';
      const directUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=vi&dt=t&q=${encodeURIComponent(clean)}`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const directData = await directRes.json();
        return Array.isArray(directData && directData[0])
          ? directData[0].map((item: any) => (item && item[0] ? item[0] : '')).join('').trim()
          : clean;
      }
      return clean;
    } catch {
      return text;
    }
  };

  const handleAddGermanSentence = async (deSentence: string) => {
    const trimmed = deSentence.trim();
    if (!trimmed) return;

    const recentDe = segments.slice(-3).map(s => s.de);
    const translatedVi = await translateSentenceLive(trimmed, recentDe);

    const isNote = /wichtig|prüfung|achtung|hausaufgabe|notiz|tipp|dặn|thi cử|lưu ý/i.test(trimmed) || /lưu ý/i.test(translatedVi);

    setSegments((prev) => [
      ...prev,
      {
        id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        de: trimmed,
        vi: translatedVi,
        isNote,
      },
    ]);
  };

  const getGroqApiKey = () => {
    const readTrim = (fn: () => unknown) => {
      try {
        return String(fn() || '')
          .trim()
          .replace(/^["']|["']$/g, '')
          .trim();
      } catch {
        return '';
      }
    };
    const envKey =
      readTrim(() => import.meta.env.VITE_GROQ_API_KEY) ||
      readTrim(() => process.env.VITE_GROQ_API_KEY) ||
      readTrim(() => process.env.GROQ_API_KEY);
    if (envKey) return envKey;

    let storedKey = '';
    try {
      storedKey = localStorage.getItem('VITE_GROQ_API_KEY') || localStorage.getItem('groq_api_key') || '';
    } catch {}
    return String(storedKey || '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim();
  };

  const pickWebmMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    for (const mime of candidates) {
      try {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(mime)) {
          return mime;
        }
      } catch {}
    }
    return '';
  };

  const isIgnorableGroqTranscript = (text: string) => {
    const clean = String(text || '').trim();
    if (!clean) return true;
    if (!/[a-zA-ZäöüßÄÖÜ0-9]/.test(clean)) return true;
    const strippedLetters = clean.replace(/[^a-zA-ZäöüßÄÖÜ0-9]/g, '');
    return strippedLetters.length < 2;
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = String(reader.result || '');
        const commaIdx = res.indexOf(',');
        resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
      };
      reader.onerror = () => reject(new Error('Không thể đọc dữ liệu âm thanh.'));
      reader.readAsDataURL(blob);
    });

  const transcribeBlobWithGroq = async (audioBlob: Blob, mimeType: string): Promise<string> => {
    const groqKey = getGroqApiKey();
    const cleanMime = (mimeType || audioBlob.type || 'audio/webm').split(';')[0].trim() || 'audio/webm';
    const ext = cleanMime.includes('mp4') ? 'm4a' : cleanMime.includes('ogg') ? 'ogg' : 'webm';

    if (groqKey) {
      const formData = new FormData();
      formData.append('file', audioBlob, `lecture_${Date.now()}.${ext}`);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'de');
      formData.append('response_format', 'json');

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || `Lỗi Groq Whisper (${res.status})`);
      }
      return String(data?.text || '').trim();
    }

    const audioBase64 = await blobToBase64(audioBlob);
    const proxyRes = await fetch('/api/groq-transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType: cleanMime }),
    });
    const proxyData = await proxyRes.json().catch(() => ({}));
    if (!proxyRes.ok) {
      throw new Error(proxyData?.error || `Lỗi Groq Whisper (${proxyRes.status})`);
    }
    return String(proxyData?.text || '').trim();
  };

  const processGroqQueue = async () => {
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;
    try {
      while (uploadQueueRef.current.length > 0) {
        const item = uploadQueueRef.current.shift();
        if (!item) continue;
        setLiveStatusText(`Đang thu âm & chuyển âm gói #${item.seqNum} qua Groq Whisper...`);
        try {
          const text = await transcribeBlobWithGroq(item.blob, item.mimeType);
          if (!isIgnorableGroqTranscript(text)) {
            const sentences = text
              .replace(/\s+/g, ' ')
              .split(/(?<=[.?!])\s+/)
              .map((s) => s.trim())
              .filter((s) => !isIgnorableGroqTranscript(s));
            const finalList = sentences.length > 0 ? sentences : [text];
            setPendingSentences((prev) => [...prev, ...finalList]);
          }
        } catch (err: any) {
          setLiveStatusText(`Lỗi Groq Whisper (gói #${item.seqNum}): ${err?.message || 'Thất bại'}`);
        }
      }
    } finally {
      isUploadingRef.current = false;
      if (uploadQueueRef.current.length > 0) {
        processGroqQueue();
      } else if (isListeningRef.current) {
        setLiveStatusText('Đang thu âm liên tục qua Groq Whisper (gửi gói mỗi 12 giây)...');
      } else {
        setLiveStatusText('');
      }
    }
  };

  const startNewSegmentRecorder = (stream: MediaStream) => {
    const chunks: BlobPart[] = [];
    const chosenMime = mimeTypeRef.current;
    const rec = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);
    const effectiveMime = (rec.mimeType || chosenMime || 'audio/webm').split(';')[0].trim() || 'audio/webm';

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    rec.onstop = () => {
      if (chunks.length === 0) return;
      const audioBlob = new Blob(chunks, { type: effectiveMime });
      if (audioBlob.size < 1500) return;
      seqCounterRef.current += 1;
      uploadQueueRef.current.push({
        blob: audioBlob,
        mimeType: effectiveMime,
        seqNum: seqCounterRef.current,
      });
      processGroqQueue();
    };

    rec.start();
    return rec;
  };

  const rotateGroqSegment = () => {
    if (!isListeningRef.current || !micStreamRef.current) return;
    const stream = micStreamRef.current;
    const prevRec = activeRecorderRef.current;
    let nextRec: MediaRecorder | null = null;
    try {
      nextRec = startNewSegmentRecorder(stream);
      activeRecorderRef.current = nextRec;
    } catch {
      nextRec = null;
    }
    if (prevRec && prevRec.state !== 'inactive') {
      const origStop = prevRec.onstop;
      prevRec.onstop = function (ev) {
        if (typeof origStop === 'function') origStop.call(this, ev);
        if (!nextRec && isListeningRef.current && micStreamRef.current) {
          try {
            activeRecorderRef.current = startNewSegmentRecorder(micStreamRef.current);
          } catch {}
        }
      };
      try {
        prevRec.stop();
      } catch {}
    }
  };

  // Continuous 12s MediaRecorder + Groq Whisper (whisper-large-v3-turbo) + Wake Lock
  const startRecording = async () => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return;
    }

    micStreamRef.current = stream;
    mimeTypeRef.current = pickWebmMimeType();
    await requestWakeLock();
    setIsRecording(true);
    setSeconds(0);
    isListeningRef.current = true;
    setLiveStatusText('Đang thu âm liên tục qua Groq Whisper (gửi gói mỗi 12 giây)...');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((p) => p + 1);
    }, 1000);

    try {
      activeRecorderRef.current = startNewSegmentRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      isListeningRef.current = false;
      setIsRecording(false);
      return;
    }

    if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    rotationTimerRef.current = setInterval(() => {
      rotateGroqSegment();
    }, 12000);
  };

  const stopRecording = async () => {
    isListeningRef.current = false;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    rotationTimerRef.current = null;

    const lastRec = activeRecorderRef.current;
    activeRecorderRef.current = null;
    if (lastRec && lastRec.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        const origStop = lastRec.onstop;
        lastRec.onstop = function (ev) {
          if (typeof origStop === 'function') origStop.call(this, ev);
          resolve();
        };
        try {
          lastRec.stop();
        } catch {
          resolve();
        }
      });
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (!isUploadingRef.current && uploadQueueRef.current.length === 0) {
      setLiveStatusText('');
    }
    await releaseWakeLock();
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    const lines = pasteText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const l of lines) {
      await handleAddGermanSentence(l);
      await new Promise((r) => setTimeout(r, 300));
    }
    setPasteText('');
    setPasteModalOpen(false);
  };

  const handleClearAll = () => {
    uploadQueueRef.current = [];
    seqCounterRef.current = 0;
    setLiveStatusText('');
    setSegments([]);
    setConfirmClearOpen(false);
  };

  const handleExportTxt = () => {
    if (segments.length === 0) return;
    let content = "=== UNTERRICHT & MITSCHREIBEN (DEUTSCHPRIVATE) ===\n\n";
    segments.forEach((seg, i) => {
      content += `[${i + 1}] DE: ${seg.de}\n    VI: ${seg.vi}\n\n`;
    });
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `UnterrichtMitschreiben_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  const handleFinishAndSummarize = async () => {
    if (segments.length === 0) return;
    setIsSummarizing(true);
    try {
      const fullGerman = segments.map(s => s.de).join(' ');
      const res = await fetch('/api/translate-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          germanText: fullGerman,
          level: 'B2',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tóm tắt bài học.');
      setSummaryData(data);
      setSummaryModalOpen(true);
    } catch (err: any) {
      // ignore
    } finally {
      setIsSummarizing(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Group translated sentences into paragraphs of 4-5 sentences each
  const paragraphs: Array<LectureSegment[]> = [];
  let currentParagraph: LectureSegment[] = [];
  segments.forEach((seg, idx) => {
    currentParagraph.push(seg);
    if (currentParagraph.length >= 4 || idx === segments.length - 1) {
      paragraphs.push(currentParagraph);
      currentParagraph = [];
    }
  });

  return (
    <div className="space-y-6">
      {/* Control Panel Header (Gom gọn thành 1 hàng) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/95 bg-[#0d1424] p-4 sm:flex-row sm:items-center sm:justify-between shadow-xl">
        {/* 3 Main Buttons on 1 Horizontal Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Start / Stop Recording with Timer */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse hover:bg-rose-500'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500'
            }`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span>{isRecording ? 'Đang lắng nghe bài giảng...' : 'Bắt đầu lắng nghe bài giảng'}</span>
            {isRecording && (
              <span className="flex items-center gap-1 font-mono rounded bg-black/30 px-2 py-0.5 text-[11px] text-rose-200">
                <Clock className="h-3 w-3" />
                {formatTimer(seconds)}
              </span>
            )}
          </button>

          {/* 2. Paste text button */}
          <button
            type="button"
            onClick={() => setPasteModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-2.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/20"
          >
            <ClipboardPaste className="h-4 w-4" />
            <span>Dán văn bản</span>
          </button>

          {/* 3. Finish & Summarize */}
          <button
            type="button"
            onClick={handleFinishAndSummarize}
            disabled={isSummarizing || segments.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-300" />}
            <span>Kết thúc & Tóm tắt bài học</span>
          </button>
        </div>

        {/* Top-Right Compact Icons: Save .txt & Clear with Confirmation */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleExportTxt}
            disabled={segments.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-40"
            title="Lưu file .txt"
          >
            <Download className="h-4 w-4 text-emerald-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (segments.length > 0) setConfirmClearOpen(true);
            }}
            disabled={segments.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-40"
            title="Xóa bảng dịch"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3 Display Frames */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Live German Segments & Parallel Translation */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Khung song song từng câu (Đức - Việt) · Nhấp vào từ để tra cứu</span>
            <span className="font-mono tabular-nums">{segments.length} câu</span>
          </div>

          <div className="flex h-[580px] flex-col gap-3 overflow-y-auto pr-1">
            {segments.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-[#0d1424]/60 p-8 text-center text-slate-400">
                <Mic className="mb-3 h-10 w-10 opacity-40 text-emerald-400 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-200">Chưa có nội dung ghi âm</h4>
                <p className="mt-1 text-xs max-w-sm">
                  Nhấn <strong className="text-emerald-400">"Bắt đầu lắng nghe bài giảng"</strong> hoặc <strong className="text-sky-400">"Dán văn bản"</strong> để bắt đầu chuyển đổi trực tiếp.
                </p>
              </div>
            ) : (
              segments.map((seg, idx) => {
                const words = seg.de.split(/\s+/);
                return (
                  <div
                    key={seg.id}
                    className={`rounded-xl border p-4 transition-all ${
                      seg.isNote
                        ? 'border-amber-500/50 bg-amber-950/15 shadow-md'
                        : 'border-slate-800/90 bg-[#0d1424]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-400">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => speechEngine.speak(seg.de, { rate: 0.95 })}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-emerald-300"
                        title="Nghe câu"
                      >
                        <Volume2 className="h-3 w-3 text-emerald-400" />
                        <span>Nghe</span>
                      </button>
                    </div>

                    <p className="text-base font-medium leading-relaxed text-slate-100">
                      {words.map((w, wi) => (
                        <span
                          key={wi}
                          onClick={() => onSelectWord(w, seg.de)}
                          className="cursor-pointer hover:bg-emerald-500/25 hover:text-emerald-200 rounded px-0.5"
                          title="Nhấn để tra từ"
                        >
                          {w}{' '}
                        </span>
                      ))}
                    </p>

                    <p className={`mt-1.5 text-sm font-semibold ${seg.isNote ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {seg.vi}
                    </p>
                  </div>
                );
              })
            )}
            {(isRecording || liveStatusText) && liveStatusText && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 px-3.5 py-2 text-xs text-sky-200">
                <span className="font-semibold text-sky-400">Groq Whisper (de): </span>
                <span>{liveStatusText}</span>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>
        </div>

        {/* Right Column: Real-time Paragraph Flow for Vietnamese Translation */}
        <div className="flex h-[620px] flex-col rounded-2xl border border-slate-800/90 bg-[#0d1424] p-5 lg:col-span-5">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>1. Bản dịch tiếng Việt (Đoạn văn xuôi mạch lạc)</span>
            </h3>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-300 border border-emerald-500/30">
              Live Real-time
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-200">
            {paragraphs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-slate-500">
                Bản dịch tiếng Việt liên tục theo thời gian thực sẽ xuất hiện tại đây...
              </div>
            ) : (
              paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-justify indent-4">
                  {para.map((seg, sIdx) => {
                    if (seg.isNote) {
                      return (
                        <span
                          key={seg.id}
                          className="mx-1 rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold text-amber-300 border border-amber-500/40"
                          title="Lưu ý giáo viên / Thi cử"
                        >
                          {seg.vi}{sIdx < para.length - 1 ? ' ' : ''}
                        </span>
                      );
                    }
                    return (
                      <span key={seg.id}>
                        {seg.vi}{sIdx < para.length - 1 ? ' ' : ''}
                      </span>
                    );
                  })}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Paste Modal */}
      {pasteModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPasteModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#0b1120] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-100">Dán văn bản tiếng Đức</h4>
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Dán đoạn văn bản hoặc ghi chú bài giảng tiếng Đức vào đây để hệ thống dịch trực tiếp thành đoạn văn mạch lạc..."
              className="w-full rounded-xl border border-slate-700 bg-[#080d1a] p-3.5 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Xử lý & Dịch ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Modal */}
      {confirmClearOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmClearOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-[#0b1120] p-5 shadow-2xl text-center">
            <h4 className="text-base font-bold text-slate-100 mb-2">Xác nhận xóa bảng dịch?</h4>
            <p className="text-xs text-slate-300 mb-5">
              Bạn có chắc chắn muốn xóa toàn bộ nội dung bản dịch hiện tại không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {summaryModalOpen && summaryData && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSummaryModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-blue-500/40 bg-[#0b1120] p-6 shadow-2xl overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <span>Tóm tắt & Phân tích bài học (Gemini SLA)</span>
              </h4>
              <button
                type="button"
                onClick={() => setSummaryModalOpen(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-200">
              <div>
                <strong className="text-emerald-400 block mb-1">Chủ đề bài giảng:</strong>
                <p className="bg-[#080d1a] p-3 rounded-xl border border-slate-800">{summaryData.title}</p>
              </div>
              <div>
                <strong className="text-emerald-400 block mb-1">Tóm tắt nội dung chính:</strong>
                <p className="bg-[#080d1a] p-3 rounded-xl border border-slate-800 leading-relaxed">{summaryData.summaryVi}</p>
              </div>
              {Array.isArray(summaryData.keyVocab) && summaryData.keyVocab.length > 0 && (
                <div>
                  <strong className="text-emerald-400 block mb-2">Từ vựng & Cụm từ quan trọng:</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {summaryData.keyVocab.map((v: any, i: number) => (
                      <div key={i} className="bg-[#080d1a] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-100 text-xs">
                            {v.article ? `${v.article} ` : ''}{v.word}
                          </div>
                          <div className="text-[11px] text-slate-400">{v.meaningVi}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSaveVocab({
                            id: `sum-voc-${Date.now()}-${i}`,
                            word: v.word,
                            article: v.article || '',
                            plural: v.plural || '',
                            ipa: v.ipa || '',
                            meaningVi: v.meaningVi,
                            level: v.level || 'B2',
                            category: 'Tóm tắt bài học',
                            collocation: v.exampleDe || v.word,
                            exampleDe: v.exampleDe || '',
                            exampleVi: v.exampleVi || '',
                            mastery: 50,
                          })}
                          className="rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-600 hover:text-white"
                        >
                          Lưu từ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSummaryModalOpen(false)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
