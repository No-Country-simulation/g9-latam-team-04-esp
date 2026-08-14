// TechMind — clasificar.js
// Fase 3: vista "Clasificar" (momento central).
// Formulario -> POST /contenido -> categoría + probabilidad + info adicional.
// Estados: idle | loading | success | error. Sin datos fabricados: la
// respuesta se lee con los campos reales del backend (ContenidoResponse):
//   id, titulo, texto, categoria, probabilidad (0..1), informacion_adicional,
//   idioma. Carga con "thinking orb" (js/orb.js).

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const t = (key) => window.TechMindI18n.t(key);
  const api = window.TechMindAPI;

  const MAX_TITULO = 500;
  const MAX_TEXTO = 10000;
  const LANG_OPTIONS = [
    { value: "auto", labelKey: "clasificar.idiomaAuto" },
    { value: "es", labelKey: "clasificar.idiomaEs" },
    { value: "en", labelKey: "clasificar.idiomaEn" },
  ];

  // Referencia al orb activo para frenarlo al cambiar de estado.
  let activeOrb = null;

  // ---------- Utilidades ----------
  function formatProbabilidad(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return "—";
    return v > 1 ? `${Math.round(v)}%` : `${Math.round(v * 100)}%`;
  }

  function barScale(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return "0";
    const pct = v > 1 ? v : v * 100;
    return Math.max(0, Math.min(100, pct)) / 100;
  }

  function shortId(id) {
    const s = String(id);
    return s.length > 11 ? `${s.slice(0, 8)}…${s.slice(-3)}` : s;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stopOrb() {
    if (activeOrb) {
      activeOrb.stop();
      activeOrb = null;
    }
  }

  // ---------- Render principal ----------
  function render(root) {
    stopOrb();
    root.innerHTML = `
      <section class="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div class="lg:col-span-2">
          <header class="mb-6">
            <h1 class="text-[28px] font-semibold tracking-[-0.5px] text-paper">${t("view.clasificar.title")}</h1>
            <p class="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">${t("view.clasificar.desc")}</p>
          </header>
        </div>

        <!-- Formulario -->
        <div class="rounded-[16px] bg-coal p-5 md:p-6">
          <form id="clasificar-form" novalidate>
            <div class="mb-5">
              <label for="clasificar-titulo" class="mb-1.5 block text-[14px] font-medium tracking-[0.5px] text-muted">${t("clasificar.titulo")}</label>
              <input id="clasificar-titulo" name="titulo" type="text" maxlength="${MAX_TITULO}"
                class="w-full rounded-[8px] bg-void px-3 border border-ash py-2.5 text-[14px] text-paper placeholder:text-muted/60 transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-volt focus:outline-none"
                placeholder="${t("clasificar.placeholderTitulo")}">
              <p class="mt-1 text-right text-[11px] text-muted" id="titulo-count">0/${MAX_TITULO}</p>
            </div>

            <div class="mb-5">
              <label for="clasificar-texto" class="mb-1.5 block text-[14px] font-medium tracking-[0.5px] text-muted">${t("clasificar.texto")}</label>
              <textarea id="clasificar-texto" name="texto" rows="8" maxlength="${MAX_TEXTO}"
                class="w-full resize-y rounded-[8px] bg-void px-3 py-2.5 text-[14px] leading-relaxed text-paper placeholder:text-muted/60 transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border border-ash focus:border-volt focus:outline-none"
                placeholder="${t("clasificar.placeholderTexto")}"></textarea>
              <p class="mt-1 text-right text-[11px] text-muted" id="texto-count">0/${MAX_TEXTO}</p>
            </div>

            <div class="flex flex-col gap-4 border-t border-ash pt-5 md:flex-row md:items-end md:justify-between">
              <!-- Idioma -->
              <label class="md:w-52">
                <span class="mb-1.5 block text-[14px] font-medium tracking-[0.5px] text-muted">${t("clasificar.idioma")}</span>
                <select id="clasificar-idioma"
                  class="w-full rounded-[8px] border border-ash bg-void px-3 py-2.5 text-[14px] text-paper transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">
                  ${LANG_OPTIONS.map((o) => `<option value="${o.value}">${t(o.labelKey)}</option>`).join("")}
                </select>
              </label>

              <!-- Acciones -->
              <div class="flex w-full flex-col-reverse gap-3 sm:flex-row md:w-auto md:flex-row md:items-center">
                <button type="button" id="clasificar-clear"
                  class="rounded-[8px] px-4 py-2.5 text-[14px] font-medium text-muted transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-ash hover:bg-dot hover:text-paper sm:flex-1 md:flex-none">
                  ${t("clasificar.limpiar")}
                </button>
                <button type="submit" id="clasificar-submit"
                  class="rounded-[8px] bg-volt px-5 py-2.5 text-[14px] font-semibold text-void transition-[background-color,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:brightness-95 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 md:flex-none"
                  data-i18n-aria="clasificar.enviar">
                  ${t("clasificar.enviar")}
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Resultado -->
        <div class="lg:sticky lg:top-20" aria-live="polite">
          <div id="clasificar-result" class="result-zone"></div>
        </div>
      </section>`;

    bindForm(root);
    renderIdle($("#clasificar-result", root));
  }

  // ---------- Estados del resultado ----------
  function renderIdle(zone) {
    stopOrb();
    zone.innerHTML = `
      <div class="rounded-[16px] bg-coal p-5">
        <div class="flex flex-col items-center py-6 text-center">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 3l1.8 4.6L18.4 9.4l-4.6 1.8L12 15.8l-1.8-4.6L5.6 9.4l4.6-1.8L12 3Z"/>
              <path d="M18.5 15.5l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z"/>
            </svg>
          </div>
          <p class="mt-3 text-[13px] text-muted">${t("clasificar.resultadoVacio")}</p>
        </div>
      </div>`;
  }

  function renderLoading(zone) {
    stopOrb();
    zone.innerHTML = `
      <div class="flex flex-col items-center rounded-[16px] bg-coal px-5 py-8 text-center" aria-busy="true">
        <div id="orb-container" class="orb-container"></div>
        <p class="mt-4 text-[13px] font-medium text-paper">${t("clasificar.procesando")}</p>
        <p class="mt-1 text-[12px] text-muted">${t("clasificar.procesandoDetalle")}</p>
      </div>`;

    const container = zone.querySelector("#orb-container");
    if (container && window.TechMindOrb) {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const orb = window.TechMindOrb.create({
        size: 120,             // tamaño del contenedor (antes 110)
        speed: 1.5,            // 1.0 es normal. 1.5 es 50% más rápido. 0.5 es más lento.
        nodeCount: 24,         // Número de puntos/vértices. Más puntos = red más densa.
        linkDistance: 1.4,     // A partir de qué distancia los puntos dejan de conectarse (1.0 a 2.0 es lo ideal).
        lineWidth: 2,          // Grosor de las líneas conectoras (antes 1.6). Más gruesas se ven más sólidas.
        nodeRadiusBase: 2.5,   // Tamaño mínimo de los puntos que están "atrás" en el 3D.
        nodeRadiusMax: 6.0,    // Tamaño máximo de los puntos que están "al frente".
        customColorNode: isLight ? "30, 30, 30" : "144, 144, 136", // Usa el color para los nodos
        customColorLink: isLight ? "106, 106, 100" : "138, 138, 138"  // Usa el color para las líneas
      });
      container.appendChild(orb.canvas);
      activeOrb = orb;
      orb.start();
    }
  }

  function renderSuccess(zone, res) {
    stopOrb();
    const info = Array.isArray(res.informacion_adicional) ? res.informacion_adicional : [];
    const probabilidad = formatProbabilidad(res.probabilidad);
    const lang = res.idioma || "";
    zone.innerHTML = `
      <article class="relative rounded-[16px] bg-coal border border-ash/50 p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-muted/70">${t("clasificar.resultado")}</span>
          <span class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-volt bg-volt/10 border border-volt/20 px-2.5 py-1 rounded-full">
            <span class="h-1.5 w-1.5 rounded-full bg-volt animate-pulse"></span>
            ${t("clasificar.estado")}
          </span>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-ash/50 p-4">
          <div class="absolute inset-y-0 left-0 bg-gradient-to-l from-volt/5 to-volt/60 border-r-2 border-volt/10 transition-all duration-700 ease-out pointer-events-none" style="width: ${barScale(res.probabilidad) * 100}%;"></div>

          <div class="relative z-10 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center text-paper">
                <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-wider text-muted">${t("clasificar.categoria")}</p>
                <p class="text-[22px] font-extrabold text-paper tracking-tight capitalize truncate leading-tight">${escapeHtml(res.categoria || t("clasificar.sinCategoria"))}</p>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="block text-[32px] font-black leading-none text-volt" title="${probabilidad}">${probabilidad}</span>
              <span class="text-[9px] font-bold uppercase tracking-widest text-muted/80 mt-1 block">${t("clasificar.probabilidad")}</span>
            </div>
          </div>
        </div>

        <div class="space-y-1 px-0.5">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted/70">${t("clasificar.titulo")}</p>
          <p class="text-[13px] font-semibold leading-relaxed text-muted line-clamp-2">${escapeHtml(res.titulo)}</p>
        </div>

        ${info.length ? `
          <div class="space-y-1.5 px-0.5">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted/70">${t("clasificar.infoAdicional")}</p>
            <div class="flex flex-wrap gap-1.5">
              ${info.map((term) => `<span class="rounded-full bg-dot border border-ash/40 px-2.5 py-1 text-[11px] font-semibold text-muted hover:border-ash transition-colors">${escapeHtml(term)}</span>`).join("")}
            </div>
        </div>` : ""}

        <div class="flex items-center justify-between border-t border-ash/30 pt-4 text-[11px] text-muted">
            ${lang ? `
              <div class="flex items-center gap-2">
                <span>${t("clasificar.idiomaDetectado")}</span>
                <span class="rounded bg-dot border border-ash/40 px-2 py-0.5 font-mono text-[10px] font-bold text-muted uppercase">${escapeHtml(String(lang).toUpperCase())}</span>
              </div>` : ""}
            ${res.id !== undefined ? `
              <div class="flex items-center gap-2">
                <span>ID:</span>
                <span class="font-mono text-muted font-semibold">${escapeHtml(shortId(res.id))}</span>
              </div>` : ""}
        </div>
      </article>`;
  }

  function renderError(zone, message) {
    stopOrb();
    zone.innerHTML = `
      <div class="rounded-[16px] border border-err bg-coal p-5" role="alert">
        <div class="flex items-start gap-3">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0 text-err" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <div class="min-w-0">
            <p class="text-[14px] font-semibold text-err">${t("clasificar.errorTitulo")}</p>
            <p class="mt-1 text-[13px] leading-relaxed text-paper">${escapeHtml(message)}</p>
          </div>
        </div>
      </div>`;
  }

  // ---------- Binding del formulario ----------
  function bindForm(root) {
    const form = $("#clasificar-form", root);
    const titulo = $("#clasificar-titulo", root);
    const texto = $("#clasificar-texto", root);
    const idioma = $("#clasificar-idioma", root);
    const submit = $("#clasificar-submit", root);
    const clear = $("#clasificar-clear", root);
    const zone = $("#clasificar-result", root);

    // Contadores de longitud (límites del backend, 500/10000)
    const updateCount = (input, el) => {
      el.textContent = `${input.value.length}/${input.maxLength}`;
      el.classList.remove("text-warn", "text-muted");
      if (input.value.length >= input.maxLength) el.classList.add("text-warn");
      else el.classList.add("text-muted");
    };
    titulo.addEventListener("input", () => updateCount(titulo, $("#titulo-count", root)));
    texto.addEventListener("input", () => updateCount(texto, $("#texto-count", root)));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submit.disabled) return;

      // Validación cliente (debe coincidir con el backend)
      const tituloVal = titulo.value.trim();
      const textoVal = texto.value.trim();
      if (!tituloVal) { titulo.focus(); flashInvalid(titulo); return; }
      if (!textoVal) { texto.focus(); flashInvalid(texto); return; }
      if (tituloVal.length > MAX_TITULO) { titulo.focus(); flashInvalid(titulo); return; }
      if (textoVal.length > MAX_TEXTO) { texto.focus(); flashInvalid(texto); return; }

      submit.disabled = true;
      renderLoading(zone);

      try {
        const res = await api.clasificar({
          titulo: tituloVal,
          texto: textoVal,
          idioma: idioma.value,
        });
        renderSuccess(zone, res);
      } catch (err) {
        renderError(zone, err.message || "Error");
      } finally {
        submit.disabled = false;
      }
    });

    clear.addEventListener("click", () => {
      titulo.value = "";
      texto.value = "";
      idioma.value = "auto";
      updateCount(titulo, $("#titulo-count", root));
      updateCount(texto, $("#texto-count", root));
      renderIdle(zone);
      titulo.focus();
    });
  }

  function flashInvalid(input) {
    input.classList.add("input-invalid");
    window.setTimeout(() => input.classList.remove("input-invalid"), 600);
  }

  // Exponer para que shell.js la registre
  window.TechMindViewClasificar = { render };
})();