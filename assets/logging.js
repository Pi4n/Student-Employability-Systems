/* global window, fetch */

(async function () {
  "use strict";

  const App = window.App;
  if (!App) return;

  function option(label, value) {
    return `<option value="${App.escapeHtml(value)}">${App.escapeHtml(label)}</option>`;
  }

  async function syncAndRenderUI() {
    const state = await App.get();

    // 1. Update UI panel metrics counter indicators
    if (App.$id("countCourses")) App.$id("countCourses").textContent = String(state.courses?.length || 0);
    if (App.$id("countSkills")) App.$id("countSkills").textContent = String(state.employabilitySkills?.length || 0);
    if (App.$id("countStudents")) App.$id("countStudents").textContent = String(state.students?.length || 0);

    // 2. Populate relational dropdown options based on your original logging.html configuration
    const programSel = App.$id("programSelect");
    if (programSel && state.programs) {
      programSel.innerHTML = state.programs.map((p) => option(p.program_name, p.program_id)).join("");
    }

    const enrStudent = App.$id("enr_student");
    const ccStudent = App.$id("cc_student");
    if (state.students && state.students.length > 0) {
      const studentOptions = state.students.map((s) => option(`${s.full_name} (${s.matric_no})`, s.student_id)).join("");
      if (enrStudent) enrStudent.innerHTML = studentOptions;
      if (ccStudent) ccStudent.innerHTML = studentOptions;
      if (App.$id("emptyState")) App.$id("emptyState").classList.add("d-none");
    } else {
      if (App.$id("emptyState")) App.$id("emptyState").classList.remove("d-none");
    }

    const enrCourse = App.$id("enr_course");
    if (enrCourse && state.courses) {
      enrCourse.innerHTML = state.courses.map((c) => option(`${c.course_code} — ${c.course_name}`, c.course_id)).join("");
    }

    // 3. Render the core Student Enrollment Data log matrix table output
    const enrTbody = App.$id("enrTable");
    if (enrTbody) {
      if (!state.enrollments || state.enrollments.length === 0) {
        enrTbody.innerHTML = `<tr><td colspan="6" class="text-secondary small">No transactional logs saved in your live Oracle tables.</td></tr>`;
      } else {
        const studentMap = new Map(state.students.map(s => [s.student_id, s]));
        const courseMap = new Map(state.courses.map(c => [c.course_id, c]));

        enrTbody.innerHTML = state.enrollments.map((e) => {
          const stu = studentMap.get(e.student_id);
          const crs = courseMap.get(e.course_id);
          return `
            <tr>
              <td>${App.escapeHtml(stu?.matric_no || "—")}</td>
              <td>${App.escapeHtml(crs?.course_code || "—")}</td>
              <td class="mono">${App.escapeHtml(e.semester || "—")}</td>
              <td><span class="badge bg-opacity-10 text-info">${App.escapeHtml(e.status || "—")}</span></td>
              <td class="mono fw-bold">${App.escapeHtml(e.grade || "—")}</td>
              <td class="text-end text-muted small">[Live Transaction]</td>
            </tr>`;
        }).join("");
      }
    }
  }

  // Bind execution interceptor directly to the core student input form
  const enrollmentForm = App.$id("enrollmentForm");
  if (enrollmentForm) {
    enrollmentForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const payload = {
        student_id: App.$id("enr_student").value,
        course_id: App.$id("enr_course").value,
        semester: App.$id("enr_semester").value.trim(),
        status: App.$id("enr_status").value,
        grade: App.$id("enr_grade").value
      };

      if (!payload.student_id || !payload.course_id || !payload.semester) return;

      try {
        const res = await fetch("/.netlify/functions/manage-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          enrollmentForm.reset();
          await syncAndRenderUI();
        } else {
          alert("Could not append row transaction to database schema. Verify data values.");
        }
      } catch (err) {
        console.error("Transmission error:", err);
      }
    });
  }

  // Load configuration on entry
  await syncAndRenderUI();
})();
