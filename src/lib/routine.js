/* ============================================
   ROUTINE GENERATOR ENGINE
   ============================================ */

import { SPLIT_TYPES, getRandomExercises } from './data.js';

const GOAL_CONFIG = {
  strength: { setsRange: [4, 5], repsRange: [3, 6], rest: 120, exercisesPerDay: 5 },
  hypertrophy: { setsRange: [3, 4], repsRange: [8, 12], rest: 75, exercisesPerDay: 6 },
  endurance: { setsRange: [2, 3], repsRange: [15, 20], rest: 45, exercisesPerDay: 7 },
  'fat-loss': { setsRange: [3, 4], repsRange: [12, 15], rest: 60, exercisesPerDay: 6 },
  powerlifting: { setsRange: [4, 6], repsRange: [1, 5], rest: 180, exercisesPerDay: 4 },
  'cardio-conditioning': { setsRange: [2, 3], repsRange: [15, 25], rest: 30, exercisesPerDay: 8 },
  'mobility-flexibility': { setsRange: [2, 3], repsRange: [8, 12], rest: 30, exercisesPerDay: 5 },
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Optimal spacing of training vs rest days based on frequency (1-7 days)
const WEEK_PATTERNS = {
  1: [false, false, true, false, false, false, false], // Wed
  2: [true, false, false, true, false, false, false],  // Mon, Thu
  3: [true, false, true, false, true, false, false],   // Mon, Wed, Fri
  4: [true, true, false, true, true, false, false],    // Mon, Tue, Thu, Fri
  5: [true, true, false, true, true, true, false],     // Mon, Tue, Thu, Fri, Sat
  6: [true, true, true, false, true, true, true],      // Mon, Tue, Wed, Fri, Sat, Sun
  7: [true, true, true, true, true, true, true],       // Every day
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a weekly routine.
 * @param {Object} params
 * @param {string} params.goal - 'strength', 'hypertrophy', 'endurance', etc.
 * @param {number} params.daysPerWeek - 1-7
 * @param {string} params.splitType - key from SPLIT_TYPES
 * @returns {Object} Weekly routine
 */
export function generateRoutine({ goal = 'hypertrophy', daysPerWeek = 4, splitType = 'push-pull-legs', profile = null }) {
  const split = SPLIT_TYPES[splitType];
  if (!split) return null;

  const goalCfg = GOAL_CONFIG[goal] || GOAL_CONFIG.hypertrophy;
  const numDays = Math.max(1, Math.min(7, parseInt(daysPerWeek) || 4));

  // Dynamically build the training day focus labels from split cycle mapping keys
  const cycle = Object.keys(split.mapping);
  const trainingDayLabels = [];
  for (let i = 0; i < numDays; i++) {
    trainingDayLabels.push(cycle[i % cycle.length]);
  }

  // Build 7-day week using optimal spacing patterns
  const week = [];
  const pattern = WEEK_PATTERNS[numDays] || WEEK_PATTERNS[4];
  let trainingIdx = 0;

  for (let i = 0; i < 7; i++) {
    const isTrainingDay = pattern[i];

    if (isTrainingDay && trainingIdx < trainingDayLabels.length) {
      const label = trainingDayLabels[trainingIdx];
      const muscles = split.mapping[label] || [];

      // Generate exercises for this day
      const usedIds = new Set();
      let dayExercises = [];

      muscles.forEach(muscle => {
        const perMuscle = Math.max(1, Math.floor(goalCfg.exercisesPerDay / muscles.length));
        const picks = getRandomExercises({ muscles: [muscle], goal }, perMuscle + 2)
          .filter(e => !usedIds.has(e.id))
          .slice(0, perMuscle);
        picks.forEach(e => usedIds.add(e.id));
        dayExercises.push(...picks);
      });

      // Personalization
      let adjustedRest = goalCfg.rest;
      if (profile && profile.age && parseInt(profile.age) > 50) {
        adjustedRest += 15;
      }

      // Trim and assign prescription
      dayExercises = dayExercises.slice(0, goalCfg.exercisesPerDay).map(ex => ({
        ...ex,
        sets: randomBetween(goalCfg.setsRange[0], goalCfg.setsRange[1]),
        reps: randomBetween(goalCfg.repsRange[0], goalCfg.repsRange[1]),
        rest: adjustedRest,
      }));

      // Sort: compounds first (with heavy compounds prioritized)
      const getExercisePriority = (ex) => {
        if (ex.muscles.includes('Core') || ex.muscles.includes('Calves')) return 4;
        if (ex.type === 'compound') {
          if (['Barbell', 'Dumbbell'].includes(ex.equipment)) return 1;
          return 2;
        }
        return 3;
      };
      dayExercises.sort((a, b) => getExercisePriority(a) - getExercisePriority(b));

      week.push({
        dayName: DAY_NAMES[i],
        dayIndex: i,
        isRest: false,
        label,
        muscles,
        exercises: dayExercises,
      });

      trainingIdx++;
    } else {
      week.push({
        dayName: DAY_NAMES[i],
        dayIndex: i,
        isRest: true,
        label: 'Rest',
        muscles: [],
        exercises: [],
      });
    }
  }

  return {
    goal,
    daysPerWeek: numDays,
    splitType,
    splitName: split.name,
    week,
  };
}

/**
 * Get available split types.
 */
export function getSplitOptions() {
  return Object.entries(SPLIT_TYPES).map(([key, val]) => ({
    key,
    name: val.name,
  }));
}
