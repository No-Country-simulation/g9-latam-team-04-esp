// TechMind — api.js
// Wrapper para la API FastAPI. Por defecto usa el MISMO origen (el backend sirve
// frontend + API juntos, local y en OCI). Si el frontend se sirve desde otro
// origen, sobreescribir con `window.TECHMIND_API_BASE` antes de cargar este script.

(function () {
  "use strict";

  const BASE = window.TECHMIND_API_BASE || "";

  // Convierte el detail de un error FastAPI en un mensaje legible.
  // FastAPI devuelve arrays de errores pydantic: [{ loc: ["body","titulo"], msg: "Value error, ...", ... }]
  function humanizeError(detail) {
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((e) => {
          const campo =
            Array.isArray(e.loc) && e.loc.length > 1 ? e.loc.slice(1).join(".") : "";
          let msg = String(e.msg || "");
          // Pydantic antepone "Value error, " a los mensajes de validación personalizados.
          msg = msg.replace(/^Value error,\s*/i, "");
          return campo ? `${campo}: ${msg}` : msg;
        })
        .filter(Boolean);
      if (msgs.length) return msgs.join(" · ");
    }
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  }

  async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });

    let body = null;
    const text = await res.text();
    if (text) {
      try { body = JSON.parse(text); } catch (_) { body = text; }
    }

    if (!res.ok) {
      const detail =
        body && (body.detail || body.message || body.error) || `HTTP ${res.status}`;
      throw new Error(humanizeError(detail));
    }
    return body;
  }

  const api = {
    base: BASE,

    // Contenido
    clasificar: (payload) => request("/contenido", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    clasificarLoteJson: (payload) =>
      request("/contenido/lote-json", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    clasificarLoteCsv: (file) => {
      // multipart/form-data: NO usar request() (fuerza application/json).
      const fd = new FormData();
      fd.append("archivo", file);
      return fetch(`${BASE}/contenido/lote-csv`, { method: "POST", body: fd }).then(
        async (res) => {
          let body = null;
          const text = await res.text();
          if (text) {
            try { body = JSON.parse(text); } catch (_) { body = text; }
          }
          if (!res.ok) {
            const detail =
              body && (body.detail || body.message || body.error) || `HTTP ${res.status}`;
            throw new Error(humanizeError(detail));
          }
          return body;
        }
      );
    },
    listarContenidos: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/contenidos${qs ? `?${qs}` : ""}`);
    },
    detalle: (id) => request(`/contenido/${id}`),
    actualizarContenido: (id, payload) =>
      request(`/contenido/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    eliminarContenido: (id) =>
      request(`/contenido/${id}`, {
        method: "DELETE",
      }),
    categorias: () => request("/categorias"),
    corregirClasificacion: (id, payload) =>
      request(`/contenidos/${id}/clasificacion`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    busquedaSemantica: (payload) =>
      request("/contenidos/busqueda-semantica", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    // Sistema
    health: () => request("/health"),
    estadoModelo: () => request("/modelos/reentrenar/estado"),
    reentrenar: (token) =>
      request("/modelos/reentrenar", {
        method: "POST",
        headers: { "X-Admin-Token": token },
      }),

    // Métricas (telemetría real en memoria)
    metricas: () => request("/metrics"),
    limpiarMetricas: (token) =>
      request("/metrics", {
        method: "DELETE",
        headers: { "X-Admin-Token": token },
      }),

    // Export de dataset (GET /contenidos/exportar-dataset)
    // params: { idioma, solo_verificados, formato, guardar }
    exportarDatasetUrl: (params = {}) => {
      const qs = new URLSearchParams({
        idioma: params.idioma || "todos",
        solo_verificados: String(params.solo_verificados ?? true),
        formato: params.formato || "csv",
        guardar: String(params.guardar === true),
      }).toString();
      return `${BASE}/contenidos/exportar-dataset?${qs}`;
    },
    exportarDatasetJson: (params = {}) => {
      const qs = new URLSearchParams({
        idioma: params.idioma || "todos",
        solo_verificados: String(params.solo_verificados ?? true),
        formato: "json",
        guardar: "false",
      }).toString();
      return request(`/contenidos/exportar-dataset?${qs}`);
    },
    guardarDataset: (params = {}) => {
      const qs = new URLSearchParams({
        idioma: params.idioma || "todos",
        solo_verificados: String(params.solo_verificados ?? true),
        formato: params.formato || "csv",
        guardar: "true",
      }).toString();
      return request(`/contenidos/exportar-dataset?${qs}`);
    },
  };

  window.TechMindAPI = api;
})();