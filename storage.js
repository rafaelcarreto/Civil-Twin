// storage.js
// Persistencia local para Civil Twin.

const STORAGE_KEY = "civil-twin-project";

export function saveProject(project) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

export function loadProject() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function deleteProject() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasProject() {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}
