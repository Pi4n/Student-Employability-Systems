/* global window */

(function () {
  "use strict";

  const App = window.App;

  function option(label, value) {
    return `<option value="${App.escapeHtml(value)}">${App.escapeHtml(label)}</option>`;
  }

  function setCounts(state) {
    App.$id("countCourses").textContent = String(state.courses.length);
    App.$id("countActivities").textContent = String(state.coCurriculum.length);
    App.$id("countSkills").textContent = String(state.employabilitySkills.length);
    App.$id("countStudents").textContent = String(state.students.length);
  }

  function renderSelects(state) {
    const programSel = App.$id("programSelect");
    programSel.innerHTML = state.programs.map((p) => option(`${p.program_name}`, p.program_id)).join("");

    const cocSel = App.$id("map_cocurr");
    cocSel.innerHTML = state.coCurriculum.map((a) => option(`${a.activity_name}`, a.cocurr_id)).join("");

    const skillSel = App.$id("map_skill");
    skillSel.innerHTML = state.employabilitySkills.map((s) => option(`${s.skill_name}`, s.skill_id)).join("");

    const enrStudent = App.$id("enr_student");
    const ccStudent = App.$id("cc_student");
    const studentOptions = state.students.map((s) => option(`${s.full_name} (${s.matric_no})`, s.student_id)).join("");
    enrStudent.innerHTML = studentOptions;
    ccStudent.innerHTML = studentOptions;

    const enrCourse = App.$id("enr_course");
    enrCourse.innerHTML = state.courses.map((c) => option(`${c.course_code} — ${c.course_name}`, c.course_id)).join("");

    const ccAct = App.$id("cc_activity");
    ccAct.innerHTML = state.coCurriculum.map((a) => option(`${a.activity_name} (${a.category})`, a.cocurr_id)).join("");
  }

  function renderCcMappings(state) {
    const tbody = App.$id("ccMapTable");
    const skillById = new Map(state.employabilitySkills.map((s) => [s.skill_id, s]));
    const actById = new Map(state.coCurriculum.map((a) => [a.cocurr_id, a]));

    if (state.coCurrSkillMappings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-secondary small">No mappings yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.coCurrSkillMappings
      .map((m) => {
        const act = actById.get(m.cocurr_id);
        const sk = skillById.get(m.skill_id);
        return `
          <tr>
            <td>${App.escapeHtml(act?.activity_name ?? "—")}</td>
            <td>${App.escapeHtml(sk?.skill_name ?? "—")}</td>
            <td class="text-secondary small">${App.escapeHtml(m.knowledge_type ?? "—")}</td>
            <td class="text-end mono">${Number(m.mapping_strength ?? 0).toFixed(2)}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-danger" data-del-ccmap="${App.escapeHtml(m.mapping_id)}">Delete</button>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("[data-del-ccmap]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del-ccmap");
        if (!id) return;
        App.removeById("coCurrSkillMappings", "mapping_id", id);
        renderAll();
      });
    });
  }

  function renderStudentTables(state) {
    const studentById = new Map(state.students.map((s) => [s.student_id, s]));
    const courseById = new Map(state.courses.map((c) => [c.course_id, c]));
    const actById = new Map(state.coCurriculum.map((a) => [a.cocurr_id, a]));

    const enrTbody = App.$id("enrTable");
    const ccTbody = App.$id("ccTable");

    enrTbody.innerHTML =
      state.enrollments.length === 0
        ? `<tr><td colspan="6" class="text-secondary small">No enrollments logged.</td></tr>`
        : state.enrollments
            .map((e) => {
              const stu = studentById.get(e.student_id);
              const crs = courseById.get(e.course_id);
              return `
                <tr>
                  <td>${App.escapeHtml(stu?.matric_no ?? "—")}</td>
                  <td>${App.escapeHtml(crs?.course_code ?? "—")}</td>
                  <td class="mono">${App.escapeHtml(e.semester ?? "")}</td>
                  <td>${App.escapeHtml(e.status ?? "")}</td>
                  <td class="mono">${App.escapeHtml(e.grade ?? "")}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" data-del-enr="${App.escapeHtml(e.enrollment_id)}">Delete</button>
                  </td>
                </tr>
              `;
            })
            .join("");

    ccTbody.innerHTML =
      state.studentCoCurriculum.length === 0
        ? `<tr><td colspan="6" class="text-secondary small">No co-curricular participation logged.</td></tr>`
        : state.studentCoCurriculum
            .map((r) => {
              const stu = studentById.get(r.student_id);
              const act = actById.get(r.cocurr_id);
              return `
                <tr>
                  <td>${App.escapeHtml(stu?.matric_no ?? "—")}</td>
                  <td>${App.escapeHtml(act?.activity_name ?? "—")}</td>
                  <td class="mono">${App.escapeHtml(r.semester ?? "")}</td>
                  <td>${App.escapeHtml(r.role ?? "")}</td>
                  <td class="text-end mono">${Number(r.achievement ?? 0).toFixed(2)}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" data-del-cc="${App.escapeHtml(r.record_id)}">Delete</button>
                  </td>
                </tr>
              `;
            })
            .join("");

    enrTbody.querySelectorAll("[data-del-enr]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del-enr");
        if (!id) return;
        App.removeById("enrollments", "enrollment_id", id);
        renderAll();
      });
    });
    ccTbody.querySelectorAll("[data-del-cc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del-cc");
        if (!id) return;
        App.removeById("studentCoCurriculum", "record_id", id);
        renderAll();
      });
    });
  }

  function clearCourseForm() {
    ["course_id", "course_code", "course_name"].forEach((id) => (App.$id(id).value = ""));
    App.$id("course_type").value = "Core";
    App.$id("credit_hours").value = "3";
  }

  function clearActivityForm() {
    ["cocurr_id", "activity_name", "organizer", "category"].forEach((id) => (App.$id(id).value = ""));
    App.$id("is_credit_bearing").value = "false";
    App.$id("activity_credit_hours").value = "0";
  }

  function clearEnrollmentForm() {
    App.$id("enr_semester").value = "";
    App.$id("enr_status").value = "In Progress";
    App.$id("enr_grade").value = "A";
  }

  function clearParticipationForm() {
    App.$id("cc_semester").value = "";
    App.$id("cc_role").value = "";
    App.$id("cc_achievement").value = "0.7";
  }

  function renderAll() {
    const state = App.get();
    const empty = App.$id("emptyState");

    const ok = state.programs.length > 0 && state.students.length > 0 && state.employabilitySkills.length > 0;
    empty.classList.toggle("d-none", ok);

    setCounts(state);
    renderSelects(state);
    renderCcMappings(state);
    renderStudentTables(state);
  }

  function initHandlers() {
    App.$id("seedBtn").addEventListener("click", () => {
      App.seedDemoData();
      renderAll();
    });
    App.$id("resetBtn").addEventListener("click", () => {
      App.resetAllData();
      renderAll();
    });

    App.$id("courseClearBtn").addEventListener("click", () => clearCourseForm());
    App.$id("activityClearBtn").addEventListener("click", () => clearActivityForm());
    App.$id("enrClearBtn").addEventListener("click", () => clearEnrollmentForm());
    App.$id("ccClearBtn").addEventListener("click", () => clearParticipationForm());

    App.$id("courseForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const state = App.get();

      const program_id = App.$id("programSelect").value;
      const course_id = App.$id("course_id").value || App.uid("crs");
      const course = {
        course_id,
        course_code: App.$id("course_code").value.trim(),
        course_name: App.$id("course_name").value.trim(),
        course_type: App.$id("course_type").value,
        credit_hours: Number(App.$id("credit_hours").value),
        program_id,
      };

      if (!course.course_code || !course.course_name || !program_id || state.programs.length === 0) return;
      App.upsert("courses", course, "course_id");
      clearCourseForm();
      renderAll();
    });

    App.$id("activityForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const cocurr_id = App.$id("cocurr_id").value || App.uid("cc");
      const activity = {
        cocurr_id,
        activity_name: App.$id("activity_name").value.trim(),
        organizer: App.$id("organizer").value.trim(),
        category: App.$id("category").value.trim(),
        is_credit_bearing: App.$id("is_credit_bearing").value === "true",
        credit_hours: Number(App.$id("activity_credit_hours").value),
      };
      if (!activity.activity_name || !activity.organizer || !activity.category) return;
      App.upsert("coCurriculum", activity, "cocurr_id");
      clearActivityForm();
      renderAll();
    });

    App.$id("ccSkillMapForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const mapping = {
        mapping_id: App.uid("ccmap"),
        cocurr_id: App.$id("map_cocurr").value,
        skill_id: App.$id("map_skill").value,
        knowledge_type: App.$id("map_knowledge").value,
        mapping_strength: Number(App.$id("map_strength").value),
      };
      if (!mapping.cocurr_id || !mapping.skill_id) return;
      if (Number.isNaN(mapping.mapping_strength)) return;
      App.set((s) => {
        const exists = s.coCurrSkillMappings.some((m) => m.cocurr_id === mapping.cocurr_id && m.skill_id === mapping.skill_id);
        if (!exists) s.coCurrSkillMappings.push(mapping);
      });
      renderAll();
    });

    App.$id("enrollmentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const enrollment = {
        enrollment_id: App.uid("enr"),
        student_id: App.$id("enr_student").value,
        course_id: App.$id("enr_course").value,
        semester: App.$id("enr_semester").value.trim(),
        status: App.$id("enr_status").value,
        grade: App.$id("enr_grade").value,
      };
      if (!enrollment.student_id || !enrollment.course_id || !enrollment.semester) return;
      App.set((s) => s.enrollments.push(enrollment));
      clearEnrollmentForm();
      renderAll();
    });

    App.$id("participationForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const record = {
        record_id: App.uid("scc"),
        student_id: App.$id("cc_student").value,
        cocurr_id: App.$id("cc_activity").value,
        semester: App.$id("cc_semester").value.trim(),
        role: App.$id("cc_role").value.trim(),
        achievement: Number(App.$id("cc_achievement").value),
      };
      if (!record.student_id || !record.cocurr_id || !record.semester || !record.role) return;
      if (Number.isNaN(record.achievement)) return;
      App.set((s) => s.studentCoCurriculum.push(record));
      clearParticipationForm();
      renderAll();
    });
  }

  function init() {
    App.get();
    initHandlers();
    renderAll();
  }

  init();
})();

