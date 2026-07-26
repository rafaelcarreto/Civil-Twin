// script.js
// Orquestador principal de Civil Twin.

import { calculateProjectMetrics, buildTimeline, buildMaterialsTable } from "./calculations.js";
import { saveProject, loadProject, deleteProject, hasProject } from "./storage.js";
import { renderCharts } from "./charts.js";
import { init3D, update3D, toggleWireframe, toggleShadows, resetView } from "./model3d.js";
import { generatePDF } from "./report.js";
import {
  showSection,
  setLoaderVisible,
  notify,
  renderSummaryCards,
  renderMaterialsTable,
  renderCostsModule,
  renderTimeline,
  renderChat
} from "./ui.js";

const defaultProject = {
  nombre: "Edificio Central",
  pisos: 5,
  largo: 20,
  ancho: 12,
  alturaPiso: 3,
  estructura: "Concreto armado",
  cimentacion: "Zapata aislada",
  concreto: "f'c 210 kg/cm²",
  ubicacion: "Madrid, España",
  observaciones: "",
  prices: {
    concrete: 110,
    steel: 1.25,
    cement: 9.5,
    sand: 24,
    gravel: 28
  }
};

let currentProject = loadProject() || structuredClone(defaultProject);
let currentMetrics = calculateProjectMetrics(currentProject);
let currentTimeline = buildTimeline(currentProject);
let chatMessages = [
  { role: "ai", text: "Hola, soy Civil Twin AI. Puedo ayudarte a interpretar el proyecto y sus métricas." }
];

function initApp() {
  applyThemeFromStorage();
  bindNavigation();
  bindTopbarActions();
  bindProjectForm();
  bindChat();
  bindCostInputs();
  bind3DControls();
  bindSearch();
  bindSidebarToggle();

  updateAll();

  if (!hasProject()) {
    notify("Proyecto base cargado. Puedes comenzar a editar.", "success");
  } else {
    notify("Proyecto recuperado desde LocalStorage.", "info");
  }

  setTimeout(() => setLoaderVisible(false), 650);
}

function updateAll() {
  currentMetrics = calculateProjectMetrics(currentProject);
  currentTimeline = buildTimeline(currentProject);

  renderSummaryCards(currentMetrics);
  renderMaterialsTable(buildMaterialsTable(currentMetrics));
  renderCostsModule(currentProject, currentMetrics, updatePrices);
  renderTimeline(currentTimeline, currentMetrics.durationWeeks);
  renderChat(chatMessages);

  renderCharts(currentMetrics, currentTimeline);
  init3D(document.getElementById("threeContainer"), currentProject);
}

function updatePrices(prices) {
  currentProject = {
    ...currentProject,
    prices: { ...currentProject.prices, ...prices }
  };
  saveProject(currentProject);
  updateAll();
  notify("Costos actualizados correctamente.", "success");
}

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.dataset.section));
  });
}

function bindTopbarActions() {
  document.getElementById("btnTheme").addEventListener("click", toggleTheme);

  document.getElementById("btnSave").addEventListener("click", () => {
    saveProject(currentProject);
    notify("Proyecto guardado en LocalStorage.", "success");
  });

  document.getElementById("btnLoad").addEventListener("click", () => {
    const loaded = loadProject();
    if (loaded) {
      currentProject = loaded;
      fillForm(loaded);
      updateAll();
      notify("Proyecto cargado correctamente.", "success");
    } else {
      notify("No hay proyecto guardado.", "info");
    }
  });

  document.getElementById("btnDelete").addEventListener("click", () => {
    deleteProject();
    currentProject = structuredClone(defaultProject);
    fillForm(currentProject);
    updateAll();
    notify("Proyecto eliminado.", "warning");
  });

  document.getElementById("btnExportPDF").addEventListener("click", exportPDF);
  document.getElementById("btnGenerateReport").addEventListener("click", exportPDF);
  document.getElementById("btnExportExcel").addEventListener("click", exportExcelStub);
}

