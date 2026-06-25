import { NextResponse } from 'next/server';
import genAI from '@/utils/gemini';
import { SchemaType } from '@google/generative-ai';
import { withCache, generateAiCacheKey } from '@/lib/redis';

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
    const { muscles, difficulty, duration, equipment, goal = 'hypertrophy' } = body;

    if (!muscles || !Array.isArray(muscles) || muscles.length === 0) {
      return NextResponse.json({ error: "At least one target muscle group must be specified." }, { status: 400 });
    }

    const cacheKey = generateAiCacheKey('workout', {
      muscles: [...muscles].sort(),
      difficulty,
      duration,
      equipment: equipment && Array.isArray(equipment) ? [...equipment].sort() : equipment,
      goal
    });

    const formattedWorkout = await withCache(cacheKey, 604800, async () => {
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

      const prompt = `
        You are a professional personal trainer. Generate a highly customized workout routine.
        Target Muscle Groups: ${muscles.join(', ')}
        Difficulty Level: ${difficultyText}
        Target Duration: ${duration} minutes
        Available Equipment: ${equipment && equipment.length ? equipment.join(', ') : 'Any standard gym equipment'}
        Training Goal: ${goalText}

        Instructions:
        1. Choose exercises that specifically target the requested muscle groups.
        2. Ensure a balanced selection starting with heavy compound exercises and finishing with isolation exercises.
        3. Set appropriate sets, reps, and rest times matching the training goal (${goal}).
        4. Order exercises scientifically with compound movements first (heavy barbell/dumbbell first) and stabilizers/core last.
        5. If the training goal is Mobility/Flexibility, you MUST ONLY select from specific mobility and flexibility exercises (e.g. World's Greatest Stretch, Cat-Cow Stretch, Cobra Stretch, Child's Pose, 90/90 Hip Rotations, Pigeon Pose, Couch Stretch, Scorpion Stretch, Thread the Needle, Doorway Chest Stretch, Band Chest Opener, etc.) and NOT select standard strength training or weightlifting exercises (like Bench Press, Squats, or Deadlifts).
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

      return {
        name: workoutData.name,
        description: workoutData.description,
        muscles: muscles,
        difficulty: parseInt(difficulty) || 2,
        duration: parseInt(duration) || 30,
        goal: goal,
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
    });

    return NextResponse.json(formattedWorkout);
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return NextResponse.json({ error: "Gemini API error: " + error.message }, { status: 500 });
  }
}
