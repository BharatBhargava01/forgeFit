import genAI from '@/utils/gemini';
import { SchemaType } from '@google/generative-ai';
import { filterExercises } from '@/lib/data';

// ==========================================
// RESPONSE SCHEMAS
// ==========================================

const plannerResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    focusStyle: {
      type: SchemaType.STRING,
      description: "E.g. Strength progression, Metabolic hypertrophy, High density endurance, Joint-safe mobility."
    },
    muscleDistribution: {
      type: SchemaType.STRING,
      description: "E.g. Chest: 50%, shoulders: 50%."
    },
    totalExercises: {
      type: SchemaType.INTEGER,
      description: "Number of exercises in the session, typical 3-8 depending on duration."
    },
    exerciseBlueprint: {
      type: SchemaType.ARRAY,
      description: "Blueprint slots for exercises.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          muscleTarget: { type: SchemaType.STRING, description: "Specific target muscle" },
          type: { type: SchemaType.STRING, description: "Either 'compound' or 'isolation'" },
          explanation: { type: SchemaType.STRING, description: "Role of this movement in the session (e.g. primary compound lift, antagonist isolator)" }
        },
        required: ["muscleTarget", "type", "explanation"]
      }
    },
    safetyBoundaries: {
      type: SchemaType.ARRAY,
      description: "Safety bounds based on difficulty or injuries.",
      items: { type: SchemaType.STRING }
    }
  },
  required: ["focusStyle", "muscleDistribution", "totalExercises", "exerciseBlueprint", "safetyBoundaries"]
};

const selectorResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    selectedExerciseIds: {
      type: SchemaType.ARRAY,
      description: "List of exercise IDs chosen from the candidate list that match the blueprint.",
      items: { type: SchemaType.STRING }
    }
  },
  required: ["selectedExerciseIds"]
};

const optimizerResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    exercises: {
      type: SchemaType.ARRAY,
      description: "Prescribed volumes for the selected exercises.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          sets: { type: SchemaType.INTEGER },
          reps: { type: SchemaType.INTEGER },
          rest: { type: SchemaType.INTEGER, description: "Rest time in seconds" },
          coachingTip: { type: SchemaType.STRING, description: "Personalized coaching tip on execution tempo, breathing, or progressive overload." }
        },
        required: ["id", "sets", "reps", "rest", "coachingTip"]
      }
    }
  },
  required: ["exercises"]
};

const reviewerResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: {
      type: SchemaType.STRING,
      description: "Motivating and specific workout name (e.g. Iron Chest & Shoulder Press, Kinetic Joint Flow)."
    },
    description: {
      type: SchemaType.STRING,
      description: "Engaging summary explaining the structure and target outcomes of this workout."
    },
    exercises: {
      type: SchemaType.ARRAY,
      description: "The finalized ordered exercise list.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          muscles: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          equipment: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.INTEGER },
          type: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          sets: { type: SchemaType.INTEGER },
          reps: { type: SchemaType.INTEGER },
          rest: { type: SchemaType.INTEGER },
          coachingTip: { type: SchemaType.STRING }
        },
        required: ["id", "name", "muscles", "equipment", "difficulty", "type", "description", "sets", "reps", "rest", "coachingTip"]
      }
    },
    safetyAlert: {
      type: SchemaType.STRING,
      description: "A prominent caution note specifically regarding any injuries or safety concerns from profile. Empty string if none."
    }
  },
  required: ["name", "description", "exercises", "safetyAlert"]
};

// ==========================================
// PIPELINE RUNNER
// ==========================================

