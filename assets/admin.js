/* global window, sessionStorage */
/**
 * Admin Panel Logic
 * - Admin/admin123 authentication via sessionStorage
 * - Learning Outcomes CRUD via /.netlify/functions/manage-learning-outcomes
 * - Student Account creation via /.netlify/functions/manage-students
 * All data is fetched live from Oracle database.
 */

(function () {
  "use strict";

  const App = window.App;
  const AUTH_KEY = "ccs3402_admin_authenticated";
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";

  // ============================================================
  // AUTHENTICATION
  // ============================================================

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

  function initAuth() {
    App.$id("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = App.$id("adminUser").value.trim();
      const pass = App.$id("adminPass").value;
      const err = App.$id("loginError");

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        setAuthenticated(true);
        err.classList.add("d-none");
        App.$id("adminPass").value = "";
        await showAdmin();
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
  }

  // ============================================================
  // LEARNING OUTCOMES
  // ============================================================

  function clearLOForm() {
    App.$id("lo_id").value = "";
    App.$id("lo_code").value = "";
    App.$id("domain").value = "Academic";
    App.$id("description").value = "";
  }

  function renderLOTable(state) {
    const filter = App.$id("filter").value.trim().toLowerCase();
    const rows = state.learningOutcomes
      .slice()
      .sort((a, b) => String(a.lo_code).localeCompare(String(b.lo_code)))
      .filter((lo) => {
        if (!filter) return true;
        return (
          String(lo.lo_code).toLowerCase().includes(filter) ||
          String(lo.description).toLowerCase().includes(filter)
        );
      });

    const tbody = App.$id("loTable");
    const empty = App.$id("emptyState");
    empty.classList.toggle("d-none", state.learningOutcomes.length > 0);

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-secondary text-center py-3">${
        state.learningOutcomes.length === 0
          ? "No Learning Outcomes yet. Create your first one above."
          : "No matches."
      }</td></tr>`;
      return;
    }

    tbody.innerHTML = rows
      .map(
        (lo) => `
        <tr>
          <td class="mono">${App.escapeHtml(lo.lo_code)}</td>
          <td>${App.escapeHtml(lo.domain)}</td>
          <td>${App.escapeHtml(lo.description)}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary me-1" data-edit="${App.escapeHtml(lo.lo_id)}" data-testid="lo-edit-btn-${App.escapeHtml(lo.lo_id)}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-del="${App.escapeHtml(lo.lo_id)}" data-testid="lo-delete-btn-${App.escapeHtml(lo.lo_id)}">Delete</button>
          </td>
        </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-edit");
        const state = await App.get();
        const cur = state.learningOutcomes.find((x) => x.lo_id === id);
        if (!cur) return;
        App.$id("lo_id").value = cur.lo_id;
        App.$id("lo_code").value = cur.lo_code;
        App.$id("domain").value = cur.domain;
        App.$id("description").value = cur.description;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del");
        if (!id) return;
        if (!confirm("Delete this learning outcome?")) return;

        try {
          await App.LearningOutcomes.delete(id);
          App.notify("Learning outcome deleted", "success");
          await renderAll();
        } catch (err) {
          App.notify(`Delete failed: ${err.message}`, "danger");
        }
      });
    });
  }

  // ============================================================
  // STUDENT MANAGEMENT
  // ============================================================

  function clearStudentForm() {
    App.$id("stu_full_name").value = "";
    App.$id("stu_matric_no").value = "";
    App.$id("stu_email").value = "";
    App.$id("stu_program_id").value = "";
  }

  function renderStudentProgramDropdown(state) {
    const sel = App.$id("stu_program_id");
    const helpEl = App.$id("studentFormHelp");

    if (state.programs.length === 0) {
      sel.innerHTML = `<option value="">No programs available</option>`;
      sel.disabled = true;
      if (helpEl) {
        helpEl.innerHTML = `<span class="text-danger">No programs exist yet.</span> Please add a Program in <a href="logging.html">Activity Logging</a> first.`;
      }
    } else {
      sel.disabled = false;
      sel.innerHTML =
        `<option value="">Select a program...</option>` +
        state.programs
          .map(
            (p) =>
              `<option value="${App.escapeHtml(p.program_id)}">${App.escapeHtml(p.program_name)} (${App.escapeHtml(p.faculty)})</option>`
          )
          .join("");
      if (helpEl) {
        helpEl.textContent = `${state.programs.length} program(s) available.`;
      }
    }
  }

  function renderStudentTable(state) {
    const tbody = App.$id("studentTable");
    const programById = new Map(state.programs.map((p) => [p.program_id, p]));

    if (state.students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-secondary text-center py-3">No students yet. Create your first account using the form on the left.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.students
      .map((s) => {
        const program = programById.get(s.program_id);
        return `
        <tr>
          <td class="mono">${App.escapeHtml(s.matric_no)}</td>
          <td>${App.escapeHtml(s.full_name)}</td>
          <td class="small text-secondary">${App.escapeHtml(s.email)}</td>
          <td class="small">${App.escapeHtml(program?.program_name ?? "—")}</td>
        </tr>`;
      })
      .join("");
  }

  // ============================================================
  // RENDER ALL
  // ============================================================

  function setCounts(state) {
    App.$id("countLO").textContent = String(state.learningOutcomes.length);
    App.$id("countSkills").textContent = String(state.employabilitySkills.length);
    App.$id("countLOMap").textContent = String(state.loSkillMappings.length);
    App.$id("countStudents").textContent = String(state.students.length);
    App.$id("countPrograms").textContent = String(state.programs.length);
  }

  async function renderAll() {
    try {
      const state = await App.get(true); // force refresh
      setCounts(state);
      renderLOTable(state);
      renderStudentProgramDropdown(state);
      renderStudentTable(state);
    } catch (err) {
      console.error("Failed to render admin panel:", err);
      App.notify("Failed to load data from Oracle database", "danger");
    }
  }

  // ============================================================
  // HANDLERS
  // ============================================================

  function initHandlers() {
    App.$id("clearBtn").addEventListener("click", () => clearLOForm());
    App.$id("studentClearBtn").addEventListener("click", () => clearStudentForm());
    App.$id("filter").addEventListener("input", async () => {
      const state = await App.get();
      renderLOTable(state);
    });

    // Learning Outcome submit
    App.$id("loForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const lo_id = App.$id("lo_id").value || null;
      const payload = {
        lo_code: App.$id("lo_code").value.trim(),
        domain: App.$id("domain").value,
        description: App.$id("description").value.trim()
      };
      if (lo_id) payload.lo_id = lo_id;

      if (!payload.lo_code || !payload.description) {
        App.notify("Please fill in all required fields", "danger");
        return;
      }

      try {
        await App.LearningOutcomes.upsert(payload);
        App.notify(lo_id ? "Learning outcome updated" : "Learning outcome created", "success");
        clearLOForm();
        await renderAll();
      } catch (err) {
        App.notify(`Save failed: ${err.message}`, "danger");
      }
    });

    // Student submit
    App.$id("studentForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        full_name: App.$id("stu_full_name").value.trim(),
        matric_no: App.$id("stu_matric_no").value.trim(),
        email: App.$id("stu_email").value.trim(),
        program_id: App.$id("stu_program_id").value
      };

      if (!payload.full_name || !payload.matric_no || !payload.email || !payload.program_id) {
        App.notify("Please fill in all required fields including program selection", "danger");
        return;
      }

      try {
        await App.Students.create(payload);
        App.notify(`Student "${payload.full_name}" created successfully`, "success");
        clearStudentForm();
        await renderAll();
      } catch (err) {
        App.notify(`Failed to create student: ${err.message}`, "danger");
      }
    });
  }

  // ============================================================
  // INIT
  // ============================================================

  async function init() {
    initAuth();
    initHandlers();

    if (isAuthenticated()) {
      await showAdmin();
    } else {
      showLogin();
    }
  }

  init();
})();
