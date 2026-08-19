// TechMind — theme.js
// Modo claro/oscuro con persistencia (localStorage) y el efecto de
// transición "circle-blur-top-left" de https://github.com/rudrodip/theme-toggle-effect
// Dispara document.startViewTransition si el navegador lo soporta.

(function () {
  "use strict";

  const STORAGE_KEY = "techmind-theme";
  const root = document.documentElement;
  const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- Estado inicial ----------
  // El HTML ya aplicó data-theme="light" temprano si había preferencia guardada.
  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  // ---------- Aplicar tema ----------
  function applyTheme(next) {
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) { /* modo incógnito o sin storage: no persiste */ }
    syncIcons();
    document.dispatchEvent(new CustomEvent("TechMindTheme.change", { detail: { theme: next } }));
  }

  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    if (mediaReduced.matches || !document.startViewTransition) {
      applyTheme(next);
      return;
    }
    // Efecto del repo: la súper-nueva capa "barre" el cambio con la máscara
    // circular (CSS en app.css). La app real se actualiza dentro del callback.
    document.startViewTransition(() => applyTheme(next));
  }

  // ---------- Iconos del botón: sol (dark) / luna (light) ----------
  function syncIcons() {
    const light = currentTheme() === "light";
    const sun = document.getElementById("icon-sun");
    const moon = document.getElementById("icon-moon");
    if (sun) sun.classList.toggle("hidden", light);
    if (moon) moon.classList.toggle("hidden", !light);
    const btn = document.getElementById("btn-theme");
    if (btn) {
      btn.setAttribute("aria-label", light ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
    }
  }

  // ---------- Init ----------
  function init() {
    const btn = document.getElementById("btn-theme");
    if (btn) btn.addEventListener("click", toggleTheme);
    syncIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();