/* global window, fetch */

(async function () {
  "use strict";

  const App = window.App;
  if (!App) return;

  function option(label, value) {
    return `<option value="${App.escapeHtml(value)}">${App.escapeHtml(label)}</option>`;
  }

  async function syncAndRenderUI() {
    // Pull fresh runtime data state payload from backend
    const state = await App.get();

    // 1. Render data metric badges
    if (App.$id("countCourses")) App.$id("countCourses").textContent = String(state.courses?.length || 0);
    if (App.$id("countActivities")) App.$id("countActivities").textContent = String(state.coCurriculum?.length || 0);
    if (App.$id("countStudents")) App.$id("countStudents").textContent = String(state.students?.length || 0);

    // 2. Map select fields options securely
    const progSel = App.$id("programSelect");
    if (progSel && state.programs) {
      progSel.innerHTML = state.programs.map(p => option(p.program_name, p.program_id)).join("");
    }

    const enrStudent = App.$id("enr_student");
    if (enrStudent && state.students) {
      enrStudent.innerHTML = state.students.map(s => option(`${s.full_name} (${s.matric_no})`, s.student_id)).join("");
    }

    const enrCourse = App.$id("enr_course");
    if (enrCourse && state.courses) {
      enrCourse.innerHTML = state.courses.map(c => option(`${c.course_code} — ${c.course_name}`, c.course_id)).join("");
    }

    // 3. Render live enrollment log list rows
    const enrTbody = App.$id("enrTable");
    if (enrTbody) {
      if (!state.enrollments || state.enrollments.length === 0) {
        enrTbody.innerHTML = `<tr><td colspan="5" class="text-secondary small text-center">No live database logs located.</td></tr>`;
      } else {
        const studentMap = new Map(state.students.map(s => [s.student_id, s]));
        const courseMap = new Map(state.courses.map(c => [c.course_id, c]));

        enrTbody.innerHTML = state.enrollments.map((e) => {
          const stu = studentMap.get(e.student_id);
          const crs = courseMap.get(e.course_id);
          return `
            <tr>
              <td>${App.escapeHtml(stu?.matric_no || "ID: " + e.student_id)}</td>
              <td>${App.escapeHtml(crs?.course_code || "ID: " + e.course_id)}</td>
              <td>${App.escapeHtml(e.semester)}</td>
              <td><span class="badge text-bg-info">${App.escapeHtml(e.status)}</span></td>
              <td class="mono fw-bold">${App.escapeHtml(e.grade)}</td>
            </tr>`;
        }).join("");
      }
    }
  }

  // Intercept creating brand new students
  const studentForm = App.$id("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const payload = {
        full_name: App.$id("stu_name").value.trim(),
        matric_no: App.$id("stu_matric").value.trim(),
        email: App.$id("stu_email").value.trim()
      };

      try {
        const res = await fetch("/.netlify/functions/manage-students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          studentForm.reset();
          await syncAndRenderUI();
        }
      } catch (err) { console.error(err); }
    });
  }

  // Intercept creating programs
  const programForm = App.$id("programForm");
  if (programForm) {
    programForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      try {
        const res = await fetch("/.netlify/functions/manage-programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ program_name: App.$id("prog_name").value.trim() })
        });
        if (res.ok) {
          programForm.reset();
          await syncAndRenderUI();
        }
      } catch (err) { console.error(err); }
    });
  }

  // Intercept creating courses
  const courseForm = App.$id("courseForm");
  if (courseForm) {
    courseForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const payload = {
        course_code: App.$id("course_code").value.trim(),
        course_name: App.$id("course_name").value.trim(),
        course_type: App.$id("course_type").value,
        credit_hours: Number(App.$id("credit_hours").value),
        program_id: App.$id("programSelect").value
      };

      try {
        const res = await fetch("/.netlify/functions/manage-courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          courseForm.reset();
          await syncAndRenderUI();
        }
      } catch (err) { console.error(err); }
    });
  }

  // Intercept committing enrollments
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

      try {
        const res = await fetch("/.netlify/functions/manage-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          enrollmentForm.reset();
          await syncAndRenderUI();
        }
      } catch (err) { console.error(err); }
    });
  }

  // Run initial data load
  await syncAndRenderUI();
})();
