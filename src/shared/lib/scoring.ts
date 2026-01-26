// export const STUCK_PATTERN_CONFIG = {
//   scale: {
//     0: { max: 29, label: "Not a significant blocker" },
//     1: { max: 49, label: "Mild friction" },
//     2: { max: 69, label: "Active blocker" },
//     3: { max: 100, label: "Strong blocker" }
//   },
//   zones: {
//     fear: {
//       label: "Fear",
//       questions: [1, 2, 3, 4, 5],
//       reverse: []
//     },
//     overload: {
//       label: "Overload",
//       questions: [6, 7, 8, 9, 10],
//       reverse: []
//     },
//     energy: {
//       label: "Energy",
//       questions: [11, 12, 13, 14, 15],
//       reverse: []
//     },
//     attention: {
//       label: "Attention",
//       questions: [16, 17, 18, 19, 20],
//       reverse: []
//     },
//     calibration: {
//       label: "Calibration",
//       questions: [21, 22],
//       reverse: [21, 22]
//     }
//   }
// };

// type ZoneResult = {
//   score: number;
//   label: string;
// };

// type answers = {
//   questionId: number;
//   value: number; // 0–4
// }[];

// const answerMap = Object.fromEntries(
//   answers.map(a => [a.questionId, a.value])
// );


// export function calculateZones(
//   config: any,
//   answerMap: Record<number, number>
// ) {
//   const results: Record<string, ZoneResult> = {};

//   for (const [zoneKey, zone] of Object.entries(config.zones)) {
//     let total = 0;

//     for (const qId of zone.questions) {
//       const raw = answerMap[qId] ?? 0;
//       const value = zone.reverse?.includes(qId)
//         ? reverseScore(raw)
//         : raw;

//       total += value;
//     }

//     const max = zone.questions.length * 4;
//     const score = Math.round((total / max) * 100);

//     results[zoneKey] = {
//       score,
//       label: zone.label
//     };
//   }

//   return results;
// }
