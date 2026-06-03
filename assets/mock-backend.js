/* global window, localStorage */
/**
 * MOCK BACKEND — VS Code Local Development Only
 * ================================================
 * 
 * This file simulates the Netlify Serverless Functions + Oracle DB locally
 * using localStorage. It auto-activates when /.netlify/functions/* is NOT
 * available (e.g., when opening with VS Code Live Server).
 * 
 * Production behaviour: when deployed to Netlify, the real functions respond
 * and this mock is bypassed completely. No code changes needed before deploy.
 * 
 * Storage key: ccs3402_mock_db
 * Implements the same Option B data transformations as the real backend.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "ccs3402_mock_db";

  // ============================================================
  // STORAGE
  // ============================================================

  function emptyDb() {
    return {
      _counters: {
        program_id: 0,
        student_id: 0,
        course_id: 0,
        lo_id: 0,
        skill_id: 0,
        mapping_id: 0,
        cocurr_id: 0,
        cocurr_mapping_id: 0,
        enrollment_id: 0,
        record_id: 0
      },
      programs: [],
      students: [],
      courses: [],
      learningOutcomes: [],
      employabilitySkills: [],
      loSkillMappings: [],
      coCurriculum: [],
      coCurrSkillMappings: [],
      enrollments: [],
      studentCoCurriculum: []
    };
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = emptyDb();
      save(fresh);
      return fresh;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return emptyDb();
    }
  }

  function save(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function nextId(db, counterName) {
    db._counters[counterName] += 1;
    return db._counters[counterName];
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ============================================================
  // OPTION B TRANSFORMATIONS (identical to backend transformers.js)
  // ============================================================

  const T = {
    courseTypeIn(x) {
      const m = { Core: "Academic", Elective: "Elective", Academic: "Academic", Technical: "Technical" };
      return m[x] || "Academic";
    },
    courseTypeOut(x) {
      const m = { Academic: "Core", Technical: "Core", Elective: "Elective" };
      return m[x] || "Core";
    },
    statusIn(x) {
      const m = { "In Progress": "Active", Completed: "Completed", Active: "Active", Withdrawn: "Withdrawn" };
      return m[x] || "Active";
    },
    statusOut(x) {
      const m = { Active: "In Progress", Completed: "Completed", Withdrawn: "Withdrawn" };
      return m[x] || "In Progress";
    },
    knowledgeIn(x) {
      const m = {
        Hard: "Academic Knowledge", Soft: "Technical Skills", Professional: "Marketability Values",
        "Academic Knowledge": "Academic Knowledge", "Technical Skills": "Technical Skills", "Marketability Values": "Marketability Values"
      };
      return m[x] || "Academic Knowledge";
    },
    knowledgeOut(x) {
      const m = { "Academic Knowledge": "Hard", "Technical Skills": "Soft", "Marketability Values": "Professional" };
      return m[x] || "Hard";
    },
    skillTypeIn(x) {
      const m = {
        Cognitive: "Academic Knowledge", "Soft Skill": "Technical Skills", Professional: "Marketability Values",
        "Academic Knowledge": "Academic Knowledge", "Technical Skills": "Technical Skills", "Marketability Values": "Marketability Values"
      };
      return m[x] || "Academic Knowledge";
    },
    skillTypeOut(x) {
      const m = { "Academic Knowledge": "Cognitive", "Technical Skills": "Soft Skill", "Marketability Values": "Professional" };
      return m[x] || "Cognitive";
    },
    strengthIn(x) {
      const num = parseFloat(x);
      if (isNaN(num)) return ["Low", "Medium", "High"].includes(x) ? x : "Medium";
      if (num < 0.4) return "Low";
      if (num < 0.7) return "Medium";
      return "High";
    },
    strengthOut(x) {
      return { Low: 0.3, Medium: 0.6, High: 0.9 }[x] ?? 0.6;
    },
    domainIn(x) {
      const m = { Academic: "Knowledge", "Co-curricular": "Skills", Knowledge: "Knowledge", Skills: "Skills", Values: "Values" };
      return m[x] || "Knowledge";
    },
    domainOut(x) {
      const m = { Knowledge: "Academic", Skills: "Co-curricular", Values: "Co-curricular" };
      return m[x] || "Academic";
    }
  };

  // ============================================================
  // HANDLERS (each mimics a Netlify function)
  // ============================================================

  function getState() {
    const db = load();

    return {
      meta: { version: 1, fetchedAt: new Date().toISOString(), mockMode: true },
      programs: db.programs.map((r) => ({
        program_id: String(r.program_id),
        program_name: r.program_name,
        faculty: r.faculty,
        total_credits: r.total_credits
      })),
      students: db.students.map((r) => ({
        student_id: String(r.student_id),
        matric_no: r.matric_no,
        full_name: r.full_name,
        email: r.email,
        program_id: String(r.program_id)
      })),
      courses: db.courses.map((r) => ({
        course_id: String(r.course_id),
        course_code: r.course_code,
        course_name: r.course_name,
        course_type: T.courseTypeOut(r.course_type),
        credit_hours: r.credit_hours,
        program_id: String(r.program_id)
      })),
      learningOutcomes: db.learningOutcomes.map((r) => ({
        lo_id: String(r.lo_id),
        lo_code: r.lo_code,
        description: r.description,
        domain: T.domainOut(r.domain),
        course_id: String(r.course_id)
      })),
      employabilitySkills: db.employabilitySkills.map((r) => ({
        skill_id: String(r.skill_id),
        skill_name: r.skill_name,
        skill_type: T.skillTypeOut(r.skill_type),
        description: r.description || ""
      })),
      loSkillMappings: db.loSkillMappings.map((r) => ({
        mapping_id: String(r.mapping_id),
        lo_id: String(r.lo_id),
        skill_id: String(r.skill_id),
        knowledge_type: T.knowledgeOut(r.knowledge_type),
        mapping_strength: T.strengthOut(r.mapping_strength)
      })),
      coCurriculum: db.coCurriculum.map((r) => ({
        cocurr_id: String(r.cocurr_id),
        activity_name: r.activity_name,
        organizer: r.organizer,
        category: r.category,
        is_credit_bearing: r.is_credit_bearing === 1,
        credit_hours: r.credit_hours
      })),
      coCurrSkillMappings: db.coCurrSkillMappings.map((r) => ({
        mapping_id: String(r.mapping_id),
        cocurr_id: String(r.cocurr_id),
        skill_id: String(r.skill_id),
        knowledge_type: T.knowledgeOut(r.knowledge_type),
        mapping_strength: T.strengthOut(r.mapping_strength)
      })),
      enrollments: db.enrollments.map((r) => ({
        enrollment_id: String(r.enrollment_id),
        student_id: String(r.student_id),
        course_id: String(r.course_id),
        semester: r.semester,
        status: T.statusOut(r.status),
        grade: r.grade || ""
      })),
      studentCoCurriculum: db.studentCoCurriculum.map((r) => ({
        record_id: String(r.record_id),
        student_id: String(r.student_id),
        cocurr_id: String(r.cocurr_id),
        semester: r.semester,
        role: r.role || "",
        achievement: parseFloat(r.achievement) || 0
      }))
    };
  }

  function ensureDefaultCourse(db) {
    let course = db.courses.find((c) => c.course_code === "GEN000");
    if (course) return course.course_id;

    // Ensure default program
    let program = db.programs.find((p) => p.program_name === "General Studies");
    if (!program) {
      program = {
        program_id: nextId(db, "program_id"),
        program_name: "General Studies",
        faculty: "General",
        total_credits: 120
      };
      db.programs.push(program);
    }

    course = {
      course_id: nextId(db, "course_id"),
      course_code: "GEN000",
      course_name: "General Learning Outcomes",
      course_type: "Academic",
      credit_hours: 0,
      program_id: program.program_id
    };
    db.courses.push(course);
    return course.course_id;
  }

  function manageStudents(body) {
    const db = load();
    const { full_name, matric_no, email, program_id } = body;
    if (!full_name || !matric_no || !email || !program_id) {
      throw new Error("Missing required fields");
    }
    if (db.students.some((s) => s.matric_no === matric_no)) {
      throw new Error("Student with this matric number already exists");
    }
    if (db.students.some((s) => s.email === email)) {
      throw new Error("Student with this email already exists");
    }
    const student = {
      student_id: nextId(db, "student_id"),
      full_name,
      matric_no,
      email,
      program_id: parseInt(program_id)
    };
    db.students.push(student);
    save(db);
    return { success: true, student_id: String(student.student_id) };
  }

  function managePrograms(body) {
    const db = load();
    const { program_name, faculty, total_credits } = body;
    if (!program_name || !faculty) throw new Error("program_name and faculty required");
    const program = {
      program_id: nextId(db, "program_id"),
      program_name,
      faculty,
      total_credits: parseInt(total_credits) || 120
    };
    db.programs.push(program);
    save(db);
    return { success: true, program_id: String(program.program_id) };
  }

  function manageSkills(body) {
    const db = load();
    const { skill_name, skill_type, description } = body;
    if (!skill_name || !skill_type) throw new Error("skill_name and skill_type required");
    const skill = {
      skill_id: nextId(db, "skill_id"),
      skill_name,
      skill_type: T.skillTypeIn(skill_type),
      description: description || null
    };
    db.employabilitySkills.push(skill);
    save(db);
    return { success: true, skill_id: String(skill.skill_id) };
  }

  function manageCourses(body) {
    const db = load();
    const { course_id, course_code, course_name, course_type, credit_hours, program_id } = body;
    if (!course_code || !course_name || !program_id) throw new Error("Missing required fields");

    if (course_id) {
      const idx = db.courses.findIndex((c) => c.course_id === parseInt(course_id));
      if (idx === -1) throw new Error("Course not found");
      db.courses[idx] = {
        ...db.courses[idx],
        course_code,
        course_name,
        course_type: T.courseTypeIn(course_type),
        credit_hours: parseInt(credit_hours) || 3,
        program_id: parseInt(program_id)
      };
      save(db);
      return { success: true, course_id: String(course_id) };
    }

    const course = {
      course_id: nextId(db, "course_id"),
      course_code,
      course_name,
      course_type: T.courseTypeIn(course_type),
      credit_hours: parseInt(credit_hours) || 3,
      program_id: parseInt(program_id)
    };
    db.courses.push(course);
    save(db);
    return { success: true, course_id: String(course.course_id) };
  }

  function manageLearningOutcomes(body) {
    const db = load();
    const { action, lo_id, lo_code, description, domain, course_id } = body;

    if (action === "delete" && lo_id) {
      db.learningOutcomes = db.learningOutcomes.filter((x) => x.lo_id !== parseInt(lo_id));
      db.loSkillMappings = db.loSkillMappings.filter((m) => m.lo_id !== parseInt(lo_id));
      save(db);
      return { success: true };
    }

    if (!lo_code || !description) throw new Error("Missing required fields");

    const finalCourseId = course_id ? parseInt(course_id) : ensureDefaultCourse(db);

    if (lo_id) {
      const idx = db.learningOutcomes.findIndex((x) => x.lo_id === parseInt(lo_id));
      if (idx === -1) throw new Error("LO not found");
      db.learningOutcomes[idx] = {
        ...db.learningOutcomes[idx],
        lo_code,
        description,
        domain: T.domainIn(domain),
        course_id: finalCourseId
      };
      save(db);
      return { success: true, lo_id: String(lo_id) };
    }

    const lo = {
      lo_id: nextId(db, "lo_id"),
      lo_code,
      description,
      domain: T.domainIn(domain || "Academic"),
      course_id: finalCourseId
    };
    db.learningOutcomes.push(lo);
    save(db);
    return { success: true, lo_id: String(lo.lo_id) };
  }

  function manageEnrollments(body) {
    const db = load();
    const { action, enrollment_id, student_id, course_id, semester, status, grade } = body;

    if (action === "delete" && enrollment_id) {
      db.enrollments = db.enrollments.filter((x) => x.enrollment_id !== parseInt(enrollment_id));
      save(db);
      return { success: true };
    }

    if (!student_id || !course_id || !semester) throw new Error("Missing required fields");

    const enrollment = {
      enrollment_id: nextId(db, "enrollment_id"),
      student_id: parseInt(student_id),
      course_id: parseInt(course_id),
      semester,
      status: T.statusIn(status || "In Progress"),
      grade: grade || null
    };
    db.enrollments.push(enrollment);
    save(db);
    return { success: true, enrollment_id: String(enrollment.enrollment_id) };
  }

  function manageCocurriculum(body) {
    const db = load();
    const { type, action } = body;

    if (type === "activity") {
      const { cocurr_id, activity_name, organizer, category, is_credit_bearing, credit_hours } = body;
      if (!activity_name || !organizer || !category) throw new Error("Missing required fields");

      if (cocurr_id) {
        const idx = db.coCurriculum.findIndex((x) => x.cocurr_id === parseInt(cocurr_id));
        if (idx === -1) throw new Error("Activity not found");
        db.coCurriculum[idx] = {
          ...db.coCurriculum[idx],
          activity_name,
          organizer,
          category,
          is_credit_bearing: is_credit_bearing === true || is_credit_bearing === "true" ? 1 : 0,
          credit_hours: parseInt(credit_hours) || 0
        };
        save(db);
        return { success: true, cocurr_id: String(cocurr_id) };
      }

      const act = {
        cocurr_id: nextId(db, "cocurr_id"),
        activity_name,
        organizer,
        category,
        is_credit_bearing: is_credit_bearing === true || is_credit_bearing === "true" ? 1 : 0,
        credit_hours: parseInt(credit_hours) || 0
      };
      db.coCurriculum.push(act);
      save(db);
      return { success: true, cocurr_id: String(act.cocurr_id) };
    }

    if (type === "skill-mapping") {
      if (action === "delete") {
        db.coCurrSkillMappings = db.coCurrSkillMappings.filter((x) => x.mapping_id !== parseInt(body.mapping_id));
        save(db);
        return { success: true };
      }
      const { cocurr_id, skill_id, knowledge_type, mapping_strength } = body;
      if (!cocurr_id || !skill_id) throw new Error("Missing required fields");

      const mapping = {
        mapping_id: nextId(db, "cocurr_mapping_id"),
        cocurr_id: parseInt(cocurr_id),
        skill_id: parseInt(skill_id),
        knowledge_type: T.knowledgeIn(knowledge_type),
        mapping_strength: T.strengthIn(mapping_strength || 0.6)
      };
      db.coCurrSkillMappings.push(mapping);
      save(db);
      return { success: true, mapping_id: String(mapping.mapping_id) };
    }

    if (type === "participation") {
      if (action === "delete") {
        db.studentCoCurriculum = db.studentCoCurriculum.filter((x) => x.record_id !== parseInt(body.record_id));
        save(db);
        return { success: true };
      }
      const { student_id, cocurr_id, semester, role, achievement } = body;
      if (!student_id || !cocurr_id || !semester || !role) throw new Error("Missing required fields");

      const rec = {
        record_id: nextId(db, "record_id"),
        student_id: parseInt(student_id),
        cocurr_id: parseInt(cocurr_id),
        semester,
        role,
        achievement: typeof achievement === "number" ? achievement.toString() : achievement || "0"
      };
      db.studentCoCurriculum.push(rec);
      save(db);
      return { success: true, record_id: String(rec.record_id) };
    }

    throw new Error("Invalid request type");
  }

  // ============================================================
  // ROUTER (dispatches mock requests by endpoint path)
  // ============================================================

  function route(endpointPath, method, body) {
    const path = endpointPath.replace("/.netlify/functions/", "");

    if (method === "GET" && path === "get-state") return getState();

    if (method === "POST") {
      switch (path) {
        case "manage-students": return manageStudents(body);
        case "manage-programs": return managePrograms(body);
        case "manage-skills": return manageSkills(body);
        case "manage-courses": return manageCourses(body);
        case "manage-learning-outcomes": return manageLearningOutcomes(body);
        case "manage-enrollments": return manageEnrollments(body);
        case "manage-cocurriculum": return manageCocurriculum(body);
      }
    }

    throw new Error(`Mock: unknown endpoint ${method} ${path}`);
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  window.MockBackend = {
    route,
    clearAll,
    getDbSnapshot: () => load()
  };
})();
