/* global window, document */

(async function () {
  "use strict";

  const App = window.App;

  async function renderLiveDashboard() {
    const state = await App.get();
    const dropdown = App.$id("studentSelect");

    if (!state.students || state.students.length === 0) {
      App.$id("emptyState").classList.remove("d-none");
      return;
    }
    App.$id("emptyState").classList.add("d-none");

    dropdown.innerHTML = state.students.map(s => `<option value="${s.student_id}">${s.full_name}</option>`).join("");
    
    // Auto-compute index metrics for the top active index choice
    const initialId = state.students[0].student_id;
    const report = App.computeMarketability(state, initialId);

    App.$id("miValue").textContent = report.marketabilityIndex;
    App.$id("miExplain").textContent = `Calculated Class Status: ${report.tier}`;
    App.$id("acadDetail").textContent = report.academicDetails;

    dropdown.addEventListener("change", function () {
      const currentReport = App.computeMarketability(state, this.value);
      App.$id("miValue").textContent = currentReport.marketabilityIndex;
      App.$id("miExplain").textContent = `Calculated Class Status: ${currentReport.tier}`;
      App.$id("acadDetail").textContent = currentReport.academicDetails;
    });
  }

  await renderLiveDashboard();
})();