function bindProjectForm() {
  const form = document.getElementById("projectForm");
  fillForm(currentProject);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    currentProject = {
      ...currentProject,
      ...data,
      pisos: Number(data.pisos),
      largo: Number(data.largo),
      ancho: Number(data.ancho),
      alturaPiso: Number(data.alturaPiso),
      prices: currentProject.prices
    };

    saveProject(currentProject);
    updateAll();
    showSection("dashboard");
    notify("Proyecto generado y calculado.", "success");
  });

  document.getElementById("btnResetForm").addEventListener("click", () => {
    currentProject = structuredClone(defaultProject);
    fillForm(currentProject);
    updateAll();
    notify("Formulario restablecido.", "info");
  });
}

function bindChat() {
  const input = document.getElementById("chatMessage");
  const btn = document.getElementById("btnSendChat");

  const send = () => {
    const text = input.value.trim();
    if (!text) return;

    chatMessages.push({ role: "user", text });
    chatMessages.push({
      role: "ai",
      text: consultarIA(text)
    });

    input.value = "";
    renderChat(chatMessages);
  };

  btn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });
}

function consultarIA(prompt) {
  // Esta función queda preparada para conectarse más adelante con ChatGPT o Gemini.
  // Por ahora responde con lógica local y contexto del proyecto.
  const area = currentMetrics.area.toFixed(2);
  const cost = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(currentMetrics.costs.totalCost);

  return `Con base en el proyecto "${currentProject.nombre}", el área es ${area} m² y el costo estimado es ${cost}. 
Tu consulta fue: "${prompt}". 
En una siguiente etapa, esta función se conectará a una API externa de IA.`;
}

function bindCostInputs() {
  // Se re-renderiza desde renderCostsModule; aquí solo dejamos el punto de integración.
}

function bind3DControls() {
  document.getElementById("btnWireframe").addEventListener("click", () => {
    toggleWireframe(currentProject);
    notify("Modo alámbrico actualizado.", "info");
  });

  document.getElementById("btnShadows").addEventListener("click", () => {
    toggleShadows(currentProject);
    notify("Estado de sombras actualizado.", "info");
  });

  document.getElementById("btnResetCamera").addEventListener("click", () => {
    resetView();
    notify("Vista reiniciada.", "success");
  });
}

function bindSearch() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll(".section").forEach(section => {
      const text = section.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        section.style.display = section.classList.contains("active") ? "block" : "none";
      }
    });
  });
}

function bindSidebarToggle() {
  const btn = document.getElementById("btnToggleSidebar");
  const sidebar = document.getElementById("sidebar");
  btn.addEventListener("click", () => sidebar.classList.toggle("open"));
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("civil-twin-theme", isDark ? "dark" : "light");
  notify(isDark ? "Modo oscuro activado." : "Modo claro activado.", "info");
}

function applyThemeFromStorage() {
  const theme = localStorage.getItem("civil-twin-theme");
  if (theme === "dark") document.body.classList.add("dark");
}

function fillForm(project) {
  const form = document.getElementById("projectForm");
  Object.entries(project).forEach(([key, value]) => {
    const el = form.elements[key];
    if (el && typeof value !== "object") el.value = value;
  });
}

function exportPDF() {
  try {
    const materials = buildMaterialsTable(currentMetrics);
    generatePDF(currentProject, currentMetrics, currentTimeline, materials);
    notify("PDF generado correctamente.", "success");
  } catch (error) {
    console.error(error);
    notify("No se pudo generar el PDF.", "warning");
  }
}

function exportExcelStub() {
  // Esta etapa deja lista la intención de exportación.
  // En la siguiente etapa se implementará exportación real a Excel/XLSX.
  const csvRows = [
    ["Concepto", "Valor"],
    ["Proyecto", currentProject.nombre],
    ["Área", currentMetrics.area.toFixed(2)],
    ["Costo total", currentMetrics.costs.totalCost.toFixed(2)]
  ];

  const csv = csvRows.map(row => row.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentProject.nombre || "civil-twin"}-resumen.csv`;
  a.click();

  URL.revokeObjectURL(url);
  notify("Exportación base CSV realizada.", "success");
}

document.addEventListener("DOMContentLoaded", initApp);
