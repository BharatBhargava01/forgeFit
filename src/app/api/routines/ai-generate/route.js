import { NextResponse } from 'next/server';
import genAI from '@/utils/gemini';
import { SchemaType } from '@google/generative-ai';
import { withCache, generateAiCacheKey } from '@/lib/redis';

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
            description: "The name of the weekday (e.g. Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)."
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
            description: "The label for the day (e.g. 'Push Day', 'Legs', 'Rest Day')."
          },
          muscles: {
            type: SchemaType.ARRAY,
            description: "Target muscle groups for this day (empty array if rest day).",
            items: { type: SchemaType.STRING }
          },
          exercises: {
            type: SchemaType.ARRAY,
            description: "List of exercises for this training day (empty array if rest day).",
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
                  description: "Required equipment (e.g. Barbell, Dumbbell, Cable, Machine, Bodyweight)."
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

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
      return NextResponse.json({ error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file." }, { status: 500 });
    }

    const body = await request.json();
    const { goal, splitType, daysPerWeek, profile = null } = body;

    const cacheKey = generateAiCacheKey('routine', { 
      goal, 
      splitType, 
      daysPerWeek,
      injuries: profile?.injuries || profile?.selected_injuries?.join(',') || 'None',
      equipment: profile?.equipment || 'Full Gym',
      focus_muscles: profile?.focus_muscles ? [...profile.focus_muscles].sort().join(',') : 'None'
    });

    const formattedRoutine = await withCache(cacheKey, 604800, async () => {
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
        ? `User Profile Constraints:
           - Fitness Level: ${profile.fitness_level || 'Not Specified'}
           - Injuries/Constraints: ${profile.injuries || profile.selected_injuries?.join(', ') || 'None'}
           - Preferred Equipment: ${profile.equipment || 'Full Gym'}
           - Target Focus Muscles: ${profile.focus_muscles ? profile.focus_muscles.join(', ') : 'None'}`
        : 'User Profile: None provided. Assume general gym access.';

      const prompt = `
        You are a professional personal trainer and sports scientist. Generate a highly customized 7-day weekly workout routine.
        
        Parameters:
        - Training Goal: ${goalText}
        - Split Type: ${splitType}
        - Training Days: ${daysPerWeek} days per week, and ${7 - daysPerWeek} rest days.
        
        ${profileContext}
        
        Instructions:
        1. Distribute training days and rest days logically across the 7 days (Monday through Sunday).
        2. Ensure that exactly ${daysPerWeek} days have "isRest: false" and exactly ${7 - daysPerWeek} days have "isRest: true".
        3. For training days, select appropriate target muscles matching the split type (${splitType}), and generate realistic exercises.
        4. Respect the equipment preferences: if preferred equipment is dumbbells only, bodyweight only, or kettlebells only, do NOT select exercises using standard gym machines, cables, or barbells.
        5. Respect the injury constraints: do NOT select exercises that put unsafe load or stress on flagged joints (e.g. no heavy squats/deadlifts for back pain; no bench press for shoulder impingements; adapt or choose safe alternatives).
        6. Respect focus muscles: increase the number of exercises or target sets for the prioritized focus muscles where possible.
        7. For rest days, leave the muscles and exercises arrays empty and set isRest to true, and label it as 'Rest'.
        8. Order exercises on training days such that compounds come first, followed by isolations.
        9. Provide reasonable sets, reps, and rest times matching the training goal (${goal}).
        10. Use proper casing and professional naming for exercises and muscle groups.
        11. If the training goal is Mobility/Flexibility, you MUST ONLY select from specific mobility and flexibility exercises (e.g. World's Greatest Stretch, Cat-Cow Stretch, Cobra Stretch, Child's Pose, 90/90 Hip Rotations, Pigeon Pose, Couch Stretch, Scorpion Stretch, Thread the Needle, Doorway Chest Stretch, Band Chest Opener, etc.) and NOT select standard strength training or weightlifting exercises (like Bench Press, Squats, or Deadlifts).
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: routineResponseSchema,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const routineData = JSON.parse(responseText);

      // Normalize and clean up response
      const formattedWeek = routineData.week.map(day => {
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
            description: ex.description || '',
            sets: parseInt(ex.sets) || 3,
            reps: parseInt(ex.reps) || 10,
            rest: parseInt(ex.rest) || 60
          }))
        };
      });

      return {
        goal,
        daysPerWeek: parseInt(daysPerWeek) || 4,
        splitType,
        splitName: routineData.splitName || "Custom AI Split",
        week: formattedWeek
      };
    });

    return NextResponse.json(formattedRoutine);
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return NextResponse.json({ error: "Gemini API error: " + error.message }, { status: 500 });
  }
}
