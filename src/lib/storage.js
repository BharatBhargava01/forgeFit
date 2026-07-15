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
    const result = await apiRequest('/workouts', {
      method: 'POST',
      body: JSON.stringify(workout),
    });
    const cache = readLocal('wg_workouts_cache');
    cache.unshift(result);
    writeLocal('wg_workouts_cache', cache);
    return result;
  } catch {
    const workouts = readLocal('wg_saved_workouts');
    const entry = { id: generateId(), ...workout, savedAt: new Date().toISOString() };
    workouts.unshift(entry);
    writeLocal('wg_saved_workouts', workouts);
    return entry;
  }
}

export async function getWorkouts() {
  try {
    const workouts = await apiRequest('/workouts');
    writeLocal('wg_workouts_cache', workouts);
    const pending = readLocal('wg_saved_workouts');
    const fetchedIds = new Set(workouts.map(w => w.id));
    const uniquePending = pending.filter(p => !fetchedIds.has(p.id));
    const deletedIds = new Set(readLocal('wg_deleted_workouts'));
    const filteredWorkouts = workouts.filter(w => !deletedIds.has(w.id));
    return [...uniquePending, ...filteredWorkouts];
  } catch {
    const cached = readLocal('wg_workouts_cache');
    const pending = readLocal('wg_saved_workouts');
    const deletedIds = new Set(readLocal('wg_deleted_workouts'));
    const combined = [...pending, ...cached];
    return combined.filter(w => !deletedIds.has(w.id));
  }
}

export async function deleteWorkout(id) {
  const pending = readLocal('wg_saved_workouts');
  const inPending = pending.some(w => w.id === id);

  if (inPending) {
    const updated = pending.filter(w => w.id !== id);
    writeLocal('wg_saved_workouts', updated);
    return;
  }

  try {
    await apiRequest(`/workouts/${id}`, { method: 'DELETE' });
    const cache = readLocal('wg_workouts_cache').filter(w => w.id !== id);
    writeLocal('wg_workouts_cache', cache);
  } catch {
    const deletes = readLocal('wg_deleted_workouts');
    if (!deletes.includes(id)) {
      deletes.push(id);
      writeLocal('wg_deleted_workouts', deletes);
    }
    const cache = readLocal('wg_workouts_cache').filter(w => w.id !== id);
    writeLocal('wg_workouts_cache', cache);
  }
}

/* --- Routines --- */

export async function saveRoutine(routine) {
  try {
    const result = await apiRequest('/routines', {
      method: 'POST',
      body: JSON.stringify(routine),
    });
    const cache = readLocal('wg_routines_cache');
    cache.unshift(result);
    writeLocal('wg_routines_cache', cache);
    return result;
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
    const routines = await apiRequest('/routines');
    writeLocal('wg_routines_cache', routines);
    const pending = readLocal('wg_saved_routines');
    const fetchedIds = new Set(routines.map(r => r.id));
    const uniquePending = pending.filter(p => !fetchedIds.has(p.id));
    const deletedIds = new Set(readLocal('wg_deleted_routines'));
    const filteredRoutines = routines.filter(r => !deletedIds.has(r.id));
    return [...uniquePending, ...filteredRoutines];
  } catch {
    const cached = readLocal('wg_routines_cache');
    const pending = readLocal('wg_saved_routines');
    const deletedIds = new Set(readLocal('wg_deleted_routines'));
    const combined = [...pending, ...cached];
    return combined.filter(r => !deletedIds.has(r.id));
  }
}

export async function deleteRoutine(id) {
  const pending = readLocal('wg_saved_routines');
  const inPending = pending.some(r => r.id === id);

  if (inPending) {
    const updated = pending.filter(r => r.id !== id);
    writeLocal('wg_saved_routines', updated);
    return;
  }

  try {
    await apiRequest(`/routines/${id}`, { method: 'DELETE' });
    const cache = readLocal('wg_routines_cache').filter(r => r.id !== id);
    writeLocal('wg_routines_cache', cache);
  } catch {
    const deletes = readLocal('wg_deleted_routines');
    if (!deletes.includes(id)) {
      deletes.push(id);
      writeLocal('wg_deleted_routines', deletes);
    }
    const cache = readLocal('wg_routines_cache').filter(r => r.id !== id);
    writeLocal('wg_routines_cache', cache);
  }
}

/* --- Custom Exercises --- */

