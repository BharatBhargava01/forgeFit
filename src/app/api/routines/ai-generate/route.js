import { NextResponse } from 'next/server';
import genAI from '@/utils/gemini';
import { SchemaType } from '@google/generative-ai';

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
    const { goal, splitType, daysPerWeek } = body;

    const goalLabels = {
      strength: "Strength (focused on low reps, heavy compound movements, longer rest, higher sets)",
      hypertrophy: "Hypertrophy (focused on moderate reps, balanced compound/isolation, moderate rest)",
      endurance: "Endurance (focused on high reps, circuit or low rest, lighter weights)"
    };
    const goalText = goalLabels[goal] || goalLabels.hypertrophy;

    const prompt = `
      You are a professional personal trainer. Generate a highly customized 7-day weekly workout routine.
      
      Parameters:
      - Training Goal: ${goalText}
      - Split Type: ${splitType}
      - Training Days: ${daysPerWeek} days per week, and ${7 - daysPerWeek} rest days.
      
      Instructions:
      1. Distribute training days and rest days logically across the 7 days (Monday through Sunday).
      2. Ensure that exactly ${daysPerWeek} days have "isRest: false" and exactly ${7 - daysPerWeek} days have "isRest: true".
      3. For training days, select appropriate target muscles matching the split type (${splitType}), and generate realistic exercises.
      4. For rest days, leave the muscles and exercises arrays empty and set isRest to true, and label it as 'Rest'.
      5. Order exercises on training days such that compounds come first, followed by isolations.
      6. Provide reasonable sets, reps, and rest times matching the training goal (${goal}).
      7. Use proper casing and professional naming for exercises and muscle groups.
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

    const formattedRoutine = {
      goal,
      daysPerWeek: parseInt(daysPerWeek) || 4,
      splitType,
      splitName: routineData.splitName || "Custom AI Split",
      week: formattedWeek
    };

    return NextResponse.json(formattedRoutine);
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return NextResponse.json({ error: "Gemini API error: " + error.message }, { status: 500 });
  }
}
