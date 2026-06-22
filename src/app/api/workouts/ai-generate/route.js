import { NextResponse } from 'next/server';
import genAI from '@/utils/gemini';
import { SchemaType } from '@google/generative-ai';

const workoutResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: {
      type: SchemaType.STRING,
      description: "A motivating and thematic name for the workout session.",
    },
    description: {
      type: SchemaType.STRING,
      description: "A short, engaging description explaining the focus and goals of the workout.",
    },
    estimatedMinutes: {
      type: SchemaType.INTEGER,
      description: "Estimated total duration of the workout in minutes.",
    },
    exercises: {
      type: SchemaType.ARRAY,
      description: "The list of exercises making up the workout.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: "The name of the exercise.",
          },
          muscles: {
            type: SchemaType.ARRAY,
            description: "Target muscle groups for this exercise (e.g. Chest, Shoulders, Triceps).",
            items: { type: SchemaType.STRING }
          },
          equipment: {
            type: SchemaType.STRING,
            description: "Required equipment (e.g. Barbell, Dumbbell, Cable, Machine, Bodyweight).",
          },
          difficulty: {
            type: SchemaType.INTEGER,
            description: "Difficulty (1 = Easy/Beginner, 2 = Medium/Intermediate, 3 = Hard/Advanced).",
          },
          type: {
            type: SchemaType.STRING,
            description: "Either 'compound' or 'isolation'.",
          },
          description: {
            type: SchemaType.STRING,
            description: "Brief tip on proper form or execution.",
          },
          sets: {
            type: SchemaType.INTEGER,
            description: "Recommended number of sets.",
          },
          reps: {
            type: SchemaType.INTEGER,
            description: "Recommended number of reps per set.",
          },
          rest: {
            type: SchemaType.INTEGER,
            description: "Rest time between sets in seconds.",
          }
        },
        required: ["name", "muscles", "equipment", "difficulty", "type", "description", "sets", "reps", "rest"]
      }
    }
  },
  required: ["name", "description", "estimatedMinutes", "exercises"]
};

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
      return NextResponse.json({ error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file." }, { status: 500 });
    }

    const body = await request.json();
    const { muscles, difficulty, duration, equipment } = body;

    if (!muscles || !Array.isArray(muscles) || muscles.length === 0) {
      return NextResponse.json({ error: "At least one target muscle group must be specified." }, { status: 400 });
    }

    const difficultyLabels = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
    const difficultyText = difficultyLabels[difficulty] || "Intermediate";

    const prompt = `
      You are a professional personal trainer. Generate a highly customized workout routine.
      Target Muscle Groups: ${muscles.join(', ')}
      Difficulty Level: ${difficultyText}
      Target Duration: ${duration} minutes
      Available Equipment: ${equipment && equipment.length ? equipment.join(', ') : 'Any standard gym equipment'}

      Instructions:
      1. Choose exercises that specifically target the requested muscle groups.
      2. Ensure a balanced selection starting with heavy compound exercises and finishing with isolation exercises.
      3. Set appropriate sets and reps tailored to ${difficultyText} level.
      4. Set realistic rest times (e.g. 90-120s for compounds, 60s for isolation).
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: workoutResponseSchema,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const workoutData = JSON.parse(responseText);

    const formattedWorkout = {
      name: workoutData.name,
      description: workoutData.description,
      muscles: muscles,
      difficulty: parseInt(difficulty) || 2,
      duration: parseInt(duration) || 30,
      exercises: workoutData.exercises.map(ex => ({
        ...ex,
        difficulty: parseInt(ex.difficulty) || parseInt(difficulty) || 2,
        sets: parseInt(ex.sets) || 3,
        reps: parseInt(ex.reps) || 10,
        rest: parseInt(ex.rest) || 60
      })),
      totalExercises: workoutData.exercises.length,
      estimatedMinutes: parseInt(workoutData.estimatedMinutes) || duration || 30
    };

    return NextResponse.json(formattedWorkout);
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return NextResponse.json({ error: "Gemini API error: " + error.message }, { status: 500 });
  }
}
