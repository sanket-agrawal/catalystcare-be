type AnswerMap = Record<string, number>; // questionId -> weight

export const calculateBurnoutScore = (answers: AnswerMap) => {
  const energy =
    ((answers["Q1"] ?? 0) +
      (answers["Q4"] ?? 0) +
      (answers["Q7"] ?? 0)) / 12 * 100;

  const mental =
    ((answers["Q2"] ?? 0) +
      (answers["Q3"] ?? 0)) / 8 * 100;

  const disengagement =
    ((answers["Q5"] ?? 0) +
      (answers["Q6"] ?? 0)) / 8 * 100;

  const burnoutIndex =
    energy * 0.4 + mental * 0.3 + disengagement * 0.3;

  const dominant =
    Math.max(energy, mental, disengagement) === energy
      ? "Energy Depletion"
      : Math.max(mental, disengagement) === mental
      ? "Mental Load"
      : "Disengagement";

  return {
    burnoutIndex: Math.round(burnoutIndex),
    dimensions: {
      energy: Math.round(energy),
      mental: Math.round(mental),
      disengagement: Math.round(disengagement)
    },
    dominant
  };
};

export const mapBurnoutResult = (score: number) => {
  if (score <= 24) return { label: "Energy Stable", insight: "You’re coping well right now." };
  if (score <= 44) return { label: "Running Low", insight: "Your energy is draining faster than it’s recovering." };
  if (score <= 64) return { label: "Mental Overload", insight: "Prolonged mental load is impacting your wellbeing." };
  return { label: "Burnout Mode", insight: "Your system is overloaded. Support can help." };
};