export async function saveCustomExercise(exercise) {
  try {
    const result = await apiRequest('/exercises/custom', {
      method: 'POST',
      body: JSON.stringify(exercise),
    });
    const cache = readLocal('wg_custom_exercises_cache');
    cache.unshift(result);
    writeLocal('wg_custom_exercises_cache', cache);
    return result;
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
    const exercises = await apiRequest('/exercises/custom');
    writeLocal('wg_custom_exercises_cache', exercises);
    const pending = readLocal('wg_custom_exercises');
    const fetchedIds = new Set(exercises.map(e => e.id));
    const uniquePending = pending.filter(p => !fetchedIds.has(p.id));
    const deletedIds = new Set(readLocal('wg_deleted_exercises'));
    const filteredExercises = exercises.filter(e => !deletedIds.has(e.id));
    return [...uniquePending, ...filteredExercises];
  } catch {
    const cached = readLocal('wg_custom_exercises_cache');
    const pending = readLocal('wg_custom_exercises');
    const deletedIds = new Set(readLocal('wg_deleted_exercises'));
    const combined = [...pending, ...cached];
    return combined.filter(e => !deletedIds.has(e.id));
  }
}

export async function deleteCustomExercise(id) {
  const pending = readLocal('wg_custom_exercises');
  const inPending = pending.some(e => e.id === id);

  if (inPending) {
    const updated = pending.filter(e => e.id !== id);
    writeLocal('wg_custom_exercises', updated);
    return;
  }

  try {
    await apiRequest(`/exercises/custom/${id}`, { method: 'DELETE' });
    const cache = readLocal('wg_custom_exercises_cache').filter(e => e.id !== id);
    writeLocal('wg_custom_exercises_cache', cache);
  } catch {
    const deletes = readLocal('wg_deleted_exercises');
    if (!deletes.includes(id)) {
      deletes.push(id);
      writeLocal('wg_deleted_exercises', deletes);
    }
    const cache = readLocal('wg_custom_exercises_cache').filter(e => e.id !== id);
    writeLocal('wg_custom_exercises_cache', cache);
  }
}

/* --- Workout Logs --- */

