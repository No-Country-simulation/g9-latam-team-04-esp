// TechMind — splash.js
// Splash de presentación como MODAL bajo demanda: un botón (`.splash-toggle`)
// la abre y se cierra con la X, Escape o clic fuera. Sin temporizador: no se
// auto-cierra. Carga el equipo desde team.json y renderiza founders.

(function () {
  "use strict";

  const splash = document.getElementById("splash");
  const teamList = document.getElementById("splash-team");
  const app = document.getElementById("app");
  const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  let teamCache = null;
  let exitBound = false;

  // ---------- Icons (SVG inline, un trazo consistente) ----------
  const ICON_GITHUB = `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.37 9.37 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.25 10.25 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/>
    </svg>`;

  const ICON_LINKEDIN = `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/>
    </svg>`;

  // ---------- Render del equipo ----------
  function initials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }

  function avatarMark(member) {
    if (member.avatar) {
      return `<img src="${member.avatar}" alt="Foto de ${member.name}" class="h-12 w-12 rounded-full object-cover ring-1 ring-ash" width="48" height="48" loading="lazy">`;
    }
    return `<span class="avatar-fallback h-12 w-12 rounded-full ring-1 ring-ash">${initials(member.name)}</span>`;
  }

  function socialHref(member, kind) {
    const url = member[kind];
    if (!url) return null;
    // Normaliza URLs sin protocolo (ej: www.linkedin.com/...)
    return url.startsWith("http") ? url : `https://${url}`;
  }

  function renderTeam(members) {
    if (!teamList) return;
    teamList.innerHTML = members
      .map((member) => {
        const gh = socialHref(member, "github");
        const li = socialHref(member, "linkedin");
        return `
          <li class="flex flex-col items-center text-center">
            <div class="relative inline-block">
              ${avatarMark(member)}
              <div class="absolute -bottom-1 -right-1 h-6 w-6">
                ${gh ? `<a href="${gh}" target="_blank" rel="noopener noreferrer" aria-label="${member.name} en GitHub" class="animate-badge-github absolute inset-0 grid h-6 w-6 place-items-center rounded-full bg-coal text-paper ring-2 ring-void shadow hover:text-volt hover:scale-110 transition-transform">${ICON_GITHUB}</a>` : ""}
                ${li ? `<a href="${li}" target="_blank" rel="noopener noreferrer" aria-label="${member.name} en LinkedIn" class="animate-badge-linkedin absolute inset-0 grid h-6 w-6 place-items-center rounded-full bg-coal text-paper ring-2 ring-void shadow hover:text-volt hover:scale-110 transition-transform">${ICON_LINKEDIN}</a>` : ""}
              </div>
            </div>
            <p class="mt-2 text-[13px] font-semibold leading-tight text-paper">${member.name}</p>
            <p class="text-[11px] text-muted">${member.role}</p>
          </li>`;
      })
      .join("");
  }

  // ---------- Carga de datos ----------
  async function loadTeam() {
    if (teamCache) return teamCache;
    try {
      const res = await fetch("assets/data/team.json");
      if (!res.ok) throw new Error(`team.json HTTP ${res.status}`);
      const data = await res.json();
      teamCache = Array.isArray(data) ? data : data.team || [];
    } catch (err) {
      console.warn("No se pudo cargar team.json:", err);
      teamCache = [];
    }
    return teamCache;
  }

  // ---------- Abrir / cerrar modal ----------
  function open() {
    if (!splash) return;
    splash.classList.remove("hidden");
    bindExit();
  }

  function close() {
    if (!splash || splash.classList.contains("hidden")) return;
    splash.classList.add("exit");
    if (app) {
      app.classList.add("revealed");
    }
    window.setTimeout(() => {
      // Ocultar (no remover) para poder volver a abrirla con el botón.
      splash.classList.add("hidden");
      splash.classList.remove("exit", "transition-opacity");
    }, mediaReduced.matches ? 0 : 400);
  }

  function bindExit() {
    if (exitBound || !splash) return;
    exitBound = true;

    // Botón X (dentro del splash)
    const btnClose = document.getElementById("splash-close");
    if (btnClose) btnClose.addEventListener("click", close);

    // Escape cierra
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  async function show() {
    if (!splash) return;
    const members = await loadTeam();
    renderTeam(members);
    open();
  }

  function syncLabel() {
    const label =
      (window.TechMindI18n && window.TechMindI18n.t("splash.show")) || "Mostrar presentación";
    document.querySelectorAll("[data-splash-label]").forEach((btn) => {
      btn.setAttribute("aria-label", label);
      btn.title = label;
    });
  }

  // ---------- Init ----------
  function init() {
    document.querySelectorAll(".splash-toggle").forEach((btn) => {
      btn.addEventListener("click", show);
    });
    if (window.TechMindI18n) {
      syncLabel();
      document.addEventListener("TechMindLang.change", syncLabel);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TechMindSplash = { show, close };
})();