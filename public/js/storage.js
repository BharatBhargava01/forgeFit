/* ============================================
   STORAGE LAYER — API with localStorage fallback
   ============================================ */

const API_BASE = '/api';

/* --- Helpers --- */

async function apiRequest(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function readLocal(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function writeLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* --- Workouts --- */

export async function saveWorkout(workout) {
  try {
    return await apiRequest('/workouts', {
      method: 'POST',
      body: JSON.stringify(workout),
    });
  } catch {
    // Fallback to localStorage
    const workouts = readLocal('wg_saved_workouts');
    const entry = { id: generateId(), ...workout, savedAt: new Date().toISOString() };
    workouts.unshift(entry);
    writeLocal('wg_saved_workouts', workouts);
    return entry;
  }
}

export async function getWorkouts() {
  try {
    return await apiRequest('/workouts');
  } catch {
    return readLocal('wg_saved_workouts');
  }
}

export async function deleteWorkout(id) {
  try {
    await apiRequest(`/workouts/${id}`, { method: 'DELETE' });
  } catch {
    const workouts = readLocal('wg_saved_workouts').filter(w => w.id !== id);
    writeLocal('wg_saved_workouts', workouts);
  }
}

/* --- Routines --- */

export async function saveRoutine(routine) {
  try {
    return await apiRequest('/routines', {
      method: 'POST',
      body: JSON.stringify(routine),
    });
  } catch {
    const routines = readLocal('wg_saved_routines');
    const entry = { id: generateId(), ...routine, savedAt: new Date().toISOString() };
    routines.unshift(entry);
    writeLocal('wg_saved_routines', routines);
    return entry;
  }
}

export async function getRoutines() {
  try {
    return await apiRequest('/routines');
  } catch {
    return readLocal('wg_saved_routines');
  }
}

export async function deleteRoutine(id) {
  try {
    await apiRequest(`/routines/${id}`, { method: 'DELETE' });
  } catch {
    const routines = readLocal('wg_saved_routines').filter(r => r.id !== id);
    writeLocal('wg_saved_routines', routines);
  }
}

/* --- Custom Exercises --- */

export async function saveCustomExercise(exercise) {
  try {
    return await apiRequest('/exercises/custom', {
      method: 'POST',
      body: JSON.stringify(exercise),
    });
  } catch {
    const exercises = readLocal('wg_custom_exercises');
    const entry = { id: generateId(), ...exercise, isCustom: true, createdAt: new Date().toISOString() };
    exercises.unshift(entry);
    writeLocal('wg_custom_exercises', exercises);
    return entry;
  }
}

export async function getCustomExercises() {
  try {
    return await apiRequest('/exercises/custom');
  } catch {
    return readLocal('wg_custom_exercises');
  }
}

export async function deleteCustomExercise(id) {
  try {
    await apiRequest(`/exercises/custom/${id}`, { method: 'DELETE' });
  } catch {
    const exercises = readLocal('wg_custom_exercises').filter(e => e.id !== id);
    writeLocal('wg_custom_exercises', exercises);
  }
}

/* --- Workout Logs --- */

export async function saveWorkoutLog(log) {
  try {
    return await apiRequest('/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  } catch {
    const logs = readLocal('wg_workout_logs');
    const entry = { id: generateId(), ...log, loggedAt: new Date().toISOString() };
    logs.unshift(entry);
    writeLocal('wg_workout_logs', logs);
    return entry;
  }
}

export async function getWorkoutLogs() {
  try {
    return await apiRequest('/logs');
  } catch {
    return readLocal('wg_workout_logs');
  }
}

export async function deleteWorkoutLog(id) {
  try {
    await apiRequest(`/logs/${id}`, { method: 'DELETE' });
  } catch {
    const logs = readLocal('wg_workout_logs').filter(l => l.id !== id);
    writeLocal('wg_workout_logs', logs);
  }
}
