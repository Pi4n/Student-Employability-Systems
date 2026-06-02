/* global window, document, fetch */

(async function () {
  "use strict";

  const App = window.App;
  
  async function reloadActiveSelections() {
    const state = await App.get();
    const selector = App.$id("stu_program_id");
    if (selector && state.programs) {
      selector.innerHTML = state.programs.map(p => `<option value="${p.program_id}">${p.program_name}</option>`).join("");
    }
  }

  const studentForm = App.$id("liveStudentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const status = App.$id("adminStatus");
      status.className = "small mt-2 text-warning";
      status.textContent = "Injecting transaction parameters into database pipeline...";

      const payload = {
        full_name: App.$id("stu_name").value,
        matric_no: App.$id("stu_matric").value,
        email: App.$id("stu_email").value,
        program_id: Number(App.$id("stu_program_id").value)
      };

      try {
        const res = await fetch("/.netlify/functions/manage-students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          status.className = "small mt-2 text-success";
          status.textContent = "Student successfully saved directly into Oracle relational memory.";
          studentForm.reset();
          await reloadActiveSelections();
        } else {
          status.className = "small mt-2 text-danger";
          status.textContent = "SQL Execution Exception: Check table parameter constraints.";
        }
      } catch {
        status.className = "small mt-2 text-danger";
        status.textContent = "Network error communicating with the pipeline API layer.";
      }
    });
  }

  const programForm = App.$id("liveProgramForm");
  if (programForm) {
    programForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const status = App.$id("adminStatus");
      status.className = "small mt-2 text-warning";
      status.textContent = "Registering new educational path structure...";

      const payload = {
        program_name: App.$id("prog_name").value,
        faculty: App.$id("prog_faculty").value,
        total_credits: App.$id("prog_credits").value
      };

      try {
        const res = await fetch("/.netlify/functions/manage-programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          status.className = "small mt-2 text-success";
          status.textContent = "Program written natively to database records.";
          programForm.reset();
          await reloadActiveSelections();
        }
      } catch {
        status.className = "small mt-2 text-danger";
        status.textContent = "Server response error during configuration sync.";
      }
    });
  }

  await reloadActiveSelections();
})();
