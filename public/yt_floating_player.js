/**
 * Floating YouTube Mini Music Player (Dark Mode)
 * Default Playlist: https://youtube.com/playlist?list=PLt3dykZcG7xs0edVsWhD5ul-fL7xg-tf9
 * Features:
 * - YouTube IFrame Player API (audio-first, toggleable mini video preview)
 * - Auto-syncs live playlist tracks via /api/youtube/playlist (YouTube Data API v3 + Live page extraction fallback)
 * - Collapsed Pill Bar + Expanded Floating Card matching dark UI spec
 */
(function () {
  const DEFAULT_PLAYLIST_ID = 'PLt3dykZcG7xs0edVsWhD5ul-fL7xg-tf9';
  const STORAGE_KEY_PLAYLIST = 'dm_yt_active_playlist_id';
  const STORAGE_KEY_SAVED_LISTS = 'dm_yt_saved_playlists_v1';

  let currentPlaylistId =
    localStorage.getItem(STORAGE_KEY_PLAYLIST) || DEFAULT_PLAYLIST_ID;
  let playlistTitle = 'Deutsch';
  let playlistDescription = 'Tự động cập nhật danh sách video từ YouTube';
  let tracks = [
    {
      index: 1,
      videoId: 'f3DwawSJlTo',
      title: 'LUYỆN NGHE TIẾNG ĐỨC B1 HIỆU QUẢ - KINH NGHIỆM THI TIẾNG ĐỨC B1',
      channel: 'Eu Deutsch - Tự Học Tiếng Đức',
      thumbnail: 'https://i.ytimg.com/vi/f3DwawSJlTo/mqdefault.jpg',
      durationText: '2:59:21',
      durationSeconds: 10761,
    },
    {
      index: 2,
      videoId: 'gUqDYeN5Fpk',
      title: 'luyện nghe TIẾNG ĐỨC B2',
      channel: 'Eu Deutsch - Tự Học Tiếng Đức',
      thumbnail: 'https://i.ytimg.com/vi/gUqDYeN5Fpk/mqdefault.jpg',
      durationText: '5:40:46',
      durationSeconds: 20446,
    },
    {
      index: 3,
      videoId: 'l15FIo3a1jk',
      title: 'Learn Everyday German in Chemnitz',
      channel: 'Easy German',
      thumbnail: 'https://i.ytimg.com/vi/l15FIo3a1jk/mqdefault.jpg',
      durationText: '15:26',
      durationSeconds: 926,
    },
  ];

  let currentIndex = 0;
  let isPlaying = false;
  let isExpanded = false;
  let isMinimizedToFab = false;
  let isVideoVisible = false;
  let isAddInputOpen = false;
  let isRepeat = false;
  let isShuffle = false;
  let volume = 85;
  let currentTimeSec = 0;
  let totalDurationSec = tracks[0].durationSeconds;
  let ytPlayer = null;
  let isPlayerReady = false;
  let progressInterval = null;

  function formatTime(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    const total = Math.floor(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function extractPlaylistId(raw) {
    if (!raw) return '';
    const trimmed = raw.trim();
    const m = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
    return '';
  }

  function injectStyles() {
    if (document.getElementById('dm-yt-floating-styles')) return;
    const style = document.createElement('style');
    style.id = 'dm-yt-floating-styles';
    style.textContent = `
      .dm-yt-root {
        position: fixed;
        left: 328px;
        right: auto;
        bottom: 20px;
        z-index: 30;
        font-family: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif;
        color: #f8fafc;
        user-select: none;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        transition: left 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
      body.dm-sidebar-collapsed .dm-yt-root {
        left: 104px;
      }
      body.news-focus-mode .dm-yt-root {
        left: 20px;
      }

      /* EXPANDED POPUP CARD */
      .dm-yt-popup {
        width: 410px;
        max-width: calc(100vw - 28px);
        background: #12151f;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 22px;
        box-shadow: 0 28px 70px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        margin-bottom: 12px;
        overflow: hidden;
        display: none;
        flex-direction: column;
        animation: dmYtSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .dm-yt-popup.open {
        display: flex;
      }
      @keyframes dmYtSlideUp {
        from { opacity: 0; transform: translateY(14px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* Header */
      .dm-yt-header {
        padding: 15px 16px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: #161a26;
      }
      .dm-yt-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .dm-yt-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex: 1;
      }
      .dm-yt-pl-name {
        font-size: 1.02rem;
        font-weight: 800;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 125px;
      }
      .dm-yt-red-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(239, 68, 68, 0.18);
        border: 1px solid rgba(239, 68, 68, 0.45);
        color: #f87171;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
        text-decoration: none;
        white-space: nowrap;
        flex-shrink: 0;
        transition: all 0.18s ease;
      }
      .dm-yt-red-badge:hover {
        background: #ef4444;
        color: #ffffff;
      }
      .dm-yt-header-actions {
        display: flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
      }
      .dm-yt-hbtn {
        height: 28px;
        min-width: 28px;
        padding: 0 8px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
        font-size: 0.74rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
        transition: all 0.18s ease;
      }
      .dm-yt-hbtn:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #ffffff;
      }
      .dm-yt-hbtn.active {
        background: rgba(239, 68, 68, 0.22);
        border-color: rgba(239, 68, 68, 0.55);
        color: #fca5a5;
      }
      .dm-yt-header-sub {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 7px;
        font-size: 0.76rem;
        color: #94a3b8;
      }
      .dm-yt-sub-desc {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 310px;
      }
      .dm-yt-sub-count {
        font-weight: 700;
        color: #cbd5e1;
        font-variant-numeric: tabular-nums;
      }

      /* + Playlist Drawer */
      .dm-yt-add-drawer {
        display: none;
        padding: 10px 14px;
        background: #0d1018;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        gap: 8px;
        flex-direction: column;
      }
      .dm-yt-add-drawer.open {
        display: flex;
      }
      .dm-yt-add-row {
        display: flex;
        gap: 6px;
      }
      .dm-yt-add-input {
        flex: 1;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 7px 10px;
        color: #fff;
        font-size: 0.78rem;
        outline: none;
      }
      .dm-yt-add-input:focus {
        border-color: #ef4444;
      }
      .dm-yt-add-submit {
        background: #ef4444;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 0 12px;
        font-size: 0.76rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .dm-yt-add-submit:hover {
        background: #dc2626;
      }

      /* Mini Video Preview Box (Clean Viewport: no YT UI clutter, non-interactive crop) */
      .dm-yt-video-wrap {
        width: 100%;
        height: 0;
        overflow: hidden;
        background: #000;
        transition: height 0.25s ease;
        position: relative;
        pointer-events: none;
        user-select: none;
      }
      .dm-yt-video-wrap.show-video {
        height: 200px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .dm-yt-video-wrap iframe {
        width: 100%;
        height: 200px;
        border: none;
        display: block;
        pointer-events: none;
        transform: scale(1.18);
        transform-origin: center center;
      }

      /* Controls Deck */
      .dm-yt-controls-section {
        padding: 14px 18px 12px;
        background: #141824;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }
      .dm-yt-controls-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .dm-yt-ctrl-left,
      .dm-yt-ctrl-center,
      .dm-yt-ctrl-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dm-yt-icon-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 0.92rem;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.16s ease;
      }
      .dm-yt-icon-btn:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.07);
      }
      .dm-yt-icon-btn.active {
        color: #ef4444;
      }
      .dm-yt-play-big {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #ffffff;
        color: #090b10;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.05rem;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(255, 255, 255, 0.22);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .dm-yt-play-big:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 22px rgba(255, 255, 255, 0.32);
      }
      .dm-yt-play-big:active {
        transform: scale(0.96);
      }
      .dm-yt-vol-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dm-yt-vol-slider {
        width: 64px;
        height: 4px;
        accent-color: #cbd5e1;
        cursor: pointer;
      }

      /* Red Progress Bar */
      .dm-yt-progress-wrap {
        margin-top: 12px;
      }
      .dm-yt-progress-range {
        width: 100%;
        height: 5px;
        accent-color: #ef4444;
        cursor: pointer;
        display: block;
      }
      .dm-yt-time-row {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-size: 0.72rem;
        color: #94a3b8;
        font-variant-numeric: tabular-nums;
      }

      /* Tracklist Vertical Scroll */
      .dm-yt-tracklist {
        max-height: 290px;
        overflow-y: auto;
        padding: 6px 8px 8px;
        background: #10131d;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
      }
      .dm-yt-tracklist::-webkit-scrollbar {
        width: 5px;
      }
      .dm-yt-tracklist::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.18);
        border-radius: 99px;
      }
      .dm-yt-track-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.16s ease;
        margin-bottom: 2px;
      }
      .dm-yt-track-item:hover {
        background: rgba(255, 255, 255, 0.06);
      }
      .dm-yt-track-item.active {
        background: rgba(255, 255, 255, 0.12);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.09) inset;
      }
      .dm-yt-track-num {
        width: 20px;
        text-align: center;
        font-size: 0.78rem;
        font-weight: 700;
        color: #64748b;
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
      }
      .dm-yt-track-item.active .dm-yt-track-num {
        color: #ef4444;
      }
      .dm-yt-thumb-box {
        position: relative;
        width: 64px;
        height: 36px;
        border-radius: 7px;
        overflow: hidden;
        background: #1e293b;
        flex-shrink: 0;
      }
      .dm-yt-thumb-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .dm-yt-thumb-dur {
        position: absolute;
        right: 3px;
        bottom: 2px;
        background: rgba(0, 0, 0, 0.84);
        color: #f8fafc;
        font-size: 0.62rem;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 4px;
        font-variant-numeric: tabular-nums;
      }
      .dm-yt-track-info {
        min-width: 0;
        flex: 1;
      }
      .dm-yt-track-title {
        font-size: 0.83rem;
        font-weight: 700;
        color: #f1f5f9;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .dm-yt-track-item.active .dm-yt-track-title {
        color: #ffffff;
      }
      .dm-yt-track-channel {
        font-size: 0.72rem;
        color: #94a3b8;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* COLLAPSED PILL BAR */
      .dm-yt-pill-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(18, 21, 31, 0.96);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 9999px;
        padding: 6px 8px 6px 7px;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        max-width: calc(100vw - 24px);
      }
      .dm-yt-pill-play {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #ffffff;
        color: #090b10;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        cursor: pointer;
        flex-shrink: 0;
        transition: transform 0.15s ease;
      }
      .dm-yt-pill-play:hover {
        transform: scale(1.06);
      }
      .dm-yt-pill-thumb {
        width: 36px;
        height: 36px;
        border-radius: 9px;
        object-fit: cover;
        flex-shrink: 0;
        background: #1e293b;
        cursor: pointer;
      }
      .dm-yt-pill-meta {
        min-width: 0;
        max-width: 220px;
        cursor: pointer;
      }
      .dm-yt-pill-title-row {
        display: flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        overflow: hidden;
      }
      .dm-yt-pill-idx {
        font-size: 0.68rem;
        font-weight: 800;
        color: #f87171;
        background: rgba(239, 68, 68, 0.16);
        padding: 1px 5px;
        border-radius: 5px;
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
      }
      .dm-yt-pill-title {
        font-size: 0.8rem;
        font-weight: 700;
        color: #ffffff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dm-yt-pill-sub {
        font-size: 0.7rem;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 1px;
        font-variant-numeric: tabular-nums;
      }
      .dm-yt-pill-next {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: #cbd5e1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s, color 0.15s;
      }
      .dm-yt-pill-next:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      .dm-yt-pill-expand {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #f1f5f9;
        height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        font-size: 0.76rem;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.18s ease;
      }
      .dm-yt-pill-expand:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
      }
      .dm-yt-pill-collapse {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.06);
        color: #94a3b8;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        font-size: 0.78rem;
        transition: all 0.18s ease;
      }
      .dm-yt-pill-collapse:hover {
        background: rgba(255, 255, 255, 0.16);
        color: #ffffff;
      }

      /* FLOATING CIRCULAR FAB WHEN MINIMIZED */
      .dm-yt-fab {
        display: none;
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1.5px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06) inset;
        color: #ffffff;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
        touch-action: none;
      }
      .dm-yt-fab:hover {
        transform: scale(1.07);
        border-color: rgba(239, 68, 68, 0.7);
      }
      .dm-yt-fab.playing {
        border-color: rgba(239, 68, 68, 0.85);
        box-shadow: 0 10px 28px rgba(239, 68, 68, 0.35), 0 0 0 3px rgba(239, 68, 68, 0.18);
      }
      .dm-yt-fab-thumb {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        opacity: 0.9;
      }
      .dm-yt-fab-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #ef4444;
        color: #fff;
        font-size: 0.65rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #0f172a;
        box-shadow: 0 2px 6px rgba(0,0,0,0.45);
      }
      .dm-yt-root.is-minimized .dm-yt-popup,
      .dm-yt-root.is-minimized .dm-yt-pill-bar {
        display: none !important;
      }
      .dm-yt-root.is-minimized .dm-yt-fab {
        display: flex;
      }

      @media (max-width: 950px) {
        .dm-yt-root,
        body.dm-sidebar-collapsed .dm-yt-root {
          left: 14px;
          right: auto;
          bottom: 16px;
          align-items: flex-start;
        }
        .dm-yt-popup {
          width: min(410px, calc(100vw - 28px));
          max-width: calc(100vw - 28px);
        }
        .dm-yt-pill-bar {
          max-width: calc(100vw - 92px);
          gap: 7px;
        }
      }

      @media (max-width: 600px) {
        .dm-yt-root,
        body.dm-sidebar-collapsed .dm-yt-root {
          left: 12px;
          right: auto;
          bottom: 14px;
        }
        .dm-yt-root.is-minimized {
          left: 14px;
          right: auto;
          bottom: 16px;
        }
        .dm-yt-popup {
          width: calc(100vw - 24px);
          max-width: calc(100vw - 24px);
        }
        .dm-yt-pill-bar {
          max-width: calc(100vw - 92px);
          gap: 6px;
        }
        .dm-yt-pill-thumb {
          display: none;
        }
        .dm-yt-pill-meta {
          flex: 1;
          min-width: 0;
          max-width: 145px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildWidgetDOM() {
    if (document.getElementById('dm-yt-floating-root')) return;
    injectStyles();

    const root = document.createElement('div');
    root.id = 'dm-yt-floating-root';
    root.className = 'dm-yt-root';

    root.innerHTML = `
      <!-- Expanded Floating Card -->
      <div class="dm-yt-popup" id="dmYtPopup">
        <!-- Header -->
        <div class="dm-yt-header">
          <div class="dm-yt-header-top">
            <div class="dm-yt-title-group">
              <span class="dm-yt-pl-name" id="dmYtHeaderTitle">Deutsch</span>
              <a
                class="dm-yt-red-badge"
                id="dmYtOriginalLink"
                href="https://www.youtube.com/playlist?list=${currentPlaylistId}"
                target="_blank"
                rel="noopener noreferrer"
                title="Mở Playlist gốc trên YouTube"
              >
                <i class="fa-brands fa-youtube"></i> YouTube Playlist
              </a>
            </div>

            <div class="dm-yt-header-actions">
              <button class="dm-yt-hbtn" id="dmYtBtnAddPl" title="Dán link Playlist YouTube khác">
                <i class="fa-solid fa-plus"></i> Playlist
              </button>
              <button class="dm-yt-hbtn" id="dmYtBtnToggleVideo" title="Bật / Tắt khung hình video nhỏ">
                <i class="fa-solid fa-tv"></i>
              </button>
              <button class="dm-yt-hbtn" id="dmYtBtnMinimize" title="Thu gọn xuống thanh bar">
                <i class="fa-solid fa-minus"></i>
              </button>
              <button class="dm-yt-hbtn" id="dmYtBtnClose" title="Đóng bảng mở rộng">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div class="dm-yt-header-sub">
            <span class="dm-yt-sub-desc" id="dmYtSubDesc">Tự động cập nhật danh sách video từ YouTube</span>
            <span class="dm-yt-sub-count" id="dmYtSubProgress">1/3</span>
          </div>
        </div>

        <!-- + Playlist Input Drawer -->
        <div class="dm-yt-add-drawer" id="dmYtAddDrawer">
          <div style="font-size: 0.72rem; color: #94a3b8; display: flex; justify-content: space-between; align-items: center;">
            <span>Dán link hoặc ID Playlist YouTube:</span>
            <button id="dmYtResetDefaultBtn" style="background:none; border:none; color:#38bdf8; font-size:0.72rem; cursor:pointer; font-weight:600;">
              Khôi phục mặc định
            </button>
          </div>
          <div class="dm-yt-add-row">
            <input
              type="text"
              class="dm-yt-add-input"
              id="dmYtPlaylistInput"
              placeholder="https://youtube.com/playlist?list=..."
            />
            <button class="dm-yt-add-submit" id="dmYtPlaylistSubmit">Tải Playlist</button>
          </div>
        </div>

        <!-- Hidden / Toggleable YouTube Video Container -->
        <div class="dm-yt-video-wrap" id="dmYtVideoWrap">
          <div id="dmYtIframeMount"></div>
        </div>

        <!-- Controls & Progress Bar -->
        <div class="dm-yt-controls-section">
          <div class="dm-yt-controls-row">
            <div class="dm-yt-ctrl-left">
              <button class="dm-yt-icon-btn" id="dmYtBtnRepeat" title="Lặp lại bài hiện tại (Repeat)">
                <i class="fa-solid fa-repeat"></i>
              </button>
              <button class="dm-yt-icon-btn" id="dmYtBtnShuffle" title="Trộn bài ngẫu nhiên (Shuffle)">
                <i class="fa-solid fa-shuffle"></i>
              </button>
            </div>

            <div class="dm-yt-ctrl-center">
              <button class="dm-yt-icon-btn" id="dmYtBtnPrev" title="Bài trước">
                <i class="fa-solid fa-backward-step"></i>
              </button>
              <button class="dm-yt-play-big" id="dmYtBtnPlayBig" title="Phát / Tạm dừng">
                <i class="fa-solid fa-play" id="dmYtPlayBigIcon"></i>
              </button>
              <button class="dm-yt-icon-btn" id="dmYtBtnNext" title="Bài tiếp theo">
                <i class="fa-solid fa-forward-step"></i>
              </button>
            </div>

            <div class="dm-yt-ctrl-right">
              <div class="dm-yt-vol-wrap">
                <button class="dm-yt-icon-btn" id="dmYtBtnMute" title="Âm lượng">
                  <i class="fa-solid fa-volume-high" id="dmYtVolIcon"></i>
                </button>
                <input
                  type="range"
                  class="dm-yt-vol-slider"
                  id="dmYtVolSlider"
                  min="0"
                  max="100"
                  value="85"
                />
              </div>
            </div>
          </div>

          <div class="dm-yt-progress-wrap">
            <input
              type="range"
              class="dm-yt-progress-range"
              id="dmYtProgressBar"
              min="0"
              max="100"
              value="0"
            />
            <div class="dm-yt-time-row">
              <span id="dmYtTimeCurrent">0:00</span>
              <span id="dmYtTimeTotal">2:59:21</span>
            </div>
          </div>
        </div>

        <!-- Scrollable Tracklist -->
        <div class="dm-yt-tracklist" id="dmYtTracklist"></div>
      </div>

      <!-- Collapsed Pill Bar -->
      <div class="dm-yt-pill-bar" id="dmYtPillBar">
        <button class="dm-yt-pill-play" id="dmYtPillPlayBtn" title="Phát / Tạm dừng">
          <i class="fa-solid fa-play" id="dmYtPillPlayIcon"></i>
        </button>

        <img
          class="dm-yt-pill-thumb"
          id="dmYtPillThumb"
          src="${tracks[0].thumbnail}"
          alt="Track thumbnail"
          referrerpolicy="no-referrer"
        />

        <div class="dm-yt-pill-meta" id="dmYtPillMetaClick" title="Nhấn để mở danh sách bài hát">
          <div class="dm-yt-pill-title-row">
            <span class="dm-yt-pill-idx" id="dmYtPillIdx">#1/3</span>
            <span class="dm-yt-pill-title" id="dmYtPillTitle">${tracks[0].title}</span>
          </div>
          <div class="dm-yt-pill-sub" id="dmYtPillSub">
            ${tracks[0].channel} • 0:00 / ${tracks[0].durationText}
          </div>
        </div>

        <button class="dm-yt-pill-next" id="dmYtPillNextBtn" title="Bài tiếp theo">
          <i class="fa-solid fa-forward-step"></i>
        </button>

        <button class="dm-yt-pill-expand" id="dmYtPillExpandBtn" title="Đóng / Mở danh sách Playlist">
          <i class="fa-solid fa-bars-staggered" style="color: #ef4444;"></i>
          <span id="dmYtPillPlBadge">Deutsch (3)</span>
        </button>

        <button class="dm-yt-pill-collapse" id="dmYtPillCollapseBtn" title="Thu gọn thanh phát xuống góc trái">
          <i class="fa-solid fa-chevron-down"></i>
        </button>
      </div>

      <!-- Circular Floating Button (When minimized) -->
      <button class="dm-yt-fab" id="dmYtFab" title="Mở lại trình phát nhạc (Hoặc vuốt lên)">
        <img class="dm-yt-fab-thumb" id="dmYtFabThumb" src="${tracks[0].thumbnail}" alt="Audio player" referrerpolicy="no-referrer" />
        <span class="dm-yt-fab-badge"><i class="fa-solid fa-chevron-up" id="dmYtFabIcon"></i></span>
      </button>
    `;

    document.body.appendChild(root);
    bindEvents();
    renderUI();
  }

  function setMinimizedState(minimized) {
    isMinimizedToFab = Boolean(minimized);
    const root = document.getElementById('dm-yt-floating-root');
    const popup = document.getElementById('dmYtPopup');
    if (isMinimizedToFab) {
      isExpanded = false;
      popup?.classList.remove('open');
      root?.classList.add('is-minimized');
      document.body.classList.add('dm-player-minimized');
    } else {
      root?.classList.remove('is-minimized');
      document.body.classList.remove('dm-player-minimized');
    }
  }

  function attachSwipeGesture(el, onSwipeDown, onSwipeUp) {
    if (!el) return;
    let startY = null;
    let startX = null;
    el.addEventListener(
      'touchstart',
      (e) => {
        if (!e.touches || !e.touches.length) return;
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );
    el.addEventListener(
      'touchend',
      (e) => {
        if (startY === null || !e.changedTouches || !e.changedTouches.length) return;
        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;
        const dy = endY - startY;
        const dx = Math.abs(endX - startX);
        startY = null;
        startX = null;
        if (Math.abs(dy) > 32 && Math.abs(dy) > dx) {
          if (dy > 0 && typeof onSwipeDown === 'function') onSwipeDown();
          if (dy < 0 && typeof onSwipeUp === 'function') onSwipeUp();
        }
      },
      { passive: true }
    );
  }

  function bindEvents() {
    const popup = document.getElementById('dmYtPopup');
    const pillBar = document.getElementById('dmYtPillBar');
    const fab = document.getElementById('dmYtFab');
    const popupHeader = popup?.querySelector('.dm-yt-header');

    const togglePopup = () => {
      isExpanded = !isExpanded;
      if (popup) popup.classList.toggle('open', isExpanded);
    };

    document.getElementById('dmYtPillExpandBtn')?.addEventListener('click', togglePopup);
    document.getElementById('dmYtPillMetaClick')?.addEventListener('click', togglePopup);
    document.getElementById('dmYtPillThumb')?.addEventListener('click', togglePopup);
    document.getElementById('dmYtBtnMinimize')?.addEventListener('click', () => {
      isExpanded = false;
      popup?.classList.remove('open');
    });
    document.getElementById('dmYtBtnClose')?.addEventListener('click', () => {
      isExpanded = false;
      popup?.classList.remove('open');
    });
    document.getElementById('dmYtPillCollapseBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      setMinimizedState(true);
    });
    fab?.addEventListener('click', () => setMinimizedState(false));

    // Touch swipe down to collapse, swipe up to restore
    attachSwipeGesture(
      pillBar,
      () => setMinimizedState(true),
      () => {
        isExpanded = true;
        popup?.classList.add('open');
      }
    );
    attachSwipeGesture(
      popupHeader,
      () => {
        isExpanded = false;
        popup?.classList.remove('open');
      },
      null
    );
    attachSwipeGesture(fab, null, () => setMinimizedState(false));

    // Play / Pause buttons
    document.getElementById('dmYtPillPlayBtn')?.addEventListener('click', togglePlayPause);
    document.getElementById('dmYtBtnPlayBig')?.addEventListener('click', togglePlayPause);

    // Next / Prev buttons
    document.getElementById('dmYtPillNextBtn')?.addEventListener('click', playNextTrack);
    document.getElementById('dmYtBtnNext')?.addEventListener('click', playNextTrack);
    document.getElementById('dmYtBtnPrev')?.addEventListener('click', playPrevTrack);

    // Repeat & Shuffle
    document.getElementById('dmYtBtnRepeat')?.addEventListener('click', () => {
      isRepeat = !isRepeat;
      document.getElementById('dmYtBtnRepeat')?.classList.toggle('active', isRepeat);
    });
    document.getElementById('dmYtBtnShuffle')?.addEventListener('click', () => {
      isShuffle = !isShuffle;
      document.getElementById('dmYtBtnShuffle')?.classList.toggle('active', isShuffle);
    });

    // Video frame toggle
    document.getElementById('dmYtBtnToggleVideo')?.addEventListener('click', () => {
      isVideoVisible = !isVideoVisible;
      document.getElementById('dmYtVideoWrap')?.classList.toggle('show-video', isVideoVisible);
      document.getElementById('dmYtBtnToggleVideo')?.classList.toggle('active', isVideoVisible);
    });

    // + Playlist Drawer toggle
    document.getElementById('dmYtBtnAddPl')?.addEventListener('click', () => {
      isAddInputOpen = !isAddInputOpen;
      document.getElementById('dmYtAddDrawer')?.classList.toggle('open', isAddInputOpen);
      document.getElementById('dmYtBtnAddPl')?.classList.toggle('active', isAddInputOpen);
      if (isAddInputOpen) {
        document.getElementById('dmYtPlaylistInput')?.focus();
      }
    });

    document.getElementById('dmYtPlaylistSubmit')?.addEventListener('click', handleAddCustomPlaylist);
    document.getElementById('dmYtPlaylistInput')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') handleAddCustomPlaylist();
    });
    document.getElementById('dmYtResetDefaultBtn')?.addEventListener('click', () => {
      loadPlaylistFromServer(DEFAULT_PLAYLIST_ID, true);
      isAddInputOpen = false;
      document.getElementById('dmYtAddDrawer')?.classList.remove('open');
      document.getElementById('dmYtBtnAddPl')?.classList.remove('active');
    });

    // Volume slider & Mute
    const volSlider = document.getElementById('dmYtVolSlider');
    volSlider?.addEventListener('input', (e) => {
      volume = parseInt(e.target.value, 10) || 0;
      if (ytPlayer && isPlayerReady && typeof ytPlayer.setVolume === 'function') {
        ytPlayer.unMute();
        ytPlayer.setVolume(volume);
      }
      updateVolumeIcon();
    });

    document.getElementById('dmYtBtnMute')?.addEventListener('click', () => {
      if (!ytPlayer || !isPlayerReady) return;
      if (ytPlayer.isMuted()) {
        ytPlayer.unMute();
        ytPlayer.setVolume(volume || 80);
      } else {
        ytPlayer.mute();
      }
      updateVolumeIcon();
    });

    // Progress scrubber
    const progBar = document.getElementById('dmYtProgressBar');
    progBar?.addEventListener('input', (e) => {
      const targetSec = parseFloat(e.target.value) || 0;
      currentTimeSec = targetSec;
      updateTimeLabels();
      if (ytPlayer && isPlayerReady && typeof ytPlayer.seekTo === 'function') {
        ytPlayer.seekTo(targetSec, true);
      }
    });
  }

  function updateVolumeIcon() {
    const icon = document.getElementById('dmYtVolIcon');
    if (!icon) return;
    const muted = ytPlayer && isPlayerReady && typeof ytPlayer.isMuted === 'function' && ytPlayer.isMuted();
    if (muted || volume === 0) {
      icon.className = 'fa-solid fa-volume-xmark';
    } else if (volume < 50) {
      icon.className = 'fa-solid fa-volume-low';
    } else {
      icon.className = 'fa-solid fa-volume-high';
    }
  }

  function handleAddCustomPlaylist() {
    const input = document.getElementById('dmYtPlaylistInput');
    if (!input) return;
    const plId = extractPlaylistId(input.value);
    if (!plId) {
      input.style.borderColor = '#ef4444';
      return;
    }
    input.value = '';
    isAddInputOpen = false;
    document.getElementById('dmYtAddDrawer')?.classList.remove('open');
    document.getElementById('dmYtBtnAddPl')?.classList.remove('active');
    loadPlaylistFromServer(plId, true);
  }

  async function loadPlaylistFromServer(playlistId, autoPlayFirst = false) {
    currentPlaylistId = playlistId;
    localStorage.setItem(STORAGE_KEY_PLAYLIST, playlistId);

    const subDesc = document.getElementById('dmYtSubDesc');
    if (subDesc) subDesc.textContent = 'Đang đồng bộ danh sách video từ YouTube...';

    try {
      const res = await fetch(`/api/youtube/playlist?list=${encodeURIComponent(playlistId)}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();

      if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
        playlistTitle = data.title || 'YouTube Playlist';
        playlistDescription =
          data.description && data.description.trim()
            ? data.description.trim()
            : 'Tự động cập nhật danh sách video từ YouTube';
        tracks = data.tracks;
        currentIndex = 0;
        currentTimeSec = 0;
        totalDurationSec = tracks[0].durationSeconds || 0;

        renderUI();

        if (ytPlayer && isPlayerReady) {
          if (autoPlayFirst) {
            ytPlayer.loadVideoById(tracks[0].videoId);
          } else {
            ytPlayer.cueVideoById(tracks[0].videoId);
          }
        }
        return;
      }
    } catch (err) {
      console.warn('Fallback to direct IFrame playlist cue:', err);
    }

    // Fallback if playlist is custom and only cueable via YT IFrame list
    if (ytPlayer && isPlayerReady && typeof ytPlayer.loadPlaylist === 'function') {
      playlistTitle = 'Playlist YouTube';
      playlistDescription = `Playlist ID: ${playlistId}`;
      ytPlayer.cuePlaylist({
        listType: 'playlist',
        list: playlistId,
        index: 0,
      });
      renderUI();
    }
  }

  function renderUI() {
    const total = tracks.length || 1;
    const safeIdx = Math.min(Math.max(0, currentIndex), total - 1);
    const current = tracks[safeIdx] || {
      videoId: 'f3DwawSJlTo',
      title: 'Đang tải bài hát...',
      channel: 'YouTube',
      thumbnail: 'https://i.ytimg.com/vi/f3DwawSJlTo/mqdefault.jpg',
      durationText: '0:00',
      durationSeconds: 0,
    };

    // Header
    const headerTitle = document.getElementById('dmYtHeaderTitle');
    if (headerTitle) headerTitle.textContent = playlistTitle;

    const origLink = document.getElementById('dmYtOriginalLink');
    if (origLink) {
      origLink.href = `https://www.youtube.com/playlist?list=${encodeURIComponent(currentPlaylistId)}`;
    }

    const subDesc = document.getElementById('dmYtSubDesc');
    if (subDesc) subDesc.textContent = playlistDescription;

    const subProg = document.getElementById('dmYtSubProgress');
    if (subProg) subProg.textContent = `${safeIdx + 1}/${total}`;

    // Collapsed Pill
    const pillThumb = document.getElementById('dmYtPillThumb');
    if (pillThumb && current.thumbnail) pillThumb.src = current.thumbnail;

    const pillIdx = document.getElementById('dmYtPillIdx');
    if (pillIdx) pillIdx.textContent = `#${safeIdx + 1}/${total}`;

    const pillTitle = document.getElementById('dmYtPillTitle');
    if (pillTitle) pillTitle.textContent = current.title;

    const pillPlBadge = document.getElementById('dmYtPillPlBadge');
    if (pillPlBadge) pillPlBadge.textContent = `${playlistTitle} (${total})`;

    // Play/Pause icons
    const playIconClass = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    const bigIcon = document.getElementById('dmYtPlayBigIcon');
    if (bigIcon) bigIcon.className = playIconClass;
    const pillIcon = document.getElementById('dmYtPillPlayIcon');
    if (pillIcon) pillIcon.className = playIconClass;

    // Circular FAB sync
    const fab = document.getElementById('dmYtFab');
    if (fab) fab.classList.toggle('playing', isPlaying);
    const fabThumb = document.getElementById('dmYtFabThumb');
    if (fabThumb && current.thumbnail) fabThumb.src = current.thumbnail;
    const fabIcon = document.getElementById('dmYtFabIcon');
    if (fabIcon) fabIcon.className = isPlaying ? 'fa-solid fa-music' : 'fa-solid fa-chevron-up';

    updateTimeLabels();
    renderTracklist();
  }

  function updateTimeLabels() {
    const total = tracks.length || 1;
    const safeIdx = Math.min(Math.max(0, currentIndex), total - 1);
    const current = tracks[safeIdx] || {};
    const effTotal = totalDurationSec > 0 ? totalDurationSec : current.durationSeconds || 0;

    const curText = formatTime(currentTimeSec);
    const totText = effTotal > 0 ? formatTime(effTotal) : current.durationText || '0:00';

    const curEl = document.getElementById('dmYtTimeCurrent');
    if (curEl) curEl.textContent = curText;

    const totEl = document.getElementById('dmYtTimeTotal');
    if (totEl) totEl.textContent = totText;

    const progBar = document.getElementById('dmYtProgressBar');
    if (progBar) {
      progBar.max = String(Math.max(1, Math.floor(effTotal)));
      progBar.value = String(Math.min(Math.floor(effTotal), Math.floor(currentTimeSec)));
    }

    const pillSub = document.getElementById('dmYtPillSub');
    if (pillSub) {
      pillSub.textContent = `${current.channel || 'YouTube'} • ${curText} / ${totText}`;
    }
  }

  function renderTracklist() {
    const listEl = document.getElementById('dmYtTracklist');
    if (!listEl) return;

    listEl.innerHTML = '';
    tracks.forEach((t, idx) => {
      const active = idx === currentIndex;
      const row = document.createElement('div');
      row.className = `dm-yt-track-item${active ? ' active' : ''}`;
      row.onclick = () => selectAndPlayTrack(idx);

      row.innerHTML = `
        <div class="dm-yt-track-num">
          ${active && isPlaying ? '<i class="fa-solid fa-volume-high"></i>' : idx + 1}
        </div>
        <div class="dm-yt-thumb-box">
          <img src="${t.thumbnail}" alt="" referrerpolicy="no-referrer" loading="lazy" />
          <span class="dm-yt-thumb-dur">${t.durationText || '0:00'}</span>
        </div>
        <div class="dm-yt-track-info">
          <div class="dm-yt-track-title">${t.title}</div>
          <div class="dm-yt-track-channel">${t.channel || 'YouTube'}</div>
        </div>
      `;
      listEl.appendChild(row);
    });
  }

  function selectAndPlayTrack(index) {
    if (!tracks.length) return;
    currentIndex = (index + tracks.length) % tracks.length;
    const target = tracks[currentIndex];
    currentTimeSec = 0;
    totalDurationSec = target.durationSeconds || 0;
    isPlaying = true;
    renderUI();

    if (ytPlayer && isPlayerReady && typeof ytPlayer.loadVideoById === 'function') {
      ytPlayer.loadVideoById(target.videoId);
    }
  }

  function togglePlayPause() {
    if (!ytPlayer || !isPlayerReady) return;
    const state = ytPlayer.getPlayerState();
    if (state === 1) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  }

  function playNextTrack() {
    if (!tracks.length) return;
    if (isShuffle && tracks.length > 1) {
      let nextIdx = currentIndex;
      while (nextIdx === currentIndex) {
        nextIdx = Math.floor(Math.random() * tracks.length);
      }
      selectAndPlayTrack(nextIdx);
    } else {
      selectAndPlayTrack((currentIndex + 1) % tracks.length);
    }
  }

  function playPrevTrack() {
    if (!tracks.length) return;
    if (currentTimeSec > 5 && ytPlayer && isPlayerReady) {
      ytPlayer.seekTo(0, true);
      currentTimeSec = 0;
      updateTimeLabels();
      return;
    }
    selectAndPlayTrack((currentIndex - 1 + tracks.length) % tracks.length);
  }

  function startProgressTicker() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (!ytPlayer || !isPlayerReady || !isPlaying) return;
      try {
        const cur = ytPlayer.getCurrentTime();
        const dur = ytPlayer.getDuration();
        if (typeof cur === 'number' && !isNaN(cur)) {
          currentTimeSec = cur;
        }
        if (typeof dur === 'number' && dur > 0) {
          totalDurationSec = dur;
          if (tracks[currentIndex] && !tracks[currentIndex].durationSeconds) {
            tracks[currentIndex].durationSeconds = Math.floor(dur);
            tracks[currentIndex].durationText = formatTime(dur);
          }
        }
        updateTimeLabels();
      } catch {
        // Ignore transient iframe state error
      }
    }, 500);
  }

  function initYouTubeIframeAPI() {
    const createPlayer = () => {
      if (ytPlayer) return;
      ytPlayer = new window.YT.Player('dmYtIframeMount', {
        height: '200',
        width: '100%',
        videoId: tracks[0]?.videoId || 'f3DwawSJlTo',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            isPlayerReady = true;
            const iframeEl = typeof event.target.getIframe === 'function' ? event.target.getIframe() : null;
            if (iframeEl) {
              iframeEl.style.pointerEvents = 'none';
              iframeEl.setAttribute('tabindex', '-1');
            }
            event.target.setVolume(volume);
            startProgressTicker();
          },
          onStateChange: (event) => {
            const YTS = window.YT.PlayerState;
            if (event.data === YTS.PLAYING) {
              isPlaying = true;
              const dur = ytPlayer.getDuration();
              if (dur > 0) totalDurationSec = dur;
              renderUI();
            } else if (event.data === YTS.PAUSED) {
              isPlaying = false;
              renderUI();
            } else if (event.data === YTS.ENDED) {
              if (isRepeat) {
                ytPlayer.seekTo(0, true);
                ytPlayer.playVideo();
              } else {
                playNextTrack();
              }
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prevCallback === 'function') prevCallback();
        createPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }
  }

  function boot() {
    buildWidgetDOM();
    initYouTubeIframeAPI();
    loadPlaylistFromServer(currentPlaylistId, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
