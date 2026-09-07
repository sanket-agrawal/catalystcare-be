export interface AssessmentQuestion {
  key: string;
  section: string;
  question: string;
  options: string[];
  category: string;
  subCategory: string;
  isRedFlag?: boolean;
}

export const CLIENT_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Section: Exploring Feelings
  {
    key: "recentFeeling",
    section: "Exploring Feelings",
    question: "When you reflect on your recent days, which feels closest?",
    options: [
      "I usually feel steady and balanced",
      "I sometimes feel low or heavy inside",
      "My mood swings between high and low",
      "I feel okay but life feels 'flat'",
    ],
    category: "Mood Disorders",
    subCategory: "Depression / Bipolar",
  },
  {
    key: "crowdedWithWorries",
    section: "Exploring Feelings",
    question: "Imagine your mind as a room. How often does it feel crowded with worries?",
    options: [
      "Rarely, the room is calm",
      "Sometimes, depending on situations",
      "Often, the room feels noisy with thoughts",
      "Almost always, it feels overwhelming",
    ],
    category: "Anxiety Disorders",
    subCategory: "Generalized Anxiety Disorder (GAD)",
  },
  {
    key: "roomFullWithPeople",
    section: "Exploring Feelings",
    question: "If you walk into a room full of people you don't know, what feels most true?",
    options: [
      "I feel at ease",
      "I feel a little nervous but manage",
      "I avoid such situations if possible",
      "My body reacts strongly (sweating, heartbeat)",
    ],
    category: "Anxiety Disorders",
    subCategory: "Social Anxiety",
  },
  {
    key: "dailyTaskFeeling",
    section: "Exploring Feelings",
    question: "When you look at your daily tasks, how do you feel?",
    options: [
      "Ready and able",
      "Capable but exhausted",
      "Overwhelmed yet push through",
      "Struggle to begin or complete them",
    ],
    category: "Mood Disorders",
    subCategory: "Depression / Burnout",
  },

  // Section: Thoughts & Beliefs
  {
    key: "thoughtEcho",
    section: "Thoughts & Beliefs",
    question: "Which thought echoes in your mind most often?",
    options: [
      "I'm doing fine, I can manage.",
      "I'm not good enough compared to others.",
      "I keep replaying things I could've done differently.",
      "No matter what I do, it never feels enough.",
    ],
    category: "Mood Disorders",
    subCategory: "Depression (Self-worth)",
  },
  {
    key: "decision",
    section: "Thoughts & Beliefs",
    question: "When decisions appear in your life, how do you respond?",
    options: [
      "Decide quickly and move forward",
      "Think carefully but reach a decision",
      "Delay because I keep overthinking",
      "Avoid deciding altogether",
    ],
    category: "Cognitive / Personality",
    subCategory: "Overthinking / Avoidance / OCD tendencies",
  },

  // Section: Past & Coping
  {
    key: "oldMemories",
    section: "Past & Coping",
    question: "When old memories surface, how do they affect you?",
    options: [
      "They're part of me but don't bother much",
      "They show up sometimes but pass",
      "They trouble me often",
      "They strongly interfere with my present life",
    ],
    category: "Trauma & Stress",
    subCategory: "PTSD / Trauma Triggers",
  },
  {
    key: "lossOrSeperation",
    section: "Past & Coping",
    question: "When you think of losses or separations in life…",
    options: [
      "I accept them with time",
      "They hurt, but I move forward with support",
      "They stay with me, difficult to let go",
      "They still affect my daily living deeply",
    ],
    category: "Trauma & Stress",
    subCategory: "Grief / Adjustment Disorders",
  },

  // Section: Relationships & Social Life
  {
    key: "closestRelationShip",
    section: "Relationships & Social Life",
    question: "How do your closest relationships feel to you?",
    options: [
      "Supportive and healthy",
      "Sometimes strained but manageable",
      "Often filled with conflict or distance",
      "I feel alone even among people",
    ],
    category: "Personality / Relationship Issues",
    subCategory: "Interpersonal Difficulties / Loneliness",
  },
  {
    key: "sayingNo",
    section: "Relationships & Social Life",
    question: "When someone asks something from you that you don't want to do, how do you respond?",
    options: [
      "I say no easily",
      "Sometimes I say yes even if I don't want to",
      "Most of the time I give in",
      "I almost never say no, even if it hurts me",
    ],
    category: "Personality / Relationship Issues",
    subCategory: "People-pleasing / Boundaries",
  },

  // Section: Lifestyle & Habits
  {
    key: "nightSleep",
    section: "Lifestyle & Habits",
    question: "At night, how does sleep usually visit you?",
    options: [
      "I fall asleep easily and rest well",
      "I sometimes struggle to rest",
      "I often lie awake or wake up frequently",
      "I sleep too much or feel exhausted despite rest",
    ],
    category: "Lifestyle & Habits",
    subCategory: "Sleep Disorders / Depression / Anxiety",
  },
  {
    key: "eatingPattern",
    section: "Lifestyle & Habits",
    question: "Which best matches your eating pattern?",
    options: [
      "I eat with balance",
      "My appetite changes with stress or mood",
      "I eat excessively under pressure",
      "I lose appetite or restrict eating often",
    ],
    category: "Lifestyle & Habits",
    subCategory: "Eating Disorders / Stress Eating",
  },
  {
    key: "heavyLifeCope",
    section: "Lifestyle & Habits",
    question: "When life feels heavy, how do you usually cope?",
    options: [
      "I talk, exercise, or use healthy outlets",
      "I sometimes use alcohol/cigarettes casually",
      "I often use them during stress",
      "I rely heavily on substances or habits to get through",
    ],
    category: "Lifestyle & Habits",
    subCategory: "Substance Use / Maladaptive Coping",
  },
  {
    key: "technologyView",
    section: "Lifestyle & Habits",
    question: "How does technology leave you feeling?",
    options: [
      "Empowered and productive",
      "Sometimes overstimulated",
      "Often drained and distracted",
      "Addicted or unable to disconnect",
    ],
    category: "Lifestyle & Habits",
    subCategory: "Digital Addiction / Overstimulation",
  },

  // Section: Self & Identity
  {
    key: "selfImage",
    section: "Self & Identity",
    question: "When you think of yourself, which feels truest?",
    options: [
      "I know my strengths and weaknesses clearly",
      "Sometimes I doubt myself",
      "I often feel unclear about who I am",
      "I frequently feel lost and uncertain of my worth",
    ],
    category: "Personality / Self",
    subCategory: "Low Self-esteem / Identity Disturbance",
  },
  {
    key: "futurePerspective",
    section: "Self & Identity",
    question: "Looking toward your future, what feels strongest?",
    options: [
      "Hopeful and motivated",
      "Uncertain but curious",
      "Confused, without clear direction",
      "Hopeless or stuck",
    ],
    category: "Mood Disorders / Self",
    subCategory: "Hopelessness / Depression",
  },

  // Section: Red Flag Concerns
  {
    key: "sucidalThoughts",
    section: "Red Flag Concerns",
    question: "At difficult times, have you ever felt life is not worth living?",
    options: [
      "Never",
      "Rarely, in passing moments",
      "Sometimes, with strong feelings",
      "Often, with serious thoughts about ending life",
    ],
    isRedFlag: true,
    category: "Red Flag Concerns",
    subCategory: "Suicidality",
  },
  {
    key: "halucinations",
    section: "Red Flag Concerns",
    question: "Have you ever felt you see or hear things others don't?",
    options: [
      "Never",
      "Rarely, unsure",
      "Sometimes, clearly",
      "Frequently, and it troubles me deeply",
    ],
    isRedFlag: true,
    category: "Red Flag Concerns",
    subCategory: "Psychosis",
  },
  {
    key: "selfHarm",
    section: "Red Flag Concerns",
    question: "Have you ever felt like harming yourself or others?",
    options: [
      "Never",
      "Rarely, in anger",
      "Sometimes, and it worries me",
      "Often, and I struggle with such impulses",
    ],
    isRedFlag: true,
    category: "Red Flag Concerns",
    subCategory: "Suicidal or Homicidal Ideation",
  },
];

export const FIELD_CATEGORY_MAP: Record<string, { category: string; subCategory: string }> =
  CLIENT_ASSESSMENT_QUESTIONS.reduce(
    (acc, q) => {
      acc[q.key] = {
        category: q.category,
        subCategory: q.subCategory,
      };
      return acc;
    },
    {} as Record<string, { category: string; subCategory: string }>
  );
