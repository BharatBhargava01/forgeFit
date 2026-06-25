/* ============================================
   EXERCISE DATABASE
   ============================================ */

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Obliques', 'Core', 'Full Body'
];

export const EQUIPMENT = [
  'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band'
];

export const SPLIT_TYPES = {
  'push-pull-legs': {
    name: 'Push / Pull / Legs',
    mapping: {
      'Push': ['Chest', 'Shoulders', 'Triceps'],
      'Pull': ['Back', 'Biceps'],
      'Legs': ['Quads', 'Hamstrings', 'Glutes', 'Calves']
    }
  },
  'upper-lower': {
    name: 'Upper / Lower',
    mapping: {
      'Upper': ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
      'Lower': ['Quads', 'Hamstrings', 'Glutes', 'Calves']
    }
  },
  'full-body': {
    name: 'Full Body',
    mapping: {
      'Full Body': ['Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Core']
    }
  },
  'bro-split': {
    name: 'Bro Split',
    mapping: {
      'Chest': ['Chest', 'Triceps'],
      'Back': ['Back', 'Biceps'],
      'Shoulders': ['Shoulders'],
      'Arms': ['Biceps', 'Triceps'],
      'Legs': ['Quads', 'Hamstrings', 'Glutes', 'Calves']
    }
  },
  'arnold': {
    name: 'Arnold Split',
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
  { id: 'co01', name: 'Plank', muscles: ['Abs'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Hold a straight-body position on your forearms and toes.' },
  { id: 'co02', name: 'Hanging Leg Raise', muscles: ['Abs'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', description: 'Hang from a bar and raise your legs to 90 degrees.' },
  { id: 'co03', name: 'Cable Woodchop', muscles: ['Obliques'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Rotate and chop a cable from high to low across your body.' },
  { id: 'co04', name: 'Ab Wheel Rollout', muscles: ['Abs'], equipment: 'Bodyweight', difficulty: 3, type: 'isolation', description: 'Roll an ab wheel forward from kneeling and pull back using your abs.' },
  { id: 'co05', name: 'Russian Twist', muscles: ['Obliques'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Sit in V position and twist side to side, optionally holding a weight.' },
  { id: 'co06', name: 'Bicycle Crunch', muscles: ['Abs', 'Obliques'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Alternate bringing elbows to opposite knees in a cycling motion.' },
  { id: 'co07', name: 'Dead Bug', muscles: ['Abs'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Lie on your back and alternate extending opposite arm and leg.' },
  { id: 'co08', name: 'Pallof Press', muscles: ['Obliques'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Press a cable handle away from your chest while resisting rotation.' },

  // ---- FULL BODY ----
  { id: 'fb01', name: 'Burpees', muscles: ['Full Body'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Drop to the floor, do a push-up, jump up and repeat.' },
  { id: 'fb02', name: 'Clean and Press', muscles: ['Full Body'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Clean a barbell from the floor to your shoulders, then press overhead.' },
  { id: 'fb03', name: 'Thrusters', muscles: ['Full Body'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Squat with dumbbells at shoulders and press them overhead as you stand.' },
  { id: 'fb04', name: 'Turkish Get-Up', muscles: ['Full Body'], equipment: 'Kettlebell', difficulty: 3, type: 'compound', description: 'Rise from lying to standing while holding a kettlebell overhead.' },
  { id: 'fb05', name: 'Man Makers', muscles: ['Full Body'], equipment: 'Dumbbell', difficulty: 3, type: 'compound', description: 'Combine a push-up, row, squat, and press into one movement.' },
  { id: 'fb06', name: 'Battle Ropes', muscles: ['Full Body'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Slam heavy ropes in alternating or simultaneous waves.' },

  // ---- NEW ADDITIONS ----
  { id: 'c10', name: 'Decline Dumbbell Press', muscles: ['Chest', 'Triceps'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Press dumbbells on a decline bench to target lower chest.' },
  { id: 'c11', name: 'Incline Cable Flyes', muscles: ['Chest'], equipment: 'Cable', difficulty: 2, type: 'isolation', description: 'Bring cables together from low pulleys on an incline bench.' },
  { id: 'b10', name: 'Neutral Grip Pull-Ups', muscles: ['Back', 'Biceps'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Pull up using neutral grip handles to target lats.' },
  { id: 'b11', name: 'Dumbbell Pullover', muscles: ['Back', 'Chest'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Lie across bench and lower dumbbell behind head, keeping arms straight.' },
  { id: 's09', name: 'Dumbbell Rear Delt Fly', muscles: ['Shoulders', 'Back'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', description: 'Bend over and raise dumbbells to the sides, targeting rear delts.' },
  { id: 's10', name: 'Cable Y-Raise', muscles: ['Shoulders'], equipment: 'Cable', difficulty: 2, type: 'isolation', description: 'Pull low cables diagonally up to form a Y shape, targeting lateral delts.' },
  { id: 'bi08', name: 'Zottman Curl', muscles: ['Biceps', 'Core'], equipment: 'Dumbbell', difficulty: 2, type: 'isolation', description: 'Curl dumbbells, rotate palms down, and lower slowly.' },
  { id: 'bi09', name: 'Cable Rope Hammer Curl', muscles: ['Biceps'], equipment: 'Cable', difficulty: 1, type: 'isolation', description: 'Curl a rope attachment with a neutral grip.' },
  { id: 'tr08', name: 'Bench Dips', muscles: ['Triceps', 'Chest'], equipment: 'Bodyweight', difficulty: 1, type: 'compound', description: 'Lower body off bench and press back up using triceps.' },
  { id: 'tr09', name: 'Lying Dumbbell Tricep Extension', muscles: ['Triceps'], equipment: 'Dumbbell', difficulty: 2, type: 'isolation', description: 'Extend dumbbells upward from forehead while lying flat.' },
  { id: 'q09', name: 'Sissy Squat', muscles: ['Quads'], equipment: 'Bodyweight', difficulty: 3, type: 'isolation', description: 'Lean back from knees holding vertical support, pushing quads.' },
  { id: 'q10', name: 'Dumbbell Step-Ups', muscles: ['Quads', 'Glutes'], equipment: 'Dumbbell', difficulty: 1, type: 'compound', description: 'Step onto a box or platform holding dumbbells at sides.' },
  { id: 'h07', name: 'Kettlebell Romanian Deadlift', muscles: ['Hamstrings', 'Glutes'], equipment: 'Kettlebell', difficulty: 2, type: 'compound', description: 'Perform hip hinge RDL holding a heavy kettlebell.' },
  { id: 'g06', name: 'Cable Kickback', muscles: ['Glutes'], equipment: 'Cable', difficulty: 2, type: 'isolation', description: 'Kick leg straight back against low cable resistance.' },
  { id: 'ca05', name: 'Calf Press on Leg Press', muscles: ['Calves'], equipment: 'Machine', difficulty: 1, type: 'isolation', description: 'Perform calf raises using the leg press sled.' },
  { id: 'co09', name: 'Hanging Knee Raise', muscles: ['Abs'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', description: 'Hang from bar and raise knees to chest.' },
  { id: 'co10', name: 'Cable Crunch', muscles: ['Abs'], equipment: 'Cable', difficulty: 2, type: 'isolation', description: 'Kneel and crunch down using high rope attachment.' },
  { id: 'fb07', name: 'Kettlebell Snatch', muscles: ['Full Body'], equipment: 'Kettlebell', difficulty: 3, type: 'compound', description: 'Swing kettlebell and pull it overhead in one fluid motion.' },
  { id: 'fb08', name: 'Bear Crawls', muscles: ['Full Body', 'Abs'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Crawling on hands and toes close to the ground.' },

  // ---- POWERLIFTING & MAX STRENGTH ----
  { id: 'pl01', name: 'Barbell Box Squat', muscles: ['Quads', 'Glutes', 'Core'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Squat down to a box/bench and drive back up from a dead stop.' },
  { id: 'pl02', name: 'Barbell Floor Press', muscles: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Lie on the floor and bench press, eliminating lower body drive.' },
  { id: 'pl03', name: 'Deficit Deadlift', muscles: ['Back', 'Hamstrings', 'Glutes'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Perform a deadlift while standing on an elevated platform for increased range of motion.' },
  { id: 'pl04', name: 'Barbell Pin Press', muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', difficulty: 3, type: 'compound', description: 'Press the barbell from a resting position on safety pins in a rack.' },

  // ---- CARDIO & CONDITIONING ----
  { id: 'cc01', name: 'Mountain Climbers', muscles: ['Core', 'Full Body'], equipment: 'Bodyweight', difficulty: 1, type: 'compound', description: 'In a plank position, drive knees to chest alternately in rapid succession.' },
  { id: 'cc02', name: 'Box Jumps', muscles: ['Quads', 'Glutes', 'Calves'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Jump explosively onto an elevated box and step down.' },
  { id: 'cc03', name: 'Jumping Jacks', muscles: ['Full Body'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Perform jumping jacks to raise heart rate and warm up the body.' },
  { id: 'cc04', name: 'High Knees', muscles: ['Core', 'Full Body'], equipment: 'Bodyweight', difficulty: 1, type: 'compound', description: 'Run in place, lifting knees up as high as possible.' },
  { id: 'cc05', name: 'Jump Squats', muscles: ['Quads', 'Glutes', 'Calves'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Squat down then jump up explosively, landing softly.' },

  // ---- MOBILITY & FLEXIBILITY ----
  { id: 'mf01', name: 'World\'s Greatest Stretch', muscles: ['Full Body', 'Core'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', description: 'Step into lunge, rotate chest and arm up to ceiling, stretch hamstrings.' },
  { id: 'mf02', name: 'Cat-Cow Stretch', muscles: ['Core', 'Back'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Arch and round your spine on hands and knees to improve back mobility.' },
  { id: 'mf03', name: 'Band Shoulder Dislocations', muscles: ['Shoulders'], equipment: 'Band', difficulty: 1, type: 'isolation', description: 'Hold a band wide and rotate arms overhead to chest and back to lower back.' },
  { id: 'mf04', name: 'Cobra Stretch', muscles: ['Core', 'Back'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Arch chest up from floor, stretching abs and lower back.' },
  { id: 'mf05', name: 'Child\'s Pose', muscles: ['Back', 'Shoulders'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Rest on knees, reach hands forward on the floor to stretch upper back.' },
  { id: 'mf06', name: '90/90 Hip Rotations', muscles: ['Glutes'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', description: 'Sit with knees bent at 90-degree angles on the floor, rotating hips side to side.' },
  { id: 'mf07', name: 'Pigeon Pose', muscles: ['Glutes', 'Hamstrings'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', description: 'Cross one leg in front of you at a 90-degree angle and extend the other leg straight back to stretch glutes.' },
  { id: 'mf08', name: 'Thoracic Spine Rotations', muscles: ['Back', 'Shoulders'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Kneel and rotate your upper back and arm toward the ceiling to open chest and mid-back.' },
  { id: 'mf09', name: 'Frog Stretch', muscles: ['Glutes'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', description: 'Widen knees on the floor and push hips backward to stretch groin and inner thighs.' },
  { id: 'mf10', name: 'Deep Squat Hold', muscles: ['Quads', 'Glutes', 'Calves'], equipment: 'Bodyweight', difficulty: 1, type: 'compound', description: 'Squat as deep as possible and hold the position, pushing knees out with elbows.' },
  { id: 'mf11', name: 'Couch Stretch', muscles: ['Quads', 'Glutes'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', description: 'Place back knee against a wall or couch and lunge forward to stretch hip flexors and quads.' },
  { id: 'mf12', name: 'Scorpion Stretch', muscles: ['Back', 'Obliques'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', description: 'Lie face down and reach one leg across your body toward the opposite hand to stretch hips and lower back.' },
  { id: 'mf13', name: 'Thread the Needle', muscles: ['Back', 'Shoulders'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Reach one arm underneath your body while on all fours, lowering shoulder to the floor.' },
  { id: 'mf14', name: 'Doorway Chest Stretch', muscles: ['Chest', 'Shoulders'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', description: 'Place forearms on a doorway and step forward to stretch chest muscles.' },
  { id: 'mf15', name: 'Band Chest Opener', muscles: ['Chest', 'Shoulders'], equipment: 'Band', difficulty: 1, type: 'isolation', description: 'Hold a band in front and pull it wide to stretch chest and shoulders.' },

  // ---- FAT LOSS & CIRCUITS ----
  { id: 'fl01', name: 'Kettlebell Goblet Squat to Press', muscles: ['Full Body', 'Quads', 'Shoulders'], equipment: 'Kettlebell', difficulty: 2, type: 'compound', description: 'Squat holding kettlebell and press overhead as you stand up.' },
  { id: 'fl02', name: 'Dumbbell Renegade Row', muscles: ['Back', 'Core', 'Chest'], equipment: 'Dumbbell', difficulty: 3, type: 'compound', description: 'Hold plank on dumbbells and row dumbbells alternately to hips.' },
  { id: 'fl03', name: 'Wall Balls', muscles: ['Full Body', 'Quads', 'Shoulders'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', description: 'Squat and throw a medicine ball/dumbbell high against a wall, catch and repeat.' }
];

/* ============================================
   PRE-MADE WORKOUT & ROUTINE TEMPLATES
   ============================================ */

export const PREMADE_WORKOUTS = [
  {
    id: 'pw01',
    name: 'Arnold Chest & Back Blast',
    muscles: ['Chest', 'Back'],
    duration: 60,
    estimatedMinutes: 60,
    goal: 'hypertrophy',
    difficulty: 3,
    totalExercises: 6,
    exercises: [
      { id: 'c01', name: 'Barbell Bench Press', muscles: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', difficulty: 2, type: 'compound', sets: 4, reps: 10, rest: 90 },
      { id: 'b03', name: 'Barbell Bent-Over Row', muscles: ['Back', 'Biceps'], equipment: 'Barbell', difficulty: 2, type: 'compound', sets: 4, reps: 10, rest: 90 },
      { id: 'c02', name: 'Incline Dumbbell Press', muscles: ['Chest', 'Shoulders'], equipment: 'Dumbbell', difficulty: 2, type: 'compound', sets: 4, reps: 10, rest: 90 },
      { id: 'b02', name: 'Pull-Ups', muscles: ['Back', 'Biceps'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', sets: 4, reps: 10, rest: 90 },
      { id: 'c09', name: 'Pec Deck Machine', muscles: ['Chest'], equipment: 'Machine', difficulty: 1, type: 'isolation', sets: 3, reps: 12, rest: 90 },
      { id: 'b04', name: 'Lat Pulldown', muscles: ['Back', 'Biceps'], equipment: 'Cable', difficulty: 1, type: 'compound', sets: 3, reps: 12, rest: 90 }
    ]
  },
  {
    id: 'pw02',
    name: 'Golden Era Shoulder & Arm Swell',
    muscles: ['Shoulders', 'Biceps', 'Triceps'],
    duration: 45,
    estimatedMinutes: 45,
    goal: 'hypertrophy',
    difficulty: 2,
    totalExercises: 6,
    exercises: [
      { id: 's01', name: 'Overhead Press', muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', difficulty: 2, type: 'compound', sets: 3, reps: 10, rest: 90 },
      { id: 'bi01', name: 'Barbell Curl', muscles: ['Biceps'], equipment: 'Barbell', difficulty: 1, type: 'isolation', sets: 3, reps: 12, rest: 75 },
      { id: 'tr03', name: 'Close-Grip Bench Press', muscles: ['Triceps', 'Chest'], equipment: 'Barbell', difficulty: 2, type: 'compound', sets: 3, reps: 10, rest: 90 },
      { id: 's02', name: 'Dumbbell Lateral Raise', muscles: ['Shoulders'], equipment: 'Dumbbell', difficulty: 1, type: 'isolation', sets: 4, reps: 12, rest: 60 },
      { id: 'bi03', name: 'Incline Dumbbell Curl', muscles: ['Biceps'], equipment: 'Dumbbell', difficulty: 2, type: 'isolation', sets: 3, reps: 12, rest: 75 },
      { id: 'tr04', name: 'Skull Crushers', muscles: ['Triceps'], equipment: 'Barbell', difficulty: 2, type: 'isolation', sets: 3, reps: 12, rest: 75 }
    ]
  },
  {
    id: 'pw03',
    name: 'Powerlifting Big Three (SBD)',
    muscles: ['Full Body'],
    duration: 90,
    estimatedMinutes: 85,
    goal: 'powerlifting',
    difficulty: 3,
    totalExercises: 4,
    exercises: [
      { id: 'q01', name: 'Barbell Back Squat', muscles: ['Quads', 'Glutes'], equipment: 'Barbell', difficulty: 3, type: 'compound', sets: 5, reps: 5, rest: 240 },
      { id: 'c01', name: 'Barbell Bench Press', muscles: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', difficulty: 2, type: 'compound', sets: 5, reps: 5, rest: 240 },
      { id: 'b01', name: 'Barbell Deadlift', muscles: ['Back', 'Hamstrings', 'Glutes'], equipment: 'Barbell', difficulty: 3, type: 'compound', sets: 5, reps: 3, rest: 240 },
      { id: 'co02', name: 'Hanging Leg Raise', muscles: ['Core'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', sets: 3, reps: 10, rest: 120 }
    ]
  },
  {
    id: 'pw04',
    name: 'Metabolic Fat Burner Circuit',
    muscles: ['Full Body'],
    duration: 30,
    estimatedMinutes: 30,
    goal: 'fat-loss',
    difficulty: 2,
    totalExercises: 5,
    exercises: [
      { id: 'fb01', name: 'Burpees', muscles: ['Full Body'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', sets: 3, reps: 15, rest: 60 },
      { id: 'g04', name: 'Kettlebell Swing', muscles: ['Glutes', 'Hamstrings', 'Core'], equipment: 'Kettlebell', difficulty: 2, type: 'compound', sets: 3, reps: 20, rest: 60 },
      { id: 'cc01', name: 'Mountain Climbers', muscles: ['Core', 'Full Body'], equipment: 'Bodyweight', difficulty: 1, type: 'compound', sets: 3, reps: 30, rest: 45 },
      { id: 'cc05', name: 'Jump Squats', muscles: ['Quads', 'Glutes', 'Calves'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', sets: 3, reps: 15, rest: 60 },
      { id: 'co05', name: 'Russian Twist', muscles: ['Core'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', sets: 3, reps: 20, rest: 45 }
    ]
  },
  {
    id: 'pw05',
    name: 'Desk Worker Mobility Routine',
    muscles: ['Full Body'],
    duration: 15,
    estimatedMinutes: 15,
    goal: 'mobility-flexibility',
    difficulty: 1,
    totalExercises: 5,
    exercises: [
      { id: 'mf01', name: 'World\'s Greatest Stretch', muscles: ['Full Body', 'Core'], equipment: 'Bodyweight', difficulty: 2, type: 'compound', sets: 2, reps: 8, rest: 30 },
      { id: 'mf02', name: 'Cat-Cow Stretch', muscles: ['Core', 'Back'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', sets: 2, reps: 10, rest: 30 },
      { id: 'mf04', name: 'Cobra Stretch', muscles: ['Core', 'Back'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', sets: 2, reps: 10, rest: 30 },
      { id: 'mf05', name: 'Child\'s Pose', muscles: ['Back', 'Shoulders'], equipment: 'Bodyweight', difficulty: 1, type: 'isolation', sets: 2, reps: 10, rest: 30 },
      { id: 'mf06', name: '90/90 Hip Rotations', muscles: ['Glutes'], equipment: 'Bodyweight', difficulty: 2, type: 'isolation', sets: 2, reps: 10, rest: 30 }
    ]
  }
];

export const PREMADE_ROUTINES = [
  {
    id: 'pr01',
    name: 'Classic 3-Day Push/Pull/Legs',
    splitName: 'Push / Pull / Legs',
    splitType: 'push-pull-legs',
    goal: 'hypertrophy',
    daysPerWeek: 3,
    week: [
      {
        dayName: 'Monday',
        dayIndex: 0,
        isRest: false,
        label: 'Push',
        muscles: ['Chest', 'Shoulders', 'Triceps'],
        exercises: [
          { id: 'c01', name: 'Barbell Bench Press', muscles: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', sets: 3, reps: 10, rest: 90 },
          { id: 's03', name: 'Dumbbell Shoulder Press', muscles: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', sets: 3, reps: 10, rest: 90 },
          { id: 'c04', name: 'Cable Crossover', muscles: ['Chest'], equipment: 'Cable', sets: 3, reps: 12, rest: 75 },
          { id: 'tr01', name: 'Tricep Pushdown', muscles: ['Triceps'], equipment: 'Cable', sets: 3, reps: 12, rest: 75 }
        ]
      },
      { dayName: 'Tuesday', dayIndex: 1, isRest: true, label: 'Rest', muscles: [], exercises: [] },
      {
        dayName: 'Wednesday',
        dayIndex: 2,
        isRest: false,
        label: 'Pull',
        muscles: ['Back', 'Biceps'],
        exercises: [
          { id: 'b01', name: 'Barbell Deadlift', muscles: ['Back', 'Hamstrings', 'Glutes'], equipment: 'Barbell', sets: 3, reps: 5, rest: 120 },
          { id: 'b06', name: 'Dumbbell Single-Arm Row', muscles: ['Back', 'Biceps'], equipment: 'Dumbbell', sets: 3, reps: 10, rest: 90 },
          { id: 'b04', name: 'Lat Pulldown', muscles: ['Back', 'Biceps'], equipment: 'Cable', sets: 3, reps: 10, rest: 90 },
          { id: 'bi02', name: 'Dumbbell Hammer Curl', muscles: ['Biceps'], equipment: 'Dumbbell', sets: 3, reps: 12, rest: 75 }
        ]
      },
      { dayName: 'Thursday', dayIndex: 3, isRest: true, label: 'Rest', muscles: [], exercises: [] },
      {
        dayName: 'Friday',
        dayIndex: 4,
        isRest: false,
        label: 'Legs',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { id: 'q01', name: 'Barbell Back Squat', muscles: ['Quads', 'Glutes'], equipment: 'Barbell', sets: 3, reps: 8, rest: 120 },
          { id: 'h01', name: 'Romanian Deadlift', muscles: ['Hamstrings', 'Glutes'], equipment: 'Barbell', sets: 3, reps: 10, rest: 90 },
          { id: 'q04', name: 'Leg Extension', muscles: ['Quads'], equipment: 'Machine', sets: 3, reps: 12, rest: 75 },
          { id: 'ca02', name: 'Seated Calf Raise', muscles: ['Calves'], equipment: 'Machine', sets: 3, reps: 15, rest: 60 }
        ]
      },
      { dayName: 'Saturday', dayIndex: 5, isRest: true, label: 'Rest', muscles: [], exercises: [] },
      { dayName: 'Sunday', dayIndex: 6, isRest: true, label: 'Rest', muscles: [], exercises: [] }
    ]
  },
  {
    id: 'pr02',
    name: '4-Day Upper / Lower Strength',
    splitName: 'Upper / Lower',
    splitType: 'upper-lower',
    goal: 'strength',
    daysPerWeek: 4,
    week: [
      {
        dayName: 'Monday',
        dayIndex: 0,
        isRest: false,
        label: 'Upper',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
        exercises: [
          { id: 'c01', name: 'Barbell Bench Press', muscles: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', sets: 4, reps: 6, rest: 120 },
          { id: 'b03', name: 'Barbell Bent-Over Row', muscles: ['Back', 'Biceps'], equipment: 'Barbell', sets: 4, reps: 6, rest: 120 },
          { id: 's01', name: 'Overhead Press', muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', sets: 3, reps: 6, rest: 120 },
          { id: 'bi01', name: 'Barbell Curl', muscles: ['Biceps'], equipment: 'Barbell', sets: 3, reps: 8, rest: 90 }
        ]
      },
      {
        dayName: 'Tuesday',
        dayIndex: 1,
        isRest: false,
        label: 'Lower',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { id: 'q01', name: 'Barbell Back Squat', muscles: ['Quads', 'Glutes'], equipment: 'Barbell', sets: 4, reps: 6, rest: 120 },
          { id: 'h01', name: 'Romanian Deadlift', muscles: ['Hamstrings', 'Glutes'], equipment: 'Barbell', sets: 4, reps: 8, rest: 120 },
          { id: 'q03', name: 'Leg Press', muscles: ['Quads', 'Glutes'], equipment: 'Machine', sets: 3, reps: 10, rest: 90 },
          { id: 'co02', name: 'Hanging Leg Raise', muscles: ['Core'], equipment: 'Bodyweight', sets: 3, reps: 10, rest: 90 }
        ]
      },
      { dayName: 'Wednesday', dayIndex: 2, isRest: true, label: 'Rest', muscles: [], exercises: [] },
      {
        dayName: 'Thursday',
        dayIndex: 3,
        isRest: false,
        label: 'Upper',
        muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
        exercises: [
          { id: 'c02', name: 'Incline Dumbbell Press', muscles: ['Chest', 'Shoulders'], equipment: 'Dumbbell', sets: 4, reps: 8, rest: 95 },
          { id: 'b02', name: 'Pull-Ups', muscles: ['Back', 'Biceps'], equipment: 'Bodyweight', sets: 4, reps: 8, rest: 95 },
          { id: 's02', name: 'Dumbbell Lateral Raise', muscles: ['Shoulders'], equipment: 'Dumbbell', sets: 3, reps: 12, rest: 75 },
          { id: 'tr03', name: 'Close-Grip Bench Press', muscles: ['Triceps', 'Chest'], equipment: 'Barbell', sets: 3, reps: 8, rest: 95 }
        ]
      },
      {
        dayName: 'Friday',
        dayIndex: 4,
        isRest: false,
        label: 'Lower',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { id: 'b01', name: 'Barbell Deadlift', muscles: ['Back', 'Hamstrings', 'Glutes'], equipment: 'Barbell', sets: 3, reps: 5, rest: 180 },
          { id: 'q05', name: 'Bulgarian Split Squat', muscles: ['Quads', 'Glutes'], equipment: 'Dumbbell', sets: 3, reps: 8, rest: 95 },
          { id: 'h02', name: 'Lying Leg Curl', muscles: ['Hamstrings'], equipment: 'Machine', sets: 3, reps: 10, rest: 75 },
          { id: 'ca01', name: 'Standing Calf Raise', muscles: ['Calves'], equipment: 'Machine', sets: 3, reps: 12, rest: 75 }
        ]
      },
      { dayName: 'Saturday', dayIndex: 5, isRest: true, label: 'Rest', muscles: [], exercises: [] },
      { dayName: 'Sunday', dayIndex: 6, isRest: true, label: 'Rest', muscles: [], exercises: [] }
    ]
  },
  {
    id: 'pr03',
    name: '5-Day Arnold Split (Hypertrophy)',
    splitName: 'Arnold Split',
    splitType: 'arnold',
    goal: 'hypertrophy',
    daysPerWeek: 5,
    week: [
      {
        dayName: 'Monday',
        dayIndex: 0,
        isRest: false,
        label: 'Chest & Back',
        muscles: ['Chest', 'Back'],
        exercises: [
          { id: 'c01', name: 'Barbell Bench Press', muscles: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell', sets: 4, reps: 10, rest: 90 },
          { id: 'b03', name: 'Barbell Bent-Over Row', muscles: ['Back', 'Biceps'], equipment: 'Barbell', sets: 4, reps: 10, rest: 90 },
          { id: 'c02', name: 'Incline Dumbbell Press', muscles: ['Chest', 'Shoulders'], equipment: 'Dumbbell', sets: 3, reps: 10, rest: 90 },
          { id: 'b02', name: 'Pull-Ups', muscles: ['Back', 'Biceps'], equipment: 'Bodyweight', sets: 3, reps: 10, rest: 90 }
        ]
      },
      {
        dayName: 'Tuesday',
        dayIndex: 1,
        isRest: false,
        label: 'Shoulders & Arms',
        muscles: ['Shoulders', 'Biceps', 'Triceps'],
        exercises: [
          { id: 's03', name: 'Dumbbell Shoulder Press', muscles: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', sets: 3, reps: 10, rest: 90 },
          { id: 'bi01', name: 'Barbell Curl', muscles: ['Biceps'], equipment: 'Barbell', sets: 3, reps: 12, rest: 75 },
          { id: 'tr04', name: 'Skull Crushers', muscles: ['Triceps'], equipment: 'Barbell', sets: 3, reps: 12, rest: 75 },
          { id: 's02', name: 'Dumbbell Lateral Raise', muscles: ['Shoulders'], equipment: 'Dumbbell', sets: 4, reps: 12, rest: 60 }
        ]
      },
      { dayName: 'Wednesday', dayIndex: 2, isRest: true, label: 'Rest', muscles: [], exercises: [] },
      {
        dayName: 'Thursday',
        dayIndex: 3,
        isRest: false,
        label: 'Legs',
        muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { id: 'q01', name: 'Barbell Back Squat', muscles: ['Quads', 'Glutes'], equipment: 'Barbell', sets: 4, reps: 8, rest: 120 },
          { id: 'h01', name: 'Romanian Deadlift', muscles: ['Hamstrings', 'Glutes'], equipment: 'Barbell', sets: 4, reps: 10, rest: 90 },
          { id: 'q03', name: 'Leg Press', muscles: ['Quads', 'Glutes'], equipment: 'Machine', sets: 3, reps: 12, rest: 90 },
          { id: 'ca02', name: 'Seated Calf Raise', muscles: ['Calves'], equipment: 'Machine', sets: 3, reps: 15, rest: 60 }
        ]
      },
      {
        dayName: 'Friday',
        dayIndex: 4,
        isRest: false,
        label: 'Chest & Back',
        muscles: ['Chest', 'Back'],
        exercises: [
          { id: 'c02', name: 'Incline Dumbbell Press', muscles: ['Chest', 'Shoulders'], equipment: 'Dumbbell', sets: 3, reps: 12, rest: 90 },
          { id: 'b06', name: 'Dumbbell Single-Arm Row', muscles: ['Back', 'Biceps'], equipment: 'Dumbbell', sets: 3, reps: 12, rest: 90 },
          { id: 'c04', name: 'Cable Crossover', muscles: ['Chest'], equipment: 'Cable', sets: 3, reps: 15, rest: 75 },
          { id: 'b04', name: 'Lat Pulldown', muscles: ['Back', 'Biceps'], equipment: 'Cable', sets: 3, reps: 12, rest: 75 }
        ]
      },
      {
        dayName: 'Saturday',
        dayIndex: 5,
        isRest: false,
        label: 'Shoulders & Arms',
        muscles: ['Shoulders', 'Biceps', 'Triceps'],
        exercises: [
          { id: 's02', name: 'Dumbbell Lateral Raise', muscles: ['Shoulders'], equipment: 'Dumbbell', sets: 4, reps: 15, rest: 60 },
          { id: 'bi02', name: 'Dumbbell Hammer Curl', muscles: ['Biceps'], equipment: 'Dumbbell', sets: 3, reps: 12, rest: 75 },
          { id: 'tr01', name: 'Tricep Pushdown', muscles: ['Triceps'], equipment: 'Cable', sets: 3, reps: 12, rest: 75 },
          { id: 'co01', name: 'Plank', muscles: ['Core'], equipment: 'Bodyweight', sets: 3, reps: 1, rest: 60 }
        ]
      },
      { dayName: 'Sunday', dayIndex: 6, isRest: true, label: 'Rest', muscles: [], exercises: [] }
    ]
  }
];

/**
 * In-memory cache of custom exercises, refreshed from API by React client.
 */
let _customExercisesCache = [];

/**
 * Update the cached custom exercises (called after API fetch).
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
export function filterExercises({ muscles = [], equipment = [], difficulty = null, type = null, search = '', goal = null } = {}) {
  const allExercises = [...EXERCISES, ..._customExercisesCache];
  return allExercises.filter(ex => {
    // If the goal is mobility/flexibility, only return mobility/flexibility exercises.
    // Otherwise, exclude mobility/flexibility exercises from standard strength/hypertrophy workouts.
    if (goal === 'mobility-flexibility') {
      if (!ex.id.startsWith('mf')) return false;
    } else if (goal !== null) {
      if (ex.id.startsWith('mf')) return false;
    }

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
