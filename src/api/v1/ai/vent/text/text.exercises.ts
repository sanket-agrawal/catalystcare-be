import { SuggestedExercise } from "./text.types";

export const WELLNESS_EXERCISES: Record<string, SuggestedExercise> = {
  ANXIOUS: {
    type: "breathing",
    title: "Box Breathing",
    instructions:
      "Inhale for 4 seconds, hold your breath for 4 seconds, exhale for 4 seconds, and hold empty for 4 seconds. Repeat this cycle 4 times to calm your nervous system.",
  },
  OVERWHELMED: {
    type: "grounding",
    title: "5-4-3-2-1 Grounding Method",
    instructions:
      "Acknowledge: 5 things you can see around you, 4 things you can touch, 3 things you hear, 2 things you can smell, and 1 thing you can taste. This shifts focus from your thoughts to your surroundings.",
  },
  ANGRY: {
    type: "breathing",
    title: "Cooling Down Breath",
    instructions:
      "Inhale deeply through your nose, hold for a moment, and exhale slowly through your mouth with a soft, relaxing sigh. Let your shoulders drop as you release the air.",
  },
  SAD: {
    type: "mindfulness",
    title: "Self-Compassion Pause",
    instructions:
      "Place a hand over your heart. Breathe deeply and tell yourself: 'This is a moment of difficulty. May I be kind to myself in this moment.' Allow yourself to feel without judgment.",
  },
  LONELY: {
    type: "mindfulness",
    title: "Heart Connection Reflection",
    instructions:
      "Close your eyes. Bring to mind someone who has shown you kindness or care. Breathe in that feeling of warmth, and remind yourself that you are not alone in wanting connection.",
  },
};

/**
 * Returns a suggested wellness exercise based on the user's sentiment.
 * Returns undefined for NEUTRAL, POSITIVE, or unknown sentiments.
 */
export function getSuggestedExercise(sentiment?: string): SuggestedExercise | undefined {
  if (!sentiment) return undefined;
  const key = sentiment.toUpperCase();
  return WELLNESS_EXERCISES[key];
}
