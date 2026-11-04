/* ==========================================================================
   The Visual Studio — interactions
   ========================================================================== */
(function () {
  "use strict";

  var data = window.TVS;
  if (!data) return;

  var items = data.items || [];
  var categories = data.categories || [];
  var featured = data.featured || {};
  var catLabel = {};
  categories.forEach(function (c) { catLabel[c.key] = c.label; });

  var PAGE = 12;
  var state = {
    cat: "all",
    filmsOnly: false,
    shown: PAGE,
    current: 0,
    list: []
  };

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtDate(iso) {
    try {
      return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .format(new Date(iso + "T12:00:00"));
    } catch (e) { return iso; }
  }

  /* ----------------------------------------------------------------------
     Collections
     ---------------------------------------------------------------------- */
  var collectionsGrid = $("#collectionsGrid");
  if (collectionsGrid) {
    collectionsGrid.innerHTML = categories.map(function (c, i) {
      var size = i === 0 ? " collection--hero" : (i >= 5 ? " collection--wide" : "");
      return '' +
        '<button class="collection' + size + '" type="button" data-cat="' + esc(c.key) + '">' +
          '<img src="' + esc(c.cover) + '" alt="" loading="lazy" decoding="async" width="640" height="640">' +
          '<span class="collection-inner">' +
            '<span class="collection-count">' + c.count + " " + (c.count === 1 ? "piece" : "pieces") + '</span>' +
            '<span class="collection-label">' + esc(c.label) + '</span>' +
            '<span class="collection-blurb">' + esc(c.blurb) + '</span>' +
          '</span>' +
          '<span class="collection-arrow" aria-hidden="true">&#8599;</span>' +
        '</button>';
    }).join("");

    collectionsGrid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cat]");
      if (!btn) return;
      applyFilter(btn.getAttribute("data-cat"));
      scrollToWork();
    });
  }

  /* ----------------------------------------------------------------------
     Filters
     ---------------------------------------------------------------------- */
  var filtersEl = $("#filters");
  var filmToggle = $("#filmToggle");

  function buildFilters() {
    if (!filtersEl) return;
    var html = '<button class="filter active" type="button" data-cat="all">All work <span>' + items.length + '</span></button>';
    html += categories.map(function (c) {
      return '<button class="filter" type="button" data-cat="' + esc(c.key) + '">' +
        esc(c.label) + ' <span>' + c.count + '</span></button>';
    }).join("");
    filtersEl.innerHTML = html;

    filtersEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cat]");
      if (!btn) return;
      applyFilter(btn.getAttribute("data-cat"));
    });
  }

  function syncFilterUI() {
    if (filtersEl) {
      $$(".filter", filtersEl).forEach(function (b) {
        b.classList.toggle("active", !state.filmsOnly && b.getAttribute("data-cat") === state.cat);
      });
    }
    if (filmToggle) {
      filmToggle.setAttribute("aria-pressed", state.filmsOnly ? "true" : "false");
    }
  }

  function applyFilter(cat) {
    state.cat = cat;
    state.filmsOnly = false;
    state.shown = PAGE;
    syncFilterUI();
    render();
  }

  function scrollToWork() {
    var work = $("#work");
    if (work) work.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ----------------------------------------------------------------------
     Gallery
     ---------------------------------------------------------------------- */
  var gallery = $("#gallery");
  var resultCount = $("#resultCount");
  var loadMore = $("#loadMore");
  var loadMoreCount = $("#loadMoreCount");

  function getList() {
    if (state.filmsOnly) return items.filter(function (i) { return i.type === "video"; });
    if (state.cat !== "all") return items.filter(function (i) { return i.cat === state.cat; });
    return items;
  }

  function tileHTML(item, index) {
    var ratio = (item.w && item.h) ? item.w + " / " + item.h : "4 / 5";
    var isVideo = item.type === "video";
    return '' +
      '<article class="tile">' +
        '<button class="tile-btn" type="button" data-index="' + index + '">' +
          '<span class="tile-media" style="aspect-ratio:' + ratio + '">' +
            '<img src="' + esc(item.thumb) + '" alt=""' +
              ' width="' + (item.w || 640) + '" height="' + (item.h || 800) + '"' +
              ' loading="' + (index < 4 ? "eager" : "lazy") + '" decoding="async">' +
            (isVideo
              ? '<span class="tile-film-badge">Film</span>' +
                '<span class="tile-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg></span>'
              : '<span class="tile-view" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17 17 7M9 7h8v8"/></svg></span>') +
          '</span>' +
          '<span class="tile-info">' +
            '<span class="tile-cat">' + esc(catLabel[item.cat] || item.cat) + '</span>' +
            '<span class="tile-title">' + esc(item.title) + '</span>' +
          '</span>' +
        '</button>' +
      '</article>';
  }

  function render() {
    state.list = getList();
    var visible = state.list.slice(0, state.shown);
    if (gallery) {
      gallery.innerHTML = visible.length
        ? visible.map(tileHTML).join("")
        : '<div class="empty-state">No pieces in this collection yet — new work is added after every shoot.</div>';
    }

    if (resultCount) {
      var prefix = state.filmsOnly ? "Films" : (state.cat === "all" ? "All work" : catLabel[state.cat]);
      var noun = state.filmsOnly ? "films" : "pieces";
      resultCount.textContent = prefix + " · Showing " + Math.min(state.shown, state.list.length) + " of " + state.list.length + " " + noun;
    }

    var remaining = state.list.length - state.shown;
    if (loadMore) {
      if (remaining > 0) {
        loadMore.hidden = false;
        if (loadMoreCount) loadMoreCount.textContent = "(+" + remaining + ")";
      } else {
        loadMore.hidden = true;
      }
    }

    syncFilterUI();
  }

  if (loadMore) {
    loadMore.addEventListener("click", function () {
      state.shown += PAGE;
      render();
    });
  }

  if (filmToggle) {
    filmToggle.addEventListener("click", function () {
      state.filmsOnly = !state.filmsOnly;
      state.cat = "all";
      state.shown = PAGE;
      render();
      if (state.filmsOnly) scrollToWork();
    });
  }

  /* ----------------------------------------------------------------------
     Lightbox
     ---------------------------------------------------------------------- */
  var lightbox = $("#lightbox");
  var lbStage = $("#lbStage");
  var lbCount = $("#lbCount");
  var lbCat = $("#lbCat");
  var lbTitle = $("#lbTitle");
  var lbDesc = $("#lbDesc");
  var lbDate = $("#lbDate");
  var lbClose = $("#lbClose");
  var lbPrev = $("#lbPrev");
  var lbNext = $("#lbNext");
  var lastFocus = null;

  function openLightbox(index, listOverride) {
    if (!lightbox) return;
    if (listOverride) state.list = listOverride;
    else state.list = getList();
    if (!state.list.length) return;
    state.current = (index + state.list.length) % state.list.length;
    lastFocus = document.activeElement;

    populateLightbox();
    lightbox.hidden = false;
    document.body.classList.add("lb-open");
    if (lbClose) lbClose.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("lb-open");
    if (lbStage) lbStage.innerHTML = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function populateLightbox() {
    var item = state.list[state.current];
    if (!item) return;

    if (lbStage) {
      if (item.type === "video") {
        lbStage.innerHTML = '<video controls autoplay playsinline preload="metadata" poster="' + esc(item.thumb) + '">' +
          '<source src="' + esc(item.video) + '" type="video/mp4">' +
          "Your browser does not support embedded video.</video>";
      } else {
        lbStage.innerHTML = '<img src="' + esc(item.src) + '" alt="' + esc(item.alt) + '">';
      }
    }

    if (lbCount) {
      lbCount.textContent = String(state.current + 1).padStart(2, "0") + " / " + String(state.list.length).padStart(2, "0");
    }
    if (lbCat) lbCat.textContent = catLabel[item.cat] || item.cat;
    if (lbTitle) lbTitle.textContent = item.title;
    if (lbDesc) lbDesc.textContent = item.desc;
    if (lbDate) lbDate.textContent = fmtDate(item.date);

    var single = state.list.length <= 1;
    [lbPrev, lbNext].forEach(function (btn) {
      if (!btn) return;
      btn.style.display = single ? "none" : "";
      btn.disabled = single;
    });

    preloadNeighbours();
  }

  function preloadNeighbours() {
    if (state.list.length <= 1) return;
    [-1, 1].forEach(function (dir) {
      var item = state.list[(state.current + dir + state.list.length) % state.list.length];
      if (item && item.type === "image") {
        var img = new Image();
        img.src = item.src;
      }
    });
  }

  function stepLightbox(dir) {
    if (state.list.length <= 1) return;
    state.current = (state.current + dir + state.list.length) % state.list.length;
    populateLightbox();
  }

  if (gallery) {
    gallery.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-index]");
      if (!btn) return;
      openLightbox(parseInt(btn.getAttribute("data-index"), 10));
    });
  }

  if (lightbox) {
    $$("[data-lb-close]", lightbox).forEach(function (el) {
      el.addEventListener("click", closeLightbox);
    });
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lbPrev) lbPrev.addEventListener("click", function () { stepLightbox(-1); });
    if (lbNext) lbNext.addEventListener("click", function () { stepLightbox(1); });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") { closeLightbox(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); stepLightbox(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stepLightbox(-1); }
      else if (e.key === "Tab") {
        var focusables = $$("button, video, a[href]", lightbox).filter(function (el) {
          return el.offsetParent !== null && !el.disabled;
        });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    var touchX = null;
    if (lbStage) {
      lbStage.addEventListener("touchstart", function (e) {
        touchX = e.changedTouches[0].clientX;
      }, { passive: true });
      lbStage.addEventListener("touchend", function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 55) stepLightbox(dx < 0 ? 1 : -1);
        touchX = null;
      }, { passive: true });
    }
  }

  /* ----------------------------------------------------------------------
     Film section
     ---------------------------------------------------------------------- */
  function showAllFilms() {
    state.filmsOnly = true;
    state.cat = "all";
    state.shown = PAGE;
    render();
  }

  var playFilmBtn = $("#playFilm");
  if (playFilmBtn) {
    playFilmBtn.addEventListener("click", function () {
      var id = playFilmBtn.getAttribute("data-film");
      showAllFilms();
      var idx = state.list.findIndex(function (i) { return i.id === id; });
      openLightbox(idx < 0 ? 0 : idx, state.list.slice());
    });
  }

  $$(".js-play-film").forEach(function (btn) {
    if (btn === playFilmBtn) return;
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-film");
      showAllFilms();
      var idx = state.list.findIndex(function (i) { return i.id === id; });
      openLightbox(idx < 0 ? 0 : idx, state.list.slice());
    });
  });

  var showFilmsBtn = $("#showFilms");
  if (showFilmsBtn) {
    showFilmsBtn.addEventListener("click", function () {
      showAllFilms();
      scrollToWork();
    });
  }

  /* ----------------------------------------------------------------------
     Footer filter links
     ---------------------------------------------------------------------- */
  $$("[data-filter-link]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      applyFilter(link.getAttribute("data-filter-link"));
      scrollToWork();
    });
  });

  /* ----------------------------------------------------------------------
     Header, nav, scroll state
     ---------------------------------------------------------------------- */
  var header = $("#header");
  var menuToggle = $("#menuToggle");
  var nav = $("#nav");
  var navLinks = $$(".nav a");
  var sectionIds = ["collections", "work", "services", "about", "contact"];

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 16);

    var y = window.scrollY + 180;
    var active = "";
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y) active = id;
    });
    // Prefer "work" while the gallery is in view, then contact at the end.
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 40) active = "contact";

    navLinks.forEach(function (a) {
      var href = a.getAttribute("href").replace("#", "");
      a.classList.toggle("active", href === active);
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    document.body.classList.remove("nav-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  navLinks.forEach(function (a) { a.addEventListener("click", closeMenu); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 1000) closeMenu();
  });

  /* ----------------------------------------------------------------------
     Service prefill
     ---------------------------------------------------------------------- */
  $$("[data-service]").forEach(function (link) {
    link.addEventListener("click", function () {
      var select = $("#type");
      if (!select) return;
      var value = link.getAttribute("data-service");
      var match = Array.prototype.slice.call(select.options).some(function (opt) { return opt.value === value; });
      if (!match) {
        var option = Array.prototype.slice.call(select.options).find(function (opt) {
          return opt.value.toLowerCase().indexOf(value.toLowerCase()) === 0;
        });
        if (option) {
          select.value = option.value;
          return;
        }
      }
      select.value = match ? value : "";
    });
  });

  /* ----------------------------------------------------------------------
     Booking form → WhatsApp
     ---------------------------------------------------------------------- */
  var bookingForm = $("#bookingForm");
  if (bookingForm) {
    var dateInput = $("#date");
    if (dateInput) {
      var today = new Date();
      dateInput.min = today.toISOString().slice(0, 10);
    }

    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
      }

      var get = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      var lines = [
        "Hi The Visual Studio! I'd like to enquire about a " + get("type").toLowerCase() + " shoot.",
        "",
        "Name: " + get("name")
      ];
      if (get("phone")) lines.push("Phone: " + get("phone"));
      if (get("date")) lines.push("Preferred date: " + get("date"));
      if (get("location")) lines.push("Location: " + get("location"));
      if (get("message")) {
        lines.push("");
        lines.push(get("message"));
      }

      var url = "https://wa.me/27791905643?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");

      var btn = bookingForm.querySelector(".booking-submit");
      if (btn) {
        var original = btn.innerHTML;
        btn.innerHTML = "Opening WhatsApp…";
        setTimeout(function () { btn.innerHTML = original; }, 3200);
      }
    });
  }

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */
  var reducesMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reducesMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

    $$("[data-reveal]").forEach(function (el) { revealObserver.observe(el); });

    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    $$("[data-count]").forEach(function (el) { statObserver.observe(el); });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("is-visible"); });
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var duration = 1300;
    var start = null;

    function tick(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  buildFilters();
  render();

  // Keep the first paint of a filtered gallery predictable.
  if (featured.film && playFilmBtn) {
    playFilmBtn.setAttribute("data-film", featured.film);
  }
})();
