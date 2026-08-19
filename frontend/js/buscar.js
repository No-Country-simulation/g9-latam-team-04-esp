// TechMind — buscar.js
// Vista "Búsqueda semántica": POST /contenidos/busqueda-semantica.
// Diferenciador del producto: encuentra contenidos por SIGNIFICADO
// (embeddings + similitud coseno), no por palabra exacta.
// Campos reales del backend (BusquedaSemanticaResponse):
//   resultados: [{ id, titulo, categoria, informacion_adicional, idioma,
//                  similitud (0..1), creado_en }], total
// Estados: idle | loading | success | error | empty. Sin datos fabricados.

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const t = (key) => window.TechMindI18n.t(key);
  const api = window.TechMindAPI;

  const MAX_CONSULTA = 10000;
  const TOP_N_OPTIONS = [5, 10, 15, 20];

  // Categorías cacheadas para el filtro opcional (carga perezosa).
  let catCache = null;

  // Ref al orb activo para frenarlo al cambiar de estado.
  let activeOrb = null;

  // Última búsqueda (para el botón Reintentar en estado error).
  let lastRun = null;

  // ---------- Utilidades ----------
  const AMP = String.fromCharCode(38);
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, AMP + "amp;")
      .replace(/</g, AMP + "lt;")
      .replace(/>/g, AMP + "gt;")
      .replace(/"/g, AMP + "quot;")
      .replace(/'/g, AMP + "#39;");
  }

  function shortId(id) {
    const s = String(id);
    return s.length > 11 ? `${s.slice(0, 8)}…${s.slice(-3)}` : s;
  }

  function formatSimilitud(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return "—";
    const pct = Math.max(0, Math.min(100, Math.round(Math.abs(v) * 100)));
    return `${pct}%`;
  }

  function simScale(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return "0";
    return Math.max(0, Math.min(1, Math.abs(v))).toFixed(3);
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const lang = window.TechMindI18n.lang() === "es" ? "es" : "en";
      return d.toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" });
    } catch (_) {
      return iso;
    }
  }

  function stopOrb() {
    if (activeOrb) {
      activeOrb.stop();
      activeOrb = null;
    }
  }

  async function loadCategorias(selectEl) {
    if (!selectEl) return;
    try {
      const cats = catCache || (await api.categorias()).categorias || [];
      catCache = cats;
      selectEl.innerHTML =
        `<option value="">${t("buscar.todasCategorias")}</option>` +
        cats.map((c) => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`).join("");
    } catch (e) {
      selectEl.innerHTML = `<option value="">${t("buscar.todasCategorias")}</option>`;
    }
  }

  // ---------- Render principal ----------
  function render(root) {
    stopOrb();
    root.innerHTML = `
      <div class="space-y-8">
        <!-- Encabezado -->
        <header>
          <h1 class="text-[28px] font-semibold tracking-[-0.5px] text-paper">${t("view.buscar.title")}</h1>
          <p class="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">${t("view.buscar.desc")}</p>
        </header>

        <!-- Formulario principal (Distribución Horizontal) -->
        <div class="rounded-[16px] bg-coal p-5 md:p-6">
          <form id="buscar-form" novalidate class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            <!-- Columna Izquierda: Cuadro de Consulta -->
            <div class="flex flex-col">
              <label for="buscar-consulta" class="mb-1.5 block text-[14px] font-medium tracking-[0.5px] text-muted">${t("buscar.consulta")}</label>
              <div class="relative flex-1 flex flex-col">
                <textarea id="buscar-consulta" name="texto_consulta" rows="6" maxlength="${MAX_CONSULTA}"
                  class="w-full flex-1 resize-y rounded-[8px] border border-ash bg-void px-3.5 py-3 text-[14px] leading-relaxed text-paper placeholder:text-muted/60
                         transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-volt focus:outline-none"
                  placeholder="${t("buscar.placeholderConsulta")}"></textarea>
                <p class="mt-1 text-right text-[11px] text-muted" id="consulta-count">0/${MAX_CONSULTA}</p>
              </div>
            </div>

            <!-- Columna Derecha: Filtros y Acciones -->
            <div class="flex flex-col justify-between gap-4">
              <div class="space-y-4">
                <!-- Categoría -->
                <label class="block">
                  <span class="mb-1.5 block text-[14px] font-medium tracking-[0.5px] text-muted">${t("buscar.categoria")}</span>
                  <select id="buscar-categoria"
                    class="w-full rounded-[8px] border border-ash bg-void px-3 py-2.5 text-[14px] text-paper
                           transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-volt focus:outline-none">
                    <option value="">${t("buscar.todasCategorias")}</option>
                  </select>
                </label>

                <!-- Top N -->
                <label class="block">
                  <span class="mb-1.5 block text-[14px] font-medium tracking-[0.5px] text-muted">${t("buscar.topN")}</span>
                  <select id="buscar-topn"
                    class="w-full rounded-[8px] border border-ash bg-void px-3 py-2.5 text-[14px] text-paper transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-volt focus:outline-none">
                    ${TOP_N_OPTIONS.map((n) => `<option value="${n}" ${n === 5 ? "selected" : ""}>${n}</option>`).join("")}
                  </select>
                </label>
              </div>

              <!-- Acciones verticamente alineadas al final -->
              <div class="flex flex-col lg:flex-row gap-2.5 pt-2">
                <button type="button" id="buscar-clear"
                  class="w-full rounded-[8px] px-4 py-2 text-[14px] font-medium text-muted text-center
                         transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                         hover:bg-dot hover:text-paper">
                  ${t("buscar.limpiar")}
                </button>
                <button type="submit" id="buscar-submit"
                  class="w-full rounded-[8px] bg-volt px-5 py-2.5 text-[14px] font-semibold text-void text-center
                         transition-[background-color,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                         hover:brightness-95 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                  data-i18n-aria="buscar.buscarBtn">
                  ${t("buscar.buscarBtn")}
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Sección Inferior: Resultados -->
        <section aria-live="polite">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-[16px] font-semibold tracking-[-0.3px] text-paper">${t("buscar.resultados")}</h2>
            <span id="buscar-total" class="text-[13px] text-muted"></span>
          </div>
          <div id="buscar-result" class="result-zone"></div>
        </section>
      </div>`;

    loadCategorias($("#buscar-categoria"));
    bindForm(root);
    renderIdle($("#buscar-result"));
  }

  // ---------- Estados ----------
  function renderIdle(zone) {
    stopOrb();
    $("#buscar-total").textContent = "";
    zone.innerHTML = `
      <div class="w-full max-w-md rounded-[16px] bg-coal p-6">
        <div class="flex flex-col items-center py-6 text-center">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
          </div>
          <p class="mt-3 text-[13px] text-muted">${t("buscar.resultadoVacio")}</p>
        </div>
      </div>`;
  }

  function renderLoading(zone) {
    stopOrb();
    $("#buscar-total").textContent = "";
    zone.innerHTML = `
      <div class="flex flex-col items-center rounded-[16px] bg-coal px-5 py-12 text-center" aria-busy="true">
        <div id="orb-container" class="orb-container"></div>
        <p class="mt-4 text-[14px] font-medium text-paper">${t("buscar.procesando")}</p>
        <p class="mt-1 text-[12px] text-muted">${t("buscar.procesandoDetalle")}</p>
      </div>`;

    const container = zone.querySelector("#orb-container");
    if (container && window.TechMindOrb) {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const orb = window.TechMindOrb.create({
        size: 120,             // tamaño del contenedor (antes 110)
        speed: 1.5,            // 1.0 es normal. 1.5 es 50% más rápido. 0.5 es más lento.
        nodeCount: 24,         // Número de puntos/vértices. Más puntos = red más densa.
        linkDistance: 1.4,     // A partir de qué distancia los puntos dejan de conectarse (1.0 a 2.0 es lo ideal).
        lineWidth: 2,        // Grosor de las líneas conectoras (antes 1.6). Más gruesas se ven más sólidas.
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

  function renderEmpty(zone) {
    stopOrb();
    $("#buscar-total").textContent = "";
    zone.innerHTML = `
      <div class="rounded-[16px] bg-coal p-6">
        <div class="flex flex-col items-center py-6 text-center">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
              <path d="M8 11h6"/>
            </svg>
          </div>
          <p class="mt-3 text-[14px] font-medium text-paper">${t("buscar.sinResultados")}</p>
          <p class="mt-1 text-[12px] text-muted">${t("buscar.sinResultadosHint")}</p>
        </div>
      </div>`;
  }

  function renderError(zone, message) {
    stopOrb();
    $("#buscar-total").textContent = "";
    const msg = message || t("buscar.errorDefault");
    zone.innerHTML = `
      <div class="rounded-[16px] bg-coal p-6">
        <div class="flex flex-col items-center py-6 text-center">
          <div class="empty-icon" style="color: rgb(var(--c-err));">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
          </div>
          <p class="mt-3 text-[14px] font-medium text-paper">${t("buscar.errorTitulo")}</p>
          <p class="mt-1 max-w-sm text-[12px] text-muted">${escapeHtml(msg)}</p>
          <button type="button" class="action-retry mt-4 rounded-[8px] border border-ash px-4 py-1.5 text-[12px] font-medium text-muted transition-colors duration-200 hover:border-ash hover:bg-dot hover:text-paper">
            ${t("action.retry")}
          </button>
        </div>
      </div>`;
    const btn = zone.querySelector(".action-retry");
    if (btn) btn.addEventListener("click", () => lastRun && runSearch(lastRun.zone, lastRun.payload));
  }

  function renderSuccess(zone, data) {
    stopOrb();
    const resultados = (data && data.resultados) || [];
    const total = (data && data.total) || resultados.length;
    $("#buscar-total").textContent = total != null ? `${total} ${t("buscar.totalLabel")}` : "";

    if (!resultados.length) {
      renderEmpty(zone);
      return;
    }

    // Grilla adaptable de tarjetas
    zone.innerHTML = `<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">${resultados.map(itemHtml).join("")}</div>`;
  }

  function itemHtml(item) {
    const sim = formatSimilitud(item.similitud);
    const scale = simScale(item.similitud);
    const info = Array.isArray(item.informacion_adicional) ? item.informacion_adicional : [];
    const fecha = formatDate(item.creado_en);
    const categoria = item.categoria || t("buscar.sinCategoria");
    const titulo = item.titulo || t("buscar.sinTitulo");
    return `
      <article class="flex flex-col justify-between rounded-[14px] bg-coal p-4 transition-all duration-200 hover:border-ash border border-transparent">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2.5">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-volt/10 border border-volt/20 px-2.5 py-1 text-[11px] font-semibold text-volt">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
              <span class="capitalize">${escapeHtml(categoria)}</span>
            </span>

            <div class="flex items-center gap-1.5 text-[11px]">
              ${item.id ? `<span class="font-mono text-muted/80 bg-dot border border-ash/30 px-1.5 py-0.5 rounded" title="${escapeHtml(String(item.id))}">#${escapeHtml(shortId(item.id))}</span>` : ""}
              ${item.idioma ? `<span class="rounded bg-dot border border-ash/30 px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider text-muted/80">${escapeHtml(item.idioma)}</span>` : ""}
            </div>
          </div>

          <h3 class="text-[14px] font-semibold tracking-[-0.3px] text-paper group-hover:text-volt transition-colors duration-200 truncate" title="${escapeHtml(titulo)}">
            ${escapeHtml(titulo)}
          </h3>
          ${fecha ? `<p class="mt-0.5 text-[11px] text-muted/70">${escapeHtml(fecha)}</p>` : ""}

          ${info.length ? `
            <div class="mt-3 flex flex-wrap gap-1.5">
              ${info.map((k) => `<span class="rounded-full bg-dot px-2 py-0.5 text-[11px] text-muted border border-ash/20">${escapeHtml(k)}</span>`).join("")}
            </div>
          ` : ""}
        </div>

        <div class="mt-4 border-t border-ash/30 pt-3 space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="flex items-center gap-1.5 text-muted font-medium">
              <span class="h-1.5 w-1.5 rounded-full bg-volt animate-pulse"></span>
              ${t("buscar.similitud")}
            </span>
            <span class="font-semibold text-volt">${sim}</span>
          </div>

          <div class="h-[5px] overflow-hidden rounded-full bg-dot border border-ash/20" role="img" aria-label="${t("buscar.similitud")} ${sim}">
            <div class="confianza-bar h-full bg-volt origin-left transition-transform duration-300" style="transform: scaleX(${scale});"></div>
          </div>
        </div>
      </article>`;
  }

  // ---------- Acción ----------
  async function runSearch(zone, payload) {
    renderLoading(zone);
    try {
      const data = await api.busquedaSemantica(payload);
      renderSuccess(zone, data);
    } catch (err) {
      renderError(zone, err && err.message);
    }
  }

  // ---------- Bind ----------
  function bindForm(root) {
    const form = $("#buscar-form");
    const consultaEl = $("#buscar-consulta");
    const countEl = $("#consulta-count");
    const submitBtn = $("#buscar-submit");
    const clearBtn = $("#buscar-clear");
    const resultZone = $("#buscar-result");

    if (consultaEl && countEl) {
      consultaEl.addEventListener("input", () => {
        countEl.textContent = `${consultaEl.value.length}/${MAX_CONSULTA}`;
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (consultaEl) { consultaEl.value = ""; if (countEl) countEl.textContent = `0/${MAX_CONSULTA}`; }
        const catEl = $("#buscar-categoria"); if (catEl) catEl.value = "";
        const topEl = $("#buscar-topn"); if (topEl) topEl.value = "10";
        renderIdle(resultZone);
        lastRun = null;
        consultaEl && consultaEl.focus();
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const consulta = (consultaEl && consultaEl.value || "").trim();
        if (!consulta) {
          consultaEl && consultaEl.classList.add("input-invalid");
          setTimeout(() => consultaEl && consultaEl.classList.remove("input-invalid"), 600);
          consultaEl && consultaEl.focus();
          return;
        }
        const catEl = $("#buscar-categoria");
        const topEl = $("#buscar-topn");
        const payload = {
          texto_consulta: consulta,
          top_n: topEl ? Number(topEl.value) : 10,
          ...(catEl && catEl.value ? { categoria: catEl.value } : {}),
        };
        lastRun = { zone: resultZone, payload };
        submitBtn && submitBtn.setAttribute("disabled", "true");
        runSearch(resultZone, payload).finally(() => submitBtn && submitBtn.removeAttribute("disabled"));
      });
    }
  }

  // ---------- Exponer ----------
  window.TechMindViewBuscar = { render };
})();