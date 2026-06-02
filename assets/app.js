/* global window, localStorage */

(function () {
  "use strict";

  const KEY = "ccs3402_marketability_v1";

  /** @returns {string} */
  function uid(prefix) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  /** @template T @param {T} v @returns {T} */
  function deepCopy(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function loadState() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveState(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function emptyState() {
    return {
      meta: { version: 1, createdAt: new Date().toISOString() },
      programs: [],
      courses: [],
      students: [],
      learningOutcomes: [],
      employabilitySkills: [],
      loSkillMappings: [],
      coCurriculum: [],
      coCurrSkillMappings: [],
      enrollments: [],
      studentCoCurriculum: [],
    };
  }

  function ensureState() {
    const current = loadState();
    if (current) return current;
    const fresh = emptyState();
    saveState(fresh);
    return fresh;
  }

  function resetAllData() {
    localStorage.removeItem(KEY);
    ensureState();
  }

  function get() {
    return deepCopy(ensureState());
  }

  function set(mutator) {
    const s = ensureState();
    mutator(s);
    saveState(s);
  }

  function upsert(collectionName, entity, idField) {
    set((s) => {
      const col = s[collectionName];
      const idx = col.findIndex((x) => x[idField] === entity[idField]);
      if (idx >= 0) col[idx] = entity;
      else col.push(entity);
    });
  }

  function removeById(collectionName, idField, id) {
    set((s) => {
      s[collectionName] = s[collectionName].filter((x) => x[idField] !== id);
    });
  }

  function seedDemoData() {
    const current = loadState();
    if (current && current.students && current.students.length > 0) return;

    const program = {
      program_id: uid("prog"),
      program_name: "Bachelor of Computer Science",
      faculty: "Faculty of Computing",
      total_credits: 120,
    };

    const student = {
      student_id: uid("stu"),
      matric_no: "A22CS9999",
      full_name: "Demo Student",
      email: "demo@student.edu",
      program_id: program.program_id,
    };

    const lo = [
      { lo_id: uid("lo"), lo_code: "LO1", description: "Apply computing fundamentals to solve problems.", domain: "Academic" },
      { lo_id: uid("lo"), lo_code: "LO2", description: "Communicate effectively in professional contexts.", domain: "Academic" },
      { lo_id: uid("lo"), lo_code: "LO3", description: "Demonstrate leadership and teamwork.", domain: "Co-curricular" },
      { lo_id: uid("lo"), lo_code: "LO4", description: "Exhibit ethical and responsible behavior.", domain: "Co-curricular" },
    ];

    const skills = [
      { skill_id: uid("sk"), skill_name: "Problem Solving", skill_type: "Cognitive", description: "Analyze and solve complex issues." },
      { skill_id: uid("sk"), skill_name: "Communication", skill_type: "Soft Skill", description: "Clear written and verbal communication." },
      { skill_id: uid("sk"), skill_name: "Leadership", skill_type: "Soft Skill", description: "Lead teams and drive outcomes." },
      { skill_id: uid("sk"), skill_name: "Ethics", skill_type: "Professional", description: "Act responsibly and ethically." },
    ];

    const courses = [
      { course_id: uid("crs"), course_code: "CSW101", course_name: "Web Systems", course_type: "Core", credit_hours: 3, program_id: program.program_id },
      { course_id: uid("crs"), course_code: "CSW202", course_name: "Database Systems", course_type: "Core", credit_hours: 3, program_id: program.program_id },
    ];

    const loSkillMappings = [
      { mapping_id: uid("lomap"), lo_id: lo[0].lo_id, skill_id: skills[0].skill_id, knowledge_type: "Hard", mapping_strength: 0.9 },
      { mapping_id: uid("lomap"), lo_id: lo[1].lo_id, skill_id: skills[1].skill_id, knowledge_type: "Soft", mapping_strength: 0.8 },
      { mapping_id: uid("lomap"), lo_id: lo[2].lo_id, skill_id: skills[2].skill_id, knowledge_type: "Soft", mapping_strength: 0.9 },
      { mapping_id: uid("lomap"), lo_id: lo[3].lo_id, skill_id: skills[3].skill_id, knowledge_type: "Professional", mapping_strength: 0.85 },
    ];

    const activities = [
      {
        cocurr_id: uid("cc"),
        activity_name: "University Hackathon",
        organizer: "Student Affairs",
        category: "Competition",
        is_credit_bearing: false,
        credit_hours: 0,
      },
      {
        cocurr_id: uid("cc"),
        activity_name: "Peer Mentoring",
        organizer: "Computing Society",
        category: "Volunteer",
        is_credit_bearing: true,
        credit_hours: 1,
      },
    ];

    const coCurrSkillMappings = [
      { mapping_id: uid("ccmap"), cocurr_id: activities[0].cocurr_id, skill_id: skills[0].skill_id, knowledge_type: "Hard", mapping_strength: 0.7 },
      { mapping_id: uid("ccmap"), cocurr_id: activities[0].cocurr_id, skill_id: skills[1].skill_id, knowledge_type: "Soft", mapping_strength: 0.4 },
      { mapping_id: uid("ccmap"), cocurr_id: activities[1].cocurr_id, skill_id: skills[2].skill_id, knowledge_type: "Soft", mapping_strength: 0.7 },
      { mapping_id: uid("ccmap"), cocurr_id: activities[1].cocurr_id, skill_id: skills[1].skill_id, knowledge_type: "Soft", mapping_strength: 0.6 },
    ];

    const enrollments = [
      {
        enrollment_id: uid("enr"),
        student_id: student.student_id,
        course_id: courses[0].course_id,
        semester: "2026S1",
        status: "Completed",
        grade: "A-",
      },
    ];

    const studentCoCurriculum = [
      {
        record_id: uid("scc"),
        student_id: student.student_id,
        cocurr_id: activities[0].cocurr_id,
        semester: "2026S1",
        role: "Participant",
        achievement: 0.75,
      },
    ];

    saveState({
      ...emptyState(),
      programs: [program],
      students: [student],
      learningOutcomes: lo,
      employabilitySkills: skills,
      courses,
      loSkillMappings,
      coCurriculum: activities,
      coCurrSkillMappings,
      enrollments,
      studentCoCurriculum,
    });
  }

  const GRADE_POINTS = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    F: 0.0,
  };

  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  function clamp100(x) {
    return Math.max(0, Math.min(100, x));
  }

  function gradeTo01(grade) {
    const gp = GRADE_POINTS[grade];
    if (gp == null) return 0;
    return clamp01(gp / 4.0);
  }

  function computeAcademicAchievement(state, studentId) {
    const enrolls = state.enrollments.filter((e) => e.student_id === studentId && (e.status || "").toLowerCase() === "completed");
    if (enrolls.length === 0) return { score01: 0, details: { totalCredits: 0, gpa: 0 } };

    let totalCredits = 0;
    let weightedPoints = 0;
    for (const e of enrolls) {
      const course = state.courses.find((c) => c.course_id === e.course_id);
      const ch = Number(course?.credit_hours ?? 0);
      const gp = GRADE_POINTS[e.grade] ?? 0;
      totalCredits += ch;
      weightedPoints += gp * ch;
    }
    const gpa = totalCredits > 0 ? weightedPoints / totalCredits : 0;
    const score01 = clamp01(gpa / 4.0);
    return { score01, details: { totalCredits, gpa: Number(gpa.toFixed(2)) } };
  }

  function computeCoCurrAchievement(state, studentId) {
    const rows = state.studentCoCurriculum.filter((r) => r.student_id === studentId);
    if (rows.length === 0) return { score01: 0, details: { totalActivities: 0 } };

    // activity-level achievement is user-provided 0..1; we apply mapping strength as amplification
    const bySkill = new Map(); // skill_id -> accumulated
    for (const r of rows) {
      const ach = clamp01(Number(r.achievement ?? 0));
      const mappings = state.coCurrSkillMappings.filter((m) => m.cocurr_id === r.cocurr_id);
      if (mappings.length === 0) {
        // still count raw achievement as generic value
        bySkill.set("__generic__", (bySkill.get("__generic__") ?? 0) + ach * 0.25);
      } else {
        for (const m of mappings) {
          const strength = clamp01(Number(m.mapping_strength ?? 0));
          bySkill.set(m.skill_id, (bySkill.get(m.skill_id) ?? 0) + ach * strength);
        }
      }
    }

    const contributions = Array.from(bySkill.values());
    const avg = contributions.length ? contributions.reduce((a, b) => a + b, 0) / contributions.length : 0;
    const normalized = clamp01(avg / 1.25); // soft normalization
    return { score01: normalized, details: { totalActivities: rows.length } };
  }

  function computeBreadthBonus01(state, studentId) {
    const skillSet = new Set();

    // academic: infer skills via LO mappings (we treat any completed course as contributing to all academic LOs equally in this frontend demo)
    const completed = state.enrollments.some((e) => e.student_id === studentId && (e.status || "").toLowerCase() === "completed");
    if (completed) {
      for (const m of state.loSkillMappings) skillSet.add(m.skill_id);
    }

    // co-curr: infer skills via co-curr mappings
    const rows = state.studentCoCurriculum.filter((r) => r.student_id === studentId);
    for (const r of rows) {
      const mappings = state.coCurrSkillMappings.filter((m) => m.cocurr_id === r.cocurr_id);
      for (const m of mappings) skillSet.add(m.skill_id);
    }

    const distinct = skillSet.size;
    return clamp01(distinct / 8); // cap at 8 distinct skills
  }

  function computeMarketability(state, studentId) {
    const acad = computeAcademicAchievement(state, studentId);
    const coc = computeCoCurrAchievement(state, studentId);
    const breadth = computeBreadthBonus01(state, studentId);

    const combined01 = clamp01(0.6 * acad.score01 + 0.4 * coc.score01 + 0.1 * breadth);
    const index = clamp100(Math.round(combined01 * 100));

    const tier = index >= 80 ? "Excellent" : index >= 65 ? "Good" : index >= 50 ? "Developing" : "Needs Improvement";
    return {
      marketabilityIndex: index,
      tier,
      academic01: acad.score01,
      coCurr01: coc.score01,
      breadth01: breadth,
      academicDetails: acad.details,
      coCurrDetails: coc.details,
    };
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function $id(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element #${id}`);
    return el;
  }

  window.App = {
    KEY,
    uid,
    get,
    set,
    upsert,
    removeById,
    seedDemoData,
    resetAllData,
    gradeTo01,
    computeMarketability,
    escapeHtml,
    $id,
  };
})();
