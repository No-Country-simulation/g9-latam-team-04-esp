// TechMind — modelo.js
// Fase 5: vista "Modelo".
// Estado REAL del reentrenamiento (/modelos/reentrenar/estado): estado del
// manager (idle/running), exit code del último run, F1 nuevo vs vigente,
// veredicto y motivo. Acción manual: POST /modelos/reentrenar con
// X-Admin-Token (el frontend NUNCA hardcodea el token; se pide al operador).

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const t = (key) => window.TechMindI18n.t(key);
  const api = window.TechMindAPI;

  const POLL_MS = 5000;
  let pollTimer = null;

  // ---------- Helpers ----------
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clearPoll() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function fmtPct(p) {
    if (p == null) return "—";
    return `${(Number(p) * 100).toFixed(2)}%`;
  }

  // ---------- Render principal ----------
  function render(root) {
    clearPoll();
    root.innerHTML = `
      <section>
        <header class="mb-8">
          <h1 class="text-[28px] font-semibold tracking-[-0.5px] text-paper">${t("view.modelo.title")}</h1>
          <p class="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">${t("view.modelo.desc")}</p>
        </header>

        <div class="mb-6 rounded-[16px] bg-coal p-5 md:p-6 border border-ash/40">
          <!-- Encabezado del Panel -->
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("modelo.estadoReentrenamiento")}</h2>
              <span id="modelo-badge" class="inline-flex items-center gap-1.5 rounded-full border border-ash/60 bg-dot px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                <span class="h-1.5 w-1.5 rounded-full bg-muted/60"></span>
                …
              </span>
            </div>
            <span class="flex items-center gap-1.5 text-[11px] text-muted/70">
              <svg class="h-3 w-3 animate-spin text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ${t("modelo.autoRefresh")}
            </span>
          </div>
          <div id="modelo-resumen" class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div class="skeleton h-32 rounded-[12px] md:col-span-5"></div>
            <div class="skeleton h-32 rounded-[12px] md:col-span-7"></div>
          </div>
        </div>

        <div class="rounded-[16px] bg-coal p-5 md:p-6">
          <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("modelo.reentrenarManual")}</h2>
          <p class="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">${t("modelo.reentrenarNota")}</p>

          <form id="modelo-form" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label class="sm:flex-1">
              <span class="mb-1 block text-[11px] font-medium uppercase tracking-[0.5px] text-muted">${t("modelo.tokenAdmin")}</span>
              <input type="password" id="modelo-token" autocomplete="off"
                class="w-full rounded-[8px] bg-coal px-3 py-2.5 text-[13px] border border-ash text-paper focus:border-volt focus:outline-none"
                placeholder="${t("modelo.tokenPlaceholder")}">
            </label>
            <button type="submit" id="modelo-trigger"
              class="rounded-[8px] bg-volt px-5 py-2.5 text-[13px] font-semibold text-void transition-opacity duration-200 hover:opacity-90 disabled:opacity-50">
              ${t("modelo.reentrenarBtn")}
            </button>
          </form>
          <p id="modelo-feedback" class="mt-3 text-[12px] text-muted" role="status"></p>
        </div>

        <!-- Exportar dataset de feedback (GET /contenidos/exportar-dataset) -->
        <div class="mt-6 rounded-[16px] bg-coal p-5 md:p-6">
          <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("exportar.titulo")}</h2>
          <p class="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">${t("exportar.nota")}</p>

          <form id="exportar-form" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <label>
              <span class="mb-1.5 block text-[14px] font-medium tracking-[0.5px] text-muted">${t("exportar.idioma")}</span>
              <select id="exportar-idioma"
                class="w-full rounded-[8px] border border-ash bg-void px-3 py-2.5 text-[14px] text-paper
                       transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">
                <option value="todos" selected>${t("exportar.idiomaTodos")}</option>
                <option value="es">${t("exportar.idiomaEs")}</option>
                <option value="en">${t("exportar.idiomaEn")}</option>
              </select>
            </label>
            <label>
              <span class="mb-1.5 block text-[14px] font-medium tracking-[0.5px] text-muted">${t("exportar.formato")}</span>
              <select id="exportar-formato"
                class="w-full rounded-[8px] border border-ash bg-void px-3 py-2.5 text-[14px] text-paper
                       transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">
                <option value="csv" selected>CSV</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2 text-[13px] font-medium text-muted lg:pt-6">
              <input type="checkbox" id="exportar-verificados" class="demo-toggle" checked>
              <span>${t("exportar.soloVerificados")}</span>
            </label>
            <div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 lg:pt-0">
              <button type="button" id="exportar-descargar"
                class="rounded-[8px] bg-volt px-4 py-2.5 text-[13px] font-semibold text-void
                       transition-[background-color,filter] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                       hover:brightness-95 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50">
                ${t("exportar.descargar")}
              </button>
              <button type="button" id="exportar-guardar"
                class="rounded-[8px] border border-ash px-4 py-2.5 text-[13px] font-semibold text-muted
                       transition-colors duration-200 hover:border-ash hover:bg-dot hover:text-paper
                       disabled:cursor-not-allowed disabled:opacity-50">
                ${t("exportar.guardarBtn")}
              </button>
            </div>
          </form>
          <p id="exportar-feedback" class="mt-3 text-[12px] text-muted" role="status"></p>
        </div>
      </section>`;

    bindForm();
    bindExportar();
    loadEstado();
    pollTimer = setInterval(loadEstado, POLL_MS);
  }

  // ---------- Exportar dataset ----------
  function exportParams() {
    return {
      idioma: ($("#exportar-idioma") || {}).value || "todos",
      formato: ($("#exportar-formato") || {}).value || "csv",
      solo_verificados: $("#exportar-verificados") ? $("#exportar-verificados").checked : true,
    };
  }

  async function descargar(url, filename) {
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
  }

  function exportFilename(params) {
    const suf = params.idioma === "todos" ? "" : `_${params.idioma}`;
    const pre = params.solo_verificados ? "feedback" : "contenidos";
    return `dataset_${pre}${suf}.${params.formato}`;
  }

  function bindExportar() {
    const dlBtn = $("#exportar-descargar");
    const saveBtn = $("#exportar-guardar");
    const feedback = $("#exportar-feedback");

    if (dlBtn) {
      dlBtn.addEventListener("click", async () => {
        const params = exportParams();
        const filename = exportFilename(params);
        feedback.textContent = t("exportar.descargando");
        feedback.className = "mt-3 text-[12px] text-muted";
        dlBtn.disabled = true;
        try {
          const url = api.exportarDatasetUrl({ ...params, guardar: false });
          await descargar(url, filename);
          feedback.textContent = `${t("exportar.descargado")} ${filename}`;
          feedback.classList.add("text-ok");
        } catch (err) {
          feedback.textContent = `${t("exportar.error")}: ${escapeHtml(err.message)}`;
          feedback.classList.add("text-err");
        } finally {
          dlBtn.disabled = false;
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const params = exportParams();
        feedback.textContent = t("exportar.guardando");
        feedback.className = "mt-3 text-[12px] text-muted";
        saveBtn.disabled = true;
        try {
          const res = await api.guardarDataset(params);
          feedback.textContent = `${t("exportar.guardado")} ${escapeHtml(res.archivo || "")} · ${res.filas != null ? `${res.filas} ${t("exportar.filasLabel")}` : ""}`;
          feedback.classList.add("text-ok");
        } catch (err) {
          feedback.textContent = `${t("exportar.error")}: ${escapeHtml(err.message)}`;
          feedback.classList.add("text-err");
        } finally {
          saveBtn.disabled = false;
        }
      });
    }
  }

  function bindForm() {
    const form = $("#modelo-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = $("#modelo-token").value.trim();
      const feedback = $("#modelo-feedback");
      const btn = $("#modelo-trigger");
      btn.disabled = true;
      feedback.textContent = t("modelo.enviando");

      try {
        const res = await api.reentrenar(token);
        const idiomas = (res.idiomas || []).join(", ");
        feedback.textContent = `${t("modelo.lanzado")}${idiomas ? ` (${idiomas})` : ""}`;
        feedback.classList.add("text-ok");
        $("#modelo-token").value = "";
        loadEstado();
      } catch (err) {
        const msg = err.message || "";
        if (/401|403/.test(msg)) {
          feedback.textContent = t("modelo.tokenInvalido");
        } else if (/409/.test(msg)) {
          feedback.textContent = t("modelo.nadaNuevo");
        } else {
          feedback.textContent = `${t("modelo.errorLanzar")}: ${escapeHtml(msg)}`;
        }
        feedback.classList.add("text-err");
      } finally {
        btn.disabled = false;
      }
    });
  }

  // ---------- Carga de estado ----------
  async function loadEstado() {
    const resumenEl = $("#modelo-resumen");
    const badgeEl = $("#modelo-badge");
    if (!resumenEl) return;

    let data = null;
    try {
      data = await api.estadoModelo();
    } catch (e) {
      resumenEl.innerHTML = `
        <div class="md:col-span-12 rounded-[12px] bg-void p-5">
          <p class="text-[13px] font-medium text-paper">${t("modelo.sinEstado")}</p>
          <p class="mt-1 text-[12px] text-muted">${escapeHtml(e.message)}</p>
        </div>`;
      if (badgeEl) {
        badgeEl.innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-err"></span> —`;
        badgeEl.className = "inline-flex items-center gap-1.5 rounded-full border border-err/40 bg-err/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-err";
      }
      return;
    }

    const estado = data.estado || "idle";
    const running = estado === "running";

    if (badgeEl) {
      badgeEl.innerHTML = `<span class="h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-volt" : "bg-muted/60"}"></span> ${running ? t("modelo.badgeRunning") : t("modelo.badgeIdle")}`;
      badgeEl.className = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
        (running ? "border-volt/50 bg-volt/10 text-volt" : "border-ash/60 bg-dot text-muted");
    }

    const exit = data.exit_code;
    const tipo = data.tipo || "desconocido";

    // ---- Banner (veredicto) según el resultado del último run ----
    function bannerHtml() {
      const chip = exit != null
        ? `<span class="text-[10px] font-mono text-muted uppercase">${t("modelo.exitCode")} ${exit}</span>`
        : "";
      let style, titulo;
      if (exit === 0) {
        style = "bg-ok/10 border-ok/20 text-ok";
        titulo = t("modelo.verdictOk");
      } else if (exit === 2 || exit === 3) {
        style = "bg-warn/10 border-warn/20 text-warn";
        titulo = t("modelo.verdictAbort");
      } else {
        style = "bg-err/10 border-err/20 text-err";
        titulo = t("modelo.verdictError");
      }
      const texto = data.motivo || data.veredicto || (data.error ? data.error : t("modelo.sinVeredicto"));
      return `
        <div class="rounded-[12px] ${style} border p-4">
          <div class="mb-1 flex items-center justify-between gap-2">
            <span class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span class="h-1.5 w-1.5 rounded-full"></span>
              ${titulo}
            </span>
            ${chip}
          </div>
          <p class="text-[12px] font-medium leading-relaxed text-paper">${escapeHtml(texto)}</p>
        </div>`;
    }

    // ---- Detalle técnico (tipo de error + script) ----
    function detalleHtml() {
      const tipoLabel = tipo === "ok" ? t("modelo.exitOk") : tipo === "abortado" ? t("modelo.exitAbort") : t("modelo.tipoDesconocido");
      const extra = data.error && data.error !== (data.motivo || "") ? `<div class="flex items-center justify-between text-[11px]">
          <span class="text-muted/70 font-mono">${t("modelo.tipoError")}</span>
          <span class="font-mono text-[11px] font-medium text-err">${escapeHtml(data.error)}</span>
        </div>` : "";
      return `
        <div class="rounded-[12px] bg-dot border border-ash/40 p-3.5 space-y-2">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-mono text-muted/70">${t("modelo.tipoError")}</span>
            <span class="rounded bg-ash/50 px-2 py-0.5 font-mono text-[10px] font-medium text-paper">${tipoLabel}</span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-mono text-muted/70">${t("modelo.comando")}</span>
            <span class="font-mono text-[11px] font-semibold text-paper">${t("modelo.scriptNombre")}</span>
          </div>
          ${extra}
        </div>`;
    }

    // ---- F1 nuevo vs vigente + comparativa con la mejora mínima ----
    const dif = data.f1_diferencia;
    const req = data.f1_mejora_minima;
    const fmtPp = (v) => {
      if (v == null) return "—";
      const val = (Number(v) * 100).toFixed(2);
      return v > 0 ? `+${val} pp` : `${val} pp`;
    };
    const difOk = dif != null && dif >= 0;
    // Progreso hacia la meta: diferencia / requerida (0..100)
    let pct = 0;
    if (dif != null && req != null && Number(req) > 0) {
      pct = Math.max(0, Math.min(100, (dif / req) * 100));
    }
    const barColor = dif != null && req != null && Number(req) > 0
      ? (dif >= req ? "bg-ok" : dif > 0 ? "bg-warn" : "bg-err")
      : "bg-dot";

    resumenEl.innerHTML = `
      <!-- COLUMNA IZQUIERDA: Comparativa de Métricas F1 (5 Cols) -->
      <div class="md:col-span-5 flex flex-col justify-between rounded-[12px] bg-void border border-ash/30 p-5">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">${t("modelo.f1Nuevo")}</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-[32px] font-black tracking-tight text-paper">${fmtPct(data.f1_nuevo)}</span>
            <span class="text-[11px] text-muted">vs ${fmtPct(data.f1_vigente)} ${t("modelo.vigente")}</span>
          </div>
        </div>

        <!-- Comparativa vs Mínimo -->
        <div class="mt-4 space-y-2 border-t border-ash/30 pt-3">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-muted">${t("modelo.diferenciaLograda")}</span>
            <span class="font-bold ${difOk ? "text-ok" : "text-err"}">${fmtPp(dif)}</span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-muted">${t("modelo.mejoraMinima")}</span>
            <span class="font-mono text-paper/80">${fmtPp(req)}</span>
          </div>
          <!-- Barra de progreso visual del requerimiento -->
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-dot">
            <div class="${barColor} h-full rounded-full" style="width: ${pct.toFixed(1)}%"></div>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA: Veredicto y Log del Último Run (7 Cols) -->
      <div class="md:col-span-7 flex flex-col gap-3">
        ${bannerHtml()}
        ${detalleHtml()}
      </div>`;
  }

  // ---------- Exponer para shell.js ----------
  window.TechMindViewModelo = {
    render(root) {
      clearPoll();
      render(root);
    },
  };
})();