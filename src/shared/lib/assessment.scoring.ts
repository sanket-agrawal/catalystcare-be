

const buildQuestionMap = (assessment) => {
    const questionMap = new Map(
    assessment.questions.map(q => [q.id, q])
  );

  return questionMap;
}

// assessmentInsights.ts
export const zoneInsights: Record<string, string> = {
  ENERGY_DEPLETION:
    "Your system feels under-fuelled. Rest may not be fully restoring you right now.",

  MENTAL_LOAD:
    "Cognitive pressure and constant demands may be draining your capacity.",

  DISENGAGEMENT:
    "You may be operating on autopilot, pushing through without recovery.",

  FEAR:
    "Part of you may be avoiding action due to fear of mistakes or judgment.",

  OVERLOAD:
    "Too many tasks and decisions are competing for your attention.",

  ENERGY:
    "Your mental energy feels limited, making effortful tasks harder to start.",

  ATTENTION:
    "Your attention system may be overstimulated or fragmented right now.",

  EMOTIONAL_EXPRESSION:
    "You may be holding emotions back or feeling unheard in expression.",

  ATTACHMENT:
    "Differences in reassurance and closeness needs may be creating tension.",

  CONFLICT:
    "Disagreements may feel unresolved or emotionally unsafe.",

  SUPPORT:
    "Your support needs may not be clearly met or communicated.",

  STRESS_SPILLOVER:
    "External stress may be leaking into this area of your life.",

  EMOTIONAL_ENERGY:
    "Your emotional resources feel depleted, making daily demands heavier.",

  MOOD_STABILITY:
    "Emotional ups and downs may be affecting your sense of steadiness.",

  EMOTIONAL_NUMBNESS:
    "You may feel emotionally disconnected or less engaged than usual.",

  OVERWHELM_STRESS:
    "Your emotional capacity feels stretched beyond comfort.",

  POSITIVE_ENGAGEMENT:
    "Joy, connection, or interest may feel reduced right now.",

  ROLE_OVERLOAD:
    "Too many roles may be competing for your energy without recovery space.",

  EMOTIONAL_LABOUR:
    "You may be carrying emotional weight that isn’t always shared.",

  TIME_BOUNDARY_STRAIN:
    "Your time and boundaries may feel stretched or hard to protect.",

  IDENTITY_SELF_LOSS:
    "You may feel disconnected from yourself beyond your responsibilities.",

  SUPPORT_SHARED_LOAD:
    "Responsibility may feel uneven or isolating right now."
};
