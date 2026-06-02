/* global window, fetch */

(function () {
  "use strict";

  async function loadStateFromServer() {
    try {
      const response = await fetch("/.netlify/functions/get-all-data");
      if (!response.ok) throw new Error("Database network bridge failure");
      return await response.json();
    } catch (err) {
      console.error(err);
      return { students: [], courses: [], programs: [], learningOutcomes: [], employabilitySkills: [], enrollments: [] };
    }
  }

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function clamp100(x) { return Math.max(0, Math.min(100, x)); }

  const GRADE_POINTS = { "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, "D+": 1.3, D: 1.0, F: 0.0 };

  function computeAcademicAchievement(state, studentId) {
    const targetId = Number(studentId);
    const enrolls = state.enrollments.filter((e) => Number(e.student_id) === targetId && e.status === "Completed");
    if (enrolls.length === 0) return { score01: 0, details: "No active completions logged in Oracle tables." };

    let totalPoints = 0;
    enrolls.forEach((e) => { totalPoints += GRADE_POINTS[e.grade] || 0.0; });
    const gpa = totalPoints / enrolls.length;
    return { score01: clamp01(gpa / 4.0), details: `GPA calculated at: ${gpa.toFixed(2)} [${enrolls.length} Units]` };
  }

  function computeMarketability(state, studentId) {
    const acad = computeAcademicAchievement(state, studentId);
    const combined01 = clamp01(0.6 * acad.score01 + 0.4 * 0.5); 
    const index = clamp100(Math.round(combined01 * 100));
    const tier = index >= 80 ? "Excellent" : index >= 65 ? "Good" : index >= 50 ? "Developing" : "Needs Improvement";

    return {
      marketabilityIndex: index,
      tier,
      academic01: acad.score01,
      coCurr01: 0.5,
      breadth01: 0,
      academicDetails: acad.details,
      coCurrDetails: "Awaiting holistic co-curricular tracking entries."
    };
  }

  function escapeHtml(s) {
    return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  window.App = {
    get: loadStateFromServer,
    computeMarketability,
    escapeHtml,
    $id: (id) => document.getElementById(id)
  };
})();
