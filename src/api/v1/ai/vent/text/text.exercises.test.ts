import { describe, expect, it } from "vitest";
import { getSuggestedExercise, WELLNESS_EXERCISES } from "./text.exercises";

describe("getSuggestedExercise", () => {
  it("should return breathing exercise for ANXIOUS sentiment", () => {
    const exercise = getSuggestedExercise("ANXIOUS");
    expect(exercise).toBeDefined();
    expect(exercise!.type).toBe("breathing");
    expect(exercise!.title).toBe("Box Breathing");
  });

  it("should return grounding exercise for OVERWHELMED sentiment", () => {
    const exercise = getSuggestedExercise("OVERWHELMED");
    expect(exercise).toBeDefined();
    expect(exercise!.type).toBe("grounding");
    expect(exercise!.title).toBe("5-4-3-2-1 Grounding Method");
  });

  it("should return breathing exercise for ANGRY sentiment", () => {
    const exercise = getSuggestedExercise("ANGRY");
    expect(exercise).toBeDefined();
    expect(exercise!.type).toBe("breathing");
    expect(exercise!.title).toBe("Cooling Down Breath");
  });

  it("should return mindfulness exercise for SAD sentiment", () => {
    const exercise = getSuggestedExercise("SAD");
    expect(exercise).toBeDefined();
    expect(exercise!.type).toBe("mindfulness");
    expect(exercise!.title).toBe("Self-Compassion Pause");
  });

  it("should return mindfulness exercise for LONELY sentiment", () => {
    const exercise = getSuggestedExercise("LONELY");
    expect(exercise).toBeDefined();
    expect(exercise!.type).toBe("mindfulness");
    expect(exercise!.title).toBe("Heart Connection Reflection");
  });

  it("should return undefined for NEUTRAL sentiment", () => {
    expect(getSuggestedExercise("NEUTRAL")).toBeUndefined();
  });

  it("should return undefined for POSITIVE sentiment", () => {
    expect(getSuggestedExercise("POSITIVE")).toBeUndefined();
  });

  it("should return undefined when no sentiment is provided", () => {
    expect(getSuggestedExercise(undefined)).toBeUndefined();
  });

  it("should handle case-insensitive sentiment by uppercasing", () => {
    const exercise = getSuggestedExercise("anxious");
    expect(exercise).toBeDefined();
    expect(exercise!.title).toBe("Box Breathing");
  });

  it("should return undefined for unknown sentiment strings", () => {
    expect(getSuggestedExercise("HAPPY")).toBeUndefined();
    expect(getSuggestedExercise("CONFUSED")).toBeUndefined();
  });

  it("should have instructions for every defined exercise", () => {
    for (const [sentiment, exercise] of Object.entries(WELLNESS_EXERCISES)) {
      expect(exercise.instructions).toBeTruthy();
      expect(exercise.instructions.length).toBeGreaterThan(20);
      expect(exercise.title).toBeTruthy();
      expect(["breathing", "grounding", "mindfulness"]).toContain(exercise.type);
    }
  });
});
