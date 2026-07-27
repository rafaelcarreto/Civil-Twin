// ui.js
// Utilidades de interfaz y renderizado.

export function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.toggle("active", section.id === sectionId);
  });

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === sectionId);
  });
}

export function setLoaderVisible(visible) {
  const loader = document.getElementById("loader");
  loader.style.display = visible ? "grid" : "none";
}

export function notify(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${type.toUpperCase()}</strong><div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 220);
  }, 2600);
}

export function renderSummaryCards(metrics) {
  const cards = [
    { label: "Área construida", value: `${metrics.area.toFixed(2)} m²`, hint: "Superficie total del proyecto" },
    { label: "Volumen estimado", value: `${metrics.volume.toFixed(2)} m³`, hint: "Volumen geométrico base" },
    { label: "Cantidad de concreto", value: `${metrics.materials.concrete.toFixed(2)} m³`, hint: "Estimación conceptual" },
    { label: "Acero estimado", value: `${metrics.materials.steel.toFixed(0)} kg`, hint: "Refuerzo aproximado" },
    { label: "Costo estimado", value: formatMoney(metrics.costs.totalCost), hint: "Presupuesto preliminar" },
    { label: "Duración estimada", value: `${metrics.durationWeeks} sem`, hint: "Cronograma base" }
  ];

  const container = document.getElementById("summaryCards");
  container.innerHTML = cards.map(card => `
    <article class="card">
      <div class="card__label">${card.label}</div>
      <div class="card__value">${card.value}</div>
      <div class="card__hint">${card.hint}</div>
    </article>
  `).join("");
}

export function renderMaterialsTable(rows) {
  const html = `
    <table>
      <thead>
        <tr>
          <th>Concepto</th>
          <th>Unidad</th>
          <th>Cantidad</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${row[2]}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
  document.getElementById("materialsTable").innerHTML = html;
}

export function renderCostsModule(project, metrics, onChange) {
  const container = document.getElementById("costsModule");

  const prices = project.prices || {};

  container.innerHTML = `
    <label class="cost-item">
      <span>Precio del concreto</span>
      <input data-price="concrete" type="number" step="0.01" value="${prices.concrete ?? 110}">
    </label>
    <label class="cost-item">
      <span>Precio del acero</span>
      <input data-price="steel" type="number" step="0.01" value="${prices.steel ?? 1.25}">
    </label>
    <label class="cost-item">
      <span>Precio del cemento</span>
      <input data-price="cement" type="number" step="0.01" value="${prices.cement ?? 9.5}">
    </label>
    <label class="cost-item">
      <span>Precio de arena</span>
      <input data-price="sand" type="number" step="0.01" value="${prices.sand ?? 24}">
    </label>
    <label class="cost-item">
      <span>Precio de grava</span>
      <input data-price="gravel" type="number" step="0.01" value="${prices.gravel ?? 28}">
    </label>
  `;

  container.querySelectorAll("input[data-price]").forEach(input => {
    input.addEventListener("input", () => onChange({
      ...project.prices,
      [input.dataset.price]: Number(input.value)
    }));
  });

  document.getElementById("totalCost").textContent = formatMoney(metrics.costs.totalCost);
  document.getElementById("costPerM2").textContent = formatMoney(metrics.costs.costPerM2);
  document.getElementById("costPerFloor").textContent = formatMoney(metrics.costs.costPerFloor);
}

export function renderTimeline(timeline, totalDuration) {
  const container = document.getElementById("timelineList");
  container.innerHTML = `
    <div class="muted" style="margin-bottom:12px;">
      Duración total estimada: <strong>${totalDuration}</strong> semanas
    </div>
    ${timeline.map(task => `
      <div style="display:grid; gap:8px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; gap:16px;">
          <strong>${task.name}</strong>
          <span class="muted">${task.startWeek} - ${task.endWeek} semanas</span>
        </div>
        <div style="height:12px; background: var(--surface-2); border-radius:999px; overflow:hidden;">
          <div style="width:${task.progress}%; height:100%; background: linear-gradient(90deg, var(--primary), var(--primary-2));"></div>
        </div>
      </div>
    `).join("")}
  `;
}

export function renderChat(messages) {
  const container = document.getElementById("chatWindow");
  container.innerHTML = messages.map(msg => `
    <div class="chat-bubble ${msg.role}">${msg.text}</div>
  `).join("");
  container.scrollTop = container.scrollHeight;
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value || 0);
}
export function renderPlanInfo(plan) {
  const el = document.getElementById("planInfo");
  if (!el) return;

  if (!plan || !plan.dataUrl) {
    el.innerHTML = "No hay plano cargado.";
    return;
  }

  el.innerHTML = `
    <strong>${plan.fileName || "Plano cargado"}</strong><br>
    Ancho real: ${Number(plan.widthMeters || 0).toFixed(2)} m · Fondo real: ${Number(plan.depthMeters || 0).toFixed(2)} m
  `;
}
