// TechMind — contenidos.js
// Fase 5: vista "Contenidos".
// Catálogo REAL: listado paginado (/contenidos), búsqueda por texto (q),
// filtro por categoría (/categorias) y corrección humana de la clasificación
// (PATCH /contenidos/{id}/clasificacion) que alimenta el feedback del modelo.

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const t = (key) => window.TechMindI18n.t(key);
  const api = window.TechMindAPI;

  const LIMITE = 10;

  // Estado local de la vista (se reinicia al re-render)
  let state = {
    q: "",
    qTimer: null,
    categoria: "",
    pagina: 1,
    total: 0,
    totalPaginas: 1,
    categorias: [],
    items: [],
    loading: false,
    error: null,
    busy: false,
    eliminarId: null,
  };

  let catCache = null; // categorías cacheadas entre renders para el formulario

  // ---------- Helpers ----------
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtPct(p) {
    return `${(Number(p) * 100).toFixed(1)}%`;
  }

  function clearTimers() {
    if (state.qTimer) { clearTimeout(state.qTimer); state.qTimer = null; }
  }

  // ---------- Render principal ----------
  function render(root) {
    clearTimers();
    root.innerHTML = `
      <section>
        <header class="mb-6">
          <h1 class="text-[28px] font-semibold tracking-[-0.5px] text-paper">${t("view.contenidos.title")}</h1>
          <p class="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">${t("view.contenidos.desc")}</p>
        </header>

        <!-- Toolbar: búsqueda + filtro categoría + lote -->
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label class="relative flex-1">
            <span class="sr-only">${t("contenidos.buscar")}</span>
            <input type="search" id="contenidos-q" value="${escapeHtml(state.q)}"
              placeholder="${t("contenidos.buscar")}"
              class="w-full rounded-[10px] bg-coal px-4 py-2.5 text-[14px] text-paper
                     placeholder:text-muted/70 border border-ash transition-colors duration-200
                     focus:border-volt focus:outline-none">
          </label>
          <label class="sm:w-56">
            <span class="sr-only">${t("contenidos.filtro")}</span>
            <select id="contenidos-categoria"
              class="w-full rounded-[10px] border border-ash bg-coal px-3 py-2.5 text-[14px] text-paper
                     transition-colors duration-200">
              <option value="">${t("contenidos.todas")}</option>
            </select>
          </label>
          <button type="button" id="contenidos-lote-btn"
            class="rounded-[10px] border border-ash px-4 py-2.5 text-[14px] font-semibold text-muted
                   transition-colors duration-200 hover:border-ash hover:bg-dot hover:text-paper">
            ${t("lote.abrir")}
          </button>
        </div>

        <!-- Contenido dinámico -->
        <div id="contenidos-body">
          <div class="grid grid-cols-1 gap-3">
            <div class="skeleton h-[92px] rounded-[14px]"></div>
            <div class="skeleton h-[92px] rounded-[14px]"></div>
            <div class="skeleton h-[92px] rounded-[14px]"></div>
          </div>
        </div>
      </section>

      <!-- Modal: carga en lote (JSON / CSV) -->
      <div id="lote-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="${t("lote.titulo")}">
        <div data-lote-close class="absolute inset-0 bg-black/60"></div>
        <div class="relative flex max-h-[88vh] w-full max-w-2xl flex-col rounded-[16px] border border-ash bg-coal p-5 md:p-6">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("lote.titulo")}</h2>
              <p class="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">${t("lote.nota")}</p>
            </div>
            <button type="button" data-lote-close aria-label="${t("lote.cerrar")}" title="${t("lote.cerrar")}"
              class="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] text-muted transition-colors duration-200 hover:bg-dot hover:text-paper">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>

          <div class="mb-4 flex items-center gap-1 self-start rounded-[8px] border border-ash p-1">
            <button type="button" data-lote-tab="json"
              class="lote-tab rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition-colors duration-200">
              JSON
            </button>
            <button type="button" data-lote-tab="csv"
              class="lote-tab rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition-colors duration-200">
              CSV
            </button>
          </div>

          <!-- Panel JSON -->
          <div data-lote-panel="json" class="lote-panel">
            <textarea id="lote-json-input" rows="8"
              class="w-full resize-y rounded-[8px] bg-void px-3 py-2.5 text-[13px] font-mono leading-relaxed text-paper placeholder:text-muted/60
                     transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border border-ash
                     focus:border-volt focus:outline-none"
              placeholder='[{"titulo": "Introducción a Spring Boot", "texto": "...", "idioma": "auto"}]'></textarea>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p class="text-[11px] text-muted">${t("lote.jsonHint")}</p>
              <button type="button" id="lote-json-btn"
                class="rounded-[8px] bg-volt px-4 py-2.5 text-[13px] font-semibold text-void
                       transition-[background-color,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                       hover:brightness-95 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50">
                ${t("lote.clasificar")}
              </button>
            </div>
          </div>

          <!-- Panel CSV -->
          <div data-lote-panel="csv" class="lote-panel hidden">
            <label class="flex cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-ash bg-void px-4 py-8 text-center transition-colors duration-200 hover:border-muted">
              <input type="file" id="lote-csv-file" accept=".csv,text/csv" class="sr-only">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted" aria-hidden="true">
                <path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
              </svg>
              <span id="lote-csv-name" class="mt-3 text-[13px] font-medium text-paper">${t("lote.csvElegir")}</span>
              <span class="mt-1 text-[11px] text-muted">${t("lote.csvHint")}</span>
            </label>
            <div class="mt-3 flex flex-wrap items-center justify-end gap-3">
              <button type="button" id="lote-csv-btn"
                class="rounded-[8px] bg-volt px-4 py-2.5 text-[13px] font-semibold text-void
                       transition-[background-color,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                       hover:brightness-95 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50">
                ${t("lote.clasificar")}
              </button>
            </div>
          </div>

          <!-- Resultado del lote -->
          <div id="lote-result" class="mt-4 min-h-0 overflow-y-auto"></div>
        </div>
      </div>

      <!-- Modal: editar contenido -->
      <div id="editar-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="${t("contenidos.editar")}">
        <div data-editar-close class="absolute inset-0 bg-black/60"></div>
        <div class="relative flex max-h-[88vh] w-full max-w-2xl flex-col rounded-[16px] border border-ash bg-coal p-5 md:p-6">
          <div class="mb-4 flex items-start justify-between gap-3">
            <h2 id="editar-titulo" class="min-w-0 flex-1 text-[15px] font-semibold tracking-[-0.3px] text-paper"></h2>
            <button type="button" data-editar-close aria-label="${t("action.cancel")}" title="${t("action.cancel")}"
              class="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] text-muted transition-colors duration-200 hover:bg-dot hover:text-paper">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>
          <div id="editar-body" class="min-h-0 overflow-y-auto"></div>
        </div>
      </div>

      <!-- Modal: confirmar eliminación -->
      <div id="eliminar-modal" class="fixed inset-0 z-[60] hidden items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label="${t("contenidos.confirmarEliminar")}">
        <div data-eliminar-cancel class="absolute inset-0 bg-black/60"></div>
        <div class="relative w-full max-w-sm rounded-[16px] border border-ash bg-coal p-5">
          <h3 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("contenidos.confirmarEliminar")}</h3>
          <p class="mt-2 text-[13px] leading-relaxed text-muted">${t("contenidos.eliminarHint")}</p>
          <p id="eliminar-msg" class="mt-3 text-[12px] text-muted"></p>
          <div class="mt-5 flex justify-end gap-3">
            <button type="button" data-eliminar-cancel
              class="rounded-[8px] px-4 py-2 text-[13px] font-medium text-muted transition-colors duration-200 hover:bg-dot hover:text-paper">
              ${t("action.cancel")}
            </button>
            <button type="button" id="eliminar-confirm"
              class="rounded-[8px] border border-err/60 px-4 py-2 text-[13px] font-semibold text-err transition-colors duration-200 hover:bg-err/10">
              ${t("contenidos.eliminar")}
            </button>
          </div>
        </div>
      </div>`;

    loadCategorias();
    loadPage();
    bindToolbar();
    bindLote();
    bindModales();
  }

  function bindToolbar() {
    const qEl = $("#contenidos-q");
    const catEl = $("#contenidos-categoria");
    if (qEl) {
      qEl.addEventListener("input", () => {
        if (state.qTimer) clearTimeout(state.qTimer);
        state.qTimer = setTimeout(() => {
          state.q = qEl.value.trim();
          state.pagina = 1;
          loadPage();
        }, 300);
      });
    }
    if (catEl) {
      catEl.addEventListener("change", () => {
        state.categoria = catEl.value;
        state.pagina = 1;
        loadPage();
      });
    }
  }

  // ---------- Carga en lote (JSON / CSV) ----------
  const LOTE_MAX = 100;

  function setLoteTab(name) {
    $$(".lote-tab").forEach((btn) => {
      const active = btn.dataset.loteTab === name;
      btn.classList.toggle("bg-dot", active);
      btn.classList.toggle("text-paper", active);
      btn.classList.toggle("text-muted", !active);
    });
    $$(".lote-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.lotePanel !== name);
    });
  }

  function parseJsonLote(text) {
    const value = JSON.parse(text);
    if (!Array.isArray(value)) throw new Error(t("lote.errorArray"));
    if (value.length === 0) throw new Error(t("lote.errorVacio"));
    if (value.length > LOTE_MAX) throw new Error(`${t("lote.errorMaximo")} ${LOTE_MAX}`);
    return value;
  }

  function renderLoteIdle(zone) {
    zone.innerHTML = "";
  }

  function renderLoteLoading(zone) {
    zone.innerHTML = `
      <div class="flex items-center gap-3 rounded-[12px] bg-void px-4 py-4 text-[13px] text-muted" aria-busy="true">
        <div class="skeleton h-4 w-4 rounded-full"></div>
        ${t("lote.procesando")}
      </div>`;
  }

  function renderLoteResult(zone, res) {
    const resultados = (res && res.resultados) || [];
    const procesados = (res && res.total_procesados) || 0;
    const exitosos = (res && res.total_exitosos) || 0;
    const fallidos = (res && res.total_fallidos) || 0;

    zone.innerHTML = `
      <div class="rounded-[12px] bg-void p-4">
        <div class="mb-3 flex flex-wrap items-center gap-2 text-[12px] font-medium">
          <span class="rounded-full bg-dot px-2 py-0.5 text-muted">${t("lote.procesados")}: ${procesados}</span>
          <span class="rounded-full bg-dot px-2 py-0.5 text-ok">${t("lote.exitosos")}: ${exitosos}</span>
          <span class="rounded-full bg-dot px-2 py-0.5 ${fallidos ? "text-err" : "text-muted"}">${t("lote.fallidos")}: ${fallidos}</span>
        </div>
        ${resultados.length ? `
          <ul class="max-h-56 divide-y divide-dot overflow-y-auto">
            ${resultados.map((r) => `
              <li class="flex items-start justify-between gap-3 py-2 text-[12px]">
                <span class="font-mono text-muted/70">#${r.posicion + 1}</span>
                <span class="min-w-0 flex-1 truncate text-paper">${escapeHtml(r.titulo || (r.data && r.data.titulo) || t("lote.sinTitulo"))}</span>
                ${r.exito
                  ? `<span class="shrink-0 rounded-full border border-ash px-2 py-0.5 text-[11px] font-medium text-paper">${escapeHtml(r.data && r.data.categoria || "—")}</span>`
                  : `<span class="shrink-0 text-[11px] text-err" title="${escapeHtml(r.error || "")}">${escapeHtml(r.error || t("lote.errorItem"))}</span>`}
              </li>`).join("")}
          </ul>` : ""}
      </div>`;
  }

  function renderLoteError(zone, message) {
    zone.innerHTML = `
      <div class="rounded-[12px] bg-void p-4">
        <p class="text-[13px] font-medium text-paper">${t("lote.errorTitulo")}</p>
        <p class="mt-1 text-[12px] text-muted">${escapeHtml(message)}</p>
      </div>`;
  }

  async function ejecutarLote(promise) {
    const zone = $("#lote-result");
    if (!zone) return;
    renderLoteLoading(zone);
    try {
      const res = await promise;
      renderLoteResult(zone, res);
      // El listado pudo cambiar: refrescamos la página actual.
      loadPage();
    } catch (e) {
      renderLoteError(zone, e.message);
    }
  }

  function openLoteModal() {
    const modal = $("#lote-modal");
    if (!modal) return;
    // Limpiar estado previo del lote y volver a tab JSON.
    renderLoteIdle($("#lote-result"));
    setLoteTab("json");
    const input = $("#lote-json-input");
    if (input) input.value = "";
    const fileInput = $("#lote-csv-file");
    if (fileInput) fileInput.value = "";
    const csvName = $("#lote-csv-name");
    if (csvName) csvName.textContent = t("lote.csvElegir");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
    const first = modal.querySelector("input, textarea, button");
    if (first) first.focus();
  }

  function closeLoteModal() {
    const modal = $("#lote-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
  }

  function bindLote() {
    // Abrir / cerrar
    const openBtn = $("#contenidos-lote-btn");
    if (openBtn) openBtn.addEventListener("click", openLoteModal);
    $$("[data-lote-close]").forEach((el) => el.addEventListener("click", closeLoteModal));
    document.addEventListener("keydown", (e) => {
      const modal = $("#lote-modal");
      if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) closeLoteModal();
    });

    // Tabs
    $$(".lote-tab").forEach((btn) => {
      btn.addEventListener("click", () => setLoteTab(btn.dataset.loteTab));
    });

    // JSON
    const jsonBtn = $("#lote-json-btn");
    if (jsonBtn) {
      jsonBtn.addEventListener("click", async () => {
        const input = $("#lote-json-input");
        const text = (input && input.value || "").trim();
        if (!text) {
          input && input.classList.add("input-invalid");
          setTimeout(() => input && input.classList.remove("input-invalid"), 600);
          input && input.focus();
          return;
        }
        let payload;
        try {
          payload = { items: parseJsonLote(text) };
        } catch (e) {
          renderLoteError($("#lote-result"), e.message);
          return;
        }
        jsonBtn.disabled = true;
        await ejecutarLote(api.clasificarLoteJson(payload));
        jsonBtn.disabled = false;
      });
    }

    // CSV
    const fileInput = $("#lote-csv-file");
    const csvName = $("#lote-csv-name");
    if (fileInput && csvName) {
      fileInput.addEventListener("change", () => {
        const file = fileInput.files && fileInput.files[0];
        csvName.textContent = file ? file.name : t("lote.csvElegir");
      });
    }
    const csvBtn = $("#lote-csv-btn");
    if (csvBtn) {
      csvBtn.addEventListener("click", async () => {
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (!file) {
          renderLoteError($("#lote-result"), t("lote.errorArchivo"));
          return;
        }
        csvBtn.disabled = true;
        await ejecutarLote(api.clasificarLoteCsv(file));
        csvBtn.disabled = false;
      });
    }
  }

  // ---------- Categorías ----------
  async function loadCategorias() {
    try {
      catCache = catCache || (await api.categorias()).categorias;
      const catEl = $("#contenidos-categoria");
      if (!catEl) return;
      catEl.innerHTML = `<option value="">${t("contenidos.todas")}</option>` +
        catCache
          .map((c) => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`)
          .join("");
      catEl.value = state.categoria;
    } catch (_) {
      // Sin categorías: el filtro queda vacío, el listado igual funciona.
    }
  }

  // ---------- Listado ----------
  async function loadPage() {
    const body = $("#contenidos-body");
    if (!body) return;
    state.loading = true;
    state.error = null;
    body.innerHTML = `
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
        <div class="skeleton h-[150px] rounded-[14px]"></div>
        <div class="skeleton h-[150px] rounded-[14px]"></div>
        <div class="skeleton h-[150px] rounded-[14px]"></div>
        <div class="skeleton h-[150px] rounded-[14px]"></div>
      </div>`;

    try {
      const params = { pagina: state.pagina, limite: LIMITE };
      if (state.q) params.q = state.q;
      if (state.categoria) params.categoria = state.categoria;
      const res = await api.listarContenidos(params);
      state.items = res.items || [];
      state.total = res.total || 0;
      state.totalPaginas = res.total_paginas || 1;
      renderBody(body);
    } catch (e) {
      state.error = e.message;
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.contenidos}</div>
          <p class="text-[15px] font-medium text-paper">${t("contenidos.errorCarga")}</p>
          <p class="mt-1 text-[12px] text-muted">${escapeHtml(e.message)}</p>
          <button type="button" id="contenidos-retry"
            class="mt-4 rounded-[8px] px-4 py-2 text-[13px] font-medium text-muted
                   transition-colors duration-200 hover:border-ash hover:bg-dot hover:text-paper">
            ${t("action.retry")}
          </button>
        </div>`;
      const retry = $("#contenidos-retry");
      if (retry) retry.addEventListener("click", loadPage);
    } finally {
      state.loading = false;
    }
  }

  function renderBody(body) {
    if (!state.items.length) {
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.contenidos}</div>
          <p class="text-[15px] font-medium text-paper">${state.q || state.categoria ? t("contenidos.sinResultados") : t("contenidos.sinContenidos")}</p>
          <p class="mt-1 text-[12px] text-muted">${t("contenidos.sinResultadosHint")}</p>
        </div>`;
      return;
    }

body.innerHTML = `
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
        ${state.items.map(cardHtml).join("")}
      </div>
      <div class="mt-6 flex items-center justify-between gap-3">
        <button type="button" id="contenidos-prev"
          ${state.pagina <= 1 ? "disabled" : ""}
          class="rounded-[8px] px-4 py-2 text-[13px] font-medium text-muted
                 transition-colors duration-200 hover:bg-dot hover:text-paper
                 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted">
          ← ${t("contenidos.anterior")}
        </button>
        <p class="text-[12px] font-medium text-muted">${t("contenidos.pagina")} ${state.pagina} ${t("contenidos.de")} ${state.totalPaginas}</p>
        <button type="button" id="contenidos-next"
          ${state.pagina >= state.totalPaginas ? "disabled" : ""}
          class="rounded-[8px] px-4 py-2 text-[13px] font-medium text-muted
                 transition-colors duration-200 hover:bg-dot hover:text-paper
                 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted">
          ${t("contenidos.siguiente")} →
        </button>
      </div>`;

    // Botón editar → modal de edición
    $$("[data-editar]", body).forEach((btn) => {
      btn.addEventListener("click", () => openEditarModal(Number(btn.dataset.editar)));
    });

    // Botón eliminar → modal de confirmación
    $$("[data-eliminar]", body).forEach((btn) => {
      btn.addEventListener("click", onEliminar);
    });

    // Paginación: anterior / siguiente
    const prevBtn = $("#contenidos-prev", body);
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (state.pagina > 1) {
          state.pagina--;
          loadPage();
        }
      });
    }
    const nextBtn = $("#contenidos-next", body);
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (state.pagina < state.totalPaginas) {
          state.pagina++;
          loadPage();
        }
      });
    }
  }

  function cardHtml(item) {
    const info = Array.isArray(item.informacion_adicional) ? item.informacion_adicional : [];
    return `
      <article class="flex flex-col rounded-[14px] bg-coal p-4 transition-colors duration-200 hover:border-ash border border-transparent">
          <div class="flex items-start justify-between gap-3">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-volt/10 border border-volt/20 px-2.5 py-1 text-[11px] font-semibold text-volt">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
              <span>${escapeHtml(item.categoria)}</span>
            </span>

            <div class="flex items-center gap-2">
              <span class="rounded bg-dot px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider text-muted/80 border border-ash/30">
                ${escapeHtml(item.idioma)}
              </span>
              <div class="flex items-center gap-1.5 bg-dot/80 border border-ash/30 px-2 py-0.5 rounded-full">
                <span class="h-1.5 w-1.5 rounded-full bg-volt"></span>
                <span class="text-[11px] font-semibold text-paper">${fmtPct(item.probabilidad)}</span>
                <span class="text-[9px] uppercase tracking-wider text-muted font-medium">${t("contenidos.confianza")}</span>
              </div>
            </div>
          </div>

          <div class="space-y-1.5 mt-2.5">
            <h3 class="text-[14px] font-semibold tracking-[-0.3px] text-paper group-hover:text-volt transition-colors duration-200 truncate" title="${escapeHtml(item.titulo)}">
              ${escapeHtml(item.titulo)}
            </h3>
            <p class="line-clamp-2 text-[12px] leading-relaxed text-muted/90">
              ${escapeHtml(item.texto)}
            </p>
          </div>

          <div class="mt-3.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-ash/20">
            ${info.slice(0, 5).map((k) => `<span class="rounded-full bg-dot px-2 py-0.5 text-[11px] text-muted border border-ash/20">${escapeHtml(k)}</span>`).join("")}
          </div>

        <div class="mt-4 flex items-center justify-end gap-2 border-t border-dot pt-3">
          <button type="button" data-eliminar="${item.id}"
            class="rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-muted transition-colors duration-200 hover:border-ash hover:bg-dot hover:border-err/60 hover:text-err">
            ${t("contenidos.eliminar")}
          </button>
          <button type="button" data-editar="${item.id}"
            class="rounded-[8px] border border-ash px-3 py-1.5 text-[12px] font-medium text-muted transition-colors duration-200 hover:bg-dot hover:text-paper">
            ${t("contenidos.editar")}
          </button>
        </div>
      </article>`;
  }

  function editarFormHtml(item) {
    return `
      <form data-editar="${item.id}">
        <div class="grid grid-cols-1 gap-3">
          <label>
            <span class="mb-1 block text-[11px] font-medium uppercase tracking-[0.5px] text-muted">${t("contenidos.titulo")}</span>
            <input type="text" name="titulo" maxlength="300" value="${escapeHtml(item.titulo)}"
              class="w-full rounded-[8px] bg-void px-3 py-2 text-[13px] text-paper border border-ash focus:border-volt focus:outline-none">
          </label>
          <label>
            <span class="mb-1 block text-[11px] font-medium uppercase tracking-[0.5px] text-muted">${t("contenidos.texto")}</span>
            <textarea name="texto" rows="5" maxlength="5000"
              class="w-full resize-y rounded-[8px] bg-void px-3 py-2 text-[13px] text-paper border border-ash focus:border-volt focus:outline-none">${escapeHtml(item.texto)}</textarea>
          </label>
          <div class="mt-1 flex flex-col sm:flex-row sm:items-end gap-3">
            <!-- Select con ancho adaptativo -->
            <label class="w-full sm:w-56">
              <span class="mb-1 block text-[11px] font-medium uppercase tracking-[0.5px] text-muted">${t("contenidos.idioma")}</span>
              <select name="idioma" class="w-full rounded-[8px] border border-ash bg-coal px-3 py-2 text-[13px] text-paper focus:border-volt focus:outline-none">
                <option value="auto" ${item.idioma === "auto" ? "selected" : ""}>${t("clasificar.idiomaAuto")}</option>
                <option value="es" ${item.idioma === "es" ? "selected" : ""}>${t("clasificar.idiomaEs")}</option>
                <option value="en" ${item.idioma === "en" ? "selected" : ""}>${t("clasificar.idiomaEn")}</option>
              </select>
            </label>

            <!-- Botón + Feedback -->
            <button type="submit" class="w-full sm:w-auto sm:ml-auto rounded-[8px] bg-volt px-4 py-2 text-[13px] font-semibold text-void transition-opacity duration-200 hover:opacity-90 disabled:opacity-50">
              ${t("contenidos.guardarCambios")}
            </button>
          </div>
          <div class="min-h-[20px]">
            <p class="feedback text-[12px] text-muted transition-all duration-200"></p>
          </div>
        </div>
      </form>`;
  }

  async function onSubmitEdicion(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const id = Number(form.dataset.editar);
    const feedback = $(".feedback", form);
    const btn = $('button[type="submit"]', form);
    if (state.busy) return;

    const titulo = form.titulo.value.trim();
    const texto = form.texto.value.trim();
    if (!titulo || !texto) {
      feedback.textContent = t("contenidos.errorCampos");
      feedback.classList.add("text-err");
      return;
    }

    state.busy = true;
    btn.disabled = true;
    feedback.textContent = t("contenidos.enviando");
    feedback.classList.remove("text-err", "text-ok");

    try {
      // El PUT devuelve el contenido ya actualizado Y re-clasificado:
      // lo usamos para actualizar solo esa card, sin volver a pedir la lista.
      const res = await api.actualizarContenido(id, { titulo, texto, idioma: form.idioma.value });
      const idx = state.items.findIndex((i) => i.id === id);
      if (idx !== -1) state.items[idx] = res;
      closeEditarModal();
      const body = $("#contenidos-body");
      if (body) renderBody(body);
      if (window.TechMindToast) window.TechMindToast.show(t("contenidos.editado"), "ok");
    } catch (err) {
      const errMsg = `${t("contenidos.errorEdicion")}: ${err.message}`;
      feedback.textContent = errMsg;
      feedback.classList.add("text-err");
      if (window.TechMindToast) window.TechMindToast.show(errMsg, "err");
    } finally {
      state.busy = false;
      btn.disabled = false;
    }
  }

  function onEliminar(e) {
    const btn = e.currentTarget;
    state.eliminarId = Number(btn.dataset.eliminar);
    // Resetear el feedback del modal de confirmación
    const msg = $("#eliminar-msg");
    if (msg) {
      msg.textContent = "";
      msg.classList.remove("text-err");
    }
    const confirmBtn = $("#eliminar-confirm");
    if (confirmBtn) confirmBtn.disabled = false;
    const modal = $("#eliminar-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  async function confirmEliminar() {
    const id = state.eliminarId;
    if (!id || state.busy) return;
    state.busy = true;
    const btn = $("#eliminar-confirm");
    const msg = $("#eliminar-msg");
    if (btn) btn.disabled = true;
    if (msg) {
      msg.textContent = t("contenidos.enviando");
      msg.classList.remove("text-err");
    }

    try {
      await api.eliminarContenido(id);
      state.eliminarId = null;
      closeEliminarModal();
      closeEditarModal();
      // Si era el último item de la página, retrocedemos una página.
      if (state.items.length === 1 && state.pagina > 1) state.pagina--;
      loadPage();
      if (window.TechMindToast) window.TechMindToast.show(t("contenidos.eliminado"), "ok");
    } catch (err) {
      state.busy = false;
      if (btn) btn.disabled = false;
      const errMsg = `${t("contenidos.errorEliminar")}: ${err.message}`;
      if (msg) {
        msg.textContent = errMsg;
        msg.classList.add("text-err");
      }
      if (window.TechMindToast) window.TechMindToast.show(errMsg, "err");
    }
  }

  // ---------- Modal de edición y confirmación ----------
  function openEditarModal(id) {
    const modal = $("#editar-modal");
    const item = state.items.find((i) => i.id === id);
    if (!modal || !item) return;
    const titulo = $("#editar-titulo");
    const body = $("#editar-body");
    if (titulo) titulo.textContent = t("contenidos.editar");
    if (body) {
      body.innerHTML = editarFormHtml(item);
      const form = $("[data-editar]", body);
      if (form) form.addEventListener("submit", onSubmitEdicion);
    }
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
    const first = modal.querySelector("input, textarea, select, button");
    if (first) first.focus();
  }

  function closeEditarModal() {
    const modal = $("#editar-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    const elimModal = $("#eliminar-modal");
    if (!elimModal || elimModal.classList.contains("hidden")) {
      document.body.style.overflow = "";
    }
  }

  function closeEliminarModal() {
    const modal = $("#eliminar-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  function bindModales() {
    $$("[data-editar-close]").forEach((el) => el.addEventListener("click", closeEditarModal));
    $$("[data-eliminar-cancel]").forEach((el) => el.addEventListener("click", closeEliminarModal));
    const confirmBtn = $("#eliminar-confirm");
    if (confirmBtn) confirmBtn.addEventListener("click", confirmEliminar);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const elimModal = $("#eliminar-modal");
      if (elimModal && !elimModal.classList.contains("hidden")) {
        closeEliminarModal();
        return;
      }
      const editarModal = $("#editar-modal");
      if (editarModal && !editarModal.classList.contains("hidden")) {
        closeEditarModal();
      }
    });
  }

  // ---------- Iconos (mismo lenguaje visual que shell.js) ----------
  const ICONS = {
    contenidos: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>
        <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
        <path d="M8 13h8"/><path d="M8 16.5h5"/>
      </svg>`,
  };

  // ---------- Exponer para shell.js ----------
  window.TechMindViewContenidos = {
    render(root) {
      clearTimers();
      render(root);
    },
  };
})();