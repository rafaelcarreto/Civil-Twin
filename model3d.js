// model3d.js
// Vista 3D conceptual con Three.js.

let scene, camera, renderer, controls;
let buildingGroup;
let wireframeMode = false;
let shadowsEnabled = false;

export function init3D(container, project) {
  if (!window.THREE) return;

  container.innerHTML = "";

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f7fb);

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(18, 16, 18);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.shadowMap.enabled = shadowsEnabled;
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 4, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 1.1);
  directional.position.set(12, 20, 10);
  directional.castShadow = shadowsEnabled;
  scene.add(directional);

  const axes = new THREE.AxesHelper(10);
  scene.add(axes);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0xe8eef6, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  buildingGroup = new THREE.Group();
  scene.add(buildingGroup);

  buildConceptBuilding(project);

  animate();
  window.addEventListener("resize", onResize);
}

function buildConceptBuilding(project) {
  if (!buildingGroup) return;

  buildingGroup.clear();

  const floors = Number(project.pisos) || 1;
  const length = Number(project.largo) || 10;
  const width = Number(project.ancho) || 8;
  const floorHeight = Number(project.alturaPiso) || 3;

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    metalness: 0.05,
    roughness: 0.8,
    wireframe: wireframeMode
  });

  for (let i = 0; i < floors; i++) {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(length, floorHeight * 0.9, width),
      bodyMaterial.clone()
    );
    floor.position.y = i * floorHeight + floorHeight / 2;
    floor.castShadow = shadowsEnabled;
    floor.receiveShadow = shadowsEnabled;
    buildingGroup.add(floor);
  }

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(length + 0.4, 0.5, width + 0.4),
    new THREE.MeshStandardMaterial({
      color: 0x0f2747,
      wireframe: wireframeMode
    })
  );
  roof.position.y = floors * floorHeight + 0.25;
  roof.castShadow = shadowsEnabled;
  buildingGroup.add(roof);

  buildingGroup.position.set(0, 0, 0);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onResize() {
  if (!renderer || !camera) return;
  const container = renderer.domElement.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

export function update3D(project) {
  if (!scene) return;
  buildConceptBuilding(project);
}

export function toggleWireframe(project) {
  wireframeMode = !wireframeMode;
  update3D(project);
  return wireframeMode;
}

export function toggleShadows(project) {
  shadowsEnabled = !shadowsEnabled;
  if (renderer) renderer.shadowMap.enabled = shadowsEnabled;
  update3D(project);
  return shadowsEnabled;
}

export function resetView() {
  if (!camera || !controls) return;
  camera.position.set(18, 16, 18);
  controls.target.set(0, 4, 0);
  controls.update();
}

export function get3DImage() {
  if (!renderer) return null;
  return renderer.domElement.toDataURL("image/png");
}
