export type AnswerPayload = {
  questionId: string
  optionWeight: number
}

type ZoneScore = {
  raw: number
  scaled: number
}

export type AssessmentResult = {
  zones: Record<string, ZoneScore>
  primaryZone: string
}


export const calculateAssessmentScore = (
  questions: any[],
  answers: AnswerPayload[]
): AssessmentResult => {

  const zoneAccumulator: Record<string, number> = {};
  const zoneMaxRaw: Record<string, number> = {};

  /* ---------- 1️⃣ Pre-compute max raw per zone (SAFE) ---------- */

  for (const q of questions) {
    if (!q.options || q.options.length === 0) {
      continue; // 🚨 critical safety
    }

    const maxOptionWeight = Math.max(
      ...q.options.map((o: any) => Number(o.weight) || 0)
    );

    zoneMaxRaw[q.zone.key] =
      (zoneMaxRaw[q.zone.key] ?? 0) + maxOptionWeight;
  }

  /* ---------- 2️⃣ Accumulate answers ---------- */

  for (const answer of answers) {
    const q = questions.find(q => q.id === answer.questionId);
    if (!q || !q.options || q.options.length === 0) continue;

    const maxWeight = Math.max(
      ...q.options.map((o: any) => Number(o.weight) || 0)
    );

    const weight = q.isReverse
      ? maxWeight - answer.optionWeight
      : answer.optionWeight;

    zoneAccumulator[q.zone.key] =
      (zoneAccumulator[q.zone.key] ?? 0) + weight;
  }

  /* ---------- 3️⃣ Scale ---------- */

  const zones: Record<string, ZoneScore> = {};

  for (const zoneKey of Object.keys(zoneMaxRaw)) {
    const raw = zoneAccumulator[zoneKey] ?? 0;
    const maxRaw = zoneMaxRaw[zoneKey];

    const scaled =
      maxRaw > 0 ? Math.round((raw / maxRaw) * 100) : 0;

    zones[zoneKey] = { raw, scaled };
  }

  /* ---------- 4️⃣ Primary zone ---------- */

  const primaryZone =
    Object.entries(zones)
      .sort((a, b) => b[1].scaled - a[1].scaled)[0]?.[0] ?? "";

  return { zones, primaryZone };
};


export const interpretScale = (score: number) => {
  if (score <= 29) return "Not a significant concern"
  if (score <= 49) return "Mild strain"
  if (score <= 69) return "Active strain"
  return "Strong strain"
}