export async function* runMultiAgentPipeline({ muscles, difficulty, duration, equipment, goal, profile }) {
  const difficultyLabels = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
  const difficultyText = difficultyLabels[difficulty] || "Intermediate";

  const goalLabels = {
    strength: "Strength (focused on low reps, heavy compound movements, longer rest, higher sets)",
    hypertrophy: "Hypertrophy (focused on moderate reps, balanced compound/isolation, moderate rest)",
    endurance: "Endurance (focused on high reps, circuit or low rest, lighter weights)",
    'fat-loss': "Fat Loss (focused on higher reps, shorter rest times, high-density circuits)",
    powerlifting: "Powerlifting (focused on very low reps, high sets, maximum compound lifting, very long rest)",
    'cardio-conditioning': "Cardio/Conditioning (focused on high-intensity exercises, very high reps, minimal rest)",
    'mobility-flexibility': "Mobility/Flexibility (focused on functional range of motion, stretching, controlled contractions, moderate rest)"
  };
  const goalText = goalLabels[goal] || goalLabels.hypertrophy;

  // ----------------------------------------------------
  // AGENT 1: PLANNER
  // ----------------------------------------------------
  yield {
    status: 'planner_start',
    message: 'Designing workout structure based on muscle groupings, goals, and training split...'
  };

  const profileContext = profile 
    ? `User Profile:
       - Fitness Level: ${profile.fitness_level || 'Not Specified'}
       - Age: ${profile.age || 'Not Specified'}
       - Focus Areas: ${profile.focus_areas || 'None'}
       - Injuries/Constraints: ${profile.injuries || 'None'}`
    : 'User Profile: None provided. Assume general population safety guidelines.';

  const plannerPrompt = `
    You are Agent 1 (The Planner), an expert exercise physiologist and training programmer.
    Your task is to design a high-level workout session blueprint.
    
    Target Muscle Groups: ${muscles.join(', ')}
    Difficulty Level: ${difficultyText} (1=Beginner, 2=Intermediate, 3=Advanced)
    Target Duration: ${duration} minutes
    Available Equipment: ${equipment && equipment.length ? equipment.join(', ') : 'Any standard gym equipment'}
    Training Goal: ${goalText}
    
    ${profileContext}
    
    Instructions:
    1. Determine the optimal focus style and muscle distribution for this session.
    2. Determine the total number of exercise slots that realistically fit within ${duration} minutes. (Typically 3 for 15m, 4-5 for 30m, 5-6 for 45m, 6-7 for 60m, 8-9 for 90m).
    3. Create an exercise blueprint array specifying the target muscle and type (compound or isolation) for each slot.
    4. Ensure the order is scientifically sound (multi-joint compound exercises first, single-joint isolation exercises last).
    5. List specific safety boundaries and constraints based on the user's injuries and difficulty level (e.g. if they have lower back pain, caution against axial load like heavy squats/deadlifts; if beginner, suggest machine stabilizer focus).
  `;

  let plannerOutput;
  try {
    const plannerModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: plannerResponseSchema,
      },
    });
    const result = await plannerModel.generateContent(plannerPrompt);
    plannerOutput = JSON.parse(result.response.text());
    yield {
      status: 'planner_done',
      message: `Session structure designed: ${plannerOutput.totalExercises} exercises planned for ${plannerOutput.focusStyle}.`,
      data: plannerOutput
    };
  } catch (err) {
    console.error("Planner agent failed:", err);
    throw new Error("Failed to plan session: " + err.message);
  }

  // ----------------------------------------------------
  // AGENT 2: SELECTOR
  // ----------------------------------------------------
  yield {
    status: 'selector_start',
    message: 'Matching exercises from database to satisfy blueprint constraints...'
  };

  // Find candidate exercises from database matching parameters
  let candidates = filterExercises({ muscles, equipment, goal });
  if (candidates.length === 0) {
    candidates = filterExercises({ muscles, goal });
  }
  if (candidates.length === 0) {
    candidates = filterExercises({ muscles });
  }
  
  // Format candidates list to feed to prompt
  const serializedCandidates = candidates.map(c => ({
    id: c.id,
    name: c.name,
    muscles: c.muscles,
    equipment: c.equipment,
    type: c.type,
    description: c.description
  }));

  const selectorPrompt = `
    You are Agent 2 (The Selector), a biomechanical exercise specialist.
    Your task is to select specific physical exercises from our database that fulfill the Planner's blueprint slots.
    
    Planner's Blueprint:
    ${JSON.stringify(plannerOutput.exerciseBlueprint)}
    
    Safety Constraints:
    ${JSON.stringify(plannerOutput.safetyBoundaries)}
    
    Database Candidates:
    ${JSON.stringify(serializedCandidates)}
    
    Instructions:
    1. For each blueprint slot in order, select a matching exercise from the Database Candidates.
    2. You MUST only select exercises that exist in the Database Candidates list. DO NOT invent or hallucinate new exercises.
    3. Respect the equipment constraints. If equipment list was specified, do not select exercises using equipment that is not available, unless absolutely necessary.
    4. Match the exercise type (compound vs. isolation) and target muscle as closely as possible.
    5. Avoid repeating the same exercise in a single workout.
    6. Return the array of selected exercise IDs in the exact order of the slots.
  `;

  let selectorOutput;
  try {
    const selectorModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: selectorResponseSchema,
      },
    });
    const result = await selectorModel.generateContent(selectorPrompt);
    selectorOutput = JSON.parse(result.response.text());
    
    // Resolve full exercise data from selected IDs
    const resolvedExercises = selectorOutput.selectedExerciseIds
      .map(id => candidates.find(c => c.id === id))
      .filter(Boolean);

    yield {
      status: 'selector_done',
      message: `Selected ${resolvedExercises.length} movements matching biomechanics specs.`,
      data: resolvedExercises
    };
  } catch (err) {
    console.error("Selector agent failed:", err);
    throw new Error("Failed to select exercises: " + err.message);
  }

  // ----------------------------------------------------
  // AGENT 3: OPTIMIZER
  // ----------------------------------------------------
  yield {
    status: 'optimizer_start',
    message: 'Calculating sets, reps, rests, and customized scientific coaching cues...'
  };

  const resolvedExercises = selectorOutput.selectedExerciseIds
    .map(id => candidates.find(c => c.id === id))
    .filter(Boolean);

  const optimizerPrompt = `
    You are Agent 3 (The Optimizer), a sports scientist and volume optimizer.
    Your task is to prescribe the sets, reps, rest periods, and custom training cues for the chosen exercises.
    
    Training Goal: ${goalText}
    Difficulty level: ${difficultyText}
    ${profileContext}
    
    Selected Exercises:
    ${JSON.stringify(resolvedExercises)}
    
    Instructions:
    1. For each exercise, decide the number of sets, target repetitions, and rest intervals.
    2. Enforce scientific parameters:
       - Strength/Powerlifting: 3-5 sets, 1-6 reps, 2-4 minutes rest.
       - Hypertrophy: 3-4 sets, 8-12 reps, 60-90 seconds rest.
       - Endurance/Fat-loss: 2-3 sets, 15-25 reps, 30-45 seconds rest.
       - Mobility/Flexibility: 2-3 sets, 8-12 reps or holds, 30 seconds rest.
    3. Modify sets/reps based on user profile. E.g. lower volume for beginners/seniors, higher intensity cues for advanced.
    4. Write a coaching tip for each exercise focusing on tempo, eccentric control, or mind-muscle connection.
  `;

  let optimizerOutput;
  try {
    const optimizerModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: optimizerResponseSchema,
      },
    });
    const result = await optimizerModel.generateContent(optimizerPrompt);
    optimizerOutput = JSON.parse(result.response.text());
    yield {
      status: 'optimizer_done',
      message: 'Volume density and recovery periods optimized.',
      data: optimizerOutput
    };
  } catch (err) {
    console.error("Optimizer agent failed:", err);
    throw new Error("Failed to optimize parameters: " + err.message);
  }

  // ----------------------------------------------------
  // AGENT 4: REVIEWER
  // ----------------------------------------------------
  yield {
    status: 'reviewer_start',
    message: 'Auditing workout safety, naming the routine, and performing final validations...'
  };

  // Build a draft workout representation for reviewer to audit
  const draftExercises = resolvedExercises.map(ex => {
    const opt = optimizerOutput.exercises.find(o => o.id === ex.id) || {};
    return {
      ...ex,
      sets: opt.sets || 3,
      reps: opt.reps || 10,
      rest: opt.rest || 60,
      coachingTip: opt.coachingTip || "Maintain strict form."
    };
  });

  const reviewerPrompt = `
    You are Agent 4 (The Reviewer), a veteran head coach.
    Your task is to inspect the draft workout, perform safety and quality audits, provide a name and description, and generate the final output.
    
    User Profile:
    ${profileContext}
    Goal: ${goal}
    Duration: ${duration} minutes
    Difficulty: ${difficultyText}
    
    Draft Workout:
    ${JSON.stringify(draftExercises)}
    
    Planner Safety Constraints:
    ${JSON.stringify(plannerOutput.safetyBoundaries)}
    
    Instructions:
    1. Inspect the exercises. Ensure that exercises do NOT clash with the user's injuries (e.g. if back pain is present, make sure no high axial spinal load movements are in the list; if knee pain is present, make sure no heavy quad loading without adjustment is present). If a problematic movement exists, swap it or add a strict safety description modify/hint to it.
    2. Check the order. Heavy compound movements MUST come before isolation. Adjust if necessary.
    3. Generate a motivating, highly themed name and short description explaining the goal of the session.
    4. Compile the list of exercises into the final validated format. Ensure all numerical fields (difficulty, sets, reps, rest) are valid integers.
    5. Write a helpful safetyAlert string if there's an injury or joint concern, otherwise leave it empty.
  `;

  let reviewerOutput;
  try {
    const reviewerModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: reviewerResponseSchema,
      },
    });
    const result = await reviewerModel.generateContent(reviewerPrompt);
    reviewerOutput = JSON.parse(result.response.text());

    // Calculate final estimated duration based on sets, reps, rest
    const estimatedTime = reviewerOutput.exercises.reduce((acc, ex) => {
      const setDuration = ((ex.reps || 10) * 3 + (ex.rest || 60)) * (ex.sets || 3);
      return acc + setDuration;
    }, 0);

    const finalWorkout = {
      name: reviewerOutput.name,
      description: reviewerOutput.description,
      muscles: muscles,
      difficulty: parseInt(difficulty) || 2,
      duration: parseInt(duration) || 30,
      goal: goal,
      exercises: reviewerOutput.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        muscles: ex.muscles || [],
        equipment: ex.equipment || "Bodyweight",
        difficulty: parseInt(ex.difficulty) || parseInt(difficulty) || 2,
        type: ex.type || "compound",
        description: `${ex.description}${ex.coachingTip ? ` Tip: ${ex.coachingTip}` : ''}`,
        sets: parseInt(ex.sets) || 3,
        reps: parseInt(ex.reps) || 10,
        rest: parseInt(ex.rest) || 60
      })),
      totalExercises: reviewerOutput.exercises.length,
      estimatedMinutes: Math.round(estimatedTime / 60) || duration || 30,
      safetyAlert: reviewerOutput.safetyAlert || null
    };

    yield {
      status: 'reviewer_done',
      message: 'Quality audit complete. Workout signed off.',
      data: finalWorkout
    };

    yield {
      status: 'completed',
      data: finalWorkout
    };
  } catch (err) {
    console.error("Reviewer agent failed:", err);
    throw new Error("Failed during final review and compilation: " + err.message);
  }
}

