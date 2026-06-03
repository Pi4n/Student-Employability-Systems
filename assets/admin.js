/* global window, sessionStorage */

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

  function showAdmin() {
    App.$id("loginSection").classList.add("d-none");
    App.$id("adminPanel").classList.remove("d-none");
    renderAll();
  }

  function clearForm() {
    App.$id("lo_id").value = "";
    App.$id("lo_code").value = "";
    App.$id("domain").value = "Academic";
    App.$id("description").value = "";
  }

  function setCounts(state) {
    App.$id("countLO").textContent = String(state.learningOutcomes.length);
    App.$id("countSkills").textContent = String(state.employabilitySkills.length);
    App.$id("countLOMap").textContent = String(state.loSkillMappings.length);
  }

  function renderTable(state) {
    const filter = App.$id("filter").value.trim().toLowerCase();
    const rows = state.learningOutcomes
      .slice()
      .sort((a, b) => String(a.lo_code).localeCompare(String(b.lo_code)))
      .filter((lo) => {
        if (!filter) return true;
        return String(lo.lo_code).toLowerCase().includes(filter) || String(lo.description).toLowerCase().includes(filter);
      });

    const tbody = App.$id("loTable");
    const empty = App.$id("emptyState");
    empty.classList.toggle("d-none", state.learningOutcomes.length > 0);

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-secondary small">No matches.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows
      .map(
        (lo) => `
        <tr>
          <td class="mono fw-semibold">${App.escapeHtml(lo.lo_code)}</td>
          <td><span class="badge ${lo.domain === "Academic" ? "text-bg-primary" : "text-bg-success"}">${App.escapeHtml(lo.domain)}</span></td>
          <td>${App.escapeHtml(lo.description)}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" data-edit="${App.escapeHtml(lo.lo_id)}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-del="${App.escapeHtml(lo.lo_id)}">Delete</button>
          </td>
        </tr>
      `,
      )
      .join("");

    tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit");
        const cur = App.get().learningOutcomes.find((x) => x.lo_id === id);
        if (!cur) return;
        App.$id("lo_id").value = cur.lo_id;
        App.$id("lo_code").value = cur.lo_code;
        App.$id("domain").value = cur.domain;
        App.$id("description").value = cur.description;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        if (!id) return;
        App.set((s) => {
          s.learningOutcomes = s.learningOutcomes.filter((x) => x.lo_id !== id);
          s.loSkillMappings = s.loSkillMappings.filter((m) => m.lo_id !== id);
        });
        renderAll();
      });
    });
  }

  function renderAll() {
    const state = App.get();
    setCounts(state);
    renderTable(state);
  }

  function initAuth() {
    App.$id("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const user = App.$id("adminUser").value.trim();
      const pass = App.$id("adminPass").value;
      const err = App.$id("loginError");

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        setAuthenticated(true);
        err.classList.add("d-none");
        App.$id("adminPass").value = "";
        showAdmin();
      } else {
        err.classList.remove("d-none");
        App.$id("adminPass").value = "";
        App.$id("adminPass").focus();
      }
    });

    App.$id("logoutBtn").addEventListener("click", () => {
      setAuthenticated(false);
      App.$id("adminUser").value = "";
      App.$id("adminPass").value = "";
      App.$id("loginError").classList.add("d-none");
      showLogin();
    });

    if (isAuthenticated()) showAdmin();
    else showLogin();
  }

  function initAdmin() {
    App.$id("seedBtn").addEventListener("click", () => {
      App.seedDemoData();
      renderAll();
    });
    App.$id("resetBtn").addEventListener("click", () => {
      App.resetAllData();
      renderAll();
    });

    App.$id("clearBtn").addEventListener("click", () => clearForm());
    App.$id("filter").addEventListener("input", () => renderAll());

    App.$id("loForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const lo_id = App.$id("lo_id").value || App.uid("lo");
      const lo = {
        lo_id,
        lo_code: App.$id("lo_code").value.trim(),
        domain: App.$id("domain").value,
        description: App.$id("description").value.trim(),
      };
      if (!lo.lo_code || !lo.description) return;

      App.set((s) => {
        const idx = s.learningOutcomes.findIndex((x) => x.lo_id === lo_id);
        if (idx >= 0) s.learningOutcomes[idx] = lo;
        else s.learningOutcomes.push(lo);
      });

      clearForm();
      renderAll();
    });
  }

  function init() {
    App.get();
    initAuth();
    initAdmin();
  }

  init();
})();
