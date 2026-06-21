/* ============================================
   EXERCISE DATABASE
   ============================================ */

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'
];

export const EQUIPMENT = [
  'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band'
];

export const SPLIT_TYPES = {
  'push-pull-legs': {
    name: 'Push / Pull / Legs',
    days: { 3: ['Push', 'Pull', 'Legs'], 6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'] },
    mapping: {
      'Push': ['Chest', 'Shoulders', 'Triceps'],
      'Pull': ['Back', 'Biceps'],
      'Legs': ['Quads', 'Hamstrings', 'Glutes', 'Calves']
    }
  },
  'upper-lower': {
    name: 'Upper / Lower',
    days: { 4: ['Upper', 'Lower', 'Upper', 'Lower'], 3: ['Upper', 'Lower', 'Upper'] },
    mapping: {
      'Upper': ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
      'Lower': ['Quads', 'Hamstrings', 'Glutes', 'Calves']
    }
  },
  'full-body': {
    name: 'Full Body',
    days: { 3: ['Full Body', 'Full Body', 'Full Body'], 4: ['Full Body', 'Full Body', 'Full Body', 'Full Body'] },
    mapping: {
      'Full Body': ['Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Core']
    }
  },
  'bro-split': {
    name: 'Bro Split',
    days: { 5: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'], 4: ['Chest', 'Back', 'Shoulders & Arms', 'Legs'] },
    mapping: {
      'Chest': ['Chest', 'Triceps'],
      'Back': ['Back', 'Biceps'],
      'Shoulders': ['Shoulders'],
      'Arms': ['Biceps', 'Triceps'],
      'Legs': ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
      'Shoulders & Arms': ['Shoulders', 'Biceps', 'Triceps']
    }
  },
  'arnold': {
    name: 'Arnold Split',
    days: { 6: ['Chest & Back', 'Shoulders & Arms', 'Legs', 'Chest & Back', 'Shoulders & Arms', 'Legs'] },
    mapping: {
      'Chest & Back': ['Chest', 'Back'],
      'Shoulders & Arms': ['Shoulders', 'Biceps', 'Triceps'],
      'Legs': ['Quads', 'Hamstrings', 'Glutes', 'Calves']
    }
  }
};

export const EXERCISES = [
  // ---- CHEST ----
  { id: 'c01', name: 'Barbell Bench Press', muscles: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Lie on a flat bench and press the barbell upward from chest level.' },
  { id: 'c02', name: 'Incline Dumbbell Press', muscles: ['Chest', 'Shoulders'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Press dumbbells upward on an incline bench at 30-45 degrees.' },
  { id: 'c03', name: 'Dumbbell Flyes', muscles: ['Chest'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', description: 'Lie flat and arc dumbbells outward then squeeze back together.' },
  { id: 'c04', name: 'Cable Crossover', muscles: ['Chest'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Pull cable handles from high position down and across your body.' },
  { id: 'c05', name: 'Push-Ups', muscles: ['Chest', 'Triceps'], equipment: 'Bodyweight', difficulty: 1, type: 'compound', description: 'Lower your body to the floor and press back up using your arms.' },
  { id: 'c06', name: 'Decline Bench Press', muscles: ['Chest', 'Triceps'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Press the barbell on a decline bench targeting lower chest.' },
  { id: 'c07', name: 'Chest Dips', muscles: ['Chest', 'Triceps'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Lean forward on dip bars and lower your body, pressing back up.' },
  { id: 'c08', name: 'Machine Chest Press', muscles: ['Chest', 'Triceps'], equipment: 'Machine', difficulty: 1, type: 'compound', description: 'Push handles forward on a chest press machine.' },
  { id: 'c09', name: 'Pec Deck Machine', muscles: ['Chest'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Squeeze pads together using the pec deck machine.' },

  // ---- BACK ----
  { id: 'b01', name: 'Barbell Deadlift', muscles: ['Back', 'Hamstrings', 'Glutes'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Lift a loaded barbell from the floor by extending your hips and knees.' },
  { id: 'b02', name: 'Pull-Ups', muscles: ['Back', 'Biceps'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Hang from a bar and pull yourself up until your chin clears the bar.' },
  { id: 'b03', name: 'Barbell Bent-Over Row', muscles: ['Back', 'Biceps'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Hinge forward and row a barbell to your lower chest.' },
  { id: 'b04', name: 'Lat Pulldown', muscles: ['Back', 'Biceps'], equipment: 'Cable', difficulty: 1, type: 'compound', description: 'Pull a wide bar down to your upper chest on a cable machine.' },
  { id: 'b05', name: 'Seated Cable Row', muscles: ['Back', 'Biceps'], equipment: 'Cable', difficulty: 1, type: 'compound', description: 'Pull a cable handle to your midsection while seated.' },
  { id: 'b06', name: 'Dumbbell Single-Arm Row', muscles: ['Back', 'Biceps'], equipment: 'Dumbbell', difficulty: 1, type: 'compound', description: 'Row a dumbbell to your hip with one arm, supported on a bench.' },
  { id: 'b07', name: 'T-Bar Row', muscles: ['Back'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Straddle a landmine barbell and row it toward your chest.' },
  { id: 'b08', name: 'Face Pulls', muscles: ['Back', 'Shoulders'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Pull a rope attachment toward your face at head height.' },
  { id: 'b09', name: 'Chin-Ups', muscles: ['Back', 'Biceps'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Pull yourself up with an underhand grip, focusing on biceps.' },

  // ---- SHOULDERS ----
  { id: 's01', name: 'Overhead Press', muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Press a barbell overhead from shoulder height to full lockout.' },
  { id: 's02', name: 'Dumbbell Lateral Raise', muscles: ['Shoulders'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', description: 'Raise dumbbells to the sides until arms are parallel to the floor.' },
  { id: 's03', name: 'Dumbbell Shoulder Press', muscles: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Press dumbbells overhead from shoulder height while seated or standing.' },
  { id: 's04', name: 'Front Raise', muscles: ['Shoulders'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', description: 'Raise dumbbells in front of you to shoulder height.' },
  { id: 's05', name: 'Reverse Pec Deck', muscles: ['Shoulders', 'Back'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Open arms against resistance on a reverse pec deck machine.' },
  { id: 's06', name: 'Arnold Press', muscles: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Rotate dumbbells from in front of your face to overhead.' },
  { id: 's07', name: 'Cable Lateral Raise', muscles: ['Shoulders'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Raise arm to the side using a low cable attachment.' },
  { id: 's08', name: 'Upright Row', muscles: ['Shoulders', 'Biceps'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Pull a barbell up along your body to chin height with elbows out.' },

  // ---- BICEPS ----
  { id: 'bi01', name: 'Barbell Curl', muscles: ['Biceps'], equipment: 'Barbell', difficulty: 1, type: 'isolation', description: 'Curl a barbell from hip level to shoulder height.' },
  { id: 'bi02', name: 'Dumbbell Hammer Curl', muscles: ['Biceps'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', description: 'Curl dumbbells with a neutral (hammer) grip.' },
  { id: 'bi03', name: 'Incline Dumbbell Curl', muscles: ['Biceps'], equipment: 'Dumbbell', difficulty: 2, type: 'isolation', description: 'Curl dumbbells while sitting on an incline bench for a deeper stretch.' },
  { id: 'bi04', name: 'Cable Curl', muscles: ['Biceps'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Curl a cable bar attachment from waist to shoulder level.' },
  { id: 'bi05', name: 'Concentration Curl', muscles: ['Biceps'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', description: 'Curl a dumbbell while bracing your elbow on your inner thigh.' },
  { id: 'bi06', name: 'Preacher Curl', muscles: ['Biceps'], equipment: 'Barbell', difficulty: 1, type: 'isolation', description: 'Curl a barbell on a preacher bench for strict form.' },
  { id: 'bi07', name: 'Spider Curl', muscles: ['Biceps'], equipment: 'Dumbbell', difficulty: 2, type: 'isolation', description: 'Curl dumbbells while lying face-down on an incline bench.' },

  // ---- TRICEPS ----
  { id: 'tr01', name: 'Tricep Pushdown', muscles: ['Triceps'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Push a cable attachment downward by extending your elbows.' },
  { id: 'tr02', name: 'Overhead Tricep Extension', muscles: ['Triceps'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', description: 'Extend a dumbbell overhead by straightening your arms.' },
  { id: 'tr03', name: 'Close-Grip Bench Press', muscles: ['Triceps', 'Chest'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Bench press with hands closer than shoulder-width to target triceps.' },
  { id: 'tr04', name: 'Skull Crushers', muscles: ['Triceps'], equipment: 'Barbell', difficulty: 2, type: 'isolation', description: 'Lower a barbell to your forehead then extend back up while lying down.' },
  { id: 'tr05', name: 'Diamond Push-Ups', muscles: ['Triceps', 'Chest'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Perform push-ups with hands together in a diamond shape.' },
  { id: 'tr06', name: 'Cable Overhead Extension', muscles: ['Triceps'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Face away from cable and extend the rope overhead.' },
  { id: 'tr07', name: 'Tricep Kickback', muscles: ['Triceps'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', description: 'Extend a dumbbell backward while hinged forward.' },

  // ---- QUADS ----
  { id: 'q01', name: 'Barbell Back Squat', muscles: ['Quads', 'Glutes'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Squat down with a barbell on your upper back until thighs are parallel.' },
  { id: 'q02', name: 'Front Squat', muscles: ['Quads', 'Core'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Squat with the barbell resting on front delts for more quad emphasis.' },
  { id: 'q03', name: 'Leg Press', muscles: ['Quads', 'Glutes'], equipment: 'Machine', difficulty: 1, type: 'compound', description: 'Push a weighted sled away using your legs on a leg press machine.' },
  { id: 'q04', name: 'Leg Extension', muscles: ['Quads'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Extend your legs against resistance on a leg extension machine.' },
  { id: 'q05', name: 'Bulgarian Split Squat', muscles: ['Quads', 'Glutes'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Lunge with rear foot elevated on a bench.' },
  { id: 'q06', name: 'Walking Lunges', muscles: ['Quads', 'Glutes'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Step forward into alternating lunges while holding dumbbells.' },
  { id: 'q07', name: 'Goblet Squat', muscles: ['Quads', 'Glutes'], equipment: 'Dumbbell', difficulty: 1, type: 'compound', description: 'Hold a dumbbell at your chest and squat down.' },
  { id: 'q08', name: 'Hack Squat', muscles: ['Quads'], equipment: 'Machine', difficulty: 2, type: 'compound', description: 'Squat on a hack squat machine for targeted quad work.' },

  // ---- HAMSTRINGS ----
  { id: 'h01', name: 'Romanian Deadlift', muscles: ['Hamstrings', 'Glutes'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Hinge at the hips lowering the barbell along your legs with slight knee bend.' },
  { id: 'h02', name: 'Lying Leg Curl', muscles: ['Hamstrings'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Curl your legs toward your glutes on a leg curl machine.' },
  { id: 'h03', name: 'Seated Leg Curl', muscles: ['Hamstrings'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Curl legs downward against resistance while seated.' },
  { id: 'h04', name: 'Stiff-Leg Deadlift', muscles: ['Hamstrings', 'Glutes'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Hinge at hips with straight legs, lowering dumbbells toward the floor.' },
  { id: 'h05', name: 'Nordic Hamstring Curl', muscles: ['Hamstrings'], equipment: 'Bodyweight', difficulty: 3, type: 'isolation', description: 'Lower your body forward from a kneeling position using hamstring strength.' },
  { id: 'h06', name: 'Good Mornings', muscles: ['Hamstrings', 'Back'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Bow forward with a barbell on your back then stand upright.' },

  // ---- GLUTES ----
  { id: 'g01', name: 'Hip Thrust', muscles: ['Glutes', 'Hamstrings'], equipment: 'Barbell', difficulty: 2, type: 'compound', description: 'Drive hips upward with upper back on a bench and barbell across hips.' },
  { id: 'g02', name: 'Glute Bridge', muscles: ['Glutes'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Lie on the floor and thrust hips upward squeezing your glutes.' },
  { id: 'g03', name: 'Cable Pull-Through', muscles: ['Glutes', 'Hamstrings'], equipment: 'Cable', difficulty: 1, type: 'compound', description: 'Pull a cable between your legs by extending hips forward.' },
  { id: 'g04', name: 'Kettlebell Swing', muscles: ['Glutes', 'Hamstrings', 'Core'], equipment: 'Kettlebell', difficulty: 2, type: 'compound', description: 'Swing a kettlebell between your legs and drive it to chest height.' },
  { id: 'g05', name: 'Sumo Deadlift', muscles: ['Glutes', 'Quads', 'Back'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Deadlift with a wide stance and hands inside the knees.' },

  // ---- CALVES ----
  { id: 'ca01', name: 'Standing Calf Raise', muscles: ['Calves'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Rise up on your toes on a standing calf raise machine.' },
  { id: 'ca02', name: 'Seated Calf Raise', muscles: ['Calves'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Raise your heels while seated with weight on your knees.' },
  { id: 'ca03', name: 'Donkey Calf Raise', muscles: ['Calves'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Perform calf raises while bent forward on a donkey calf machine.' },
  { id: 'ca04', name: 'Single-Leg Calf Raise', muscles: ['Calves'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Rise up on one foot for an extra challenge on your calf.' },

  // ---- CORE ----
  { id: 'co01', name: 'Plank', muscles: ['Core'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Hold a straight-body position on your forearms and toes.' },
  { id: 'co02', name: 'Hanging Leg Raise', muscles: ['Core'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', description: 'Hang from a bar and raise your legs to 90 degrees.' },
  { id: 'co03', name: 'Cable Woodchop', muscles: ['Core'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Rotate and chop a cable from high to low across your body.' },
  { id: 'co04', name: 'Ab Wheel Rollout', muscles: ['Core'], equipment: 'Bodyweight', difficulty: 3, type: 'isolation', description: 'Roll an ab wheel forward from kneeling and pull back using your abs.' },
  { id: 'co05', name: 'Russian Twist', muscles: ['Core'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Sit in V position and twist side to side, optionally holding a weight.' },
  { id: 'co06', name: 'Bicycle Crunch', muscles: ['Core'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Alternate bringing elbows to opposite knees in a cycling motion.' },
  { id: 'co07', name: 'Dead Bug', muscles: ['Core'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Lie on your back and alternate extending opposite arm and leg.' },
  { id: 'co08', name: 'Pallof Press', muscles: ['Core'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Press a cable handle away from your chest while resisting rotation.' },

  // ---- FULL BODY ----
  { id: 'fb01', name: 'Burpees', muscles: ['Full Body'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Drop to the floor, do a push-up, jump up and repeat.' },
  { id: 'fb02', name: 'Clean and Press', muscles: ['Full Body'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Clean a barbell from the floor to your shoulders, then press overhead.' },
  { id: 'fb03', name: 'Thrusters', muscles: ['Full Body'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Squat with dumbbells at shoulders and press them overhead as you stand.' },
  { id: 'fb04', name: 'Turkish Get-Up', muscles: ['Full Body'], equipment: 'Kettlebell', difficulty: 3, type: 'compound', description: 'Rise from lying to standing while holding a kettlebell overhead.' },
  { id: 'fb05', name: 'Man Makers', muscles: ['Full Body'], equipment: 'Dumbbell', difficulty: 3, type: 'compound', description: 'Combine a push-up, row, squat, and press into one movement.' },
  { id: 'fb06', name: 'Battle Ropes', muscles: ['Full Body'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Slam heavy ropes in alternating or simultaneous waves.' },
];

/**
 * In-memory cache of custom exercises, refreshed from API by app.js.
 */
let _customExercisesCache = [];

/**
 * Update the cached custom exercises (called by app.js after API fetch).
 */
export function setCustomExercisesCache(exercises) {
  _customExercisesCache = exercises || [];
}

/**
 * Get all exercises (built-in + cached custom).
 */
export function getAllExercises() {
  return [...EXERCISES, ..._customExercisesCache];
}

/**
 * Get combined exercise count.
 */
export function getExerciseCount() {
  return EXERCISES.length + _customExercisesCache.length;
}

/**
 * Get exercises filtered by criteria (includes cached custom exercises).
 */
export function filterExercises({ muscles = [], equipment = [], difficulty = null, type = null, search = '' } = {}) {
  const allExercises = [...EXERCISES, ..._customExercisesCache];
  return allExercises.filter(ex => {
    if (muscles.length && !muscles.some(m => ex.muscles.includes(m))) return false;
    if (equipment.length && !equipment.includes(ex.equipment)) return false;
    if (difficulty !== null && ex.difficulty !== difficulty) return false;
    if (type && ex.type !== type) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!ex.name.toLowerCase().includes(q) && !ex.description.toLowerCase().includes(q) &&
          !ex.muscles.some(m => m.toLowerCase().includes(q))) return false;
    }
    return true;
  });
}

/**
 * Get a random subset of exercises matching criteria.
 */
export function getRandomExercises(filters, count) {
  const pool = filterExercises(filters);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
