(function () {
  "use strict";

  const THEME_KEY = "cardfind-theme";

  // ─── DOM ────────────────────────────────────────────────────
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const els = {
    html: document.documentElement,
    themeToggle: $("#theme-toggle"),
    searchInput: $("#search-input"),
    searchKbd: $("#search-kbd"),
    filters: $("#filters"),
    sortSelect: $("#sort-select"),
    cardsGrid: $("#cards-grid"),
    topPicksGrid: $("#top-picks-grid"),
    resultsCount: $("#results-count"),
    clearFilters: $("#clear-filters"),
    emptyState: $("#empty-state"),
    resetSearch: $("#reset-search"),
    year: $("#year"),
  };

  // ─── State ──────────────────────────────────────────────────
  const state = {
    query: "",
    filter: "all",
    sort: "rating",
  };

  // ─── Theme ──────────────────────────────────────────────────
  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return "light"; // default light mode
  }

  function applyTheme(theme) {
    els.html.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    const isDark = theme === "dark";
    els.themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  function toggleTheme() {
    const current = els.html.getAttribute("data-theme") || "light";
    applyTheme(current === "light" ? "dark" : "light");
  }

  // ─── Helpers ────────────────────────────────────────────────
  function formatFee(fee) {
    if (fee === 0) return { text: "No annual fee", free: true, short: "$0" };
    return { text: `$${fee}/yr annual fee`, free: false, short: `$${fee}/yr` };
  }

  function renderFeesBlock(card) {
    const fee = formatFee(card.annualFee);
    const feeNote = card.feeNote
      ? `<div class="fee-note">${escapeHtml(card.feeNote)}</div>`
      : "";
    const apr = card.apr || "See issuer terms";
    return `
      <div class="card-fees" aria-label="Fees">
        <div class="fee-row">
          <span class="fee-label">Annual fee</span>
          <span class="fee-value${fee.free ? " free" : ""}">${escapeHtml(fee.short)}${fee.free ? " · No annual fee" : ""}</span>
        </div>
        <div class="fee-row">
          <span class="fee-label">Purchase APR</span>
          <span class="fee-value">${escapeHtml(apr)}</span>
        </div>
        ${feeNote}
      </div>
    `;
  }

  function categoryLabel(cat) {
    const map = {
      travel: "Travel",
      lounge: "Lounge Access",
      cashback: "Cash Back",
      dining: "Dining",
      gas: "Gas",
      groceries: "Groceries",
      "no-fee": "No Fee",
      premium: "Premium",
      business: "Business",
      student: "Student",
      points: "Points",
      entertainment: "Entertainment",
      streaming: "Streaming",
      shopping: "Shopping",
      airline: "Airline",
      secured: "Secured",
    };
    return map[cat] || cat;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ─── Card visual (mock card face) ───────────────────────────
  function renderCardFace(card, compact = false) {
    const darkClass = card.textDark ? " text-dark" : "";
    const name = escapeHtml(card.name);
    const network = escapeHtml(card.network);
    const issuer = escapeHtml(card.issuer);

    return `
      <div
        class="card-visual${darkClass}"
        style="background: ${card.gradient}"
      >
        <div class="card-chip-row">
          <div>
            <div class="card-issuer-badge">${issuer}</div>
            <div class="card-chip" aria-hidden="true"></div>
          </div>
          <div class="card-network">${network}</div>
        </div>
        ${compact ? "" : `<div class="card-face-name">${name}</div>`}
        <span class="card-external" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </span>
      </div>
    `;
  }

  function renderCardVisual(card, compact = false) {
    const name = escapeHtml(card.name);
    const issuer = escapeHtml(card.issuer);
    return `
      <a
        class="card-link"
        href="${escapeHtml(card.applyUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Learn more about ${name} and apply at ${issuer}"
      >
        ${renderCardFace(card, compact)}
      </a>
    `;
  }

  // ─── Full card item ─────────────────────────────────────────
  function renderCard(card) {
    const fee = formatFee(card.annualFee);
    const tags = card.categories
      .slice(0, 4)
      .map((c) => `<span class="tag">${escapeHtml(categoryLabel(c))}</span>`)
      .join("");

    const highlights = card.highlights
      .slice(0, 3)
      .map((h) => `<li>${escapeHtml(h)}</li>`)
      .join("");

    const bonusHtml =
      card.welcomeBonusValue > 0
        ? `<div class="card-bonus"><strong>Welcome bonus:</strong> ${escapeHtml(card.welcomeBonus)}</div>`
        : `<div class="card-bonus"><strong>Ongoing:</strong> ${escapeHtml(card.welcomeBonus)}</div>`;

    return `
      <article class="card-item" data-id="${escapeHtml(card.id)}">
        ${renderCardVisual(card)}
        <div class="card-body">
          <div class="card-meta">
            <span class="card-rating" title="Editor rating">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              ${card.rating.toFixed(1)}
            </span>
            <span class="card-fee${fee.free ? " free" : ""}">${escapeHtml(fee.short)} annual fee</span>
            <span>${escapeHtml(card.issuer)}</span>
            <span class="card-region" title="Issued in the United States">🇺🇸 U.S.</span>
          </div>
          <h3 class="card-title">${escapeHtml(card.name)}</h3>
          <p class="card-desc">${escapeHtml(card.description)}</p>
          ${renderFeesBlock(card)}
          <ul class="card-highlights">${highlights}</ul>
          ${bonusHtml}
          <div class="card-tags">${tags}</div>
          <div class="card-actions">
            <a
              class="btn btn-primary"
              href="${escapeHtml(card.applyUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more &amp; apply
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  // ─── Top picks ──────────────────────────────────────────────
  function renderTopPicks() {
    const picks = CREDIT_CARDS.filter((c) => c.topFor);
    els.topPicksGrid.innerHTML = picks
      .map((card) => {
        const meta = TOP_PICK_LABELS[card.topFor] || {
          title: "Top pick",
          emoji: "⭐",
          blurb: card.description,
        };
        return `
          <a
            class="top-pick-card"
            href="${escapeHtml(card.applyUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            data-category="${escapeHtml(card.topFor)}"
            aria-label="${escapeHtml(meta.title)}: ${escapeHtml(card.name)} — learn more and apply"
          >
            <div class="top-pick-label">
              <span>${meta.emoji}</span>
              <span>${escapeHtml(meta.title)}</span>
            </div>
            <div class="top-pick-visual">
              ${renderCardFace(card, true)}
            </div>
            <div class="top-pick-name">${escapeHtml(card.name)}</div>
            <div class="top-pick-blurb">${escapeHtml(meta.blurb)}</div>
            <div class="top-pick-fee${card.annualFee === 0 ? " free" : ""}">${
              card.annualFee === 0
                ? "No annual fee"
                : `$${card.annualFee}/yr annual fee`
            }</div>
          </a>
        `;
      })
      .join("");
  }

  // ─── Filter & sort ──────────────────────────────────────────
  function matchesQuery(card, q) {
    if (!q) return true;
    // U.S.-only catalog — expand common region/country searches
    const usAliases = ["us", "usa", "u.s.", "u.s.a", "united states", "america", "american"];
    if (usAliases.some((a) => q === a || q === a + " credit card" || q === a + " cards")) {
      return card.country === "US";
    }
    const hay = [
      card.name,
      card.issuer,
      card.issuerFull || "",
      card.network,
      card.country || "US",
      card.region || "United States",
      card.description,
      card.welcomeBonus,
      card.apr || "",
      card.feeNote || "",
      String(card.annualFee ?? ""),
      ...(card.keywords || []),
      ...card.highlights,
      ...card.categories.map(categoryLabel),
    ]
      .join(" ")
      .toLowerCase();
    // Support multi-word search (all terms must match)
    const terms = q.split(/\s+/).filter(Boolean);
    return terms.every((term) => hay.includes(term));
  }

  function matchesFilter(card, filter) {
    if (filter === "all") return true;
    return card.categories.includes(filter);
  }

  function sortCards(cards, sort) {
    const sorted = [...cards];
    switch (sort) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "fee-low":
        sorted.sort((a, b) => a.annualFee - b.annualFee || b.rating - a.rating);
        break;
      case "fee-high":
        sorted.sort((a, b) => b.annualFee - a.annualFee || b.rating - a.rating);
        break;
      case "bonus":
        sorted.sort(
          (a, b) => b.welcomeBonusValue - a.welcomeBonusValue || b.rating - a.rating
        );
        break;
      case "rating":
      default:
        sorted.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }

  function getFilteredCards() {
    const q = state.query.trim().toLowerCase();
    let list = CREDIT_CARDS.filter(
      (c) => matchesQuery(c, q) && matchesFilter(c, state.filter)
    );
    return sortCards(list, state.sort);
  }

  // ─── Render results ─────────────────────────────────────────
  function renderResults() {
    const cards = getFilteredCards();
    const count = cards.length;

    els.resultsCount.textContent =
      count === 1 ? "1 card" : `${count} cards`;

    const hasActiveFilters =
      state.filter !== "all" || state.query.trim().length > 0;
    els.clearFilters.hidden = !hasActiveFilters;

    if (count === 0) {
      els.cardsGrid.innerHTML = "";
      els.emptyState.hidden = false;
      return;
    }

    els.emptyState.hidden = true;
    els.cardsGrid.innerHTML = cards.map(renderCard).join("");
  }

  function setFilter(filter) {
    state.filter = filter;
    $$(".filter-chip", els.filters).forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    renderResults();
  }

  function clearAll() {
    state.query = "";
    state.filter = "all";
    els.searchInput.value = "";
    setFilter("all");
  }

  // ─── Events ─────────────────────────────────────────────────
  function bindEvents() {
    els.themeToggle.addEventListener("click", toggleTheme);

    let searchTimer;
    els.searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.query = e.target.value;
        renderResults();
      }, 120);
    });

    els.filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      setFilter(btn.dataset.filter);
    });

    els.sortSelect.addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderResults();
    });

    els.clearFilters.addEventListener("click", clearAll);
    els.resetSearch.addEventListener("click", clearAll);

    // Keyboard: "/" focuses search, Escape clears focus
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        document.activeElement !== els.searchInput &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "SELECT"
      ) {
        e.preventDefault();
        els.searchInput.focus();
        els.searchInput.select();
      }
      if (e.key === "Escape" && document.activeElement === els.searchInput) {
        els.searchInput.blur();
      }
    });

    // Top pick cards: also filter when clicking category label area — they go external
    // Optional: clicking category in top picks could scroll + filter (kept as external apply links)

    // Smooth scroll to a card when? skip for now
  }

  // ─── Init ───────────────────────────────────────────────────
  function init() {
    applyTheme(getPreferredTheme());
    if (els.year) els.year.textContent = String(new Date().getFullYear());
    renderTopPicks();
    renderResults();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
