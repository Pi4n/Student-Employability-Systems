/* global window, fetch */

(function () {
  "use strict";

  // We change these to ASYNC functions because network requests take time!
  async function loadStateFromServer() {
    try {
      const response = await fetch("/.netlify/functions/get-all-data");
      if (!response.ok) throw new Error("Failed to pull live Oracle data");
      return await response.json(); 
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async function upsertToOracle(collectionName, entity, idField) {
    try {
      await fetch(`/.netlify/functions/manage-${collectionName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert", entity, idField })
      });
    } catch (err) {
      console.error("Failed to sync change to Oracle:", err);
    }
  }

  async function removeFromOracle(collectionName, idField, id) {
    try {
      await fetch(`/.netlify/functions/manage-${collectionName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", idField, id })
      });
    } catch (err) {
      console.error("Failed to delete record from Oracle:", err);
    }
  }

  // Keep all your beautiful mathematical scoring formulas unchanged!
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function clamp100(x) { return Math.max(0, Math.min(100, x)); }
  
  const GRADE_POINTS = { "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, "D+": 1.3, D: 1.0, F: 0.0 };

  function computeMarketability(state, studentId) {
    // Keep your exact same code logic here for calculations...
    // (This remains safe because it just runs math on data after it arrives)
  }

  window.App = {
    get: loadStateFromServer,
    upsert: upsertToOracle,
    removeById: removeFromOracle,
    computeMarketability,
    $id: (id) => document.getElementById(id)
  };
})();
