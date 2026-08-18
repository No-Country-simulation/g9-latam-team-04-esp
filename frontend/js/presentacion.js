// TechMind — presentacion.js
// Modal de presentación para la demo: slides HTML navegables (←/→), abrir
// con la tecla "P" o el botón del header, cerrar con ESC, X o clic afuera.
// Cada slide es HTML editable acá mismo; si algún día se exportan slides del
// PPTX como imágenes, basta reemplazar el innerHTML de un slide por <img>.

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const SLIDES = [
    {
      title: "TechMind",
      html: `
        <div class="flex flex-col items-center text-center">
          <img src="assets/logos/techmind.png" alt="TechMind" class="logo-invert h-16 lg:h-24 w-auto object-contain mb-6">
          <h2 class="text-[28px] lg:text-[40px] font-semibold tracking-[-1px] text-paper">El cerebro que entiende tu contenido técnico.</h2>
          <p class="mt-2 text-[15px] lg:text-[18px] text-muted">La API que lo comparte.</p>
          <p class="mt-8 text-[11px] font-semibold uppercase tracking-[0.5px] text-volt">Generación 9 · Team 04</p>
        </div>`,
    },
    {
      title: "El problema",
      html: `
        <div class="max-w-2xl">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Problema</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">Demasiado conocimiento técnico sin organizar</h2>
          <ul class="mt-6 space-y-3 text-[14px] leading-relaxed text-muted">
            <li class="flex gap-3"><span class="text-volt">•</span>Profesionales y estudiantes guardan documentación, tutoriales y notas en todos lados.</li>
            <li class="flex gap-3"><span class="text-volt">•</span>Clasificar, encontrar y reutilizar ese conocimiento lleva horas.</li>
            <li class="flex gap-3"><span class="text-volt">•</span>El conocimiento queda muerto: no se comparte ni se consume por otras apps.</li>
          </ul>
        </div>`,
    },
    {
      title: "La solución",
      html: `
        <div class="max-w-2xl">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Solución</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">TechMind organiza por ti, automáticamente</h2>
          <ul class="mt-6 space-y-3 text-[14px] leading-relaxed text-muted">
            <li class="flex gap-3"><span class="text-volt">•</span>Clasifica contenido técnico en 7 categorías, con idioma automático (EN/ES).</li>
            <li class="flex gap-3"><span class="text-volt">•</span>Extrae términos clave y busca por significado (embeddings).</li>
            <li class="flex gap-3"><span class="text-volt">•</span>El feedback humano reentrena los modelos en caliente.</li>
            <li class="flex gap-3"><span class="text-volt">•</span>Expone todo por API REST + app web completa.</li>
          </ul>
        </div>`,
    },
    {
      title: "Arquitectura",
      html: `
        <div class="max-w-2xl">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Arquitectura</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">FastAPI + Oracle + modelos por idioma</h2>
          <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-muted">
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">API</p><p class="mt-1">FastAPI, Pydantic v2, Uvicorn</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">Datos</p><p class="mt-1">Oracle Database (wallet/DSN)</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">ML</p><p class="mt-1">TF-IDF + Logistic Regression por idioma, embeddings</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">Frontend</p><p class="mt-1">SPA vanilla + Tailwind, servida por la misma API</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">Infra</p><p class="mt-1">Docker, OCI Compute</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">Telemetría</p><p class="mt-1">Métricas en memoria: latencia P95, éxito, tráfico</p></div>
          </div>
        </div>`,
    },
    {
      title: "Demostración en vivo",
      html: `
        <div class="max-w-2xl">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Demo</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">Veamos TechMind en acción</h2>
          <ul class="mt-6 space-y-3 text-[14px] leading-relaxed text-muted">
            <li class="flex gap-3"><span class="text-volt">1.</span><span><span class="text-paper font-medium">Clasificar</span> — un contenido real, con categoría, confianza y términos clave.</span></li>
            <li class="flex gap-3"><span class="text-volt">2.</span><span><span class="text-paper font-medium">Búsqueda semántica</span> — encontrar por significado, no por palabras exactas.</span></li>
            <li class="flex gap-3"><span class="text-volt">3.</span><span><span class="text-paper font-medium">Correcciones</span> — feedback humano que alimenta el reentrenamiento.</span></li>
            <li class="flex gap-3"><span class="text-volt">4.</span><span><span class="text-paper font-medium">Métricas</span> — la API real en vivo: peticiones, P95, éxito.</span></li>
          </ul>
        </div>`,
    },
    {
      title: "El equipo",
      html: `
        <div class="flex flex-col items-center text-center">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Equipo</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">Ocho personas, una sola misión</h2>
          <p class="mt-2 text-[14px] text-muted">Arquitecto · 2 Data Scientists · BI Analyst · 2 Backend · 2 Full Stack</p>
          <p class="mt-10 text-[12px] text-muted">Membresía completa en la splash del equipo (botón reloj arriba).</p>
        </div>`,
    },
    {
      title: "Gracias",
      html: `
        <div class="flex flex-col items-center text-center">
          <img src="assets/logos/techmind.png" alt="TechMind" class="logo-invert h-14 lg:h-20 w-auto object-contain mb-6">
          <h2 class="text-[26px] lg:text-[38px] font-semibold tracking-[-1px] text-paper">¡Gracias!</h2>
          <p class="mt-2 text-[14px] lg:text-[16px] text-muted">¿Preguntas?</p>
          <p class="mt-8 text-[11px] font-semibold uppercase tracking-[0.5px] text-volt">Generation 9 · Team 04 · No Country</p>
        </div>`,
    },
  ];

  let current = 0;
  let exitBound = false;
  let i18nLabel = "Presentación";

  function t(key) {
    return (window.TechMindI18n && window.TechMindI18n.t(key)) || key;
  }

  function modal() {
    let el = $("#presentacion-modal");
    if (el) return el;
    el = document.createElement("div");
    el.id = "presentacion-modal";
    el.className = "fixed inset-0 z-[80] hidden items-center justify-center bg-void";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML = `
      <div class="pointer-events-none absolute inset-0 presentacion-dotgrid" aria-hidden="true"></div>
      <button type="button" data-pres-close aria-label="Cerrar presentación" title="Cerrar (Esc)"
        class="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-[8px] text-muted transition-colors duration-200 hover:bg-dot hover:text-paper">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
      <div class="relative flex h-full w-full max-w-5xl flex-col px-6 py-6 lg:py-10">
        <div class="flex flex-1 items-center justify-center" id="pres-slide"></div>
        <div class="mt-6 flex items-center justify-between gap-4">
          <button type="button" data-pres-prev aria-label="Anterior"
            class="grid h-10 w-10 place-items-center rounded-full border border-ash text-muted transition-colors duration-200 hover:bg-dot hover:text-paper disabled:opacity-30 disabled:cursor-not-allowed">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>
          </button>
          <p class="text-[12px] font-medium text-muted" id="pres-counter"></p>
          <button type="button" data-pres-next aria-label="Siguiente"
            class="grid h-10 w-10 place-items-center rounded-full border border-ash text-muted transition-colors duration-200 hover:bg-dot hover:text-paper disabled:opacity-30 disabled:cursor-not-allowed">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  function renderSlide() {
    const el = $("#pres-slide");
    const counter = $("#pres-counter");
    if (!el) return;
    el.innerHTML = SLIDES[current].html;
    if (counter) counter.textContent = `${current + 1} / ${SLIDES.length}`;
    const prev = modal().querySelector("[data-pres-prev]");
    const next = modal().querySelector("[data-pres-next]");
    if (prev) prev.disabled = current <= 0;
    if (next) next.disabled = current >= SLIDES.length - 1;
  }

  function open() {
    const el = modal();
    current = 0;
    renderSlide();
    el.classList.remove("hidden");
    el.classList.add("flex");
    document.body.style.overflow = "hidden";
    bindExit();
  }

  function close() {
    const el = $("#presentacion-modal");
    if (!el || el.classList.contains("hidden")) return;
    el.classList.add("hidden");
    el.classList.remove("flex");
    document.body.style.overflow = "";
  }

  function bindExit() {
    if (exitBound) return;
    exitBound = true;
    const el = modal();
    el.querySelector("[data-pres-close]").addEventListener("click", close);
    el.querySelector("[data-pres-prev]").addEventListener("click", () => {
      if (current > 0) { current--; renderSlide(); }
    });
    el.querySelector("[data-pres-next]").addEventListener("click", () => {
      if (current < SLIDES.length - 1) { current++; renderSlide(); }
    });
    document.addEventListener("keydown", (e) => {
      const visible = !$("#presentacion-modal").classList.contains("hidden");
      if (!visible) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowLeft") { if (current > 0) { current--; renderSlide(); } }
      if (e.key === "ArrowRight") { if (current < SLIDES.length - 1) { current++; renderSlide(); } }
    });
    // Tecla "P" abre la presentación desde cualquier vista.
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "p" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target;
        const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
        if (!typing) open();
      }
    });
  }

  function syncLabel() {
    i18nLabel = t("presentacion.abrir");
    document.querySelectorAll("[data-pres-label]").forEach((btn) => {
      btn.setAttribute("aria-label", i18nLabel);
      btn.title = i18nLabel;
    });
  }

  function init() {
    document.querySelectorAll("[data-pres-label]").forEach((btn) => {
      btn.addEventListener("click", open);
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

  window.TechMindPresentacion = { open, close };
})();
