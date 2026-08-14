// TechMind — correcciones.js
// Vista "Correcciones humanas": revisar y corregir la clasificación de los
// contenidos con BAJA CONFIANZA (< UMBRAL) para mejorar el modelo con feedback.
// Reusa el listado real (GET /contenidos) y la corrección humana
// (PATCH /contenidos/{id}/clasificacion). El filtro por umbral es del lado
// del cliente: el endpoint de listado no expone un filtro de probabilidad.

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const t = (key) => window.TechMindI18n.t(key);
  const api = window.TechMindAPI;

  // Contenidos con probabilidad menor a este umbral se consideran candidatos
  // a corrección humana.
  const UMBRAL = 0.35;
  const LIMITE = 100;
  // Contexto máximo (en palabras) que se muestra al desplegar una card para
  // corregir: suficiente para evaluar la clasificación sin abrumar.
  const MAX_CONTEXTO = 300;

  let catCache = null;
  let state = {
    items: [],
    loading: false,
    error: null,
    busy: false,
    expandedId: null,
  };

  // ---------- Helpers ----------
  const AMP = String.fromCharCode(38);
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, AMP + "amp;")
      .replace(/</g, AMP + "lt;")
      .replace(/>/g, AMP + "gt;")
      .replace(/"/g, AMP + "quot;")
      .replace(/'/g, AMP + "#39;");
  }

  function fmtPct(p) {
    return `${(Number(p) * 100).toFixed(1)}%`;
  }

  // Recorta un texto a un máximo de palabras (para dar contexto sin abrumar).
  function resumirTexto(texto, max) {
    const s = String(texto == null ? "" : texto);
    const palabras = s.trim().split(/\s+/);
    if (palabras.length <= max) return s;
    return `${palabras.slice(0, max).join(" ")}…`;
  }

  function fmtFecha(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const lang = window.TechMindI18n.lang() === "es" ? "es" : "en";
    return d.toLocaleDateString(lang, { day: "numeric", month: "short" });
  }

  // ---------- Render principal ----------
  function render(root) {
    root.innerHTML = `
      <section>
        <header class="mb-6">
          <h1 class="text-[28px] font-semibold tracking-[-0.5px] text-paper">${t("view.correcciones.title")}</h1>
          <p class="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">${t("view.correcciones.desc")}</p>
        </header>

        <div class="mb-6 flex flex-wrap items-center gap-2">
          <span class="rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-[12px] font-semibold text-volt">${t("correcciones.umbral")}</span>
          <span id="correcciones-count" class="text-[12px] text-muted"></span>
        </div>

        <div id="correcciones-body" class="columns-1 gap-4 lg:columns-2">
          <div class="skeleton mb-4 h-[180px] break-inside-avoid rounded-[14px]"></div>
          <div class="skeleton mb-4 h-[180px] break-inside-avoid rounded-[14px]"></div>
          <div class="skeleton mb-4 h-[180px] break-inside-avoid rounded-[14px]"></div>
          <div class="skeleton mb-4 h-[180px] break-inside-avoid rounded-[14px]"></div>
        </div>
      </section>`;

    loadCategorias();
    load();
  }

  // ---------- Categorías (para el select del form) ----------
  async function loadCategorias() {
    try {
      catCache = catCache || (await api.categorias()).categorias;
    } catch (_) {
      // Sin categorías: el form igual funciona (select vacío con opción por defecto).
    }
  }

  // ---------- Carga ----------
  async function load() {
    const body = $("#correcciones-body");
    if (!body) return;
    state.loading = true;
    state.error = null;
    body.innerHTML = `
      <div class="skeleton mb-4 h-[180px] break-inside-avoid rounded-[14px]"></div>
      <div class="skeleton mb-4 h-[180px] break-inside-avoid rounded-[14px]"></div>
      <div class="skeleton mb-4 h-[180px] break-inside-avoid rounded-[14px]"></div>
      <div class="skeleton mb-4 h-[180px] break-inside-avoid rounded-[14px]"></div>`;

    try {
      // El backend no filtra por probabilidad: traemos el lote más grande y
      // filtramos acá. En un catálogo grande habría que agregar el filtro server-side.
      const res = await api.listarContenidos({ pagina: 1, limite: LIMITE });
      const todos = res.items || [];
      state.items = todos.filter((i) => Number(i.probabilidad) < UMBRAL);
      renderBody(body);
    } catch (e) {
      state.error = e.message;
      body.innerHTML = `
        <div class="[column-span:all]">
          <div class="empty-state">
            <div class="empty-icon">${ICONS.correcciones}</div>
            <p class="text-[15px] font-medium text-paper">${t("correcciones.errorCarga")}</p>
            <p class="mt-1 text-[12px] text-muted">${escapeHtml(e.message)}</p>
            <button type="button" id="correcciones-retry"
              class="mt-4 rounded-[8px] px-4 py-2 text-[13px] font-medium text-muted
                     transition-colors duration-200 hover:border-ash hover:bg-dot hover:text-paper">
              ${t("action.retry")}
            </button>
          </div>
        </div>`;
      const retry = $("#correcciones-retry");
      if (retry) retry.addEventListener("click", load);
    } finally {
      state.loading = false;
    }
  }

  function renderBody(body) {
    const countEl = $("#correcciones-count");
    if (countEl) {
      countEl.textContent = state.items.length ? `${state.items.length} ${t("correcciones.pendientes")}` : "";
    }

    if (!state.items.length) {
      body.innerHTML = `
        <div class="[column-span:all]">
          <div class="empty-state">
            <div class="empty-icon">${ICONS.correcciones}</div>
            <p class="text-[15px] font-medium text-paper">${t("correcciones.sinPendientes")}</p>
            <p class="mt-1 text-[12px] text-muted">${t("correcciones.sinPendientesHint")}</p>
          </div>
        </div>`;
      return;
    }

    body.innerHTML = state.items.map(cardHtml).join("");

    // Click en card: desplegar/ocultar el form de corrección
    $$("[data-correccion-expand]", body).forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const id = Number(trigger.dataset.correccionExpand);
        state.expandedId = state.expandedId === id ? null : id;
        renderBody(body);
      });
    });

    // Binds de los formularios de corrección (solo los desplegados)
    $$("[data-corregir]", body).forEach((form) => {
      form.addEventListener("submit", onSubmitCorreccion);
    });
  }

  // ---------- Card de corrección (resumen desplegable) ----------
  function cardHtml(item) {
    const info = Array.isArray(item.informacion_adicional) ? item.informacion_adicional : [];
    const expanded = state.expandedId === item.id;
    return `
      <article class="mb-4 break-inside-avoid rounded-[14px] bg-coal p-4 transition-colors duration-200 hover:border-ash border border-transparent">
        <button type="button" data-correccion-expand="${item.id}"
          class="flex w-full items-start justify-between gap-3 text-left"
          aria-expanded="${expanded}">
          <div class="min-w-0 flex-1">
            <p class="${expanded ? "text-[15px]" : "truncate text-[14px]"} font-semibold tracking-[-0.3px] text-paper" title="${escapeHtml(item.titulo)}">${escapeHtml(item.titulo)}</p>
            <p class="${expanded ? "mt-2 whitespace-pre-line text-[13px]" : "mt-1 line-clamp-2 text-[12px]"} leading-relaxed text-muted">${escapeHtml(resumirTexto(item.texto, MAX_CONTEXTO))}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-[13px] font-semibold text-warn">${fmtPct(item.probabilidad)}</p>
            <p class="text-[10px] uppercase tracking-[0.5px] text-muted">${t("contenidos.confianza")}</p>
          </div>
          <span class="mt-0.5 shrink-0 text-[12px] text-muted transition-transform duration-200 ${expanded ? "rotate-90" : ""}">›</span>
        </button>

        <div class="mt-3 flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-volt/10 border border-volt/20 px-2.5 py-1 text-[11px] font-semibold text-volt">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
            <span class="capitalize">${escapeHtml(item.categoria || t("correcciones.sinCategoria"))}</span>
          </span>
          ${info.slice(0, 5).map((k) => `<span class="rounded-full bg-dot px-2 py-0.5 text-[11px] text-muted">${escapeHtml(k)}</span>`).join("")}
          ${item.idioma ? `<span class="ml-auto text-[11px] uppercase tracking-[0.5px] text-muted/70">${escapeHtml(item.idioma)}</span>` : ""}
        </div>

        ${expanded ? `
        <form data-corregir="${item.id}" class="mt-4 border-t border-dot pt-4">
          <div class="grid grid-cols-1 gap-3">
            <label>
              <span class="mb-1 block text-[11px] font-medium uppercase tracking-[0.5px] text-muted">${t("contenidos.nuevaCategoria")}</span>
              <select name="categoria" class="w-full rounded-[8px] border border-ash bg-void px-3 py-2 text-[13px] text-paper">
                ${optionsCategorias(item.categoria)}
              </select>
            </label>
            <label>
              <span class="mb-1 block text-[11px] font-medium uppercase tracking-[0.5px] text-muted">${t("contenidos.usuario")}</span>
              <input type="text" name="usuario" maxlength="100"
                class="w-full rounded-[8px] bg-void px-3 py-2 text-[13px] text-paper border border-ash focus:border-volt focus:outline-none">
            </label>
            <label>
              <span class="mb-1 block text-[11px] font-medium uppercase tracking-[0.5px] text-muted">${t("contenidos.motivo")}</span>
              <textarea name="motivo" rows="2" maxlength="500"
                class="w-full resize-y rounded-[8px] bg-void px-3 py-2 text-[13px] text-paper border border-ash focus:border-volt focus:outline-none"></textarea>
            </label>
          </div>
          <div class="mt-3 flex items-center gap-3">
            <button type="submit" class="rounded-[8px] bg-volt px-4 py-2 text-[13px] font-semibold text-void transition-opacity duration-200 hover:opacity-90 disabled:opacity-50">
              ${t("contenidos.guardar")}
            </button>
            <p class="feedback text-[12px] text-muted"></p>
          </div>
        </form>` : ""}
      </article>`;
  }

  function optionsCategorias(actual) {
    const cats = catCache || [];
    const actualId = cats.find((c) => c.nombre === actual)?.id;
    return cats
      .map((c) => `<option value="${c.id}" ${c.id === actualId ? "selected" : ""}>${escapeHtml(c.nombre)}</option>`)
      .join("");
  }

  // ---------- Acción: corregir clasificación ----------
  async function onSubmitCorreccion(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const id = Number(form.dataset.corregir);
    const feedback = $(".feedback", form);
    const btn = $('button[type="submit"]', form);
    if (state.busy) return;
    state.busy = true;
    btn.disabled = true;
    feedback.textContent = t("contenidos.enviando");

    const payload = { nueva_categoria_id: Number(form.categoria.value) };
    const usuario = form.usuario.value.trim();
    const motivo = form.motivo.value.trim();
    if (usuario) payload.usuario = usuario;
    if (motivo) payload.motivo = motivo;

    try {
      const res = await api.corregirClasificacion(id, payload);
      const okMsg = res.corregida ? t("contenidos.corregida") : t("contenidos.confirmada");
      if (window.TechMindToast) window.TechMindToast.show(okMsg, "ok");
      // Quitar la card corregida de la cola: el feedback humano ya quedó registrado.
      state.items = state.items.filter((i) => i.id !== id);
      renderBody($("#correcciones-body"));
    } catch (err) {
      const errMsg = `${t("contenidos.errorCorreccion")}: ${err.message}`;
      feedback.textContent = errMsg;
      feedback.classList.add("text-err");
      if (window.TechMindToast) window.TechMindToast.show(errMsg, "err");
    } finally {
      state.busy = false;
      btn.disabled = false;
    }
  }

  // ---------- Iconos ----------
  const ICONS = {
    correcciones: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3l1.8 4.6L18.4 9.4l-4.6 1.8L12 15.8l-1.8-4.6L5.6 9.4l4.6-1.8L12 3Z"/>
        <path d="M20 20H8"/>
        <path d="M4 16l1.5-1.5L7 16l-1.5 1.5L4 16Z"/>
      </svg>`,
  };

  // ---------- Exponer para shell.js ----------
  window.TechMindViewCorrecciones = { render };
})();