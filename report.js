// report.js
// Generación de PDF con jsPDF.

import { get3DImage } from "./model3d.js";

export function generatePDF(project, metrics, timeline, materialsTable) {
  if (!window.jspdf?.jsPDF) {
    throw new Error("jsPDF no está disponible.");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const title = project.nombre || "Civil Twin";
  const now = new Date().toLocaleString("es-ES");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Civil Twin - Reporte del Proyecto", 14, 16);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Proyecto: ${title}`, 14, 26);
  doc.text(`Generado: ${now}`, 14, 32);

  let y = 44;

  doc.setFont("helvetica", "bold");
  doc.text("Datos del proyecto", 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`Pisos: ${project.pisos}`, 14, y); y += 6;
  doc.text(`Dimensiones: ${project.largo} m x ${project.ancho} m`, 14, y); y += 6;
  doc.text(`Altura de piso: ${project.alturaPiso} m`, 14, y); y += 6;
  doc.text(`Estructura: ${project.estructura}`, 14, y); y += 6;
  doc.text(`Cimentación: ${project.cimentacion}`, 14, y); y += 6;
  doc.text(`Concreto: ${project.concreto}`, 14, y); y += 6;
  doc.text(`Ubicación: ${project.ubicacion || "-"}`, 14, y); y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Resumen", 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`Área construida: ${metrics.area.toFixed(2)} m²`, 14, y); y += 6;
  doc.text(`Volumen estimado: ${metrics.volume.toFixed(2)} m³`, 14, y); y += 6;
  doc.text(`Costo estimado: ${formatMoney(metrics.costs.totalCost)}`, 14, y); y += 6;
  doc.text(`Duración estimada: ${metrics.durationWeeks} semanas`, 14, y); y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Materiales", 14, y);
  y += 6;

  const materialRows = materialsTable.map(row => [row[0], row[1], row[2]]);
  if (doc.autoTable) {
    doc.autoTable({
      startY: y,
      head: [["Concepto", "Unidad", "Cantidad"]],
      body: materialRows,
      theme: "grid"
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    materialRows.forEach(r => {
      doc.setFont("helvetica", "normal");
      doc.text(`${r[0]}: ${r[2]} ${r[1]}`, 14, y);
      y += 6;
    });
    y += 4;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Cronograma", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  timeline.forEach(task => {
    doc.text(`• ${task.name} (${task.startWeek}-${task.endWeek} semanas)`, 14, y);
    y += 5.5;
  });

  const img = get3DImage();
  if (img) {
    if (y > 220) {
      doc.addPage();
      y = 14;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Modelo 3D", 14, y);
    y += 6;
    doc.addImage(img, "PNG", 14, y, 180, 90);
    y += 98;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Conclusiones", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Este reporte resume un modelo conceptual y estimaciones preliminares.", 14, y, { maxWidth: 180 });

  doc.save(`${sanitizeFileName(title)}-civil-twin.pdf`);
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value || 0);
}

function sanitizeFileName(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}
