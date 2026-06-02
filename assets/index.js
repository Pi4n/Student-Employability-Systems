/* global window, document, fetch */

(function () {
  "use strict";

  const App = window.App;
  const statusEl = document.getElementById("seedStatus");
  const seedBtn = document.getElementById("seedBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (!seedBtn || !resetBtn || !statusEl || !App) return;

  // 1. SEED ORACLE DATABASE
  seedBtn.addEventListener("click", async function () {
    statusEl.className = "small mt-2 text-warning";
    statusEl.textContent = "Seeding Oracle SQL database... Please wait.";
    seedBtn.disabled = true;

    try {
      // Calls your new Netlify function instead of localStorage
      const response = await fetch("/.netlify/functions/seed-oracle", {
        method: "POST"
      });
      const data = await response.json();

      if (response.ok) {
        statusEl.className = "small mt-2 text-success";
        statusEl.textContent = "Database seeded successfully into Oracle!";
        
        // Optional: Clear out old localStorage tracking so it doesn't conflict
        App.resetAllData(); 
      } else {
        statusEl.className = "small mt-2 text-danger";
        statusEl.textContent = "Database error: " + (data.error || "Failed to seed.");
      }
    } catch (err) {
      statusEl.className = "small mt-2 text-danger";
      statusEl.textContent = "Network error: Could not reach the serverless function.";
    } finally {
      seedBtn.disabled = false;
    }
  });

  // 2. RESET ORACLE DATABASE (CLEARS DATA VIA SERVERLESS)
  resetBtn.addEventListener("click", async function () {
    if (!confirm("Are you sure you want to clear your Oracle database tables?")) return;

    statusEl.className = "small mt-2 text-warning";
    statusEl.textContent = "Clearing Oracle tables...";
    resetBtn.disabled = true;

    try {
      // We can use the same seed function since it automatically wipes data before inserting new data
      const response = await fetch("/.netlify/functions/seed-oracle", {
        method: "POST"
      });
      
      if (response.ok) {
        statusEl.className = "small mt-2 text-danger";
        statusEl.textContent = "Oracle tables cleared and fresh data applied.";
      } else {
        statusEl.className = "small mt-2 text-danger";
        statusEl.textContent = "Failed to clear tables completely.";
      }
    } catch (err) {
      statusEl.className = "small mt-2 text-danger";
      statusEl.textContent = "Network error occurred.";
    } finally {
      resetBtn.disabled = false;
    }
  });
})();
