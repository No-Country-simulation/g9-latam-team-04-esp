// TechMind — shell.js
// Fase 2: SPA shell con router hash vanilla, navegación (sidebar de íconos +
// drawer móvil), cabecera con fecha/idioma/perfil, y registro de vistas.
// Cada vista queda registrada aquí; las fases 3-5 reemplazan su render.

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ---------- Iconos (un trazo, outline, 1.5px) ----------
  const ICONS = {
    clasificar: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3l1.8 4.6L18.4 9.4l-4.6 1.8L12 15.8l-1.8-4.6L5.6 9.4l4.6-1.8L12 3Z"/>
        <path d="M18.5 15.5l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z"/>
      </svg>`,
    metricas: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>
      </svg>`,
    contenidos: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>
        <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
        <path d="M8 13h8"/><path d="M8 16.5h5"/>
      </svg>`,
    correcciones: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3l1.8 4.6L18.4 9.4l-4.6 1.8L12 15.8l-1.8-4.6L5.6 9.4l4.6-1.8L12 3Z"/>
        <path d="M20 20H8"/>
        <path d="M4 16l1.5-1.5L7 16l-1.5 1.5L4 16Z"/>
      </svg>`,
    buscar: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7"/>
        <path d="m20 20-3.5-3.5"/>
      </svg>`,
    modelo: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
        <path d="M9 2v4"/><path d="M15 2v4"/><path d="M9 18v4"/><path d="M15 18v4"/>
        <path d="M2 9h4"/><path d="M2 15h4"/><path d="M18 9h4"/><path d="M18 15h4"/>
        <path d="M10 10h4v4h-4z"/>
      </svg>`,
    faq: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/>
        <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.32c-.83.33-1.4 1.04-1.4 1.93V13.5"/>
        <path d="M12 17h.01"/>
      </svg>`,
  };

  // ---------- Registro de vistas ----------
  // Cada vista: icono, keys de i18n y un render (placeholder en Fase 2).
  const VIEWS = {
    clasificar: {
      icon: "clasificar",
      nav: "nav.clasificar",
      title: "view.clasificar.title",
      desc: "view.clasificar.desc",
      phase: 3,
      render: function (el) {
        if (window.TechMindViewClasificar) window.TechMindViewClasificar.render(el);
        else renderPlaceholder(el, this);
      },
    },
    buscar: {
      icon: "buscar",
      nav: "nav.buscar",
      title: "view.buscar.title",
      desc: "view.buscar.desc",
      phase: 3,
      render: function (el) {
        if (window.TechMindViewBuscar) window.TechMindViewBuscar.render(el);
        else renderPlaceholder(el, this);
      },
    },
    contenidos: {
      icon: "contenidos",
      nav: "nav.contenidos",
      title: "view.contenidos.title",
      desc: "view.contenidos.desc",
      phase: 5,
      render: function (el) {
        if (window.TechMindViewContenidos) window.TechMindViewContenidos.render(el);
        else renderPlaceholder(el, this);
      },
    },
    correcciones: {
      icon: "correcciones",
      nav: "nav.correcciones",
      title: "view.correcciones.title",
      desc: "view.correcciones.desc",
      phase: 5,
      render: function (el) {
        if (window.TechMindViewCorrecciones) window.TechMindViewCorrecciones.render(el);
        else renderPlaceholder(el, this);
      },
    },
    modelo: {
      icon: "modelo",
      nav: "nav.modelo",
      title: "view.modelo.title",
      desc: "view.modelo.desc",
      phase: 5,
      render: function (el) {
        if (window.TechMindViewModelo) window.TechMindViewModelo.render(el);
        else renderPlaceholder(el, this);
      },
    },
    metricas: {
      icon: "metricas",
      nav: "nav.metricas",
      title: "view.metricas.title",
      desc: "view.metricas.desc",
      phase: 4,
      render: function (el) {
        if (window.TechMindViewMetricas) window.TechMindViewMetricas.render(el);
        else renderPlaceholder(el, this);
      },
    },
    faq: {
      icon: "faq",
      nav: "nav.faq",
      title: "view.faq.title",
      desc: "view.faq.desc",
      phase: 6,
      render: function (el) {
        if (window.TechMindViewFaq) window.TechMindViewFaq.render(el);
        else renderPlaceholder(el, this);
      },
    },
  };

  const DEFAULT_VIEW = "clasificar";

  function t(key) { return window.TechMindI18n.t(key); }

  // ---------- Placeholder de Fase 2 (se reemplaza en fases 3-5) ----------
  function renderPlaceholder(el, viewDef) {
    el.innerHTML = `
      <section class="view-enter">
        <header class="mb-8">
          <h1 class="text-[28px] font-semibold tracking-[-0.5px] text-paper">${t(viewDef.title)}</h1>
          <p class="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">${t(viewDef.desc)}</p>
        </header>
        <div class="empty-state">
          <div class="empty-icon">${ICONS[viewDef.icon]}</div>
          <p class="text-[15px] font-medium text-paper">${t("state.placeholder")} ${viewDef.phase}</p>
          <p class="mt-1 text-[12px] text-muted">${t("action.coming")}</p>
        </div>
      </section>`;
  }

  // ---------- Router ----------
  function currentRoute() {
    const hash = location.hash.replace(/^#\/?/, "").split("?")[0];
    return VIEWS[hash] ? hash : DEFAULT_VIEW;
  }

  const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let renderToken = 0;

  function renderRoute() {
    const token = ++renderToken;
    const name = currentRoute();
    const viewDef = VIEWS[name];
    const viewEl = $("#view");

    // Título de pestaña
    document.title = `${t(viewDef.title)} — TechMind`;

    // Transición: la vista vieja sale primero (140ms), luego entra la nueva.
    const mount = () => {
      if (token !== renderToken) return;
      // Render de la vista (preserva las clases de contenedor del <main>)
      viewEl.innerHTML = "";
      viewDef.render.call(viewDef, viewEl);
      const section = viewEl.firstElementChild;
      if (section) section.classList.add("view-enter");
      // Estado activo en ambas naves
      $$(".nav-item").forEach((item) => {
        const active = item.dataset.route === name;
        item.classList.toggle("nav-active", active);
        if (active) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });
      // Cerrar drawer móvil tras navegar
      closeDrawer();
    };

    const old = viewEl.firstElementChild;
    if (!old || mediaReduced.matches) {
      mount();
      return;
    }
    old.classList.add("view-leave");
    window.setTimeout(mount, 150);
  }

  // ---------- Navegación (desktop + móvil) ----------
  function navItemHtml(name, withLabel) {
    const viewDef = VIEWS[name];
    const label = t(viewDef.nav);
    const icon = ICONS[viewDef.icon];
    if (withLabel) {
      return `
        <a href="#/${name}" class="nav-item flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium text-muted transition-colors duration-200 hover:bg-dot hover:text-paper" data-route="${name}">
          <span class="grid h-6 w-6 place-items-center">${icon}</span>
          <span>${label}</span>
        </a>`;
    }
    return `
      <a href="#/${name}" class="nav-item group relative grid h-11 w-11 place-items-center rounded-[8px] text-muted transition-colors duration-200 hover:bg-dot hover:text-volt" data-route="${name}" aria-label="${label}">
        ${icon}
        <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-ash bg-coal px-3 py-1 text-[11px] font-semibold text-paper opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          ${label}
        </span>
      </a>`;
  }

  function buildNav() {
    const desktop = $("#nav-desktop");
    const mobile = $("#nav-mobile");
    if (!desktop || !mobile) return;
    desktop.innerHTML = Object.keys(VIEWS).map((name) => navItemHtml(name, false)).join("");
    mobile.innerHTML =
      `<p class="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">TechMind</p>` +
      Object.keys(VIEWS).map((name) => navItemHtml(name, true)).join("");
  }

  // ---------- Drawer móvil ----------
  const drawer = $("#mobile-drawer");
  const btnMenu = $("#btn-menu");

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.remove("hidden");
    drawer.setAttribute("aria-hidden", "false");
    btnMenu && btnMenu.setAttribute("aria-expanded", "true");
    const first = drawer.querySelector("a");
    first && first.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.add("hidden");
    drawer.setAttribute("aria-hidden", "true");
    btnMenu && btnMenu.setAttribute("aria-expanded", "false");
  }

  function bindDrawer() {
    btnMenu && btnMenu.addEventListener("click", () => {
      drawer.classList.contains("hidden") ? openDrawer() : closeDrawer();
    });
    $("#drawer-backdrop") && $("#drawer-backdrop").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer && !drawer.classList.contains("hidden")) closeDrawer();
    });
  }

  // ---------- Cabecera: fecha ----------
  function renderDate() {
    const el = $("#header-date");
    if (!el) return;
    const lang = window.TechMindI18n.lang() === "es" ? "es" : "en";
    el.textContent = new Date().toLocaleDateString(lang, {
      day: "numeric", month: "short", year: "numeric",
      ...(lang === "es" ? {} : {}),
    });
  }

  // ---------- Idioma ----------
  function renderLangButtons() {
    const currentLang = window.TechMindI18n.lang().toUpperCase();
    $$(".lang-toggle").forEach((btn) => (btn.textContent = currentLang));
  }

  function bindLang() {
    const toggle = () => {
      const next = window.TechMindI18n.lang() === "es" ? "en" : "es";
      window.TechMindI18n.setLang(next);
    };
    $$(".lang-toggle").forEach((btn) => btn.addEventListener("click", toggle));
    document.addEventListener("TechMindLang.change", () => {
      renderLangButtons();
      renderDate();
      buildNav();       // re-render etiquetas de nav
      renderRoute();    // re-render vista actual
      $$("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (key) el.textContent = t(key);
      });
    });
  }

  // ---------- Toast (feedback visual global) ----------
  const mediaReducedToast = window.matchMedia("(prefers-reduced-motion: reduce)");

  function toastRoot() {
    let root = $("#toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "toast-root";
      root.className = "pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col items-end gap-2";
      document.body.appendChild(root);
    }
    return root;
  }

  const TOAST_ICONS = {
    ok: `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>
      </svg>`,
    err: `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/>
      </svg>`,
  };

  function showToast(message, type) {
    const kind = type === "err" ? "err" : "ok";
    const root = toastRoot();

    const el = document.createElement("div");
    el.className = `pointer-events-auto flex items-start gap-3 rounded-[12px] border bg-coal p-3 shadow-lg transition-all duration-300 ${
      kind === "err" ? "border-err/40" : "border-ash"
    }`;
    el.style.transform = "translateX(12px)";
    el.style.opacity = "0";

    const icon = document.createElement("span");
    icon.className = `mt-0.5 shrink-0 ${kind === "err" ? "text-err" : "text-ok"}`;
    icon.innerHTML = TOAST_ICONS[kind];

    const msg = document.createElement("p");
    msg.className = "min-w-0 flex-1 text-[13px] leading-snug text-paper";
    msg.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "shrink-0 text-muted transition-colors duration-200 hover:text-paper";
    closeBtn.setAttribute("aria-label", t("action.cancel"));
    closeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18"/>
      </svg>`;

    el.append(icon, msg, closeBtn);
    root.appendChild(el);
    el.setAttribute("role", kind === "err" ? "alert" : "status");

    if (mediaReducedToast.matches) {
      el.style.transform = "none";
      el.style.opacity = "1";
    } else {
      requestAnimationFrame(() => {
        el.style.transform = "translateX(0)";
        el.style.opacity = "1";
      });
    }

    const dismiss = () => {
      el.style.transform = "translateX(12px)";
      el.style.opacity = "0";
      window.setTimeout(() => el.remove(), 300);
    };
    closeBtn.addEventListener("click", dismiss);
    window.setTimeout(dismiss, 3500);
  }

  // ---------- Init ----------
  window.TechMindToast = { show: showToast };

  function init() {
    buildNav();
    bindDrawer();
    bindLang();
    renderLangButtons();
    renderDate();
    if (!location.hash) location.replace(`#/${DEFAULT_VIEW}`);
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();