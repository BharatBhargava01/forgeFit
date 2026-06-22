/* ============================================
   ROUTINE GENERATOR ENGINE
   ============================================ */

import { SPLIT_TYPES, getRandomExercises } from './data.js';

const GOAL_CONFIG = {
  strength: { setsRange: [4, 5], repsRange: [3, 6], rest: 120, exercisesPerDay: 5 },
  hypertrophy: { setsRange: [3, 4], repsRange: [8, 12], rest: 75, exercisesPerDay: 6 },
  endurance: { setsRange: [2, 3], repsRange: [15, 20], rest: 45, exercisesPerDay: 7 },
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a weekly routine.
 * @param {Object} params
 * @param {string} params.goal - 'strength', 'hypertrophy', 'endurance'
 * @param {number} params.daysPerWeek - 3-6
 * @param {string} params.splitType - key from SPLIT_TYPES
 * @returns {Object} Weekly routine
 */
export function generateRoutine({ goal = 'hypertrophy', daysPerWeek = 4, splitType = 'push-pull-legs' }) {
  const split = SPLIT_TYPES[splitType];
  if (!split) return null;

  const goalCfg = GOAL_CONFIG[goal] || GOAL_CONFIG.hypertrophy;

  // Get the training day labels for the selected day count
  const availableDayCounts = Object.keys(split.days).map(Number).sort((a, b) => a - b);
  // Find the closest matching day count
  let matchedDays = availableDayCounts[0];
  for (const dc of availableDayCounts) {
    if (dc <= daysPerWeek) matchedDays = dc;
  }
  const trainingDayLabels = split.days[matchedDays];

  // Build 7-day week: fill training days then rest
  const week = [];
  let trainingIdx = 0;

  for (let i = 0; i < 7; i++) {
    if (trainingIdx < trainingDayLabels.length) {
      const label = trainingDayLabels[trainingIdx];
      const muscles = split.mapping[label] || [];

      // Generate exercises for this day
      const usedIds = new Set();
      let dayExercises = [];

      muscles.forEach(muscle => {
        const perMuscle = Math.max(1, Math.floor(goalCfg.exercisesPerDay / muscles.length));
        const picks = getRandomExercises({ muscles: [muscle] }, perMuscle + 2)
          .filter(e => !usedIds.has(e.id))
          .slice(0, perMuscle);
        picks.forEach(e => usedIds.add(e.id));
        dayExercises.push(...picks);
      });

      // Trim and assign prescription
      dayExercises = dayExercises.slice(0, goalCfg.exercisesPerDay).map(ex => ({
        ...ex,
        sets: randomBetween(goalCfg.setsRange[0], goalCfg.setsRange[1]),
        reps: randomBetween(goalCfg.repsRange[0], goalCfg.repsRange[1]),
        rest: goalCfg.rest,
      }));

      // Sort: compounds first
      dayExercises.sort((a, b) => (a.type === 'compound' ? -1 : 1) - (b.type === 'compound' ? -1 : 1));

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
    daysPerWeek: trainingDayLabels.length,
    splitType,
    splitName: split.name,
    week,
  };
}

/**
 * Get available split types and their day options.
 */
export function getSplitOptions() {
  return Object.entries(SPLIT_TYPES).map(([key, val]) => ({
    key,
    name: val.name,
    dayOptions: Object.keys(val.days).map(Number),
  }));
}