export async function saveWorkoutLog(log) {
  try {
    const result = await apiRequest('/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
    const cache = readLocal('wg_workout_logs_cache');
    cache.unshift(result);
    writeLocal('wg_workout_logs_cache', cache);
    return result;
  } catch {
    const logs = readLocal('wg_workout_logs');
    const entry = { id: generateId(), ...log, loggedAt: log.date || new Date().toISOString() };
    logs.unshift(entry);
    writeLocal('wg_workout_logs', logs);
    return entry;
  }
}

export async function getWorkoutLogs() {
  try {
    const logs = await apiRequest('/logs');
    writeLocal('wg_workout_logs_cache', logs);
    const pending = readLocal('wg_workout_logs');
    const fetchedIds = new Set(logs.map(l => l.id));
    const uniquePending = pending.filter(p => !fetchedIds.has(p.id));
    const deletedIds = new Set(readLocal('wg_deleted_logs'));
    const filteredLogs = logs.filter(l => !deletedIds.has(l.id));
    return [...uniquePending, ...filteredLogs];
  } catch {
    const cached = readLocal('wg_workout_logs_cache');
    const pending = readLocal('wg_workout_logs');
    const deletedIds = new Set(readLocal('wg_deleted_logs'));
    const combined = [...pending, ...cached];
    return combined.filter(l => !deletedIds.has(l.id));
  }
}

export async function deleteWorkoutLog(id) {
  const pending = readLocal('wg_workout_logs');
  const inPending = pending.some(l => l.id === id);

  if (inPending) {
    const updated = pending.filter(l => l.id !== id);
    writeLocal('wg_workout_logs', updated);
    return;
  }

  try {
    await apiRequest(`/logs/${id}`, { method: 'DELETE' });
    const cache = readLocal('wg_workout_logs_cache').filter(l => l.id !== id);
    writeLocal('wg_workout_logs_cache', cache);
  } catch {
    const deletes = readLocal('wg_deleted_logs');
    if (!deletes.includes(id)) {
      deletes.push(id);
      writeLocal('wg_deleted_logs', deletes);
    }
    const cache = readLocal('wg_workout_logs_cache').filter(l => l.id !== id);
    writeLocal('wg_workout_logs_cache', cache);
  }
}

export async function updateWorkoutLog(id, updatedLog) {
  try {
    const result = await apiRequest(`/logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedLog),
    });
    let cache = readLocal('wg_workout_logs_cache');
    cache = cache.map(l => l.id === id ? result : l);
    writeLocal('wg_workout_logs_cache', cache);
    return result;
  } catch {
    // If pending offline log, update it
    let pending = readLocal('wg_workout_logs');
    if (pending.some(l => l.id === id)) {
      pending = pending.map(l => l.id === id ? { ...l, ...updatedLog } : l);
      writeLocal('wg_workout_logs', pending);
      return { id, ...updatedLog };
    }
    
    // Otherwise, update the cached log
    let cache = readLocal('wg_workout_logs_cache');
    cache = cache.map(l => l.id === id ? { ...l, ...updatedLog } : l);
    writeLocal('wg_workout_logs_cache', cache);
    
    // Save locally for sync
    const updates = readLocal('wg_updated_logs');
    const existingIdx = updates.findIndex(u => u.id === id);
    if (existingIdx !== -1) {
      updates[existingIdx] = { id, ...updatedLog };
    } else {
      updates.push({ id, ...updatedLog });
    }
    writeLocal('wg_updated_logs', updates);
    return { id, ...updatedLog };
  }
}

/* --- Synchronization --- */

async function syncCollection(key, url) {
  const localItems = readLocal(key);
  if (!localItems.length) return false;

  console.log(`[Sync] Syncing ${localItems.length} items for ${key}...`);
  const failedToSync = [];
  let successCount = 0;

  for (const item of localItems) {
    try {
      const payload = { ...item };
      delete payload.id;
      delete payload.savedAt;
      delete payload.loggedAt;
      delete payload.createdAt;
      delete payload.isCustom;

      await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      successCount++;
    } catch (err) {
      console.error(`[Sync] Failed to sync item from ${key}:`, err);
      failedToSync.push(item);
    }
  }

  writeLocal(key, failedToSync);
  return successCount > 0;
}

async function syncDeletes(key, url) {
  const deleteIds = readLocal(key);
  if (!deleteIds.length) return false;

  console.log(`[Sync] Syncing ${deleteIds.length} deletions for ${key}...`);
  const failedDeletes = [];
  let successCount = 0;

  for (const id of deleteIds) {
    try {
      await apiRequest(`${url}/${id}`, { method: 'DELETE' });
      successCount++;
    } catch (err) {
      console.error(`[Sync] Failed to sync deletion of ${id} from ${key}:`, err);
      failedDeletes.push(id);
    }
  }

  writeLocal(key, failedDeletes);
  return successCount > 0;
}

async function syncUpdates(key, url) {
  const localItems = readLocal(key);
  if (!localItems.length) return false;

  console.log(`[Sync] Syncing ${localItems.length} updates for ${key}...`);
  const failedToSync = [];
  let successCount = 0;

  for (const item of localItems) {
    try {
      const payload = { ...item };
      const id = payload.id;
      delete payload.id;
      delete payload.loggedAt;
      delete payload.createdAt;
      delete payload.isCustom;

      await apiRequest(`${url}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      successCount++;
    } catch (err) {
      console.error(`[Sync] Failed to sync update from ${key}:`, err);
      failedToSync.push(item);
    }
  }

  writeLocal(key, failedToSync);
  return successCount > 0;
}

export async function syncOfflineData() {
  if (typeof window === 'undefined' || !navigator.onLine) return false;

  console.log('[Sync] Starting offline data synchronization...');

  try {
    const results = await Promise.all([
      syncCollection('wg_custom_exercises', '/exercises/custom'),
      syncCollection('wg_saved_workouts', '/workouts'),
      syncCollection('wg_saved_routines', '/routines'),
      syncCollection('wg_workout_logs', '/logs'),
      syncUpdates('wg_updated_logs', '/logs'),

      syncDeletes('wg_deleted_exercises', '/exercises/custom'),
      syncDeletes('wg_deleted_workouts', '/workouts'),
      syncDeletes('wg_deleted_routines', '/routines'),
      syncDeletes('wg_deleted_logs', '/logs'),
    ]);

    const anySynced = results.some(r => r === true);
    if (anySynced) {
      console.log('[Sync] Synchronization complete!');
    }
    return anySynced;
  } catch (err) {
    console.error('[Sync] Sync failed:', err);
    return false;
  }
}
