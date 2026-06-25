/* ============================================
   WORKOUT GENERATOR ENGINE
   ============================================ */

import { EXERCISES, getRandomExercises } from './data.js';

const DURATION_CONFIG = {
  15: { totalExercises: 4 },
  30: { totalExercises: 5 },
  45: { totalExercises: 6 },
  60: { totalExercises: 7 },
  90: { totalExercises: 9 },
};

const SCIENTIFIC_GOAL_CONFIGS = {
  strength: {
    setsRange: [3, 5],
    repsRange: [3, 6],
    rest: 180, // 3 minutes for neural recovery
    intensityText: "80-85% 1RM"
  },
  hypertrophy: {
    setsRange: [3, 4],
    repsRange: [8, 12],
    rest: 90, // 90 seconds for metabolic hypertrophy
    intensityText: "70-80% 1RM"
  },
  endurance: {
    setsRange: [2, 3],
    repsRange: [15, 20],
    rest: 45, // 45 seconds for lactic threshold
    intensityText: "50-60% 1RM"
  },
  'fat-loss': {
    setsRange: [3, 4],
    repsRange: [8, 12],
    rest: 60, // Shorter rest for calorie density, preserving muscle
    intensityText: "65-75% 1RM"
  },
  powerlifting: {
    setsRange: [4, 5],
    repsRange: [1, 5],
    rest: 240, // 4 minutes for complete ATP resynthesis
    intensityText: "85-95% 1RM"
  },
  'cardio-conditioning': {
    setsRange: [2, 3],
    repsRange: [15, 25],
    rest: 30, // 30 seconds for aerobic conditioning
    intensityText: "40-50% 1RM"
  },
  'mobility-flexibility': {
    setsRange: [2, 3],
    repsRange: [8, 12],
    rest: 30, // Controlled eccentric movements
    intensityText: "Stretch & Control"
  }
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
 * @param {string} params.goal - Selected training goal
 * @returns {Object} Generated workout
 */
export function generateWorkout({ muscles = [], difficulty = 2, duration = 30, equipment = [], goal = 'hypertrophy', profile = null }) {
  const goalCfg = SCIENTIFIC_GOAL_CONFIGS[goal] || SCIENTIFIC_GOAL_CONFIGS.hypertrophy;

  const targetSeconds = duration * 60;
  
  // Default baseline exercise counts and bounds per duration
  const DURATION_CONFIGS = {
    15: { defaultEx: 3, minEx: 2, maxEx: 4 },
    30: { defaultEx: 4, minEx: 3, maxEx: 6 },
    45: { defaultEx: 5, minEx: 4, maxEx: 9 },
    60: { defaultEx: 6, minEx: 5, maxEx: 12 },
    90: { defaultEx: 8, minEx: 6, maxEx: 15 }
  };
  
  const durCfg = DURATION_CONFIGS[duration] || DURATION_CONFIGS[30];
  const defaultExCount = durCfg.defaultEx;
  const minExCount = durCfg.minEx;
  const maxExCount = durCfg.maxEx;
  
  const avgReps = Math.round((goalCfg.repsRange[0] + goalCfg.repsRange[1]) / 2);
  const restTime = goalCfg.rest;

  let bestNumEx = defaultExCount;
  let bestSets = Math.round((goalCfg.setsRange[0] + goalCfg.setsRange[1]) / 2);
  let minPenalty = Infinity;

  // Search grid of possible exercises and sets
  for (let numEx = minExCount; numEx <= maxExCount; numEx++) {
    for (let sets = 2; sets <= 6; sets++) {
      // Calculate estimated time for this configuration:
      // S * (reps * 3s + rest) + 60s transition per exercise
      const exTime = sets * (avgReps * 3 + restTime) + 60;
      const estTime = numEx * exTime - 60;

      const timeDiff = Math.abs(estTime - targetSeconds);
      
      // Calculate penalties
      let setPenalty = 0;
      if (sets < goalCfg.setsRange[0]) {
        setPenalty = (goalCfg.setsRange[0] - sets) * 200;
      } else if (sets > goalCfg.setsRange[1]) {
        setPenalty = (sets - goalCfg.setsRange[1]) * 200;
      }

      const exDiff = Math.abs(numEx - defaultExCount);
      const exPenalty = exDiff * 150;

      // Higher weight for time difference to prioritize duration accuracy
      const totalPenalty = timeDiff * 3 + setPenalty + exPenalty;

      if (totalPenalty < minPenalty) {
        minPenalty = totalPenalty;
        bestNumEx = numEx;
        bestSets = sets;
      }
    }
  }

  const totalExercises = bestNumEx;
  const targetSets = bestSets;

  // Distribute exercises across selected muscles
  const exercisesPerMuscle = Math.max(1, Math.floor(totalExercises / (muscles.length || 1)));
  const remaining = totalExercises - (exercisesPerMuscle * muscles.length);

  let selectedExercises = [];
  const usedIds = new Set();

  // Pick exercises per muscle group
  const muscleList = muscles.length ? muscles : ['Chest', 'Back', 'Shoulders'];
  muscleList.forEach((muscle, idx) => {
    const count = exercisesPerMuscle + (idx < remaining ? 1 : 0);
    const filters = { muscles: [muscle], goal };
    if (equipment.length) filters.equipment = equipment;

    const picks = getRandomExercises(filters, count + 3)
      .filter(e => !usedIds.has(e.id))
      .slice(0, count);

    picks.forEach(e => usedIds.add(e.id));
    selectedExercises.push(...picks);
  });

  // Fill if we're short
  if (selectedExercises.length < totalExercises) {
    const extraFilters = { muscles: muscleList, goal };
    if (equipment.length) extraFilters.equipment = equipment;
    const extras = getRandomExercises(extraFilters, 10)
      .filter(e => !usedIds.has(e.id))
      .slice(0, totalExercises - selectedExercises.length);
    selectedExercises.push(...extras);
  }

  // Trim to target
  selectedExercises = selectedExercises.slice(0, totalExercises);

  // SCIENTIFIC SORTING / ORDERING ALGORITHM
  // 1. Heavy barbell/dumbbell compound lifts first (Priority 1)
  // 2. Machine/cable compound lifts second (Priority 2)
  // 3. Isolation lifts third (Priority 3)
  // 4. Minor target groups / Core last (Priority 4)
  const getExercisePriority = (ex) => {
    if (ex.muscles.includes('Core') || ex.muscles.includes('Calves')) return 4;
    if (ex.type === 'compound') {
      if (['Barbell', 'Dumbbell'].includes(ex.equipment)) return 1;
      return 2;
    }
    return 3;
  };

  selectedExercises.sort((a, b) => getExercisePriority(a) - getExercisePriority(b));

  // Personalization based on profile
  let adjustedTargetSets = targetSets;
  let adjustedRest = goalCfg.rest;

  if (profile) {
    const level = profile.fitness_level?.toLowerCase();
    if (level === 'beginner') {
      adjustedTargetSets = Math.max(2, targetSets - 1);
    } else if (level === 'advanced') {
      adjustedTargetSets = Math.min(6, targetSets + 1);
    }
    if (profile.age && parseInt(profile.age) > 50) {
      adjustedRest += 15; // extra recovery
    }
  }

  // Assign sets, reps, rest
  const exercises = selectedExercises.map(ex => {
    const sets = adjustedTargetSets;
    const reps = randomBetween(goalCfg.repsRange[0], goalCfg.repsRange[1]);
    const restTime = adjustedRest;
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
    goal,
    exercises,
    totalExercises: exercises.length,
    estimatedMinutes: Math.round(estimatedTime / 60),
  };
}
