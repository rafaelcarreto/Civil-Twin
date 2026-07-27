// model3d.js
// Civil Twin - Motor 3D corregido con Three.js en modo módulo.
// Soporta:
// - rotación, zoom y paneo con OrbitControls
// - ejes
// - wireframe
// - sombras
// - reinicio de cámara
// - carga de plano de referencia como imagen/SVG
// - actualización del modelo desde los datos del proyecto

import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";

const state = {
  container: null,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  requestId: null,

  project: null,
  buildingGroup: null,
  referenceGroup: null,
  planMesh: null,
  planTexture: null,
  planUrl: null,

  wireframe: false,
  shadows: false,
};

function normalizeProject(project = {}) {
  return {
    nombre: project.nombre || "Civil Twin",
    pisos: Number(project.pisos) || 1,
    largo: Number(project.largo) || 20,
    ancho: Number(project.ancho) || 12,
    alturaPiso: Number(project.alturaPiso) || 3,
  };
}

function disposeScene() {
  cancelAnimationFrame(state.requestId);
  state.requestId = null;

  if (state.controls) {
    state.controls.dispose();
    state.controls = null;
  }

  if (state.renderer) {
    state.renderer.dispose();
    state.renderer.forceContextLoss?.();
    if (state.renderer.domElement && state.renderer.domElement.parentElement) {
      state.renderer.domElement.parentElement.removeChild(state.renderer.domElement);
    }
    state.renderer = null;
  }

  if (state.planTexture) {
    state.planTexture.dispose();
    state.planTexture = null;
  }

  state.planMesh = null;
  state.buildingGroup = null;
  state.referenceGroup = null;
  state.scene = null;
  state.camera = null;
}

function createScene(container) {
  state.container = container;
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0xf4f7fb);

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;

  state.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  state.camera.position.set(20, 16, 20);

  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  state.renderer.setSize(width, height);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  state.renderer.shadowMap.enabled = state.shadows;
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.innerHTML = "";
  container.appendChild(state.renderer.domElement);

  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = 0.08;
  state.controls.enablePan = true;
  state.controls.maxPolarAngle = Math.PI / 2.02;
  state.controls.target.set(0, 4, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.82);
  state.scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
  dirLight.position.set(18, 24, 12);
  dirLight.castShadow = state.shadows;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 80;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  state.scene.add(dirLight);

  const helper = new THREE.AxesHelper(10);
  state.scene.add(helper);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({
      color: 0xeaf0f7,
      roughness: 1,
      metalness: 0,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  state.scene.add(ground);

  state.referenceGroup = new THREE.Group();
  state.scene.add(state.referenceGroup);

  state.buildingGroup = new THREE.Group();
  state.scene.add(state.buildingGroup);

  window.addEventListener("resize", onResize);
}

function onResize() {
  if (!state.container || !state.camera || !state.renderer) return;

  const width = state.container.clientWidth || 800;
  const height = state.container.clientHeight || 500;

  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(width, height);
}

function clearBuilding() {
  if (!state.buildingGroup) return;

  while (state.buildingGroup.children.length) {
    const child = state.buildingGroup.children.pop();
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach(m => m.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  }
}

function clearReferencePlan() {
  if (!state.referenceGroup) return;

  while (state.referenceGroup.children.length) {
    const child = state.referenceGroup.children.pop();
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach(m => m.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  }

  state.planMesh = null;

  if (state.planTexture) {
    state.planTexture.dispose();
    state.planTexture = null;
  }

  if (state.planUrl) {
    URL.revokeObjectURL(state.planUrl);
    state.planUrl = null;
  }
}

function createFootprintGrid(project) {
  const length = project.largo;
  const width = project.ancho;

  const group = new THREE.Group();

  const mat = new THREE.LineBasicMaterial({ color: 0x7c8aa5 });
  const y = 0.02;

  const points = [
    new THREE.Vector3(-length / 2, y, -width / 2),
    new THREE.Vector3(length / 2, y, -width / 2),
    new THREE.Vector3(length / 2, y, width / 2),
    new THREE.Vector3(-length / 2, y, width / 2),
    new THREE.Vector3(-length / 2, y, -width / 2),
  ];

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const outline = new THREE.Line(geo, mat);
  group.add(outline);

  // retícula sencilla de referencia
  const gridSizeX = Math.max(2, Math.round(length / 5));
  const gridSizeY = Math.max(2, Math.round(width / 5));

  for (let i = 1; i < gridSizeX; i++) {
    const x = -length / 2 + (length / gridSizeX) * i;
    const linePoints = [
      new THREE.Vector3(x, y, -width / 2),
      new THREE.Vector3(x, y, width / 2),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), mat));
  }

  for (let i = 1; i < gridSizeY; i++) {
    const z = -width / 2 + (width / gridSizeY) * i;
    const linePoints = [
      new THREE.Vector3(-length / 2, y, z),
      new THREE.Vector3(length / 2, y, z),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), mat));
  }

  return group;
}

