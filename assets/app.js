/* global window, fetch */

(function () {
  "use strict";

  // Global infrastructure wrapper matching your original layout architecture
  const App = {
    // Utility helper to query DOM objects fast
    $id: (id) => document.getElementById(id),

    // Reusable HTML safe string injection formatting method
    escapeHtml: (str) => {
      if (!str) return "";
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    },

    // Central safe state getter fetching records directly from live endpoints
    get: async () => {
      try {
        // Fallback structures match your schema keys perfectly to protect render matrices
        const defaultState = {
          programs: [],
          courses: [],
          students: [],
          learningOutcomes: [],
          employabilitySkills: [],
          enrollments: [],
          coCurriculum: []
        };

        const res = await fetch("/.netlify/functions/get-state");
        if (!res.ok) return defaultState;
        
        const data = await res.json();
        return { ...defaultState, ...data };
      } catch (err) {
        console.error("Backend state sync failure:", err);
        return {
          programs: [],
          courses: [],
          students: [],
          learningOutcomes: [],
          employabilitySkills: [],
          enrollments: [],
          coCurriculum: []
        };
      }
    }
  };

  // Bind to window context across admin.js, dashboard.js, and logging.js instances
  window.App = App;
})();
