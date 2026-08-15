// TechMind — metricas.js
// Fase 4: vista "Métricas".
// - KPIs REALES: /health (status, modelos, embeddings), /contenidos (total),
//   /modelos/reentrenar/estado (F1 nuevo vs vigente).
// - Telemetría REAL del backend: GET /metrics (middleware HTTP en memoria)
//   con polling mientras el toggle de streaming está activo. Reemplaza la
//   demo simulada del dashboard.py.

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const t = (key) => window.TechMindI18n.t(key);
  const api = window.TechMindAPI;

  // Refs para limpiar charts/intervalos al re-render
  let charts = [];
  let telemetriaTimer = null;
  let teleStore = [];

  // ---------- Helpers ----------
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function destroyCharts() {
    charts.forEach((c) => { try { c.destroy(); } catch (_) {} });
    charts = [];
  }

  function clearTelemetriaTimer() {
    if (telemetriaTimer) { clearInterval(telemetriaTimer); telemetriaTimer = null; }
  }

  // ---------- Colores del tema activo (para Chart.js) ----------
  function themeColors() {
    const cs = getComputedStyle(document.documentElement);
    const rgb = (v) => {
      const t = v.trim().split(/\s+/).map(Number);
      return `rgb(${t[0]},${t[1]},${t[2]})`;
    };
    return {
      void: rgb(cs.getPropertyValue("--c-void") || "0 0 0"),
      coal: rgb(cs.getPropertyValue("--c-coal") || "22 22 22"),
      ash: rgb(cs.getPropertyValue("--c-ash") || "40 40 40"),
      dot: rgb(cs.getPropertyValue("--c-dot") || "31 31 31"),
      paper: rgb(cs.getPropertyValue("--c-paper") || "255 255 255"),
      muted: rgb(cs.getPropertyValue("--c-muted") || "138 138 138"),
      volt: rgb(cs.getPropertyValue("--c-volt") || "229 255 143"),
      ok: rgb(cs.getPropertyValue("--c-ok") || "33 255 0"),
      warn: rgb(cs.getPropertyValue("--c-warn") || "255 159 10"),
      err: rgb(cs.getPropertyValue("--c-err") || "255 31 31"),
    };
  }

  // ---------- Render principal ----------
  function render(root) {
    clearTelemetriaTimer();
    destroyCharts();
    root.innerHTML = `
      <section>
        <div class="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div class="lg:col-span-2">
            <header class="mb-8">
              <h1 class="text-[28px] font-semibold tracking-[-0.5px] text-paper">${t("view.metricas.title")}</h1>
              <p class="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">${t("view.metricas.desc")}</p>
            </header>
          </div>
        </div>

        <!-- KPIs reales -->
        <div class="mb-8">
          <div class="mb-4 flex items-center gap-2">
            <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("metricas.kpisReales")}</h2>
            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-muted">API</span>
          </div>
          <div id="metricas-kpis" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="skeleton h-[104px] rounded-[16px]"></div>
            <div class="skeleton h-[104px] rounded-[16px]"></div>
            <div class="skeleton h-[104px] rounded-[16px]"></div>
            <div class="skeleton h-[104px] rounded-[16px]"></div>
          </div>
        </div>

        <!-- Estado del modelo (real) -->
        <div class="mb-8">
          <div class="mb-4 flex items-center gap-2">
            <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("metricas.estadoModelo")}</h2>
            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-muted">${t("metricas.real")}</span>
          </div>
          <div id="metricas-modelo" class="rounded-[16px] bg-coal p-5">
            <div class="skeleton h-40 rounded-[12px]"></div>
          </div>
        </div>

        <!-- Telemetría real (GET /metrics) -->
        <div class="rounded-[16px] bg-coal p-5 md:p-6">
          <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("metricas.teleTitle")}</h2>
                <span class="rounded-full border border-ok/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-ok">${t("metricas.teleBadge")}</span>
              </div>
              <p class="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">${t("metricas.teleNota")}</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <label class="flex cursor-pointer select-none items-center gap-2 text-[12px] font-medium text-muted">
                <input type="checkbox" id="tele-stream" class="tele-toggle">
                <span>${t("metricas.teleStream")}</span>
              </label>
              <div class="flex items-center gap-2">
                <input type="password" id="tele-token" autocomplete="off"
                  placeholder="${t("metricas.tokenPlaceholder")}"
                  class="w-[150px] rounded-[8px] border border-ash bg-void px-2.5 py-1.5 text-[12px] text-paper outline-none
                         transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                         focus:border-volt/60 placeholder:text-muted/50">
                <button type="button" id="tele-clear"
                  class="rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-muted
                         transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                         hover:border-ash hover:bg-dot hover:text-paper">
                  ${t("metricas.teleLimpiar")}
                </button>
              </div>
            </div>
          </div>

          <p id="tele-feedback" class="mb-3 hidden text-[12px] text-warn"></p>

          <!-- KPIs telemetría -->
          <div id="tele-kpis" class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"></div>

          <!-- Charts telemetría -->
          <div class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
            <div class="rounded-[16px] bg-void p-4">
              <p class="mb-3 text-[13px] font-medium text-paper">${t("metricas.teleLatenciaChart")}</p>
              <div class="relative h-[280px] min-w-0 overflow-hidden">
                <canvas id="tele-chart-line"></canvas>
              </div>
            </div>
            <div class="rounded-[16px] bg-void p-4">
              <p class="mb-3 text-[13px] font-medium text-paper">${t("metricas.teleTraficoChart")}</p>
              <div class="relative h-[280px] min-w-0 overflow-hidden">
                <canvas id="tele-chart-donut"></canvas>
              </div>
            </div>
          </div>

          <!-- Logs telemetría -->
          <div>
            <p class="mb-3 text-[13px] font-medium text-paper">${t("metricas.teleLogs")}</p>
            <div id="tele-logs" class="overflow-x-auto">
              <table class="w-full min-w-[560px] border-collapse text-[12px]">
                <thead>
                  <tr class="border-b border-ash text-left text-[11px] uppercase tracking-[0.5px] text-muted">
                    <th class="py-2 pr-3 font-medium">${t("metricas.logHora")}</th>
                    <th class="py-2 pr-3 font-medium">${t("metricas.logId")}</th>
                    <th class="py-2 pr-3 font-medium">${t("metricas.logEndpoint")}</th>
                    <th class="py-2 pr-3 font-medium">${t("metricas.logStatus")}</th>
                    <th class="py-2 font-medium">${t("metricas.logLatencia")}</th>
                  </tr>
                </thead>
                <tbody id="tele-logs-body"></tbody>
              </table>
            </div>
          </div>
        </div>
      </section>`;

    loadReales();
    initTelemetria();
    // Volver a colorear charts si cambia el tema (guard contra listeners duplicados)
    if (!window.__metricasThemeBound) {
      window.__metricasThemeBound = true;
      document.addEventListener("TechMindTheme.change", onThemeChange);
    }
  }

  function onThemeChange() {
    if (!document.getElementById("metricas-kpis")) return; // vista ya no montada
    if (window.Chart) {
      // Re-render de charts con colores nuevos (teleStore conserva el estado)
      buildTeleCharts();
    }
  }

  // ---------- KPIs reales ----------
  async function loadReales() {
    const kpisEl = $("#metricas-kpis");
    const modeloEl = $("#metricas-modelo");
    if (!kpisEl || !modeloEl) return;

    let health = null;
    let estadoRetrain = null;
    let totalContenidos = null;
    try { health = await api.health(); } catch (e) { /* offline */ }
    try { estadoRetrain = await api.estadoModelo(); } catch (e) { /* offline */ }
    try {
      const page = await api.listarContenidos({ pagina: 1, limite: 1 });
      totalContenidos = page && typeof page.total === "number" ? page.total : null;
    } catch (e) { /* offline */ }

    // --- KPI 1: API ---
    const apiOk = health && health.status === "ok";
    const kpiApi = kpiCard(
      t("metricas.kpiApi"),
      apiOk ? t("metricas.valorOk") : t("metricas.valorOffline"),
      apiOk ? "ok" : "err",
      apiOk ? `${t("metricas.slaApi")} v${health.version || "—"}` : t("metricas.sinConexion"),
    );

    // --- KPI 2: Modelos ---
    let modelos = "—";
    let modelosNote = "";
    if (health && health.model_loaded !== undefined) {
      modelos = health.model_loaded ? t("metricas.valorCargado") : t("metricas.valorNoCargado");
      const recarga = health.ultima_recarga || {};
      const parte = Object.entries(recarga)
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
        .join(" · ");
      modelosNote = parte ? `model_loaded_en/es — ${parte}` : t("metricas.sinDetalles");
    }
    const kpiModelos = kpiCard(t("metricas.kpiModelos"), modelos, "volt", modelosNote);

    // --- KPI 3: Embeddings ---
    const embOk = health && health.embeddings === true;
    const kpiEmbeddings = kpiCard(
      t("metricas.kpiEmbeddings"),
      embOk ? t("metricas.valorOk") : t("metricas.valorNoCargado"),
      embOk ? "ok" : "warn",
      embOk ? t("metricas.busquedaSemantica") : t("metricas.busquedaDesactivada"),
    );

    // --- KPI 4: Contenidos ---
    const kpiContenidos = kpiCard(
      t("metricas.kpiContenidos"),
      totalContenidos === null ? "—" : String(totalContenidos).replace(/\B(?=(\d{3})+(?!\d))/g, "."),
      "volt",
      t("metricas.indexados"),
    );

    kpisEl.innerHTML = [kpiApi, kpiModelos, kpiEmbeddings, kpiContenidos].join("");

    // --- Estado del modelo (F1) ---
    if (estadoRetrain && typeof estadoRetrain.f1_vigente === "number") {
      const f1Nuevo = estadoRetrain.f1_nuevo ?? 0;
      const f1Vigente = estadoRetrain.f1_vigente ?? 0;
      const diff = estadoRetrain.f1_diferencia !== undefined ? estadoRetrain.f1_diferencia : f1Nuevo - f1Vigente;
      const estado = estadoRetrain.estado || "idle";
      const verdict = estadoRetrain.veredicto || estadoRetrain.motivo || "";
      const estadoOk = (estadoRetrain.exit_code === 0 && diff >= 0) || estado === "idle";
      const estadoTxt = estadoRetrain.tipo || estado;

      modeloEl.innerHTML = `
        <div class="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <div class="mb-1 flex items-baseline justify-between">
              <span class="text-[12px] font-medium text-muted">${t("metricas.f1Nuevo")}</span>
              <span class="text-[14px] font-semibold text-paper">${(f1Nuevo * 100).toFixed(2)}%</span>
            </div>
            <div class="h-[6px] overflow-hidden rounded-full bg-dot">
              <div class="confianza-bar h-full w-full rounded-full" style="transform:scaleX(${f1Nuevo})"></div>
            </div>
            <div class="mb-4 mt-4 flex items-baseline justify-between">
              <span class="text-[12px] font-medium text-muted">${t("metricas.f1Vigente")}</span>
              <span class="text-[14px] font-semibold text-paper">${(f1Vigente * 100).toFixed(2)}%</span>
            </div>
            <div class="h-[6px] overflow-hidden rounded-full bg-dot">
              <div class="confianza-bar h-full w-full rounded-full" style="transform:scaleX(${f1Vigente})"></div>
            </div>
            <p class="mt-4 text-[12px] text-muted">${t("metricas.f1Diferencia")}: <span class="font-semibold ${diff >= 0 ? "text-ok" : "text-err"}">${diff >= 0 ? "+" : ""}${(diff * 100).toFixed(2)} pp</span></p>
          </div>
          <div class="flex flex-col justify-between rounded-[12px] bg-void p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-[12px] font-medium text-muted">${t("metricas.estado")}</span>
              <span class="rounded-[8px] px-2.5 py-1 text-[12px] font-semibold ${estadoOk ? "bg-ok/10 text-ok" : "bg-err/10 text-err"}">${escapeHtml(estadoTxt.toUpperCase())}</span>
            </div>
            <p class="mt-3 text-[13px] leading-relaxed text-paper">${escapeHtml(verdict || t("metricas.sinVeredicto"))}</p>
          </div>
        </div>`;
    } else {
      modeloEl.innerHTML = `
        <div class="flex items-center gap-3 py-6">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-warn" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p class="text-[13px] text-muted">${t("metricas.sinEstadoModelo")}</p>
        </div>`;
    }
  }

  function kpiCard(title, value, tone, note) {
    const toneClass = {
      ok: "text-ok",
      warn: "text-warn",
      err: "text-err",
      volt: "text-volt",
    }[tone] || "text-volt";
    return `
      <div class="rounded-[16px] bg-coal p-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">${escapeHtml(title)}</p>
        <p class="mt-1.5 text-[26px] font-semibold tracking-[-0.6px] ${toneClass}">${escapeHtml(value)}</p>
        <p class="mt-1 truncate text-[11px] text-muted" title="${escapeHtml(note)}">${escapeHtml(note)}</p>
      </div>`;
  }

  // ---------- Telemetría real (GET /metrics) ----------

  function p95(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, idx)];
  }

  async function fetchTelemetria() {
    try {
      const snap = await api.metricas();
      if (!snap) return;
      teleStore = snap;
      renderTelemetria();
    } catch (e) { /* offline: mantener lo último */ }
  }

  function initTelemetria() {
    const stream = $("#tele-stream");
    const clearBtn = $("#tele-clear");
    const tokenInput = $("#tele-token");
    const feedback = $("#tele-feedback");
    if (!stream || !clearBtn || !tokenInput || !feedback) return;

    stream.addEventListener("change", () => {
      if (stream.checked) {
        telemetriaTimer = setInterval(fetchTelemetria, 2000);
        feedback.classList.add("hidden");
      } else {
        clearTelemetriaTimer();
      }
    });

    clearBtn.addEventListener("click", async () => {
      const token = tokenInput.value.trim();
      feedback.classList.add("hidden");
      if (!token) {
        feedback.textContent = t("metricas.teleTokenRequerido");
        feedback.classList.remove("hidden");
        return;
      }
      try {
        await api.limpiarMetricas(token);
        tokenInput.value = "";
        await fetchTelemetria();
      } catch (e) {
        feedback.textContent = e.message || t("metricas.teleTokenInvalido");
        feedback.classList.remove("hidden");
      }
    });

    // Primer fetch (y re-fetch cada 2s si el toggle está activo desde antes)
    fetchTelemetria();
  }

  function renderTelemetria() {
    renderTelemetriaKpis();
    renderTelemetriaLogs();
    if (window.Chart) buildTeleCharts();
  }

  function renderTelemetriaKpis() {
    const el = $("#tele-kpis");
    if (!el) return;
    const snap = teleStore || {};
    const total = snap.total || 0;
    const p95v = snap.p95_latencia_ms || 0;
    const tasaExito = snap.tasa_exito ?? 0;
    const endpoints = Array.isArray(snap.por_endpoint) ? snap.por_endpoint.length : 0;

    el.innerHTML = [
      kpiCard(t("metricas.telePeticiones"), String(total).replace(/\B(?=(\d{3})+(?!\d))/g, "."), "volt", t("metricas.teleAcumulado")),
      kpiCard(t("metricas.teleLatenciaP95"), `${p95v.toFixed(1)} ms`, "volt", t("metricas.teleP95Nota")),
      kpiCard(t("metricas.teleTasaExito"), `${tasaExito.toFixed(1)}%`, tasaExito >= 99 ? "ok" : "warn", `${t("metricas.teleSla")} ≥ 99%`),
      kpiCard(t("metricas.teleEndpoints"), String(endpoints), "volt", t("metricas.teleEndpointsNota")),
    ].join("");
  }

  function renderTelemetriaLogs() {
    const body = $("#tele-logs-body");
    if (!body) return;
    const snap = teleStore || {};
    const logs = Array.isArray(snap.logs) ? snap.logs : [];
    if (!logs.length) {
      body.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-muted">${t("metricas.teleSinLogs")}</td></tr>`;
      return;
    }
    body.innerHTML = logs.map((d) => {
      const time = new Date(d.timestamp).toTimeString().slice(0, 8);
      const statusTone = d.http_status === 200 ? "text-ok" : d.http_status >= 500 ? "text-err" : "text-warn";
      return `
        <tr class="border-b border-dot last:border-0">
          <td class="py-2 pr-3 font-mono text-muted">${time}</td>
          <td class="py-2 pr-3 font-mono text-muted">${escapeHtml(d.request_id)}</td>
          <td class="py-2 pr-3 font-mono text-paper"><span class="mr-1.5 text-muted/70">${escapeHtml(d.method)}</span>${escapeHtml(d.endpoint)}</td>
          <td class="py-2 pr-3 font-mono font-semibold ${statusTone}">${d.http_status}</td>
          <td class="py-2 font-mono text-paper">${d.latencia_ms.toFixed(2)} ms</td>
        </tr>`;
    }).join("");
  }

  function buildTeleCharts() {
    if (!window.Chart) return;
    const colors = themeColors();
    const gridColor = colors.dot;
    const tickColor = colors.muted;

    const snap = teleStore || {};
    const serie = Array.isArray(snap.serie) ? snap.serie : [];
    const porEndpoint = Array.isArray(snap.por_endpoint) ? snap.por_endpoint : [];

    // --- Línea: latencia por request vs umbral SLA ---
    const lineEl = $("#tele-chart-line");
    if (lineEl) {
      const last = serie.slice(-40);
      const labels = last.map(() => "");

      // Agrupar por endpoint para series de color
      const epNames = [...new Set(last.map((d) => d.endpoint))];
      const epColors = [colors.volt, colors.ok, colors.warn, colors.paper];
      const datasets = epNames.map((name, i) => ({
        label: name,
        data: last.map((d) => (d.endpoint === name ? d.latencia_ms : null)),
        borderColor: epColors[i % epColors.length],
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 2.5,
        pointBackgroundColor: epColors[i % epColors.length],
        tension: 0.3,
        spanGaps: true,
      }));

      const existing = charts.find((c) => c.canvas === lineEl);
      if (existing) existing.destroy();

      const chart = new Chart(lineEl, {
        type: "line",
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: tickColor, boxWidth: 10, font: { family: "Onest", size: 11 } } } },
          scales: {
            x: { display: false },
            y: {
              beginAtZero: false,
              grid: { color: gridColor },
              ticks: { color: tickColor, font: { family: "Onest", size: 11 } },
            },
          },
        },
      });
      charts.push(chart);
    }

    // --- Donut: tráfico por endpoint ---
    const donutEl = $("#tele-chart-donut");
    if (donutEl) {
      const existing = charts.find((c) => c.canvas === donutEl);
      if (existing) existing.destroy();

      const chart = new Chart(donutEl, {
        type: "doughnut",
        data: {
          labels: porEndpoint.map((ep) => `${ep.method} ${ep.endpoint}`),
          datasets: [{
            data: porEndpoint.map((ep) => ep.count),
            backgroundColor: [colors.volt, colors.ok, colors.warn, colors.paper, colors.muted],
            borderColor: colors.void,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: { legend: { position: "bottom", labels: { color: tickColor, boxWidth: 10, font: { family: "Onest", size: 11 } } } },
        },
      });
      charts.push(chart);
    }
  }

  // ---------- Limpieza al re-render ----------
  function teardown() {
    clearTelemetriaTimer();
    destroyCharts();
  }

  // Exponer para shell.js
  window.TechMindViewMetricas = {
    render(root) {
      teardown();
      render(root);
    },
  };
})();