function createColumns(project) {
  const length = project.largo;
  const width = project.ancho;
  const floors = project.pisos;
  const height = project.alturaPiso;

  const group = new THREE.Group();

  const gridX = Math.max(2, Math.round(length / 6));
  const gridY = Math.max(2, Math.round(width / 6));

  const columnRadius = 0.18;
  const columnMat = new THREE.MeshStandardMaterial({
    color: 0x0f2747,
    wireframe: state.wireframe,
    roughness: 0.8,
    metalness: 0.05,
  });

  for (let ix = 0; ix <= gridX; ix++) {
    for (let iy = 0; iy <= gridY; iy++) {
      const x = -length / 2 + (length / gridX) * ix;
      const z = -width / 2 + (width / gridY) * iy;
      const colHeight = floors * height + 0.2;

      const geometry = new THREE.CylinderGeometry(columnRadius, columnRadius, colHeight, 16);
      const column = new THREE.Mesh(geometry, columnMat.clone());
      column.position.set(x, colHeight / 2, z);
      column.castShadow = state.shadows;
      column.receiveShadow = state.shadows;
      group.add(column);
    }
  }

  return group;
}

function createSlabs(project) {
  const length = project.largo;
  const width = project.ancho;
  const floors = project.pisos;
  const floorHeight = project.alturaPiso;

  const group = new THREE.Group();
  const slabThickness = 0.18;

  for (let i = 0; i < floors; i++) {
    const y = (i + 1) * floorHeight - slabThickness / 2;

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.98, slabThickness, width * 0.98),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x1d4ed8 : 0x274c77,
        wireframe: state.wireframe,
        roughness: 0.85,
        metalness: 0.04,
      })
    );

    slab.position.set(0, y, 0);
    slab.castShadow = state.shadows;
    slab.receiveShadow = state.shadows;
    group.add(slab);
  }

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(length * 1.01, 0.2, width * 1.01),
    new THREE.MeshStandardMaterial({
      color: 0x0b1b33,
      wireframe: state.wireframe,
      roughness: 0.9,
    })
  );
  roof.position.set(0, floors * floorHeight + 0.12, 0);
  roof.castShadow = state.shadows;
  roof.receiveShadow = state.shadows;
  group.add(roof);

  return group;
}

function createPerimeterBeams(project) {
  const length = project.largo;
  const width = project.ancho;
  const floors = project.pisos;
  const floorHeight = project.alturaPiso;

  const group = new THREE.Group();

  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    wireframe: state.wireframe,
    roughness: 0.75,
  });

  const beamThickness = 0.22;
  const beamDepth = 0.28;
  const beamHeightOffset = floorHeight - 0.18;

  for (let i = 0; i < floors; i++) {
    const y = i * floorHeight + beamHeightOffset;

    const horizontalA = new THREE.Mesh(
      new THREE.BoxGeometry(length, beamThickness, beamDepth),
      beamMat.clone()
    );
    horizontalA.position.set(0, y, -width / 2 + beamDepth / 2);
    horizontalA.castShadow = state.shadows;

    const horizontalB = horizontalA.clone();
    horizontalB.position.z = width / 2 - beamDepth / 2;

    const verticalA = new THREE.Mesh(
      new THREE.BoxGeometry(beamDepth, beamThickness, width),
      beamMat.clone()
    );
    verticalA.position.set(-length / 2 + beamDepth / 2, y, 0);
    verticalA.castShadow = state.shadows;

    const verticalB = verticalA.clone();
    verticalB.position.x = length / 2 - beamDepth / 2;

    group.add(horizontalA, horizontalB, verticalA, verticalB);
  }

  return group;
}