// ==========================================
// USER PROGRAM AI BLUEPRINT PIPELINE SCHEMAS
// ==========================================

const blueprintDietitianSchema = {
  type: SchemaType.OBJECT,
  properties: {
    targetCalories: {
      type: SchemaType.INTEGER,
      description: "Customized daily calorie target based on physiological stats and fitness goal."
    },
    proteinGrams: {
      type: SchemaType.INTEGER,
      description: "Customized daily protein target in grams."
    },
    carbGrams: {
      type: SchemaType.INTEGER,
      description: "Customized daily carb target in grams."
    },
    fatGrams: {
      type: SchemaType.INTEGER,
      description: "Customized daily fat target in grams."
    }
  },
  required: ["targetCalories", "proteinGrams", "carbGrams", "fatGrams"]
};

const blueprintStrategistSchema = {
  type: SchemaType.OBJECT,
  properties: {
    recommendedSplit: {
      type: SchemaType.STRING,
      description: "Recommended weekly routine split name (e.g. Upper/Lower, 3-Day Push/Pull/Legs, Arnold Split, Custom AI Split)."
    },
    weeklySchedule: {
      type: SchemaType.ARRAY,
      description: "Suggested 7-day schedule summary, from Monday to Sunday, matching user frequency.",
      items: { type: SchemaType.STRING }
    }
  },
  required: ["recommendedSplit", "weeklySchedule"]
};

