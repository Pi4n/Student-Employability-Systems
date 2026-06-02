/* global window, document, fetch */

(async function () {
  "use strict";

  const App = window.App;

  async function populateInteractiveSelections() {
    const state = await App.get();

    const studentBox = App.$id("enr_student");
    if (studentBox && state.students) {
      studentBox.innerHTML = state.students.map(s => `<option value="${s.student_id}">${s.full_name} (${s.matric_no})</option>`).join("");
    }

    const courseBox = App.$id("enr_course");
    if (courseBox && state.courses) {
      courseBox.innerHTML = state.courses.map(c => `<option value="${c.course_id}">${c.course_code} — ${c.course_name}</option>`).join("");
    }
  }

  const enrollmentForm = App.$id("enrollmentForm");
  if (enrollmentForm) {
    enrollmentForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const info = App.$id("logStatus");
      info.className = "small mt-2 text-warning";
      info.textContent = "Streaming log transaction directly into tracking index...";

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
          info.className = "small mt-2 text-success";
          info.textContent = "Enrollment ledger verified and saved cleanly!";
          enrollmentForm.reset();
        }
      } catch {
        info.className = "small mt-2 text-danger";
        info.textContent = "API transmission dropped during serialization routing.";
      }
    });
  }

  await populateInteractiveSelections();
})();
