/* global window, Chart */

(function () {
  "use strict";

  const App = window.App;

  let radar = null;

  function getSelectedStudentId() {
    const sel = App.$id("studentSelect");
    return sel.value || null;
  }

  function setTierBadge(tier, index) {
    const badge = App.$id("tierBadge");
    badge.textContent = tier;
    badge.className =
      index >= 80
        ? "badge text-bg-success"
        : index >= 65
          ? "badge text-bg-primary"
          : index >= 50
            ? "badge text-bg-warning"
            : "badge text-bg-danger";
  }

  function fmtPct01(x) {
    return `${Math.round(x * 100)}%`;
  }

  function render() {
    const state = App.get();
    const sel = App.$id("studentSelect");
    const empty = App.$id("emptyState");

    if (state.students.length === 0) {
      empty.classList.remove("d-none");
      sel.innerHTML = "";
      return;
    }

    empty.classList.add("d-none");

    const prior = getSelectedStudentId();
    sel.innerHTML = state.students
      .map((s) => `<option value="${App.escapeHtml(s.student_id)}">${App.escapeHtml(s.full_name)} (${App.escapeHtml(s.matric_no)})</option>`)
      .join("");
    if (prior && state.students.some((s) => s.student_id === prior)) sel.value = prior;

    const studentId = getSelectedStudentId() || state.students[0].student_id;
    sel.value = studentId;

    const student = state.students.find((s) => s.student_id === studentId);
    const program = state.programs.find((p) => p.program_id === student?.program_id);
    App.$id("studentMeta").innerHTML = [
      `<div class="mono">${App.escapeHtml(student?.email ?? "")}</div>`,
      `<div>${App.escapeHtml(program?.program_name ?? "—")}</div>`,
    ].join("");

    const m = App.computeMarketability(state, studentId);

    const acadPct = Math.round(m.academic01 * 100);
    const cocPct = Math.round(m.coCurr01 * 100);

    App.$id("acadBar").style.width = `${acadPct}%`;
    App.$id("cocBar").style.width = `${cocPct}%`;

    App.$id("acadText").textContent = `GPA: ${m.academicDetails.gpa} | Completed credits: ${m.academicDetails.totalCredits}`;
    App.$id("cocText").textContent = `Activities logged: ${m.coCurrDetails.totalActivities} | Breadth bonus: ${fmtPct01(m.breadth01)}`;

    App.$id("miValue").textContent = String(m.marketabilityIndex);
    App.$id("miExplain").textContent = `Academic ${acadPct}% + Co-curricular ${cocPct}% + breadth bonus`;
    setTierBadge(m.tier, m.marketabilityIndex);

    const data = {
      labels: ["Academic", "Co-curricular"],
      datasets: [
        {
          label: "Achievement",
          data: [acadPct, cocPct],
          borderColor: "rgba(59, 130, 246, 0.95)",
          backgroundColor: "rgba(59, 130, 246, 0.25)",
          pointBackgroundColor: "rgba(59, 130, 246, 1)",
          pointBorderColor: "#1e293b",
          pointHoverBackgroundColor: "#93c5fd",
          pointHoverBorderColor: "#1e293b",
        },
      ],
    };

    const ctx = /** @type {HTMLCanvasElement} */ (App.$id("radarChart")).getContext("2d");
    if (!radar) {
      radar = new Chart(ctx, {
        type: "radar",
        data,
        options: {
          responsive: true,
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { stepSize: 20, color: "#94a3b8", backdropColor: "transparent" },
              grid: { color: "rgba(148, 163, 184, 0.15)" },
              angleLines: { color: "rgba(148, 163, 184, 0.15)" },
              pointLabels: { color: "#e2e8f0", font: { size: 12, weight: "500" } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (tt) => `${tt.label}: ${tt.formattedValue}/100`,
              },
            },
          },
        },
      });
    } else {
      radar.data = data;
      radar.update();
    }
  }

  function init() {
    App.$id("seedBtn").addEventListener("click", () => {
      App.seedDemoData();
      render();
    });
    App.$id("resetBtn").addEventListener("click", () => {
      App.resetAllData();
      render();
    });
    App.$id("studentSelect").addEventListener("change", () => render());

    // Ensure state exists (but don't auto-seed)
    App.get();
    render();
  }

  init();
})();