const blueprintReviewerSchema = {
  type: SchemaType.OBJECT,
  properties: {
    coachAdvice: {
      type: SchemaType.STRING,
      description: "Personalized advice from the AI coach addressing injuries, equipment, and focus muscles."
    },
    keyMilestone: {
      type: SchemaType.STRING,
      description: "A motivating first milestone to target."
    }
  },
  required: ["coachAdvice", "keyMilestone"]
};

// ==========================================
// WEEKLY ROUTINE PIPELINE SCHEMAS
// ==========================================

const routinePlannerResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    splitName: {
      type: SchemaType.STRING,
      description: "A descriptive name for this routine layout (e.g. Push/Pull/Legs, Upper/Lower, Arnold Split, Custom AI Split)."
    },
    week: {
      type: SchemaType.ARRAY,
      description: "A 7-day schedule representing the week, starting with Monday. Distribute training days and rest days matching frequency constraint.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dayName: { type: SchemaType.STRING, description: "Monday, Tuesday, etc." },
          dayIndex: { type: SchemaType.INTEGER, description: "0 for Monday, 6 for Sunday." },
          isRest: { type: SchemaType.BOOLEAN, description: "True if rest day, false if training day." },
          label: { type: SchemaType.STRING, description: "e.g. Push Day, Pull Day, Legs, Rest" },
          muscles: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Target muscle groups for this day (empty if rest day)" }
        },
        required: ["dayName", "dayIndex", "isRest", "label", "muscles"]
      }
    }
  },
  required: ["splitName", "week"]
};

const routineSelectorResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    week: {
      type: SchemaType.ARRAY,
      description: "A 7-day schedule representing the week, starting with Monday.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dayIndex: { type: SchemaType.INTEGER },
          selectedExerciseIds: {
            type: SchemaType.ARRAY,
            description: "List of exercise IDs chosen from the candidate database list for this day's muscles. Empty if rest day.",
            items: { type: SchemaType.STRING }
          }
        },
        required: ["dayIndex", "selectedExerciseIds"]
      }
    }
  },
  required: ["week"]
};

const routineOptimizerResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    week: {
      type: SchemaType.ARRAY,
      description: "A 7-day schedule representing the week, starting with Monday.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dayIndex: { type: SchemaType.INTEGER },
          exercises: {
            type: SchemaType.ARRAY,
            description: "Volume metrics for selected exercises.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                sets: { type: SchemaType.INTEGER },
                reps: { type: SchemaType.INTEGER },
                rest: { type: SchemaType.INTEGER, description: "Rest time in seconds" },
                coachingTip: { type: SchemaType.STRING, description: "Tips on execution tempo or safety." }
              },
              required: ["id", "sets", "reps", "rest", "coachingTip"]
            }
          }
        },
        required: ["dayIndex", "exercises"]
      }
    }
  },
  required: ["week"]
};

const routineResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    splitName: {
      type: SchemaType.STRING,
      description: "A descriptive name for this routine layout (e.g. Push/Pull/Legs, Upper/Lower, Arnold Split, Custom AI Split)."
    },
    week: {
      type: SchemaType.ARRAY,
      description: "A 7-day schedule representing the week, starting with Monday.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dayName: {
            type: SchemaType.STRING,
            description: "The name of the weekday (e.g. Monday, Tuesday, etc.)."
          },
          dayIndex: {
            type: SchemaType.INTEGER,
            description: "The 0-based index of the day (0 = Monday, 6 = Sunday)."
          },
          isRest: {
            type: SchemaType.BOOLEAN,
            description: "True if it's a rest day, false if it's a training day."
          },
          label: {
            type: SchemaType.STRING,
            description: "The label for the day (e.g. 'Push Day', 'Legs', 'Rest')."
          },
          muscles: {
            type: SchemaType.ARRAY,
            description: "Target muscle groups for this day.",
            items: { type: SchemaType.STRING }
          },
          exercises: {
            type: SchemaType.ARRAY,
            description: "List of exercises for this training day.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: {
                  type: SchemaType.STRING,
                  description: "Name of the exercise."
                },
                muscles: {
                  type: SchemaType.ARRAY,
                  description: "Muscle groups targeted by this exercise.",
                  items: { type: SchemaType.STRING }
                },
                equipment: {
                  type: SchemaType.STRING,
                  description: "Required equipment (e.g. Barbell, Dumbbell, Bodyweight)."
                },
                difficulty: {
                  type: SchemaType.INTEGER,
                  description: "Difficulty (1 = Easy, 2 = Medium, 3 = Hard)."
                },
                type: {
                  type: SchemaType.STRING,
                  description: "Either 'compound' or 'isolation'."
                },
                description: {
                  type: SchemaType.STRING,
                  description: "Form execution tips."
                },
                sets: {
                  type: SchemaType.INTEGER,
                  description: "Recommended sets."
                },
                reps: {
                  type: SchemaType.INTEGER,
                  description: "Recommended reps per set."
                },
                rest: {
                  type: SchemaType.INTEGER,
                  description: "Rest time in seconds between sets."
                }
              },
              required: ["name", "muscles", "equipment", "difficulty", "type", "description", "sets", "reps", "rest"]
            }
          }
        },
        required: ["dayName", "dayIndex", "isRest", "label", "muscles", "exercises"]
      }
    }
  },
  required: ["splitName", "week"]
};

// ==========================================
// BLUEPRINT PIPELINE RUNNER
// ==========================================

