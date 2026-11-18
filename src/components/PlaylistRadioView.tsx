import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Radio,
  Plus,
  Volume2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { PLAYLIST_TRACKS, PlaylistTrack } from '../data/deutschData';
import { speechEngine } from '../utils/speech';

interface PlaylistRadioViewProps {
  onSelectWord: (word: string, sentence: string) => void;
}

export const PlaylistRadioView: React.FC<PlaylistRadioViewProps> = ({ onSelectWord }) => {
  const [tracks, setTracks] = useState<PlaylistTrack[]>(PLAYLIST_TRACKS);
  const [currentTrackId, setCurrentTrackId] = useState<string>(PLAYLIST_TRACKS[0].id);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [autoSpeakTranscript, setAutoSpeakTranscript] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Add custom stream / podcast form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newBroadcaster, setNewBroadcaster] = useState<string>('Custom Stream');
  const [newLevel, setNewLevel] = useState<'B1' | 'B2' | 'C1'>('B2');
  const [newScriptDe, setNewScriptDe] = useState<string>('');
  const [newScriptVi, setNewScriptVi] = useState<string>('');

  const lastSpokenIndexRef = useRef<number>(-1);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) || tracks[0];

  const activeSegmentIndex = currentTrack.transcript.reduce((acc, item, index) => {
    if (currentTime >= item.timeSec) return index;
    return acc;
  }, 0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1 * playbackRate;
        if (loopA !== null && loopB !== null && next >= loopB) {
          lastSpokenIndexRef.current = -1;
          return loopA;
        }
        if (next >= currentTrack.durationSeconds) {
          setIsPlaying(false);
          lastSpokenIndexRef.current = -1;
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPlaying, playbackRate, loopA, loopB, currentTrack.durationSeconds]);

  // Synchronize German speech synthesis when active transcript segment changes while playing
  useEffect(() => {
    if (!isPlaying || !autoSpeakTranscript) return;
    if (activeSegmentIndex !== lastSpokenIndexRef.current) {
      lastSpokenIndexRef.current = activeSegmentIndex;
      const seg = currentTrack.transcript[activeSegmentIndex];
      if (seg) {
        speechEngine.speak(seg.de, { rate: playbackRate });
      }
    }
  }, [activeSegmentIndex, isPlaying, autoSpeakTranscript, currentTrack, playbackRate]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      speechEngine.stop();
    } else {
      lastSpokenIndexRef.current = -1;
      setIsPlaying(true);
    }
  };

  const handleSelectTrack = (trackId: string) => {
    speechEngine.stop();
    setCurrentTrackId(trackId);
    setCurrentTime(0);
    setLoopA(null);
    setLoopB(null);
    lastSpokenIndexRef.current = -1;
    setIsPlaying(true);
  };

  const handleJumpToSegment = (timeSec: number, index: number, textDe: string) => {
    setCurrentTime(timeSec);
    lastSpokenIndexRef.current = index;
    setIsPlaying(true);
    if (autoSpeakTranscript) {
      speechEngine.speak(textDe, { rate: playbackRate });
    }
  };

  const handleSetLoopPoint = () => {
    if (loopA === null) {
      setLoopA(Math.floor(currentTime));
    } else if (loopB === null && currentTime > loopA) {
      setLoopB(Math.ceil(currentTime));
    } else {
      setLoopA(null);
      setLoopB(null);
    }
  };

  const handleAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newScriptDe.trim()) return;

    const sentencesDe = newScriptDe
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const sentencesVi = newScriptVi
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const transcript = sentencesDe.map((de, idx) => {
      const timeSec = idx * 14;
      const mins = String(Math.floor(timeSec / 60)).padStart(2, '0');
      const secs = String(timeSec % 60).padStart(2, '0');
      return {
        timeSec,
        timeLabel: `${mins}:${secs}`,
        de,
        vi: sentencesVi[idx] || 'Bản tin tiếng Đức tuỳ chỉnh do bạn thêm vào Playlist.',
      };
    });

    const newTrack: PlaylistTrack = {
      id: `pl-custom-${Date.now()}`,
      title: newTitle.trim(),
      broadcaster: newBroadcaster.trim() || 'Playlist Cá Nhân',
      category: 'Custom',
      level: newLevel,
      durationSeconds: Math.max(30, transcript.length * 14),
      descriptionVi: 'Nội dung nghe chủ động được thêm vào danh sách phát SLA của bạn.',
      transcript,
    };

    setTracks((prev) => [newTrack, ...prev]);
    setCurrentTrackId(newTrack.id);
    setCurrentTime(0);
    setShowAddForm(false);
    setNewTitle('');
    setNewScriptDe('');
    setNewScriptVi('');
  };

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const r = String(s % 60).padStart(2, '0');
    return `${m}:${r}`;
  };

  const filteredTracks =
    filterCategory === 'ALL'
      ? tracks
      : tracks.filter((t) => t.category === filterCategory);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      {/* Left Interactive Audio Stage & Synchronized Transcript (7-8 cols on desktop) */}
      <div className="space-y-6 lg:col-span-7 xl:col-span-8">
        {/* Player Deck */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-slate-200">{currentTrack.broadcaster}</span>
              <span aria-hidden="true">·</span>
              <span>{currentTrack.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-400">CEFR {currentTrack.level}</span>
            </div>
            <span className="font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(currentTrack.durationSeconds)}
            </span>
          </div>

          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
            {currentTrack.title}
          </h2>
          <p className="mt-1.5 text-sm text-slate-300">{currentTrack.descriptionVi}</p>

          {/* Timeline Scrubber */}
          <div className="mt-5">
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              {loopA !== null && (
                <div
                  className="absolute top-0 bottom-0 bg-amber-500/30"
                  style={{
                    left: `${(loopA / currentTrack.durationSeconds) * 100}%`,
                    width: `${
                      (((loopB ?? currentTrack.durationSeconds) - loopA) /
                        currentTrack.durationSeconds) *
                      100
                    }%`,
                  }}
                />
              )}
              <div
                className="h-full bg-emerald-500 transition-all duration-200"
                style={{
                  width: `${Math.min(100, (currentTime / currentTrack.durationSeconds) * 100)}%`,
                }}
              />
            </div>

            <input
              type="range"
              aria-label="Thanh tua thời gian phát"
              min={0}
              max={currentTrack.durationSeconds}
              value={Math.floor(currentTime)}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Transport Controls — Responsive Stack */}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  const idx = tracks.findIndex((t) => t.id === currentTrack.id);
                  const prevIdx = (idx - 1 + tracks.length) % tracks.length;
                  handleSelectTrack(tracks[prevIdx].id);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-[#080d1a] text-slate-300 hover:bg-slate-800"
                title="Bài trước"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 whitespace-nowrap shrink-0"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 fill-current" />
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Phát Đài / Playlist</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const idx = tracks.findIndex((t) => t.id === currentTrack.id);
                  const nextIdx = (idx + 1) % tracks.length;
                  handleSelectTrack(tracks[nextIdx].id);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-[#080d1a] text-slate-300 hover:bg-slate-800"
                title="Bài tiếp theo"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleSetLoopPoint}
                className={`flex h-11 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  loopA !== null
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : 'border-slate-800 bg-[#080d1a] text-slate-300 hover:bg-slate-800'
                }`}
                title="Lặp đoạn A-B để nghe thấm câu khó"
              >
                <Repeat className="h-3.5 w-3.5" />
                <span className="font-mono tabular-nums">
                  {loopA === null
                    ? 'Lặp A–B'
                    : loopB === null
                    ? `A: ${formatTime(loopA)} → Chọn B`
                    : `${formatTime(loopA)}–${formatTime(loopB)}`}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
                {[0.75, 0.9, 1.0, 1.2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackRate(spd)}
                    className={`rounded-md px-2.5 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      playbackRate === spd
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setAutoSpeakTranscript((p) => !p)}
                className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  autoSpeakTranscript
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-[#080d1a] text-slate-400'
                }`}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Giọng đọc Đức</span>
              </button>
            </div>
          </div>
        </div>

        {/* Synchronized Bilingual Transcript */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-bold text-slate-100">
              Phụ Đề Song Ngữ Đồng Bộ Thời Gian Thực (SLA Transcript)
            </h3>
            <span className="text-xs text-slate-400">
              Nhấp mốc thời gian để nghe câu · Nhấp vào từ để tra nghĩa
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {currentTrack.transcript.map((line, index) => {
              const isCurrent = index === activeSegmentIndex;
              const words = line.de.split(/\s+/);

              return (
                <div
                  key={index}
                  className={`rounded-xl border p-4 transition-colors ${
                    isCurrent
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-800/80 bg-[#080d1a] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleJumpToSegment(line.timeSec, index, line.de)}
                      className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400 hover:underline tabular-nums"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{line.timeLabel}</span>
                      {isCurrent && isPlaying && (
                        <span className="ml-1 text-emerald-300">· Đang phát</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => speechEngine.speak(line.de, { rate: playbackRate })}
                      className="rounded-md border border-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-emerald-300 whitespace-nowrap shrink-0"
                    >
                      Nghe lại câu
                    </button>
                  </div>

                  <p className="mt-2 text-base font-semibold leading-relaxed text-slate-100 sm:text-lg">
                    {words.map((w, wIdx) => (
                      <React.Fragment key={wIdx}>
                        <span
                          onClick={() => onSelectWord(w, line.de)}
                          className="cursor-pointer rounded-xs px-0.5 transition-colors hover:bg-emerald-500/25 hover:text-emerald-200"
                        >
                          {w}
                        </span>{' '}
                      </React.Fragment>
                    ))}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-300">{line.vi}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Playlist Queue & Add Stream Deck (4-5 cols on desktop) */}
      <div className="space-y-6 lg:col-span-5 xl:col-span-4">
        <div className="rounded-xl border border-slate-800/90 bg-[#0d1424] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-100">Danh Sách Đài Đức & Playlist</h3>
              <p className="text-xs text-slate-400">
                Nghe thụ động & chủ động theo chuẩn viện ngôn ngữ Đức
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Bài Nghe</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#080d1a] p-1">
            {['ALL', 'Radio Live', 'Podcast SLA', 'Hörbuch B2'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filterCategory === cat
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>

          {/* Add Custom Track Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddCustomTrack}
              className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-[#080d1a] p-4"
            >
              <div className="text-xs font-semibold text-emerald-400">
                Thêm bản tin / Podcast tiếng Đức vào Playlist
              </div>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tiêu đề bài nghe (VD: DW Nachrichten - Wirtschaft)"
                className="w-full rounded-lg border border-slate-800 bg-[#0d1424] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newBroadcaster}
                  onChange={(e) => setNewBroadcaster(e.target.value)}
                  placeholder="Nguồn phát (VD: DW / WDR)"
                  className="rounded-lg border border-slate-800 bg-[#0d1424] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as 'B1' | 'B2' | 'C1')}
                  className="rounded-lg border border-slate-800 bg-[#0d1424] px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="B1">Trình độ B1</option>
                  <option value="B2">Trình độ B2</option>
                  <option value="C1">Trình độ C1</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                value={newScriptDe}
                onChange={(e) => setNewScriptDe(e.target.value)}
                placeholder="Nhập nội dung tiếng Đức (tách tự động theo từng câu)..."
                className="w-full rounded-lg border border-slate-800 bg-[#0d1424] p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <textarea
                rows={2}
                value={newScriptVi}
                onChange={(e) => setNewScriptVi(e.target.value)}
                placeholder="Bản dịch tiếng Việt tương ứng (không bắt buộc)..."
                className="w-full rounded-lg border border-slate-800 bg-[#0d1424] p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Lưu vào Playlist
                </button>
              </div>
            </form>
          )}

          {/* Track Items */}
          <div className="mt-4 space-y-2.5">
            {filteredTracks.map((track) => {
              const active = track.id === currentTrack.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                    active
                      ? 'border-emerald-500/60 bg-emerald-950/25'
                      : 'border-slate-800/80 bg-[#080d1a] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-semibold text-emerald-400">{track.level}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{track.broadcaster}</span>
                    </div>
                    <span className="font-mono tabular-nums shrink-0">
                      {formatTime(track.durationSeconds)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100 line-clamp-2">
                      {track.title}
                    </span>
                    {active && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
