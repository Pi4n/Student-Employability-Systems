/* global window */

(async function () {
  "use strict";

  const App = window.App;
  if (!App) return;

  const statusEl = document.getElementById("seedStatus");
  if (!statusEl) return;

  statusEl.className = "small mt-2 text-warning";
  statusEl.textContent = "Checking pipeline communication status...";

  try {
    const check = await App.get();
    if (check && check.students) {
      statusEl.className = "small mt-2 text-success";
      statusEl.textContent = `Connected! Real-time operational schema contains ${check.students.length} recorded student row(s).`;
    }
  } catch {
    statusEl.className = "small mt-2 text-danger";
    statusEl.textContent = "Pipeline offline. Check serverless logs and environment configurations.";
  }
})();
