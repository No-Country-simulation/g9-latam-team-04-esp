// TechMind — metricas.js
// Fase 4: vista "Métricas".
// - KPIs REALES: /health (status, modelos, embeddings), /contenidos (total),
//   /modelos/reentrenar/estado (F1 nuevo vs vigente).
// - Telemetría (latencia P95, tráfico por endpoint, logs): réplica del
//   dashboard.py del equipo, EXPLÍCITAMENTE marcada como demo simulada
//   (el backend no expone telemetría de latencia).

(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const t = (key) => window.TechMindI18n.t(key);
  const api = window.TechMindAPI;

  // Refs para limpiar charts/intervalos al re-render
  let charts = [];
  let demoTimer = null;
  let demoStore = [];

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

  function clearDemoTimer() {
    if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
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
    clearDemoTimer();
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

        <!-- Telemetría demo (simulada, marcada) -->
        <div class="rounded-[16px] bg-coal p-5 md:p-6">
          <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("metricas.demoTitle")}</h2>
                <span class="rounded-full border border-warn/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-warn">${t("metricas.demoBadge")}</span>
              </div>
              <p class="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">${t("metricas.demoNota")}</p>
            </div>
            <div class="flex items-center gap-3">
              <label class="flex cursor-pointer select-none items-center gap-2 text-[12px] font-medium text-muted">
                <input type="checkbox" id="demo-stream" class="demo-toggle">
                <span>${t("metricas.demoStream")}</span>
              </label>
              <button type="button" id="demo-clear"
                class="rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-muted
                       transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                       hover:border-ash hover:bg-dot hover:text-paper">
                ${t("metricas.demoLimpiar")}
              </button>
            </div>
          </div>

          <!-- KPIs demo -->
          <div id="demo-kpis" class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"></div>

          <!-- Charts demo -->
          <div class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
            <div class="rounded-[16px] bg-void p-4">
              <p class="mb-3 text-[13px] font-medium text-paper">${t("metricas.demoLatenciaChart")}</p>
              <div class="relative h-[280px] min-w-0 overflow-hidden">
                <canvas id="demo-chart-line"></canvas>
              </div>
            </div>
            <div class="rounded-[16px] bg-void p-4">
              <p class="mb-3 text-[13px] font-medium text-paper">${t("metricas.demoTraficoChart")}</p>
              <div class="relative h-[280px] min-w-0 overflow-hidden">
                <canvas id="demo-chart-donut"></canvas>
              </div>
            </div>
          </div>

          <!-- Logs demo -->
          <div>
            <p class="mb-3 text-[13px] font-medium text-paper">${t("metricas.demoLogs")}</p>
            <div id="demo-logs" class="overflow-x-auto">
              <table class="w-full min-w-[560px] border-collapse text-[12px]">
                <thead>
                  <tr class="border-b border-ash text-left text-[11px] uppercase tracking-[0.5px] text-muted">
                    <th class="py-2 pr-3 font-medium">${t("metricas.logHora")}</th>
                    <th class="py-2 pr-3 font-medium">${t("metricas.logId")}</th>
                    <th class="py-2 pr-3 font-medium">${t("metricas.logEndpoint")}</th>
                    <th class="py-2 pr-3 font-medium">${t("metricas.logStatus")}</th>
                    <th class="py-2 pr-3 font-medium">${t("metricas.logLatencia")}</th>
                    <th class="py-2 font-medium">${t("metricas.logConfianza")}</th>
                  </tr>
                </thead>
                <tbody id="demo-logs-body"></tbody>
              </table>
            </div>
          </div>
        </div>
      </section>`;

    loadReales();
    initDemo();
    // Volver a colorear charts si cambia el tema (guard contra listeners duplicados)
    if (!window.__metricasThemeBound) {
      window.__metricasThemeBound = true;
      document.addEventListener("TechMindTheme.change", onThemeChange);
    }
  }

  function onThemeChange() {
    if (!document.getElementById("metricas-kpis")) return; // vista ya no montada
    if (window.Chart) {
      // Re-render de charts con colores nuevos (demoStore conserva el estado)
      buildDemoCharts();
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
      const page = await api.listarContenidos({ page: 1, page_size: 1 });
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

  // ---------- Demo simulada (dashboard.py) ----------
  const DEMO_ENDPOINTS = [{ name: "/search", w: 0.45, base: 135, spread: 20 }, { name: "/enrich", w: 0.35, base: 165, spread: 25 }, { name: "/recommend", w: 0.20, base: 110, spread: 15 }];

  function rnd(lo, hi) { return lo + Math.random() * (hi - lo); }

  function pickEndpoint() {
    const r = Math.random();
    let acc = 0;
    for (const ep of DEMO_ENDPOINTS) {
      acc += ep.w;
      if (r <= acc) return ep;
    }
    return DEMO_ENDPOINTS[0];
  }

  function generateDemoEntry() {
    const ep = pickEndpoint();
    const statusRoll = Math.random();
    let httpStatus = 200;
    if (statusRoll > 0.97) httpStatus = 500;
    else if (statusRoll > 0.94) httpStatus = 422;
    let latency = Math.max(10, ep.base + rnd(-ep.spread, ep.spread));
    if (httpStatus === 500) latency += rnd(150, 300);
    return {
      request_id: `req_${Math.floor(rnd(100000, 999999))}`,
      timestamp: Date.now(),
      endpoint: ep.name,
      http_status: httpStatus,
      latency_ms: Math.round(latency * 100) / 100,
      ai_confidence: Math.round(rnd(78, 98.5) * 100) / 100,
    };
  }

  function p95(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, idx)];
  }

  function initDemo() {
    // Estado inicial como el dashboard.py: 30 eventos
    demoStore = Array.from({ length: 30 }, generateDemoEntry);
    bootstrapDemo();
  }

  function bootstrapDemo() {
    const stream = $("#demo-stream");
    const clearBtn = $("#demo-clear");
    if (!stream || !clearBtn) return;

    stream.addEventListener("change", () => {
      if (stream.checked) {
        demoTimer = setInterval(() => {
          demoStore.push(generateDemoEntry());
          if (demoStore.length > 100) demoStore.shift();
          renderDemo();
        }, 1000);
      } else {
        clearDemoTimer();
      }
    });

    clearBtn.addEventListener("click", () => {
      demoStore = [generateDemoEntry()];
      renderDemo();
    });

    renderDemo();
  }

  function renderDemo() {
    renderDemoKpis();
    renderDemoLogs();
    if (window.Chart) buildDemoCharts();
  }

  function renderDemoKpis() {
    const el = $("#demo-kpis");
    if (!el) return;
    const latencies = demoStore.map((d) => d.latency_ms);
    const statuses = demoStore.map((d) => d.http_status);
    const confs = demoStore.map((d) => d.ai_confidence);
    const total = demoStore.length;
    const p95v = p95(latencies);
    const success = total ? (statuses.filter((s) => s === 200).length / total) * 100 : 0;
    const avgConf = total ? confs.reduce((a, b) => a + b, 0) / total : 0;

    el.innerHTML = [
      kpiCard(t("metricas.demoPeticiones"), String(total).replace(/\B(?=(\d{3})+(?!\d))/g, "."), "volt", t("metricas.demoAcumulado")),
      kpiCard(t("metricas.demoLatenciaP95"), `${p95v.toFixed(1)} ms`, p95v <= 200 ? "ok" : "err", `${t("metricas.demoObjetivo")} ≤ 200 ms`),
      kpiCard(t("metricas.demoTasaExito"), `${success.toFixed(1)}%`, success >= 99 ? "ok" : "warn", `${t("metricas.demoSla")} ≥ 99%`),
      kpiCard(t("metricas.demoConfianza"), `${avgConf.toFixed(1)}%`, "volt", t("metricas.demoAccEstable")),
    ].join("");
  }

  function renderDemoLogs() {
    const body = $("#demo-logs-body");
    if (!body) return;
    const rows = [...demoStore].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    body.innerHTML = rows.map((d) => {
      const time = new Date(d.timestamp).toTimeString().slice(0, 8);
      const statusTone = d.http_status === 200 ? "text-ok" : d.http_status >= 500 ? "text-err" : "text-warn";
      return `
        <tr class="border-b border-dot last:border-0">
          <td class="py-2 pr-3 font-mono text-muted">${time}</td>
          <td class="py-2 pr-3 font-mono text-muted">${escapeHtml(d.request_id)}</td>
          <td class="py-2 pr-3 font-mono text-paper">${escapeHtml(d.endpoint)}</td>
          <td class="py-2 pr-3 font-mono font-semibold ${statusTone}">${d.http_status}</td>
          <td class="py-2 pr-3 font-mono text-paper">${d.latency_ms.toFixed(2)} ms</td>
          <td class="py-2 font-mono text-paper">${d.ai_confidence.toFixed(2)}%</td>
        </tr>`;
    }).join("");
  }

  function buildDemoCharts() {
    if (!window.Chart) return;
    const colors = themeColors();
    const gridColor = colors.dot;
    const tickColor = colors.muted;

    // --- Línea: latencia vs umbral SLA ---
    const lineEl = $("#demo-chart-line");
    if (lineEl) {
      const last = demoStore.slice(-40);
      const labels = last.map(() => "");
      const datasets = DEMO_ENDPOINTS.map((ep, i) => {
        const series = last.filter((d) => d.endpoint === ep.name).map((d) => d.latency_ms);
        return {
          label: ep.name,
          data: series,
          borderColor: [colors.volt, colors.ok, colors.warn][i % 3],
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 2.5,
          pointBackgroundColor: [colors.volt, colors.ok, colors.warn][i % 3],
          tension: 0.3,
          spanGaps: true,
        };
      });
      // Umbral SLA 200ms
      datasets.push({
        label: t("metricas.demoSlaUmbral"),
        data: Array(last.length).fill(200),
        borderColor: colors.err,
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      });

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
    const donutEl = $("#demo-chart-donut");
    if (donutEl) {
      const counts = DEMO_ENDPOINTS.map((ep) => demoStore.filter((d) => d.endpoint === ep.name).length);
      const existing = charts.find((c) => c.canvas === donutEl);
      if (existing) existing.destroy();

      const chart = new Chart(donutEl, {
        type: "doughnut",
        data: {
          labels: DEMO_ENDPOINTS.map((ep) => ep.name),
          datasets: [{ data: counts, backgroundColor: [colors.volt, colors.ok, colors.warn], borderColor: colors.void, borderWidth: 2 }],
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
    clearDemoTimer();
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