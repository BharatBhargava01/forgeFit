/* ============================================
   WORKOUT GENERATOR ENGINE
   ============================================ */

import { EXERCISES, getRandomExercises } from './data.js';

const DURATION_CONFIG = {
  15: { totalExercises: 4, setsRange: [2, 3] },
  30: { totalExercises: 5, setsRange: [3, 4] },
  45: { totalExercises: 6, setsRange: [3, 4] },
  60: { totalExercises: 7, setsRange: [3, 5] },
  90: { totalExercises: 9, setsRange: [4, 5] },
};

const DIFFICULTY_REPS = {
  1: { compound: { min: 10, max: 15 }, isolation: { min: 12, max: 20 } },
  2: { compound: { min: 6, max: 12 }, isolation: { min: 10, max: 15 } },
  3: { compound: { min: 3, max: 6 },  isolation: { min: 6, max: 10 } },
};

const REST_TIMES = {
  1: { compound: 60, isolation: 45 },
  2: { compound: 90, isolation: 60 },
  3: { compound: 120, isolation: 90 },
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a workout from user parameters.
 * @param {Object} params
 * @param {string[]} params.muscles - Selected muscle groups
 * @param {number} params.difficulty - 1 (easy), 2 (medium), 3 (hard)
 * @param {number} params.duration - Minutes: 15, 30, 45, 60, 90
 * @param {string[]} params.equipment - Available equipment (empty = all)
 * @returns {Object} Generated workout
 */
export function generateWorkout({ muscles = [], difficulty = 2, duration = 30, equipment = [] }) {
  const config = DURATION_CONFIG[duration] || DURATION_CONFIG[30];
  const diffReps = DIFFICULTY_REPS[difficulty] || DIFFICULTY_REPS[2];
  const rest = REST_TIMES[difficulty] || REST_TIMES[2];

  // Distribute exercises across selected muscles
  const exercisesPerMuscle = Math.max(1, Math.floor(config.totalExercises / (muscles.length || 1)));
  const remaining = config.totalExercises - (exercisesPerMuscle * muscles.length);

  let selectedExercises = [];
  const usedIds = new Set();

  // Pick exercises per muscle group
  const muscleList = muscles.length ? muscles : ['Chest', 'Back', 'Shoulders'];
  muscleList.forEach((muscle, idx) => {
    const count = exercisesPerMuscle + (idx < remaining ? 1 : 0);
    const filters = { muscles: [muscle] };
    if (equipment.length) filters.equipment = equipment;

    const picks = getRandomExercises(filters, count + 3)
      .filter(e => !usedIds.has(e.id))
      .slice(0, count);

    picks.forEach(e => usedIds.add(e.id));
    selectedExercises.push(...picks);
  });

  // Fill if we're short
  if (selectedExercises.length < config.totalExercises) {
    const extraFilters = { muscles: muscleList };
    if (equipment.length) extraFilters.equipment = equipment;
    const extras = getRandomExercises(extraFilters, 10)
      .filter(e => !usedIds.has(e.id))
      .slice(0, config.totalExercises - selectedExercises.length);
    selectedExercises.push(...extras);
  }

  // Trim to target
  selectedExercises = selectedExercises.slice(0, config.totalExercises);

  // Sort: compounds first
  selectedExercises.sort((a, b) => {
    if (a.type === 'compound' && b.type !== 'compound') return -1;
    if (a.type !== 'compound' && b.type === 'compound') return 1;
    return 0;
  });

  // Assign sets, reps, rest
  const exercises = selectedExercises.map(ex => {
    const repRange = diffReps[ex.type] || diffReps.compound;
    const sets = randomBetween(config.setsRange[0], config.setsRange[1]);
    const reps = randomBetween(repRange.min, repRange.max);
    const restTime = rest[ex.type] || rest.compound;
    return { ...ex, sets, reps, rest: restTime };
  });

  // Calculate estimated duration
  const estimatedTime = exercises.reduce((acc, ex) => {
    const setDuration = (ex.reps * 3 + ex.rest) * ex.sets; // rough: 3s per rep + rest
    return acc + setDuration;
  }, 0);

  return {
    muscles: muscleList,
    difficulty,
    duration,
    exercises,
    totalExercises: exercises.length,
    estimatedMinutes: Math.round(estimatedTime / 60),
  };
}
