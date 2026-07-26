// charts.js
// Gestión de gráficos con Chart.js.

let charts = {
  costs: null,
  progress: null,
  materials: null
};

function destroyChart(chart) {
  if (chart && typeof chart.destroy === "function") {
    chart.destroy();
  }
}

export function renderCharts(metrics, timeline) {
  if (!window.Chart) return;

  destroyChart(charts.costs);
  destroyChart(charts.progress);
  destroyChart(charts.materials);

  const costCtx = document.getElementById("chartCosts");
  const progressCtx = document.getElementById("chartProgress");
  const materialsCtx = document.getElementById("chartMaterials");

  charts.costs = new Chart(costCtx, {
    type: "doughnut",
    data: {
      labels: ["Concreto", "Acero", "Cemento", "Arena", "Grava"],
      datasets: [{
        data: [
          metrics.costs.concrete,
          metrics.costs.steel,
          metrics.costs.cement,
          metrics.costs.sand,
          metrics.costs.gravel
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  charts.progress = new Chart(progressCtx, {
    type: "bar",
    data: {
      labels: timeline.map(t => t.name),
      datasets: [{
        label: "% avance",
        data: timeline.map(t => t.progress)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });

  charts.materials = new Chart(materialsCtx, {
    type: "pie",
    data: {
      labels: ["Concreto", "Acero", "Ladrillo", "Bloques"],
      datasets: [{
        data: [
          metrics.materials.concrete,
          metrics.materials.steel,
          metrics.materials.brick,
          metrics.materials.blocks
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
