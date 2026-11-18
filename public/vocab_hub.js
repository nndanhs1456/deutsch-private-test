// Quản lý Trung tâm 5,243 Từ vựng Thực chiến, Quick Dict Modal & Trình Đọc Báo Tiếng Đức Trực Tiếp (Reader View)
(function () {
  let currentLevelFilter = 'ALL';
  let currentCategoryFilter = 'ALL';
  let currentWortartFilter = 'ALL';
  let currentSearchQuery = '';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 30;
  let currentModalItem = null;

  // Trạng thái Chế độ xem Kollokationen & Wortschatz ('list' | 'flashcard')
  let currentVocabViewMode = 'list';
  let flashcardDeck = [];
  let currentFlashcardIdx = 0;
  let isFlashcardFlipped = false;

  // Trạng thái Tin tức Tiếng Đức (Leseverstehen Reader View)
  let liveNewsItems = [];
  let currentNewsSource = 'all';
  let activeNewsArticle = null;
  let isReadingAloudNews = false;

  function classifyWortart(item) {
    const art = (item.art || '').toLowerCase().trim();
    const en = (item.en || '').toLowerCase().trim();
    const ex = item.example || '';
    if (art === 'der' || art === 'die' || art === 'das') return 'NOMEN';
    if (
      en.startsWith('động từ') ||
      ex.startsWith('Man muss im Beruf') ||
      ex.startsWith('Können Sie diese Aufgabe')
    ) {
      return 'VERBEN';
    }
    if (ex.startsWith('Diese Lösung ist') || en.startsWith('tính từ')) {
      return 'ADJEKTIVE';
    }
    return 'OTHER';
  }

  function getFilteredWords() {
    const source = window.allHubWords || [];
    return source.filter((item) => {
      if (currentLevelFilter !== 'ALL' && item.level !== currentLevelFilter) {
        return false;
      }
      if (currentCategoryFilter !== 'ALL' && item.catVi !== currentCategoryFilter) {
        return false;
      }
      if (currentWortartFilter !== 'ALL' && classifyWortart(item) !== currentWortartFilter) {
        return false;
      }
      if (currentSearchQuery.trim()) {
        const q = currentSearchQuery.toLowerCase().trim();
        const w = (item.word || item.de || '').toLowerCase();
        const vi = (item.en || '').toLowerCase();
        const cat = (item.catVi || '').toLowerCase();
        const ex = (item.example || '').toLowerCase();
        return w.includes(q) || vi.includes(q) || cat.includes(q) || ex.includes(q);
      }
      return true;
    });
  }

  function renderCategoryChips() {
    const chipContainer = document.getElementById('categoryFilterChips');
    if (!chipContainer) return;
    const source = window.allHubWords || [];
    const categories = ['ALL', ...Array.from(new Set(source.map((i) => i.catVi).filter(Boolean)))];

    chipContainer.innerHTML = '';
    categories.forEach((cat) => {
      const btn = document.createElement('button');
      const isActive = currentCategoryFilter === cat;
      btn.className = isActive ? 'deck-btn btn-primary-ios' : 'deck-btn btn-glass-subtle';
      btn.style.cssText = 'padding: 6px 14px; font-size: 0.8rem; border-radius: 12px;';
      btn.innerText = cat === 'ALL' ? 'Tất cả chủ đề' : cat;
      btn.onclick = () => {
        currentCategoryFilter = cat;
        currentPage = 1;
        renderCategoryChips();
        window.renderVocabHubGrid();
        syncFlashcardDeckFromFilters(false);
      };
      chipContainer.appendChild(btn);
    });
  }

  window.renderVocabHubGrid = function () {
    const grid = document.getElementById('vocabCardsGrid');
    if (!grid) return;

    const source = window.allHubWords || [];
    const filtered = getFilteredWords();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const totalCountEl = document.getElementById('totalVocabCount');
    if (totalCountEl && source.length > 0) {
      totalCountEl.innerText = source.length.toLocaleString('en-US');
    }

    const countEl = document.getElementById('filteredWordCountText');
    if (countEl) {
      countEl.innerText = `${filtered.length.toLocaleString('en-US')} từ`;
    }

    const favCountEl = document.getElementById('hubFavCount');
    if (favCountEl && typeof window.getFavorites === 'function') {
      favCountEl.innerText = `${window.getFavorites().length} từ`;
    }

    const pageInd = document.getElementById('hubPageIndicator');
    if (pageInd) {
      pageInd.innerText = `${currentPage} / ${totalPages}`;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    grid.innerHTML = '';
    if (pageItems.length === 0) {
      grid.innerHTML = `
        <div class="liquid-glass" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; color: #94a3b8;">
          <i class="fa-solid fa-filter-circle-xmark" style="font-size: 2rem; color: #64748b; margin-bottom: 10px; display: block;"></i>
          Không tìm thấy từ vựng phù hợp với bộ lọc hiện tại. Hãy thử đổi Từ loại hoặc bấm "Đặt lại bộ lọc".
        </div>
      `;
    }
    pageItems.forEach((item) => {
      const artColor =
        item.art === 'der'
          ? '#38bdf8'
          : item.art === 'die'
          ? '#f43f5e'
          : item.art === 'das'
          ? '#10b981'
          : '#fbbf24';

      const fullDe = (item.art ? item.art + ' ' : '') + (item.word || '');
      const favorited = typeof window.isFavorited === 'function' ? window.isFavorited(fullDe) : false;

      const card = document.createElement('div');
      card.className = 'liquid-glass';
      card.style.cssText =
        'padding: 18px 20px; background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.18s ease, border-color 0.18s ease;';

      card.onmouseenter = () => {
        card.style.borderColor = 'rgba(56, 189, 248, 0.45)';
        card.style.transform = 'translateY(-2px)';
      };
      card.onmouseleave = () => {
        card.style.borderColor = 'rgba(255,255,255,0.1)';
        card.style.transform = 'translateY(0)';
      };
      card.onclick = () => window.openQuickDictModal(item);

      const safeSpeakStr = fullDe.replace(/'/g, "\\'");

      const notebookSvg = favorited
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(251, 191, 36, 0.28)" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M10 2v8l3-3 3 3V2" fill="#fbbf24"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M10 2v8l3-3 3 3V2"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path></svg>';

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 6px;">
            <span style="font-size: 0.72rem; font-weight: 800; color: #38bdf8; text-transform: uppercase;">${item.level} • ${item.catVi || 'Tổng hợp'}</span>
            <div style="display: flex; gap: 6px;">
              <button class="card-fav-btn" title="${favorited ? 'Đã lưu vào Sổ tay' : 'Lưu vào Sổ tay'}" aria-label="${favorited ? 'Đã lưu vào Sổ tay' : 'Lưu vào Sổ tay'}" style="display: inline-flex; align-items: center; justify-content: center; background: ${favorited ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${favorited ? 'rgba(251, 191, 36, 0.55)' : 'rgba(255,255,255,0.16)'}; color: ${favorited ? '#fbbf24' : '#94a3b8'}; box-shadow: ${favorited ? '0 0 10px rgba(251, 191, 36, 0.22)' : 'none'}; width: 32px; height: 32px; border-radius: 10px; cursor: pointer; transition: all 0.18s ease;">
                ${notebookSvg}
              </button>
              <button onclick="event.stopPropagation(); window.speakText('${safeSpeakStr}')" title="Nghe phát âm" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: 32px; height: 32px; border-radius: 10px; cursor: pointer;">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>
          </div>
          <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; flex-wrap: wrap;">
            ${item.art ? `<strong style="color: ${artColor}; font-size: 1.05rem;">${item.art}</strong>` : ''}
            <strong style="color: #fff; font-size: 1.25rem;">${item.word}</strong>
          </div>
          <div style="color: #34d399; font-size: 0.95rem; font-weight: 600; margin-bottom: 10px;">
            ${item.en}
          </div>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 10px 12px; border-radius: 12px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.45;">
          "${item.example}"
          <div style="color: #94a3b8; margin-top: 3px; font-style: italic;">➔ ${item.exampleEn}</div>
        </div>
      `;

      const favBtn = card.querySelector('.card-fav-btn');
      if (favBtn) {
        favBtn.onclick = (e) => {
          e.stopPropagation();
          if (typeof window.toggleFavoriteItem === 'function') {
            const added = window.toggleFavoriteItem({
              de: fullDe,
              vi: item.en || '',
              type: `Từ vựng (${item.level || 'B1'})`,
              ex: item.example || '',
            });
            if (typeof window.showAppToast === 'function') {
              window.showAppToast(
                added ? `Đã lưu "${fullDe}" vào Sổ tay` : `Đã xóa "${fullDe}" khỏi Sổ tay`,
                added ? 'saved' : 'removed'
              );
            }
            window.renderVocabHubGrid();
          }
        };
      }

      grid.appendChild(card);
    });
  };

  function syncFlashcardDeckFromFilters(preserveIndex) {
    flashcardDeck = getFilteredWords().slice();
    if (!preserveIndex || currentFlashcardIdx >= flashcardDeck.length) {
      currentFlashcardIdx = 0;
    }
    isFlashcardFlipped = false;
    if (currentVocabViewMode === 'flashcard') {
      window.renderHubFlashcard();
    }
  }

  window.filterByLevel = function (level, btnEl) {
    currentLevelFilter = level;
    currentPage = 1;
    if (btnEl && btnEl.parentElement) {
      Array.from(btnEl.parentElement.children).forEach((b) => {
        b.className = 'deck-btn btn-glass-subtle';
        b.style.background = '';
      });
      btnEl.className = 'deck-btn btn-primary-ios';
      btnEl.style.background = 'linear-gradient(135deg, #e11d48, #f43f5e)';
    }
    window.renderVocabHubGrid();
    syncFlashcardDeckFromFilters(false);
  };

  window.filterByWortart = function (wortart, btnEl) {
    currentWortartFilter = wortart || 'ALL';
    currentPage = 1;
    const group = document.getElementById('wortartenFilterGroup');
    if (group) {
      Array.from(group.children).forEach((b) => {
        const active = b === btnEl || b.getAttribute('data-wortart') === currentWortartFilter;
        b.className = active ? 'deck-btn btn-primary-ios' : 'deck-btn btn-glass-subtle';
        b.style.background = active ? 'linear-gradient(135deg, #2563eb, #38bdf8)' : '';
      });
    }
    window.renderVocabHubGrid();
    syncFlashcardDeckFromFilters(false);
  };

  window.handleHubSearch = function (val) {
    currentSearchQuery = val || '';
    currentPage = 1;
    window.renderVocabHubGrid();
    syncFlashcardDeckFromFilters(false);
  };

  window.resetHubFilters = function () {
    currentLevelFilter = 'ALL';
    currentCategoryFilter = 'ALL';
    currentWortartFilter = 'ALL';
    currentSearchQuery = '';
    currentPage = 1;
    const input = document.getElementById('hubSearchInput');
    if (input) input.value = '';
    const levelAllBtn = document.getElementById('btnFilterLevelAll');
    if (levelAllBtn && levelAllBtn.parentElement) {
      Array.from(levelAllBtn.parentElement.children).forEach((b) => {
        b.className = 'deck-btn btn-glass-subtle';
        b.style.background = '';
      });
      levelAllBtn.className = 'deck-btn btn-primary-ios';
      levelAllBtn.style.background = 'linear-gradient(135deg, #e11d48, #f43f5e)';
    }
    const wortGroup = document.getElementById('wortartenFilterGroup');
    if (wortGroup) {
      Array.from(wortGroup.children).forEach((b) => {
        const isAll = b.getAttribute('data-wortart') === 'ALL';
        b.className = isAll ? 'deck-btn btn-primary-ios' : 'deck-btn btn-glass-subtle';
        b.style.background = isAll ? 'linear-gradient(135deg, #2563eb, #38bdf8)' : '';
      });
    }
    renderCategoryChips();
    window.renderVocabHubGrid();
    syncFlashcardDeckFromFilters(false);
  };

  function getNotebookIconSvgInline(favorited) {
    return favorited
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(251, 191, 36, 0.28)" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M10 2v8l3-3 3 3V2" fill="#fbbf24"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M10 2v8l3-3 3 3V2"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path></svg>';
  }

  window.switchVocabViewMode = function (mode) {
    currentVocabViewMode = mode === 'flashcard' ? 'flashcard' : 'list';
    const listWrap = document.getElementById('vocabListModeContainer');
    const fcWrap = document.getElementById('vocabFlashcardModeContainer');
    const btnList = document.getElementById('btnVocabModeList');
    const btnFc = document.getElementById('btnVocabModeFlashcard');

    if (listWrap) listWrap.style.display = currentVocabViewMode === 'list' ? 'block' : 'none';
    if (fcWrap) fcWrap.style.display = currentVocabViewMode === 'flashcard' ? 'block' : 'none';

    if (btnList) {
      btnList.className = currentVocabViewMode === 'list' ? 'deck-btn btn-primary-ios' : 'deck-btn btn-glass-subtle';
      btnList.style.background = currentVocabViewMode === 'list' ? 'linear-gradient(135deg, #2563eb, #38bdf8)' : '';
    }
    if (btnFc) {
      btnFc.className = currentVocabViewMode === 'flashcard' ? 'deck-btn btn-primary-ios' : 'deck-btn btn-glass-subtle';
      btnFc.style.background = currentVocabViewMode === 'flashcard' ? 'linear-gradient(135deg, #2563eb, #38bdf8)' : '';
    }

    if (currentVocabViewMode === 'flashcard') {
      if (!flashcardDeck.length) {
        flashcardDeck = getFilteredWords().slice();
      }
      window.renderHubFlashcard();
    } else {
      window.renderVocabHubGrid();
    }
  };

  window.renderHubFlashcard = function () {
    if (!flashcardDeck.length) {
      flashcardDeck = getFilteredWords().slice();
    }
    const cardBox = document.getElementById('hubFlashcardBox');
    const metaEl = document.getElementById('fcMetaBadge');
    const artEl = document.getElementById('fcArtText');
    const wordEl = document.getElementById('fcWordText');
    const viEl = document.getElementById('fcViMeaning');
    const exDeEl = document.getElementById('fcExampleDe');
    const exViEl = document.getElementById('fcExampleVi');
    const counterEl = document.getElementById('hubFlashcardCounter');
    const favBtnFront = document.getElementById('fcFavBtnFront');
    const favBtnBack = document.getElementById('fcFavBtnBack');

    if (cardBox) {
      cardBox.classList.toggle('is-flipped', isFlashcardFlipped);
    }

    if (!flashcardDeck.length) {
      if (metaEl) metaEl.innerText = 'Không có thẻ';
      if (artEl) artEl.innerText = '';
      if (wordEl) wordEl.innerText = 'Không tìm thấy từ phù hợp';
      if (viEl) viEl.innerText = 'Hãy thay đổi bộ lọc hoặc từ khóa tìm kiếm.';
      if (exDeEl) exDeEl.innerText = '';
      if (exViEl) exViEl.innerText = '';
      if (counterEl) counterEl.innerText = 'Thẻ 0 / 0';
      return;
    }

    if (currentFlashcardIdx >= flashcardDeck.length) currentFlashcardIdx = 0;
    if (currentFlashcardIdx < 0) currentFlashcardIdx = flashcardDeck.length - 1;

    const item = flashcardDeck[currentFlashcardIdx];
    const wortart = classifyWortart(item);
    const wortartLabel =
      wortart === 'NOMEN' ? 'Nomen' : wortart === 'VERBEN' ? 'Verb' : wortart === 'ADJEKTIVE' ? 'Adjektiv' : 'Từ vựng';

    if (metaEl) {
      metaEl.innerText = `${item.level || 'B1'} • ${item.catVi || 'Tổng hợp'} • ${wortartLabel}`;
    }

    const artColor =
      item.art === 'der'
        ? '#38bdf8'
        : item.art === 'die'
        ? '#f43f5e'
        : item.art === 'das'
        ? '#10b981'
        : '#fbbf24';

    if (artEl) {
      artEl.innerText = item.art || '';
      artEl.style.color = artColor;
      artEl.style.display = item.art ? 'inline' : 'none';
    }
    if (wordEl) {
      wordEl.innerText = item.word || item.de || '';
    }
    if (viEl) {
      viEl.innerText = item.en || '';
    }
    if (exDeEl) {
      exDeEl.innerText = item.example ? `"${item.example}"` : '';
    }
    if (exViEl) {
      exViEl.innerText = item.exampleEn ? `➔ ${item.exampleEn}` : '';
    }
    if (counterEl) {
      counterEl.innerText = `Thẻ ${(currentFlashcardIdx + 1).toLocaleString('en-US')} / ${flashcardDeck.length.toLocaleString('en-US')}`;
    }

    const fullDe = (item.art ? item.art + ' ' : '') + (item.word || item.de || '');
    const favorited = typeof window.isFavorited === 'function' ? window.isFavorited(fullDe) : false;

    [favBtnFront, favBtnBack].forEach((btn) => {
      if (!btn) return;
      btn.innerHTML = getNotebookIconSvgInline(favorited);
      btn.title = favorited ? 'Đã lưu vào Sổ tay' : 'Lưu vào Sổ tay';
      btn.style.background = favorited ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255,255,255,0.06)';
      btn.style.borderColor = favorited ? 'rgba(251, 191, 36, 0.55)' : 'rgba(255,255,255,0.16)';
      btn.style.color = favorited ? '#fbbf24' : '#94a3b8';
      btn.style.boxShadow = favorited ? '0 0 10px rgba(251, 191, 36, 0.22)' : 'none';
    });
  };

  window.flipHubFlashcard = function () {
    if (!flashcardDeck.length) return;
    isFlashcardFlipped = !isFlashcardFlipped;
    const cardBox = document.getElementById('hubFlashcardBox');
    if (cardBox) {
      cardBox.classList.toggle('is-flipped', isFlashcardFlipped);
    }
  };

  window.nextHubFlashcard = function () {
    if (!flashcardDeck.length) return;
    currentFlashcardIdx = (currentFlashcardIdx + 1) % flashcardDeck.length;
    isFlashcardFlipped = false;
    window.renderHubFlashcard();
  };

  window.prevHubFlashcard = function () {
    if (!flashcardDeck.length) return;
    currentFlashcardIdx = (currentFlashcardIdx - 1 + flashcardDeck.length) % flashcardDeck.length;
    isFlashcardFlipped = false;
    window.renderHubFlashcard();
  };

  window.shuffleHubFlashcards = function () {
    if (!flashcardDeck.length) return;
    for (let i = flashcardDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = flashcardDeck[i];
      flashcardDeck[i] = flashcardDeck[j];
      flashcardDeck[j] = tmp;
    }
    currentFlashcardIdx = 0;
    isFlashcardFlipped = false;
    window.renderHubFlashcard();
    if (typeof window.showAppToast === 'function') {
      window.showAppToast('Đã đảo ngẫu nhiên thứ tự bộ thẻ', 'saved');
    }
  };

  window.speakCurrentFlashcard = function () {
    if (!flashcardDeck.length || typeof window.speakText !== 'function') return;
    const item = flashcardDeck[currentFlashcardIdx];
    const fullDe = (item.art ? item.art + ' ' : '') + (item.word || item.de || '');
    window.speakText(fullDe);
  };

  window.toggleFlashcardFavorite = function () {
    if (!flashcardDeck.length || typeof window.toggleFavoriteItem !== 'function') return;
    const item = flashcardDeck[currentFlashcardIdx];
    const fullDe = (item.art ? item.art + ' ' : '') + (item.word || item.de || '');
    const added = window.toggleFavoriteItem({
      de: fullDe,
      vi: item.en || '',
      type: `Từ vựng (${item.level || 'B1'})`,
      ex: item.example || '',
    });
    if (typeof window.showAppToast === 'function') {
      window.showAppToast(
        added ? `Đã lưu "${fullDe}" vào Sổ tay` : `Đã xóa "${fullDe}" khỏi Sổ tay`,
        added ? 'saved' : 'removed'
      );
    }
    window.renderHubFlashcard();
    const favCountEl = document.getElementById('hubFavCount');
    if (favCountEl && typeof window.getFavorites === 'function') {
      favCountEl.innerText = `${window.getFavorites().length} từ`;
    }
  };

  window.changeHubPage = function (delta) {
    const filtered = getFilteredWords();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    currentPage = Math.min(totalPages, Math.max(1, currentPage + delta));
    window.renderVocabHubGrid();
  };

  window.jumpToHubPage = function () {
    const input = document.getElementById('jumpPageInput');
    if (!input) return;
    const target = parseInt(input.value, 10);
    if (!isNaN(target) && target >= 1) {
      currentPage = target;
      window.renderVocabHubGrid();
    }
  };

  function syncModalFavButtonState() {
    const btn = document.getElementById('btnFavoriteModal');
    if (!btn || !currentModalItem) return;
    const fullDe = (currentModalItem.art ? currentModalItem.art + ' ' : '') + (currentModalItem.word || currentModalItem.de || '');
    const isFav = typeof window.isFavorited === 'function' ? window.isFavorited(fullDe) : false;
    if (isFav) {
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.28)" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M10 2v8l3-3 3 3V2" fill="currentColor"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path></svg> Đã lưu vào Sổ tay';
      btn.title = 'Đã lưu vào Sổ tay';
      btn.style.background = 'linear-gradient(135deg, #d97706, #fbbf24)';
      btn.style.color = '#0f172a';
    } else {
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M10 2v8l3-3 3 3V2"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path></svg> Lưu vào Sổ tay';
      btn.title = 'Lưu vào Sổ tay';
      btn.style.background = 'rgba(255,255,255,0.1)';
      btn.style.color = '#fff';
    }
  }

  window.openQuickDictModal = function (item) {
    currentModalItem = item;
    const overlay = document.getElementById('quickDictModalOverlay');
    if (!overlay) return;

    const loadingEl = document.getElementById('modalLoadingState');
    if (loadingEl) loadingEl.style.display = item.isLoading ? 'block' : 'none';

    const artEl = document.getElementById('modalDictArt');
    if (artEl) {
      artEl.innerText = item.art || '';
      artEl.style.color =
        item.art === 'der'
          ? '#38bdf8'
          : item.art === 'die'
          ? '#f43f5e'
          : item.art === 'das'
          ? '#10b981'
          : '#fbbf24';
    }

    document.getElementById('modalDictWord').innerText = item.word || item.de || '';
    document.getElementById('modalDictLevelBadge').innerText = item.level || 'B1/B2';
    document.getElementById('modalDictTopicName').innerText = item.catVi || 'Tổng hợp';
    document.getElementById('modalDictViMeaning').innerText = item.en || 'Đang dịch nghĩa...';
    document.getElementById('modalDictSentenceDe').innerText = item.example ? `"${item.example}"` : '';
    document.getElementById('modalDictSentenceVi').innerText = item.exampleEn ? `➤ ${item.exampleEn}` : '';

    syncModalFavButtonState();

    overlay.style.display = 'flex';
    overlay.style.pointerEvents = 'auto';
  };

  window.closeQuickDictModal = function () {
    const overlay = document.getElementById('quickDictModalOverlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'none';
  };

  window.toggleFavoriteFromModal = function () {
    if (!currentModalItem || typeof window.toggleFavoriteItem !== 'function') return;
    const fullDe = (currentModalItem.art ? currentModalItem.art + ' ' : '') + (currentModalItem.word || currentModalItem.de || '');
    const added = window.toggleFavoriteItem({
      de: fullDe,
      vi: currentModalItem.en || '',
      type: currentModalItem.catVi || 'Từ vựng',
      ex: currentModalItem.example || '',
    });
    if (typeof window.showAppToast === 'function') {
      window.showAppToast(
        added ? `Đã lưu "${fullDe}" vào Sổ tay` : `Đã xóa "${fullDe}" khỏi Sổ tay`,
        added ? 'saved' : 'removed'
      );
    }
    syncModalFavButtonState();
    window.renderVocabHubGrid();
  };

  window.openDeepDictFromModal = function () {
    const word = currentModalItem ? currentModalItem.word || currentModalItem.de : '';
    window.closeQuickDictModal();
    if (typeof window.switchTab === 'function') {
      window.switchTab('dictionary');
      if (word && typeof window.quickDictLookup === 'function') {
        window.quickDictLookup(word);
      }
    }
  };

  // =========================================================================
  // TRÌNH ĐỌC BÁO TIẾNG ĐỨC TRỰC TIẾP (LIVE RSS + CHEERIO READER VIEW)
  // =========================================================================

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Biến đoạn văn tiếng Đức thành các từ có thể bấm vào tra từ ngay lập tức
  function tokenizeGermanParagraph(paragraphText) {
    const safeSentenceAttr = escapeHtml(paragraphText);
    // Tách theo khoảng trắng nhưng giữ nguyên dấu câu bên ngoài thẻ span từ
    return paragraphText
      .split(/(\s+)/)
      .map((token) => {
        if (/^\s+$/.test(token)) return token;
        const match = token.match(/^([^A-Za-zÄÖÜäöüß0-9]*)([A-Za-zÄÖÜäöüß0-9\-]+)([^A-Za-zÄÖÜäöüß0-9]*)$/);
        if (!match) return escapeHtml(token);
        const [, prefix, coreWord, suffix] = match;
        return `${escapeHtml(prefix)}<span class="de-reader-word" data-word="${escapeHtml(coreWord)}" data-sentence="${safeSentenceAttr}" onclick="window.handleReaderWordClick(this, event)">${escapeHtml(coreWord)}</span>${escapeHtml(suffix)}`;
      })
      .join('');
  }

  window.handleReaderWordClick = function (el, ev) {
    if (ev) ev.stopPropagation();
    // Nếu người dùng đang bôi đen một cụm từ dài thì ưu tiên cụm từ bôi đen
    const sel = window.getSelection ? window.getSelection().toString().trim() : '';
    if (sel && sel.length > 1 && sel.includes(' ')) {
      return;
    }
    const word = el.getAttribute('data-word') || el.innerText || '';
    const sentence = el.getAttribute('data-sentence') || '';
    if (word) {
      window.lookupWordFromReader(word, sentence);
    }
  };

  async function translateGermanTextToVi(text) {
    if (!text) return '';
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          return data[0].map((part) => part[0]).join('');
        }
      }
    } catch (_e) {
      // Fallback sang MyMemory nếu bị chặn
    }
    try {
      const res2 = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=de|vi`
      );
      if (res2.ok) {
        const d2 = await res2.json();
        if (d2 && d2.responseData && d2.responseData.translatedText) {
          return d2.responseData.translatedText;
        }
      }
    } catch (_e2) {}
    return '';
  }

  window.lookupWordFromReader = async function (rawText, sentenceContext) {
    const cleaned = String(rawText || '')
      .replace(/^[.,!?;:"„“”'()\[\]«»—–\-]+|[.,!?;:"„“”'()\[\]«»—–\-]+$/g, '')
      .trim();
    if (!cleaned || cleaned.length < 2) return;

    const lower = cleaned.toLowerCase();
    const hubList = window.allHubWords || [];

    // 1. Tìm chính xác hoặc theo gốc từ trong 5,243 từ vựng
    let match =
      hubList.find((w) => (w.word || '').toLowerCase() === lower) ||
      hubList.find(
        (w) =>
          lower.length >= 4 &&
          (w.word || '').toLowerCase().startsWith(lower.slice(0, Math.max(4, lower.length - 2)))
      );

    if (match) {
      const modalObj = {
        art: match.art || '',
        word: match.word || cleaned,
        level: match.level || 'B1/B2',
        catVi: `${match.catVi || 'Báo Đức'} • Tin tức`,
        en: match.en || '',
        example: sentenceContext || match.example || '',
        exampleEn: match.exampleEn || '',
        isLoading: Boolean(sentenceContext && sentenceContext !== match.example),
      };
      window.openQuickDictModal(modalObj);

      if (sentenceContext && sentenceContext !== match.example) {
        const translatedSentence = await translateGermanTextToVi(sentenceContext);
        const loadingEl = document.getElementById('modalLoadingState');
        if (loadingEl) loadingEl.style.display = 'none';
        if (translatedSentence) {
          currentModalItem.exampleEn = translatedSentence;
          const senViEl = document.getElementById('modalDictSentenceVi');
          if (senViEl) senViEl.innerText = `➤ ${translatedSentence}`;
        }
      }
      return;
    }

    // 2. Từ mới hoặc cụm từ được bôi đen trực tiếp trên báo Đức -> Dịch tự động & cho phép lưu vào Sổ tay
    const isPhrase = cleaned.includes(' ');
    const guessedArt =
      !isPhrase && /^[A-ZÄÖÜ]/.test(cleaned)
        ? cleaned.endsWith('ung') || cleaned.endsWith('heit') || cleaned.endsWith('keit') || cleaned.endsWith('schaft') || cleaned.endsWith('tion')
          ? 'die'
          : cleaned.endsWith('chen') || cleaned.endsWith('lein') || cleaned.endsWith('ment') || cleaned.endsWith('um')
          ? 'das'
          : ''
        : '';

    const tempItem = {
      art: guessedArt,
      word: cleaned,
      level: activeNewsArticle ? activeNewsArticle.level || 'B1-B2' : 'B1-B2',
      catVi: activeNewsArticle ? `Báo ${activeNewsArticle.sourceLabel}` : 'Tin tức tiếng Đức',
      en: 'Đang tra cứu nghĩa tiếng Việt...',
      example: sentenceContext || cleaned,
      exampleEn: 'Đang dịch câu ngữ cảnh trong bài báo...',
      isLoading: true,
    };

    window.openQuickDictModal(tempItem);

    const [viMeaning, viSentence] = await Promise.all([
      translateGermanTextToVi(cleaned),
      sentenceContext ? translateGermanTextToVi(sentenceContext) : Promise.resolve(''),
    ]);

    const loadingEl = document.getElementById('modalLoadingState');
    if (loadingEl) loadingEl.style.display = 'none';

    tempItem.isLoading = false;
    tempItem.en = viMeaning || cleaned;
    tempItem.exampleEn = viSentence || '';
    currentModalItem = tempItem;

    const viEl = document.getElementById('modalDictViMeaning');
    if (viEl) viEl.innerText = tempItem.en;
    const senViEl = document.getElementById('modalDictSentenceVi');
    if (senViEl) senViEl.innerText = tempItem.exampleEn ? `➤ ${tempItem.exampleEn}` : '';
    syncModalFavButtonState();
  };

  function setupReaderTextSelectionListener() {
    const readerBody = document.getElementById('liveNewsReaderBody');
    if (!readerBody || readerBody.dataset.selectionBound === 'true') return;
    readerBody.dataset.selectionBound = 'true';

    readerBody.addEventListener('mouseup', () => {
      setTimeout(() => {
        const selObj = window.getSelection ? window.getSelection() : null;
        if (!selObj) return;
        const selectedText = selObj.toString().trim();
        if (selectedText && selectedText.length >= 2 && selectedText.length <= 140 && selectedText.includes(' ')) {
          let contextSentence = '';
          if (selObj.anchorNode && selObj.anchorNode.parentElement) {
            const p = selObj.anchorNode.parentElement.closest('p');
            if (p) contextSentence = p.innerText.trim();
          }
          window.lookupWordFromReader(selectedText, contextSentence);
        }
      }, 60);
    });
  }

  function formatRssDate(dateStr) {
    if (!dateStr) return 'Hôm nay';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderLiveNewsList() {
    const listContainer = document.getElementById('liveNewsFeedList');
    if (!listContainer) return;

    if (!liveNewsItems.length) {
      listContainer.innerHTML = `
        <div style="padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 0.9rem;">
          Không tìm thấy bài báo nào cho nguồn này. Hãy thử bấm Làm mới.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = '';
    liveNewsItems.forEach((item, idx) => {
      const isSelected = activeNewsArticle && activeNewsArticle.link === item.link;
      const sourceColor =
        item.source === 'tagesschau'
          ? '#38bdf8'
          : item.source === 'dw'
          ? '#a855f7'
          : '#10b981';

      const card = document.createElement('div');
      card.style.cssText = `
        padding: 14px 16px;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: ${isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.65)'};
        border: 1px solid ${isSelected ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.08)'};
        margin-bottom: 10px;
      `;

      card.onclick = () => window.openLiveReaderArticle(idx);

      const summaryText = item.summary || item.description || '';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 0.7rem; font-weight: 800; color: ${sourceColor}; text-transform: uppercase; letter-spacing: 0.04em;">
            <i class="fa-solid fa-rss"></i> ${escapeHtml(item.sourceLabel)}
          </span>
          <span style="font-size: 0.68rem; background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 2px 8px; border-radius: 8px; font-weight: 700;">
            ${escapeHtml(item.level || 'B1-B2')}
          </span>
        </div>
        <div style="font-size: 0.95rem; font-weight: 700; color: #f8fafc; line-height: 1.4; margin-bottom: 6px;">
          ${escapeHtml(item.title)}
        </div>
        ${
          summaryText
            ? `<div style="font-size: 0.8rem; color: #94a3b8; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 6px;">
                ${escapeHtml(summaryText)}
              </div>`
            : ''
        }
        <div style="font-size: 0.72rem; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
          <span><i class="fa-regular fa-clock"></i> ${escapeHtml(formatRssDate(item.pubDate))}</span>
          <span style="color: #38bdf8; font-weight: 600;">Đọc ngay ➔</span>
        </div>
      `;

      listContainer.appendChild(card);
    });
  }

  async function fetchRssViaRss2Json(rssUrl, sourceKey, sourceLabel, level) {
    try {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      const res = await fetch(apiUrl);
      if (!res.ok) return [];
      const json = await res.json();
      if (json.status !== 'ok' || !Array.isArray(json.items)) return [];
      return json.items.slice(0, 12).map((it, idx) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = it.content || it.description || '';
        const plain = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
        const paragraphs = Array.from(tmp.querySelectorAll('p'))
          .map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim())
          .filter((t) => t.length >= 25);
        return {
          id: `${sourceKey}-r2j-${idx}`,
          title: it.title || '',
          link: it.link || '',
          pubDate: it.pubDate || '',
          source: sourceKey,
          sourceLabel,
          level,
          image: it.thumbnail || it.enclosure?.link || '',
          summary: plain.slice(0, 260),
          fullTextParagraphs: paragraphs.length ? paragraphs : plain ? [plain] : [],
        };
      });
    } catch {
      return [];
    }
  }

  window.fetchLiveGermanNews = async function (source = 'all', btnEl = null) {
    currentNewsSource = source;
    window.currentNewsSource = source;
    if (btnEl && btnEl.parentElement) {
      Array.from(btnEl.parentElement.querySelectorAll('.news-source-filter-btn')).forEach((b) => {
        b.className = 'deck-btn btn-glass-subtle news-source-filter-btn';
        b.style.background = '';
      });
      btnEl.className = 'deck-btn btn-primary-ios news-source-filter-btn';
      btnEl.style.background = 'linear-gradient(135deg, #0284c7, #38bdf8)';
    }

    const listContainer = document.getElementById('liveNewsFeedList');
    if (listContainer) {
      listContainer.innerHTML = `
        <div style="padding: 36px 16px; text-align: center; color: #7dd3fc;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
          <div style="font-size: 0.88rem; font-weight: 600;">Đang tải tin tức mới nhất từ RSS báo Đức...</div>
        </div>
      `;
    }

    try {
      let items = [];
      try {
        const res = await fetch(`/api/news?source=${encodeURIComponent(source)}`);
        if (res.ok) {
          const data = await res.json();
          items = Array.isArray(data.items) ? data.items : [];
        }
      } catch (_apiErr) {}

      // Fallback trực tiếp qua api.rss2json.com nếu server proxy không khả dụng
      if (items.length === 0) {
        const feeds = [];
        if (source === 'all' || source === 'tagesschau') {
          feeds.push(
            fetchRssViaRss2Json('https://www.tagesschau.de/xml/rss2/', 'tagesschau', 'Tagesschau (ARD)', 'B2/C1')
          );
        }
        if (source === 'all' || source === 'dw') {
          feeds.push(
            fetchRssViaRss2Json('https://rss.dw.com/xml/rss-de-all', 'dw', 'DW Deutsch', 'B1/B2')
          );
        }
        if (source === 'all' || source === 'nachrichtenleicht') {
          feeds.push(
            fetchRssViaRss2Json(
              'https://www.nachrichtenleicht.de/nachrichtenleicht-nachrichten-100.rss',
              'nachrichtenleicht',
              'Nachrichtenleicht (Einfache Sprache)',
              'A2/B1'
            )
          );
        }
        const results = await Promise.all(feeds);
        items = results.flat();
      }

      liveNewsItems = items;
      renderLiveNewsList();
      if (liveNewsItems.length > 0) {
        window.openLiveReaderArticle(0);
      }
    } catch (err) {
      if (listContainer) {
        listContainer.innerHTML = `
          <div style="padding: 24px 16px; text-align: center; color: #fca5a5; font-size: 0.85rem;">
            <i class="fa-solid fa-triangle-exclamation"></i> Không thể tải danh sách tin tức. Vui lòng thử lại.
          </div>
        `;
      }
    }
  };

  window.openLiveReaderArticle = async function (idx) {
    const item = liveNewsItems[idx];
    if (!item) return;
    activeNewsArticle = item;
    renderLiveNewsList();

    const readerContainer = document.getElementById('liveNewsReaderBody');
    const origLinkBtn = document.getElementById('liveNewsOriginalLinkBtn');
    const sourceBadge = document.getElementById('liveNewsReaderSourceBadge');
    const levelBadge = document.getElementById('liveNewsReaderLevelBadge');

    if (origLinkBtn) {
      origLinkBtn.href = item.link || '#';
      origLinkBtn.style.display = item.link ? 'inline-flex' : 'none';
    }
    if (sourceBadge) sourceBadge.innerText = item.sourceLabel || 'Tagesschau';
    if (levelBadge) levelBadge.innerText = `Trình độ ${item.level || 'B1-B2'}`;

    if (!readerContainer) return;
    setupReaderTextSelectionListener();

    readerContainer.innerHTML = `
      <div style="padding: 48px 20px; text-align: center; color: #7dd3fc;">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.8rem; margin-bottom: 12px;"></i>
        <div style="font-size: 0.95rem; font-weight: 600;">Đang trích xuất chế độ đọc sạch (Reader View) từ bài báo gốc...</div>
      </div>
    `;

    try {
      const res = await fetch(`/api/news/article?url=${encodeURIComponent(item.link)}`);
      const article = await res.json();

      const title = article.title || item.title || '';
      const pubDate = formatRssDate(article.pubDate || item.pubDate);
      const coverImg = article.image || item.image || '';
      let paragraphs =
        Array.isArray(article.paragraphs) && article.paragraphs.length > 0
          ? article.paragraphs
          : Array.isArray(item.fullTextParagraphs)
          ? item.fullTextParagraphs
          : [];

      if (paragraphs.length === 0) {
        const rssText = item.rssContent || item.summary || item.description || '';
        paragraphs = rssText
          .split(/\n+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 20);
      }

      activeNewsArticle.extractedParagraphs = paragraphs;
      activeNewsArticle.extractedTitle = title;

      const paragraphsHtml = paragraphs
        .map(
          (p) => `
          <p style="font-size: 1.14rem; line-height: 1.85; color: #e2e8f0; margin-bottom: 18px; letter-spacing: 0.01em;">
            ${tokenizeGermanParagraph(p)}
          </p>
        `
        )
        .join('');

      readerContainer.innerHTML = `
        <div style="margin-bottom: 18px;">
          <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(pubDate)}</span>
            <span style="color: #34d399;"><i class="fa-solid fa-wand-magic-sparkles"></i> Bấm vào bất kỳ từ nào hoặc bôi đen cụm từ để tra từ điển & lưu vào Sổ tay</span>
          </div>
          <h2 style="font-size: 1.65rem; font-weight: 800; color: #ffffff; line-height: 1.35; margin: 0 0 16px 0;">
            ${tokenizeGermanParagraph(title)}
          </h2>
          ${
            coverImg
              ? `<div style="margin-bottom: 20px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); max-height: 340px; background: #0f172a;">
                  <img src="${escapeHtml(coverImg)}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; max-height: 340px; object-fit: cover; display: block;" onerror="this.parentElement.style.display='none'" />
                </div>`
              : ''
          }
        </div>
        <div class="reader-article-paragraphs">
          ${
            paragraphsHtml ||
            `<p style="font-size: 1.08rem; color: #cbd5e1; line-height: 1.75;">${tokenizeGermanParagraph(
              item.summary || item.description || 'Bấm "Mở bài gốc trên trình duyệt" để xem nội dung chi tiết.'
            )}</p>`
          }
        </div>
      `;
    } catch (e) {
      const fallbackText = item.rssContent || item.description || '';
      readerContainer.innerHTML = `
        <h2 style="font-size: 1.55rem; font-weight: 800; color: #ffffff; line-height: 1.35; margin: 0 0 16px 0;">
          ${tokenizeGermanParagraph(item.title || '')}
        </h2>
        <p style="font-size: 1.12rem; line-height: 1.85; color: #e2e8f0; margin-bottom: 18px;">
          ${tokenizeGermanParagraph(fallbackText)}
        </p>
      `;
    }
  };

  window.readAloudActiveNewsArticle = function () {
    if (!activeNewsArticle || typeof window.speakText !== 'function') return;
    if (isReadingAloudNews && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isReadingAloudNews = false;
      return;
    }
    const textToRead = [
      activeNewsArticle.extractedTitle || activeNewsArticle.title || '',
      ...((activeNewsArticle.extractedParagraphs || []).slice(0, 5)),
    ].join('. ');
    if (textToRead.trim()) {
      isReadingAloudNews = true;
      window.speakText(textToRead);
    }
  };

  window.initLiveNewsReader = function () {
    if (liveNewsItems.length === 0) {
      window.fetchLiveGermanNews('all');
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    renderCategoryChips();
    window.renderVocabHubGrid();
    // Khởi tạo sẵn danh sách báo Đức cho tab Leseverstehen
    setTimeout(() => {
      window.initLiveNewsReader();
    }, 300);
  });
})();
