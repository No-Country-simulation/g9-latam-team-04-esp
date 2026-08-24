(function () {
  "use strict";

  const STORAGE_KEY = "techmind-theme";
  const root = document.documentElement;

  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      root.setAttribute("data-theme", savedTheme);
    }
  } catch (error) {
    // Sin acceso a localStorage, se conserva el tema definido en index.html.
  }
})();