function buildBuilding(project) {
  clearBuilding();

  const normalized = normalizeProject(project);
  state.project = normalized;

  const footprint = createFootprintGrid(normalized);
  state.buildingGroup.add(footprint);

  const columns = createColumns(normalized);
  const slabs = createSlabs(normalized);
  const beams = createPerimeterBeams(normalized);

  state.buildingGroup.add(columns);
  state.buildingGroup.add(slabs);
  state.buildingGroup.add(beams);

  // Centrar grupo por si hay cambios futuros
  state.buildingGroup.position.set(0, 0, 0);
}

function renderReferencePlanFromUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    if (!state.referenceGroup) {
      reject(new Error("La escena 3D no está inicializada."));
      return;
    }

    clearReferencePlan();

    const widthMeters = Number(options.widthMeters) || state.project?.largo || 20;
    const depthMeters = Number(options.depthMeters) || state.project?.ancho || 12;
    const opacity = options.opacity ?? 0.55;

    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        state.planTexture = texture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        const geometry = new THREE.PlaneGeometry(widthMeters, depthMeters);
        state.planMesh = new THREE.Mesh(geometry, material);
        state.planMesh.rotation.x = -Math.PI / 2;
        state.planMesh.position.y = 0.015;

        state.referenceGroup.add(state.planMesh);
        resolve(true);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function animate() {
  state.requestId = requestAnimationFrame(animate);

  if (state.controls) state.controls.update();
  if (state.renderer && state.scene && state.camera) {
    state.renderer.render(state.scene, state.camera);
  }
}

export async function init3D(container, project, options = {}) {
  disposeScene();

  createScene(container);
  buildBuilding(project);

  if (options.planUrl) {
    try {
      await setPlanReferenceFromUrl(options.planUrl, {
        widthMeters: options.planWidthMeters,
        depthMeters: options.planDepthMeters,
        opacity: options.planOpacity,
      });
    } catch (error) {
      console.warn("No se pudo cargar el plano de referencia:", error);
    }
  }

  animate();
}

export function update3D(project) {
  if (!state.scene || !state.container) return;
  buildBuilding(project);

  // Si hay plano cargado, lo mantenemos visible y reescalado según proyecto
  if (state.planUrl && state.planMesh) {
    const widthMeters = state.project?.largo || 20;
    const depthMeters = state.project?.ancho || 12;
    state.planMesh.geometry.dispose();
    state.planMesh.geometry = new THREE.PlaneGeometry(widthMeters, depthMeters);
    state.planMesh.rotation.x = -Math.PI / 2;
    state.planMesh.position.y = 0.015;
  }
}

export function toggleWireframe(project) {
  state.wireframe = !state.wireframe;
  update3D(project);
  return state.wireframe;
}

export function toggleShadows(project) {
  state.shadows = !state.shadows;

  if (state.renderer) state.renderer.shadowMap.enabled = state.shadows;
  update3D(project);
  return state.shadows;
}

export function resetView() {
  if (!state.camera || !state.controls) return;

  state.camera.position.set(20, 16, 20);
  state.controls.target.set(0, 4, 0);
  state.controls.update();
}

export async function setPlanReferenceFromFile(file, options = {}) {
  if (!file) throw new Error("No se recibió ningún archivo.");

  const mime = file.type || "";
  const isImage = mime.startsWith("image/");

  if (!isImage) {
    throw new Error(
      "Por ahora este módulo acepta imágenes (PNG, JPG, WEBP, SVG). Para PDF se añadirá soporte en la fase 2 con pdf.js."
    );
  }

  if (state.planUrl) {
    URL.revokeObjectURL(state.planUrl);
    state.planUrl = null;
  }

  const objectUrl = URL.createObjectURL(file);
  state.planUrl = objectUrl;

  await setPlanReferenceFromUrl(objectUrl, options);
  return true;
}

export async function setPlanReferenceFromUrl(url, options = {}) {
  if (!state.scene) {
    // Se guarda para cuando se inicialice el motor
    state.planUrl = url;
    return true;
  }

  state.planUrl = url;
  return renderReferencePlanFromUrl(url, options);
}

export function clearPlanReference() {
  clearReferencePlan();
}

export function get3DImage() {
  if (!state.renderer) return null;
  return state.renderer.domElement.toDataURL("image/png");
}
