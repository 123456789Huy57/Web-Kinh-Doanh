function bindLanguageToggle() {
  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    toggleLanguage();
    window.location.reload();
  });
}

import { getActiveCart as _gac, setActiveCart as _sac } from "./storage.js";
window.__storageExports = { getActiveCart: _gac, setActiveCart: _sac };

document.addEventListener("DOMContentLoaded", () => {
  void mountSharedLayout();
});

export {
  createHeaderHTML,
  createFooterHTML,
  renderProductCard,
  showToast,
  mountShar