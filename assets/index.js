/* global window */

(function () {
  "use strict";

  const App = window.App;
  const statusEl = document.getElementById("seedStatus");
  const seedBtn = document.getElementById("seedBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (!seedBtn || !resetBtn || !statusEl || !App) return;

  seedBtn.addEventListener("click", function () {
    App.seedDemoData();
    statusEl.className = "small mt-2 text-success";
    statusEl.textContent = "Seeded demo data successfully.";
  });

  resetBtn.addEventListener("click", function () {
    App.resetAllData();
    statusEl.className = "small mt-2 text-danger";
    statusEl.textContent = "Local data cleared. You can seed again.";
  });
})();
