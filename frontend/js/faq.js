// TechMind — faq.js
// Fase 6: vista "API y preguntas frecuentes".
// Guía de consumo de la API para usuarios: base URL, documentación interactiva
// (Swagger/ReDoc), endpoints reales con su método y descripción, ejemplos con
// curl y errores comunes. Todo es estático salvo la base URL (api.base).

(function () {
  "use strict";

  const t = (key) => window.TechMindI18n.t(key);
  const api = window.TechMindAPI;

  // ---------- Datos de la guía ----------
  // Los endpoints y ejemplos son artefactos técnicos: se muestran en inglés.
  const METHODS_STYLE = {
    GET: "border-ok/30 bg-ok/10 text-ok",
    POST: "border-volt/30 bg-volt/10 text-volt",
    PUT: "border-warn/30 bg-warn/10 text-warn",
    PATCH: "border-warn/30 bg-warn/10 text-warn",
    DELETE: "border-err/30 bg-err/10 text-err",
  };

  const ENDPOINTS = [
    { metodo: "GET", ruta: "/health", desc: "faq.ep.health" },
    { metodo: "POST", ruta: "/contenido", desc: "faq.ep.clasificar" },
    { metodo: "POST", ruta: "/contenido/lote-json", desc: "faq.ep.loteJson" },
    { metodo: "POST", ruta: "/contenido/lote-csv", desc: "faq.ep.loteCsv" },
    { metodo: "GET", ruta: "/contenidos", desc: "faq.ep.listar" },
    { metodo: "GET", ruta: "/contenido/{id}", desc: "faq.ep.detalle" },
    { metodo: "PUT", ruta: "/contenido/{id}", desc: "faq.ep.actualizar" },
    { metodo: "DELETE", ruta: "/contenido/{id}", desc: "faq.ep.eliminar" },
    { metodo: "GET", ruta: "/categorias", desc: "faq.ep.categorias" },
    { metodo: "PATCH", ruta: "/contenidos/{id}/clasificacion", desc: "faq.ep.corregir" },
    { metodo: "GET", ruta: "/contenidos/exportar-dataset", desc: "faq.ep.exportar" },
    { metodo: "POST", ruta: "/contenidos/busqueda-semantica", desc: "faq.ep.busqueda" },
    { metodo: "GET", ruta: "/modelos/reentrenar/estado", desc: "faq.ep.estadoModelo" },
    { metodo: "POST", ruta: "/modelos/reentrenar", desc: "faq.ep.reentrenar" },
  ];

  const EJEMPLOS = [
    {
      titulo: "faq.ejemplos.clasificar",
      code: `curl -X POST ${api.base}/contenido \\
  -H "Content-Type: application/json" \\
  -d '{"titulo": "Cómo configurar CORS en Spring Boot",
       "texto": "Guía paso a paso para habilitar CORS en una API REST con Spring Boot...",
       "idioma": "auto"}'`,
    },
    {
      titulo: "faq.ejemplos.listar",
      code: `curl "${api.base}/contenidos?pagina=1&limite=10&q=spring"`,
    },
    {
      titulo: "faq.ejemplos.corregir",
      code: `curl -X PATCH ${api.base}/contenidos/1/clasificacion \\
  -H "Content-Type: application/json" \\
  -d '{"nueva_categoria_id": 3, "usuario": "juan", "motivo": "La categoría correcta es Backend"}'`,
    },
  ];

  // ---------- Helpers ----------
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function methodPill(metodo) {
    const style = METHODS_STYLE[metodo] || METHODS_STYLE.GET;
    return `<span class="inline-flex w-16 justify-center rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${style}">${metodo}</span>`;
  }

  // ---------- Render principal ----------
  function render(root) {
    root.innerHTML = `
      <section>
        <header class="mb-8">
          <h1 class="text-[28px] font-semibold tracking-[-0.5px] text-paper">${t("view.faq.title")}</h1>
          <p class="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">${t("view.faq.desc")}</p>
        </header>

        <!-- Acceso a la API -->
        <div class="mb-6 rounded-[16px] bg-coal p-5 md:p-6 border border-ash/40">
          <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("faq.acceso.titulo")}</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div class="rounded-[12px] border border-ash/30 bg-void p-4">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">${t("faq.acceso.baseLabel")}</p>
              <code class="mt-2 block select-all rounded-[8px] bg-coal px-3 py-2 font-mono text-[13px] text-volt">${escapeHtml(api.base)}</code>
              <p class="mt-2 text-[11px] leading-relaxed text-muted">${t("faq.acceso.baseNota")}</p>
            </div>
            <div class="rounded-[12px] border border-ash/30 bg-void p-4">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">${t("faq.acceso.docs")}</p>
              <p class="mt-2 text-[12px] leading-relaxed text-muted">${t("faq.acceso.docsDesc")}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <a href="${escapeHtml(api.base)}/docs" target="_blank" rel="noopener noreferrer"
                  class="rounded-[8px] bg-volt px-3 py-1.5 text-[12px] font-semibold text-void transition-opacity duration-200 hover:opacity-90">
                  ${t("faq.acceso.swagger")}
                </a>
                <a href="${escapeHtml(api.base)}/redoc" target="_blank" rel="noopener noreferrer"
                  class="rounded-[8px] border border-ash px-3 py-1.5 text-[12px] font-medium text-muted transition-colors duration-200 hover:bg-dot hover:text-paper">
                  ${t("faq.acceso.redoc")}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Endpoints -->
        <div class="mb-6 rounded-[16px] bg-coal p-5 md:p-6 border border-ash/40">
          <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("faq.endpoints.titulo")}</h2>
          <p class="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">${t("faq.endpoints.desc")}</p>
          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr class="border-b border-ash/40 text-[10px] font-bold uppercase tracking-wider text-muted">
                  <th class="pb-2 pr-4">${t("faq.endpoints.metodo")}</th>
                  <th class="pb-2 pr-4">${t("faq.endpoints.ruta")}</th>
                  <th class="pb-2">${t("faq.endpoints.descripcion")}</th>
                </tr>
              </thead>
              <tbody>
                ${ENDPOINTS.map((ep) => `
                  <tr class="border-b border-dot last:border-0">
                    <td class="py-2.5 pr-4">${methodPill(ep.metodo)}</td>
                    <td class="py-2.5 pr-4 font-mono text-[12px] text-paper">${escapeHtml(ep.ruta)}</td>
                    <td class="py-2.5 text-[12px] leading-relaxed text-muted">${t(ep.desc)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ejemplos -->
        <div class="mb-6 rounded-[16px] bg-coal p-5 md:p-6 border border-ash/40">
          <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("faq.ejemplos.titulo")}</h2>
          <p class="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">${t("faq.ejemplos.desc")}</p>
          <div class="mt-4 grid gap-4 lg:grid-cols-3">
            ${EJEMPLOS.map((ej) => `
              <div class="min-w-0 rounded-[12px] border border-ash/30 bg-void p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">${t(ej.titulo)}</p>
                <pre class="mt-3 w-full max-w-full overflow-x-auto rounded-[8px] bg-coal p-3 font-mono text-[11px] leading-relaxed text-paper/90"><code>${escapeHtml(ej.code)}</code></pre>
              </div>`).join("")}
          </div>
        </div>

        <!-- Errores comunes -->
        <div class="mb-6 rounded-[16px] bg-coal p-5 md:p-6 border border-ash/40">
          <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("faq.err.titulo")}</h2>
          <p class="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">${t("faq.err.desc")}</p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="rounded-[12px] border border-ash/30 bg-void p-4">
              <p class="text-[12px] font-bold text-err">${t("faq.err.notFound")}</p>
              <p class="mt-1 text-[12px] leading-relaxed text-muted">${t("faq.err.notFoundDesc")}</p>
            </div>
            <div class="rounded-[12px] border border-ash/30 bg-void p-4">
              <p class="text-[12px] font-bold text-warn">${t("faq.err.validation")}</p>
              <p class="mt-1 text-[12px] leading-relaxed text-muted">${t("faq.err.validationDesc")}</p>
            </div>
            <div class="rounded-[12px] border border-ash/30 bg-void p-4">
              <p class="text-[12px] font-bold text-muted">${t("faq.err.conflict")}</p>
              <p class="mt-1 text-[12px] leading-relaxed text-muted">${t("faq.err.conflictDesc")}</p>
            </div>
            <div class="rounded-[12px] border border-ash/30 bg-void p-4">
              <p class="text-[12px] font-bold text-muted">${t("faq.err.auth")}</p>
              <p class="mt-1 text-[12px] leading-relaxed text-muted">${t("faq.err.authDesc")}</p>
            </div>
          </div>
        </div>

        <!-- Preguntas frecuentes -->
        <div class="rounded-[16px] bg-coal p-5 md:p-6 border border-ash/40">
          <h2 class="text-[15px] font-semibold tracking-[-0.3px] text-paper">${t("faq.faq.titulo")}</h2>
          <div class="mt-4 space-y-2">
            <details class="group rounded-[12px] border border-ash/30 bg-void">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-paper [&::-webkit-details-marker]:hidden">
                ${t("faq.q.auth")}
                <span class="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90">›</span>
              </summary>
              <p class="border-t border-dot px-4 py-3 text-[12px] leading-relaxed text-muted">${t("faq.q.authA")}</p>
            </details>
            <details class="group rounded-[12px] border border-ash/30 bg-void">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-paper [&::-webkit-details-marker]:hidden">
                ${t("faq.q.docs")}
                <span class="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90">›</span>
              </summary>
              <p class="border-t border-dot px-4 py-3 text-[12px] leading-relaxed text-muted">${t("faq.q.docsA")}</p>
            </details>
            <details class="group rounded-[12px] border border-ash/30 bg-void">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-paper [&::-webkit-details-marker]:hidden">
                ${t("faq.q.umbral")}
                <span class="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90">›</span>
              </summary>
              <p class="border-t border-dot px-4 py-3 text-[12px] leading-relaxed text-muted">${t("faq.q.umbralA")}</p>
            </details>
            <details class="group rounded-[12px] border border-ash/30 bg-void">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-paper [&::-webkit-details-marker]:hidden">
                ${t("faq.q.exportar")}
                <span class="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90">›</span>
              </summary>
              <p class="border-t border-dot px-4 py-3 text-[12px] leading-relaxed text-muted">${t("faq.q.exportarA")}</p>
            </details>
            <details class="group rounded-[12px] border border-ash/30 bg-void">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-paper [&::-webkit-details-marker]:hidden">
                ${t("faq.q.correccion")}
                <span class="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90">›</span>
              </summary>
              <p class="border-t border-dot px-4 py-3 text-[12px] leading-relaxed text-muted">${t("faq.q.correccionA")}</p>
            </details>
          </div>
        </div>
      </section>`;
  }

  // ---------- Exponer para shell.js ----------
  window.TechMindViewFaq = { render };
})();