export async function* runMultiAgentBlueprintPipeline({ profile }) {
  const difficultyLabels = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
  const fitnessLevelText = difficultyLabels[profile.fitness_level] || profile.fitness_level || "Intermediate";

  // ----------------------------------------------------
  // AGENT 1: DIETITIAN (PLANNER)
  // ----------------------------------------------------
  yield {
    status: 'dietitian_start',
    message: 'Dietitian Agent: Analyzing physiological stats and calculating customized daily calorie & macronutrient targets...'
  };

  const dietitianPrompt = `
    You are Agent 1 (The Dietitian), an expert sports nutritionist.
    Your task is to calculate daily calorie targets and macronutrient splits (protein, carbs, fat in grams) for a user based on their profile.
    
    User Profile:
    - Age: ${profile.age || 'Not specified'} years
    - Gender: ${profile.gender || 'Not specified'}
    - Weight: ${profile.weight || 70} kg
    - Target Weight: ${profile.target_weight || profile.targetWeight || 'Not specified'} kg
    - Height: ${profile.height || 170} cm
    - Fitness Goal: ${profile.goal || 'hypertrophy'}
    - Fitness Level: ${fitnessLevelText}
    - Training Frequency: ${profile.frequency || 4} days/week
    
    Instructions:
    1. Calculate target daily calories and macronutrient splits (Protein, Carbs, Fat) scientifically based on Mifflin-St Jeor formula and fitness goal.
    2. Maintain target calorie and macros as integers.
  `;

  let dietitianOutput;
  try {
    const dietitianModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: blueprintDietitianSchema,
      },
    });
    const result = await dietitianModel.generateContent(dietitianPrompt);
    dietitianOutput = JSON.parse(result.response.text());
    yield {
      status: 'dietitian_done',
      message: `Dietitian Agent completed. Daily Calories: ${dietitianOutput.targetCalories} kcal (P: ${dietitianOutput.proteinGrams}g, C: ${dietitianOutput.carbGrams}g, F: ${dietitianOutput.fatGrams}g).`,
      data: dietitianOutput
    };
  } catch (err) {
    console.error("Dietitian agent failed:", err);
    throw new Error("Failed to calculate nutrition profile: " + err.message);
  }

  // ----------------------------------------------------
  // AGENT 2: STRATEGIST (SELECTOR)
  // ----------------------------------------------------
  yield {
    status: 'strategist_start',
    message: 'Strategist Agent: Selecting the optimal routine split and 7-day schedule layout...'
  };

  const strategistPrompt = `
    You are Agent 2 (The Strategist), an elite strength coach.
    Your task is to determine the most effective weekly training split and draft a 7-day schedule layout.
    
    User Profile:
    - Goal: ${profile.goal || 'hypertrophy'}
    - Experience: ${fitnessLevelText}
    - Target Workout Frequency: ${profile.frequency || 4} days/week
    - Priorities: ${profile.focus_muscles ? profile.focus_muscles.join(', ') : 'All balanced'}
    
    Instructions:
    1. Reconfirm/suggest the most effective weekly routine split (e.g. 'Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Arnold Split', 'Bro Split').
    2. Schedule a 7-day schedule starting with Monday and ending with Sunday. Ensure it matches their frequency constraint (${profile.frequency || 4} training days and ${7 - (profile.frequency || 4)} rest days).
    3. Output each day as "DayName: DayDescription" (e.g., "Monday: Push Day", "Tuesday: Rest").
  `;

  let strategistOutput;
  try {
    const strategistModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: blueprintStrategistSchema,
      },
    });
    const result = await strategistModel.generateContent(strategistPrompt);
    strategistOutput = JSON.parse(result.response.text());
    yield {
      status: 'strategist_done',
      message: `Strategist Agent completed. Recommended Split: ${strategistOutput.recommendedSplit}.`,
      data: strategistOutput
    };
  } catch (err) {
    console.error("Strategist agent failed:", err);
    throw new Error("Failed to design strategy: " + err.message);
  }

  // ----------------------------------------------------
  // AGENT 3: HEAD COACH (REVIEWER)
  // ----------------------------------------------------
  yield {
    status: 'reviewer_start',
    message: 'Reviewer Agent: Auditing for injury safety, equipment constraints, and formulating milestones...'
  };

  const reviewerPrompt = `
    You are Agent 3 (The Reviewer/Head Coach), a veteran training director.
    Your task is to review the strategy, write safety-oriented coach advice addressing their injury profile and equipment limits, and create their first motivating milestone.
    
    User Profile:
    - Injuries/Joint Constraints: ${profile.injuries || 'None'}
    - Available Equipment: ${profile.equipment || 'Full Gym'}
    - Goal: ${profile.goal}
    - Recommended Split: ${strategistOutput.recommendedSplit}
    
    Instructions:
    1. Inspect the profile for joint injuries or equipment limitations.
    2. Formulate encouraging, safety-oriented coach advice addressing these limitations.
    3. Define a realistic and motivating first milestone to target (e.g. 'Perform 1 pain-free pull-up', 'Add 5kg to bench press', 'Perform 15 continuous push-ups').
  `;

  let reviewerOutput;
  try {
    const reviewerModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: blueprintReviewerSchema,
      },
    });
    const result = await reviewerModel.generateContent(reviewerPrompt);
    reviewerOutput = JSON.parse(result.response.text());
    
    const finalBlueprint = {
      recommendedSplit: strategistOutput.recommendedSplit,
      weeklySchedule: strategistOutput.weeklySchedule,
      targetCalories: dietitianOutput.targetCalories,
      proteinGrams: dietitianOutput.proteinGrams,
      carbGrams: dietitianOutput.carbGrams,
      fatGrams: dietitianOutput.fatGrams,
      coachAdvice: reviewerOutput.coachAdvice,
      keyMilestone: reviewerOutput.keyMilestone
    };

    yield {
      status: 'reviewer_done',
      message: 'Reviewer Agent completed. Onboarding AI Program Blueprint finalized.',
      data: finalBlueprint
    };

    yield {
      status: 'completed',
      data: finalBlueprint
    };
  } catch (err) {
    console.error("Reviewer agent failed:", err);
    throw new Error("Failed to finalize blueprint safety audit: " + err.message);
  }
}

// ==========================================
// ROUTINE PIPELINE RUNNER
// ==========================================

