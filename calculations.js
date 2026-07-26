// calculations.js
// Cálculos base para Civil Twin.
// En esta etapa se deja la lógica fundacional, lista para crecer.

export function calculateProjectMetrics(project) {
  const floors = Number(project.pisos) || 0;
  const length = Number(project.largo) || 0;
  const width = Number(project.ancho) || 0;
  const floorHeight = Number(project.alturaPiso) || 0;

  const area = length * width;
  const height = floors * floorHeight;
  const volume = area * height;

  // Estimaciones conceptuales.
  const concrete = volume * 0.22; // m³ aprox.
  const steel = concrete * 120;   // kg aprox.
  const brick = area * floors * 18; // unidades aprox.
  const blocks = area * floors * 8;  // unidades aprox.

  const cementBags = concrete * 7.5;
  const sand = concrete * 0.42;    // m³
  const gravel = concrete * 0.68;   // m³
  const water = concrete * 180;    // litros

  // Costos base de referencia.
  const costConcrete = concrete * (project.prices?.concrete ?? 110);
  const costSteel = steel * (project.prices?.steel ?? 1.25);
  const costCement = cementBags * (project.prices?.cement ?? 9.5);
  const costSand = sand * (project.prices?.sand ?? 24);
  const costGravel = gravel * (project.prices?.gravel ?? 28);

  const totalCost = costConcrete + costSteel + costCement + costSand + costGravel;
  const costPerM2 = area > 0 ? totalCost / area : 0;
  const costPerFloor = floors > 0 ? totalCost / floors : 0;

  const durationWeeks = Math.max(8, Math.round(floors * 4.2 + area / 140));

  return {
    area,
    height,
    volume,
    materials: {
      concrete,
      steel,
      brick,
      blocks,
      cementBags,
      sand,
      gravel,
      water
    },
    costs: {
      concrete: costConcrete,
      steel: costSteel,
      cement: costCement,
      sand: costSand,
      gravel: costGravel,
      totalCost,
      costPerM2,
      costPerFloor
    },
    durationWeeks
  };
}

export function buildTimeline(project) {
  const floors = Number(project.pisos) || 1;
  const base = [
    { name: "Excavación", weeks: 1 },
    { name: "Cimentación", weeks: 2 },
    { name: "Columnas", weeks: Math.max(1, Math.ceil(floors / 2)) },
    { name: "Vigas", weeks: Math.max(1, Math.ceil(floors / 2)) },
    { name: "Losas", weeks: floors },
    { name: "Muros", weeks: floors },
    { name: "Acabados", weeks: Math.max(2, Math.ceil(floors * 0.8)) },
    { name: "Instalaciones", weeks: Math.max(2, Math.ceil(floors * 0.7)) },
    { name: "Entrega", weeks: 1 }
  ];

  let current = 0;
  return base.map((task, index) => {
    const start = current;
    current += task.weeks;
    const progress = Math.min(100, Math.round(((index + 1) / base.length) * 100));
    return {
      ...task,
      startWeek: start + 1,
      endWeek: current,
      progress
    };
  });
}

export function buildMaterialsTable(metrics) {
  const m = metrics.materials;
  return [
    ["Área", "m²", metrics.area.toFixed(2)],
    ["Volumen estimado", "m³", metrics.volume.toFixed(2)],
    ["Concreto", "m³", m.concrete.toFixed(2)],
    ["Acero aproximado", "kg", m.steel.toFixed(2)],
    ["Ladrillo aproximado", "und", Math.round(m.brick).toLocaleString("es-ES")],
    ["Bloques", "und", Math.round(m.blocks).toLocaleString("es-ES")],
    ["Cemento", "bolsas", m.cementBags.toFixed(2)],
    ["Arena", "m³", m.sand.toFixed(2)],
    ["Grava", "m³", m.gravel.toFixed(2)],
    ["Agua", "L", Math.round(m.water).toLocaleString("es-ES")]
  ];
}
