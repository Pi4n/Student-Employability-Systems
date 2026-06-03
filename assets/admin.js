/* global window, sessionStorage, fetch */

(function () {
  "use strict";

  const App = window.App;
  const AUTH_KEY = "ccs3402_admin_authenticated";
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";

  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === "true";
  }

  function setAuthenticated(value) {
    if (value) sessionStorage.setItem(AUTH_KEY, "true");
    else sessionStorage.removeItem(AUTH_KEY);
  }

  function showLogin() {
    App.$id("loginSection").classList.remove("d-none");
    App.$id("adminPanel").classList.add("d-none");
  }

  async function showAdmin() {
    App.$id("loginSection").classList.add("d-none");
    App.$id("adminPanel").classList.remove("d-none");
    await renderAll();
  }

  async function renderAll() {
    const state = await App.get();
    
    // Update structural row count metrics
    if (App.$id("countLO")) App.$id("countLO").textContent = String(state.learningOutcomes?.length || 0);
    if (App.$id("countSkills")) App.$id("countSkills").textContent = String(state.employabilitySkills?.length || 0);

    const tbody = App.$id("loTable");
    const empty = App.$id("emptyState");

    if (!state.learningOutcomes || state.learningOutcomes.length === 0) {
      if (empty) empty.classList.remove("d-none");
      if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-secondary small">No records saved inside live schema.</td></tr>`;
      return;
    }

    if (empty) empty.classList.add("d-none");
    if (tbody) {
      tbody.innerHTML = state.learningOutcomes
        .map(
          (lo) => `
          <tr>
            <td class="mono fw-semibold">${App.escapeHtml(lo.lo_code)}</td>
            <td><span class="badge text-bg-primary">${App.escapeHtml(lo.domain)}</span></td>
            <td>${App.escapeHtml(lo.description)}</td>
            <td class="text-end text-muted small">[Live Synced Row]</td>
          </tr>`
        )
        .join("");
    }
  }

  // Handle administrator login gate actions
  const loginForm = App.$id("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const user = App.$id("adminUser").value;
      const pass = App.$id("adminPass").value;

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        setAuthenticated(true);
        App.$id("loginError").classList.add("d-none");
        showAdmin();
      } else {
        App.$id("loginError").classList.remove("d-none");
      }
    });
  }

  const logoutBtn = App.$id("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      setAuthenticated(false);
      App.$id("adminUser").value = "";
      App.$id("adminPass").value = "";
      showLogin();
    });
  }

  // Initialize view state
  if (isAuthenticated()) {
    showAdmin();
  } else {
    showLogin();
  }
})();