export async function* runMultiAgentRoutinePipeline({ goal, splitType, daysPerWeek, profile }) {
  const goalLabels = {
    strength: "Strength (focused on low reps, heavy compound movements, longer rest, higher sets)",
    hypertrophy: "Hypertrophy (focused on moderate reps, balanced compound/isolation, moderate rest)",
    endurance: "Endurance (focused on high reps, circuit or low rest, lighter weights)",
    'fat-loss': "Fat Loss (focused on higher reps, shorter rest times, high-density circuits)",
    powerlifting: "Powerlifting (focused on very low reps, high sets, maximum compound lifting, very long rest)",
    'cardio-conditioning': "Cardio/Conditioning (focused on high-intensity exercises, very high reps, minimal rest)",
    'mobility-flexibility': "Mobility/Flexibility (focused on functional range of motion, stretching, controlled contractions, moderate rest)"
  };
  const goalText = goalLabels[goal] || goalLabels.hypertrophy;

  const profileContext = profile 
    ? `User Profile:
       - Current Weight: ${profile.weight || 'Not Specified'} kg
       - Target Weight: ${profile.target_weight || profile.targetWeight || 'Not Specified'} kg
       - Fitness Level: ${profile.fitness_level || 'Not Specified'}
       - Injuries/Constraints: ${profile.injuries || profile.selected_injuries?.join(', ') || 'None'}
       - Preferred Equipment: ${profile.equipment || 'Full Gym'}
       - Target Focus Muscles: ${profile.focus_muscles ? profile.focus_muscles.join(', ') : 'None'}`
    : 'User Profile: None provided. Assume general gym access.';

  // ----------------------------------------------------
  // AGENT 1: PLANNER
  // ----------------------------------------------------
  yield {
    status: 'planner_start',
    message: 'Planner Agent: Structuring the weekly calendar, mapping training vs rest days, and distributing muscles...'
  };

  const plannerPrompt = `
    You are Agent 1 (The Planner), an expert training strategist.
    Your task is to structure a 7-day training schedule split based on the following parameters.
    
    Parameters:
    - Training Goal: ${goalText}
    - Split Type: ${splitType}
    - Target frequency: ${daysPerWeek} training days and ${7 - daysPerWeek} rest days.
    
    ${profileContext}
    
    Instructions:
    1. Distribute training days and rest days logically across Monday through Sunday.
    2. Ensure that exactly ${daysPerWeek} days are training days (isRest: false) and ${7 - daysPerWeek} are rest days (isRest: true).
    3. For training days, select appropriate target muscles matching the split type (${splitType}).
    4. Provide a label for each day (e.g. 'Push Day', 'Pull Day', 'Legs', 'Rest Day').
  `;

  let plannerOutput;
  try {
    const plannerModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: routinePlannerResponseSchema,
      },
    });
    const result = await plannerModel.generateContent(plannerPrompt);
    plannerOutput = JSON.parse(result.response.text());
    yield {
      status: 'planner_done',
      message: `Planner Agent completed. Routine Split Name: "${plannerOutput.splitName}" with ${daysPerWeek} training days mapped.`,
      data: plannerOutput
    };
  } catch (err) {
    console.error("Routine Planner failed:", err);
    throw new Error("Failed to plan routine structure: " + err.message);
  }

  // ----------------------------------------------------
  // AGENT 2: SELECTOR
  // ----------------------------------------------------
  yield {
    status: 'selector_start',
    message: 'Selector Agent: Querying database and selecting exercise selections matching weekly constraints...'
  };

  // Find candidate exercises from database matching equipment & goal
  const equipment = profile?.equipment ? [profile.equipment] : [];
  let candidates = filterExercises({ equipment, goal });
  if (candidates.length === 0) candidates = filterExercises({ goal });
  if (candidates.length === 0) candidates = filterExercises({});

  const serializedCandidates = candidates.map(c => ({
    id: c.id,
    name: c.name,
    muscles: c.muscles,
    equipment: c.equipment,
    type: c.type,
    description: c.description
  }));

  const selectorPrompt = `
    You are Agent 2 (The Selector), a biomechanical exercise specialist.
    Your task is to select specific physical exercises from our database for each training day in the Planner's week layout.
    
    Planner's Week Layout:
    ${JSON.stringify(plannerOutput.week)}
    
    Database Candidates:
    ${JSON.stringify(serializedCandidates)}
    
    ${profileContext}
    
    Instructions:
    1. For each training day in the Planner's layout (where isRest is false), select 4 to 6 exercise IDs from the Database Candidates list that target the day's muscles.
    2. You MUST only select exercise IDs that exist in the Database Candidates list. DO NOT invent or hallucinate new exercises.
    3. Respect equipment preferences. Do not select exercises requiring equipment the user doesn't have.
    4. Respect injuries. Do not select exercises that stress injured joints.
    5. If a day is a rest day, leave selectedExerciseIds as an empty array.
  `;

  let selectorOutput;
  try {
    const selectorModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: routineSelectorResponseSchema,
      },
    });
    const result = await selectorModel.generateContent(selectorPrompt);
    selectorOutput = JSON.parse(result.response.text());
    yield {
      status: 'selector_done',
      message: 'Selector Agent completed. Grounded and selected appropriate exercises for all training days.',
      data: selectorOutput
    };
  } catch (err) {
    console.error("Routine Selector failed:", err);
    throw new Error("Failed to select routine exercises: " + err.message);
  }

  // ----------------------------------------------------
  // AGENT 3: OPTIMIZER
  // ----------------------------------------------------
  yield {
    status: 'optimizer_start',
    message: 'Optimizer Agent: Calculating target sets, reps, rest intervals, and coaching tips...'
  };

  // Resolve exercise details from database candidates for the prompt context
  const resolvedSelectorWeek = selectorOutput.week.map(day => {
    const exercisesDetails = (day.selectedExerciseIds || [])
      .map(id => candidates.find(c => c.id === id))
      .filter(Boolean);
    return {
      dayIndex: day.dayIndex,
      exercises: exercisesDetails
    };
  });

  const optimizerPrompt = `
    You are Agent 3 (The Optimizer), a sports scientist and volume optimizer.
    Your task is to prescribe the sets, reps, rest periods, and coaching tips for each exercise in the weekly routine.
    
    Training Goal: ${goalText}
    Weekly Split: ${splitType}
    
    Selected Exercises per Day:
    ${JSON.stringify(resolvedSelectorWeek)}
    
    ${profileContext}
    
    Instructions:
    1. For each exercise on each day, prescribe sets, reps, rest times, and a custom execution tip.
    2. Apply scientific training guidelines matching the goal:
       - Strength/Powerlifting: 3-5 sets, 1-6 reps, 120-240s rest.
       - Hypertrophy: 3-4 sets, 8-12 reps, 60-90s rest.
       - Endurance/Fat Loss: 2-3 sets, 15-25 reps, 30-45s rest.
       - Mobility/Flexibility: 2-3 sets, 8-12 reps or static holds, 30s rest.
    3. Tailor variables according to user fitness level (lower sets for beginner, higher intensity for advanced).
  `;

  let optimizerOutput;
  try {
    const optimizerModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: routineOptimizerResponseSchema,
      },
    });
    const result = await optimizerModel.generateContent(optimizerPrompt);
    optimizerOutput = JSON.parse(result.response.text());
    yield {
      status: 'optimizer_done',
      message: 'Optimizer Agent completed. Volume, reps, and rests calculated scientifically.',
      data: optimizerOutput
    };
  } catch (err) {
    console.error("Routine Optimizer failed:", err);
    throw new Error("Failed to optimize routine volumes: " + err.message);
  }

  // ----------------------------------------------------
  // AGENT 4: REVIEWER
  // ----------------------------------------------------
  yield {
    status: 'reviewer_start',
    message: 'Reviewer Agent: Performing final weekly safety audits and compilation...'
  };

  // Compile a draft week for the reviewer to audit
  const draftWeek = plannerOutput.week.map(day => {
    if (day.isRest) {
      return { ...day, exercises: [] };
    }
    const selDay = selectorOutput.week.find(d => d.dayIndex === day.dayIndex) || {};
    const optDay = optimizerOutput.week.find(d => d.dayIndex === day.dayIndex) || {};
    
    const exercises = (selDay.selectedExerciseIds || []).map(id => {
      const dbEx = candidates.find(c => c.id === id) || {};
      const optEx = (optDay.exercises || []).find(e => e.id === id || e.name === dbEx.name) || {};
      return {
        name: dbEx.name || optEx.name || 'Exercise',
        muscles: dbEx.muscles || [],
        equipment: dbEx.equipment || 'Bodyweight',
        difficulty: dbEx.difficulty || 2,
        type: dbEx.type || 'compound',
        description: dbEx.description || '',
        sets: optEx.sets || 3,
        reps: optEx.reps || 10,
        rest: optEx.rest || 60,
        coachingTip: optEx.coachingTip || ''
      };
    });

    return {
      ...day,
      exercises
    };
  });

  const reviewerPrompt = `
    You are Agent 4 (The Reviewer/Head Coach).
    Your task is to inspect the draft weekly routine, perform safety audits for injuries, verify exercise order (compounds before isolations), and compile the final weekly routine JSON.
    
    User Profile:
    ${profileContext}
    Goal: ${goal}
    Split: ${splitType}
    
    Draft Week Routine:
    ${JSON.stringify(draftWeek)}
    
    Instructions:
    1. Inspect all exercises on all training days. Make sure no exercises violate joint injuries (e.g. no heavy axial loading for lower back pain, adapt shoulder movements if shoulder impingement is present). If a problem exists, swap it or adjust its description.
    2. Ensure compound exercises come before isolation exercises on training days.
    3. Output the final routine weekly schedule following the schema exactly.
  `;

  let reviewerOutput;
  try {
    const reviewerModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: routineResponseSchema,
      },
    });
    const result = await reviewerModel.generateContent(reviewerPrompt);
    reviewerOutput = JSON.parse(result.response.text());

    // Normalize final routine week schedule
    const formattedWeek = reviewerOutput.week.map(day => {
      if (day.isRest) {
        return {
          dayName: day.dayName,
          dayIndex: parseInt(day.dayIndex) || 0,
          isRest: true,
          label: day.label || 'Rest',
          muscles: [],
          exercises: []
        };
      }
      return {
        dayName: day.dayName,
        dayIndex: parseInt(day.dayIndex) || 0,
        isRest: false,
        label: day.label || 'Training Day',
        muscles: day.muscles || [],
        exercises: (day.exercises || []).map(ex => ({
          name: ex.name,
          muscles: ex.muscles || [],
          equipment: ex.equipment || 'Bodyweight',
          difficulty: parseInt(ex.difficulty) || 2,
          type: ex.type || 'compound',
          description: ex.description + (ex.coachingTip ? ` Tip: ${ex.coachingTip}` : ''),
          sets: parseInt(ex.sets) || 3,
          reps: parseInt(ex.reps) || 10,
          rest: parseInt(ex.rest) || 60
        }))
      };
    });

    const finalRoutine = {
      goal,
      daysPerWeek: parseInt(daysPerWeek) || 4,
      splitType,
      splitName: reviewerOutput.splitName || plannerOutput.splitName || "Custom AI Split",
      week: formattedWeek
    };

    yield {
      status: 'reviewer_done',
      message: 'Reviewer Agent completed. Weekly Routine audit complete & certified.',
      data: finalRoutine
    };

    yield {
      status: 'completed',
      data: finalRoutine
    };
  } catch (err) {
    console.error("Routine Reviewer failed:", err);
    throw new Error("Failed to review weekly routine: " + err.message);
  }
}
