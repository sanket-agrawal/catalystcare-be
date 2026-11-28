// ─── Sub-types ────────────────────────────────────────────────────────────────

export interface SubConditionContent {
  id: string; // anchor id, e.g. "social-anxiety"
  anchor: string; // e.g. "#social-anxiety"
  slug: string;
  name: string;
  description: string;
}

export interface CategoryTestimonial {
  name: string;
  concern: string;
  text: string;
}

export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface TrustStripItem {
  icon: string;
  label: string;
}

export interface PricingBlock {
  h2: string;
  body: string;
  startingPrice: number;
  currency: string;
  disclaimer: string;
}

export interface WhenReadyCta {
  text: string;
  linkText: string;
  href: string;
}

// ─── Main page content type ────────────────────────────────────────────────────

export interface CategoryPageContent {
  slug: string;
  aliases: string[];
  name: string;
  /** H1 for the landing page */
  h1: string;
  /** Hero subhead (below H1) */
  subhead: string;
  tagline: string;
  /** Primary hero CTA button text — scrolls to therapist cards */
  heroCta: string;
  /** Secondary link CTA below hero primary button */
  secondaryCta: {
    text: string;
    href: string;
  };
  /** Trust strip items (shown directly under hero subhead) */
  trustStrip: TrustStripItem[];
  /** "Is this you?" first-person bullets */
  isThisYou: string[];
  /** 4-step "How it works" section — reuses homepage component */
  howItWorks: HowItWorksStep[];
  /** Sub-condition anchor sections */
  subCategories: SubConditionContent[];
  /** Condition-matched testimonials */
  testimonials: CategoryTestimonial[];
  /** Pricing transparency section (null for safety pages) */
  pricingBlock: PricingBlock | null;
  /** FAQ accordion items */
  faq: CategoryFaq[];
  /** Prebuilt FAQPage JSON-LD string for <script type="application/ld+json"> (null for safety pages) */
  faqJsonLd: string | null;
  finalCta: {
    h2: string;
    buttonText: string;
    secondaryCta: { text: string; href: string };
  };
  pricing: {
    startingPrice: number;
    currency: string;
    text: string;
  };
  /** Sticky mobile CTA bar text (viewports < 768px; empty string if disabled) */
  stickyCtaText: string;
  /** Optional content note (for trauma-informed pages) */
  contentNote?: string;
  /** Whether this is a safety page (Page I: red-flag) */
  isSafetyPage?: boolean;
  /** Soft CTA to therapist directory when ready */
  whenReady?: WhenReadyCta;
}

// ─── Shared constants ──────────────────────────────────────────────────────────

const SHARED_TRUST_STRIP: TrustStripItem[] = [
  { icon: "✓", label: "Verified therapists" },
  { icon: "🔒", label: "100% private" },
  { icon: "₹", label: "Sessions from ₹499" },
  { icon: "📅", label: "Same-week slots" },
];

const SHARED_HOW_IT_WORKS: HowItWorksStep[] = [
  {
    step: 1,
    title: "Tell us",
    description: "Share what you're going through — takes 2 minutes.",
  },
  {
    step: 2,
    title: "Get matched",
    description: "We suggest verified psychologists suited to your needs and budget.",
  },
  {
    step: 3,
    title: "Begin sessions",
    description: "Book directly into your therapist's calendar. Private video call, no travel.",
  },
  {
    step: 4,
    title: "Track progress",
    description: "Review goals and insights after each session at your own pace.",
  },
];

const SHARED_SECONDARY_CTA = {
  text: "Not sure? Take the free 1-minute check",
  href: "/self-help/assessment",
};

const SHARED_PRICING_BLOCK: PricingBlock = {
  h2: "What it costs",
  body: "Sessions start at ₹499. Every therapist sets their own fee — you see it before you book. No packages required, no hidden charges. Pay per session.",
  startingPrice: 499,
  currency: "INR",
  disclaimer: "Each therapist's fee is shown on their profile before you book.",
};

/** Shared therapy FAQs (Q2–Q5 from Page A, reused across all standard therapy pages) */
const COMMON_THERAPY_FAQS: CategoryFaq[] = [
  {
    question: "What happens in the first session?",
    answer:
      "Your therapist listens, understands your situation, and agrees on goals with you. No tests to pass, nothing to prepare.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Sessions start at ₹499. Each therapist's fee is shown on their profile before you book.",
  },
  {
    question: "Is it really private?",
    answer: "Yes. Sessions are one-on-one video calls. Your information is never shared.",
  },
  {
    question: "How soon can I start?",
    answer: "Most clients get a same-week appointment.",
  },
];

/** Build FAQPage JSON-LD string from FAQ array */
function buildFaqJsonLd(faqs: CategoryFaq[]): string {
  if (!faqs || faqs.length === 0) return "";
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  });
}

// ─── Page FAQ records ──────────────────────────────────────────────────────────

const ANXIETY_FAQ: CategoryFaq[] = [
  {
    question: "How do I know if I need therapy for anxiety?",
    answer:
      "If worry, panic, or stress is affecting sleep, work, or relationships for more than a few weeks, a psychologist can help. The free 1-minute check can also guide you.",
  },
  ...COMMON_THERAPY_FAQS,
];

const MOOD_FAQ: CategoryFaq[] = [
  {
    question: "Is feeling low the same as depression?",
    answer:
      "Everyone has low days. When low mood, numbness, or hopelessness lasts more than two weeks and affects daily life, it's worth talking to a professional.",
  },
  ...COMMON_THERAPY_FAQS,
];

const RELATIONS_FAQ: CategoryFaq[] = [
  {
    question: "Do we attend together or separately?",
    answer:
      "Usually together; your therapist may occasionally suggest individual sessions. Partners can join the video call from different locations.",
  },
  {
    question: "What if my partner won't come?",
    answer:
      "Start alone. Individual relationship counselling helps, and partners often join later.",
  },
  ...COMMON_THERAPY_FAQS,
];

const SELF_IDENTITY_FAQ: CategoryFaq[] = [
  {
    question: "Is low self-esteem something therapy can help with?",
    answer:
      "Yes. A psychologist helps you notice the patterns behind how you see yourself and practise kinder, more realistic ways of thinking. Change is gradual, but very common.",
  },
  ...COMMON_THERAPY_FAQS,
];

const LIFESTYLE_HABITS_FAQ: CategoryFaq[] = [
  {
    question: "Is this therapy, or habit coaching?",
    answer:
      "This is therapy with a verified psychologist. It looks at what drives the pattern (stress, mood, sleep, emotions), not just willpower. If you mainly want help with focus, motivation or direction, see Focus, Motivation & Direction.",
  },
  ...COMMON_THERAPY_FAQS,
];

const TRAUMA_GRIEF_FAQ: CategoryFaq[] = [
  {
    question: "Will I have to talk about everything that happened?",
    answer:
      "No. A trauma-informed therapist goes at your pace and focuses first on feeling safe and steady. You decide what you share and when.",
  },
  ...COMMON_THERAPY_FAQS,
];

const THOUGHT_CONCERNS_FAQ: CategoryFaq[] = [
  {
    question: "Are intrusive thoughts a sign something is wrong with me?",
    answer:
      "Unwanted thoughts are very common and don't reflect who you are or what you want. When they cause distress or lead to repeated checking or rituals, therapy such as CBT can help a lot.",
  },
  ...COMMON_THERAPY_FAQS,
];

const CATALYST_COACH_FAQ: CategoryFaq[] = [
  {
    question: "Do I need a mental health problem to see a therapist?",
    answer:
      "No. Many people come to work on focus, motivation, big decisions or a life change. A psychologist helps you understand the patterns behind feeling stuck, not just make a to-do list.",
  },
  ...COMMON_THERAPY_FAQS,
];

// ─── All 9 Page Records ───────────────────────────────────────────────────────

export const CATEGORY_PAGES_CONTENT: Record<string, CategoryPageContent> = {
  // Page A: /our-services/anxiety-stress
  "anxiety-stress": {
    slug: "anxiety-stress",
    aliases: ["anxiety", "anxiety-disorders", "stress", "anxiety-and-stress"],
    name: "Anxiety & Stress",
    h1: "Therapy for Anxiety & Stress, Online Across India",
    subhead:
      "When your mind won't slow down — constant worry, panic, overthinking, pressure — talking to the right psychologist helps. Private video sessions from ₹499.",
    tagline: "Private video sessions from ₹499",
    heroCta: "Find your therapist",
    secondaryCta: SHARED_SECONDARY_CTA,
    trustStrip: SHARED_TRUST_STRIP,
    howItWorks: SHARED_HOW_IT_WORKS,
    isThisYou: [
      "My mind races at night and I can't switch off.",
      "Small things trigger a wave of panic or dread.",
      "I keep overthinking conversations and decisions.",
      "Work pressure follows me home every single day.",
      "I'm exhausted from pretending I'm fine.",
    ],
    subCategories: [
      {
        id: "generalized-anxiety",
        anchor: "#generalized-anxiety",
        slug: "generalized-anxiety",
        name: "Generalized Anxiety",
        description:
          "Persistent, uncontrollable worry and physical tension about everyday matters that makes it hard to unwind or focus.",
      },
      {
        id: "social-anxiety",
        anchor: "#social-anxiety",
        slug: "social-anxiety",
        name: "Social Anxiety",
        description:
          "Intense fear of scrutiny, judgment, or embarrassment in social, professional, or group settings.",
      },
      {
        id: "panic",
        anchor: "#panic",
        slug: "panic",
        name: "Panic Disorders",
        description:
          "Sudden episodes of intense fear, rapid heartbeat, shortness of breath, and physical dread with no clear trigger.",
      },
      {
        id: "stress-management",
        anchor: "#stress-management",
        slug: "stress-management",
        name: "Stress Management",
        description:
          "Practical coping tools for demanding workplaces, academic pressure, and lifestyle overload before it damages your health.",
      },
      {
        id: "burnout",
        anchor: "#burnout",
        slug: "burnout",
        name: "Burnout",
        description:
          "Deep physical, mental, and emotional exhaustion caused by prolonged, unmanaged pressure and chronic overload.",
      },
    ],
    testimonials: [
      {
        name: "Ananya",
        concern: "Overthinking & Anxiety",
        text: "I spent months trying to rationalize my racing thoughts alone. Having a licensed psychologist guide me through CBT tools gave me my evenings back.",
      },
      {
        name: "Priya",
        concern: "Social Anxiety",
        text: "Before presentations and team meetings, my heart would pound so hard I couldn't speak. Now I have grounded strategies that actually work.",
      },
      {
        name: "Sameer",
        concern: "Insomnia Driven by Anxiety",
        text: "My anxiety always peaked at night when everything was quiet. After 4 sessions, I finally sleep without dreading bedtime.",
      },
    ],
    pricingBlock: SHARED_PRICING_BLOCK,
    faq: ANXIETY_FAQ,
    faqJsonLd: buildFaqJsonLd(ANXIETY_FAQ),
    finalCta: {
      h2: "Start feeling like yourself again.",
      buttonText: "Find your therapist",
      secondaryCta: SHARED_SECONDARY_CTA,
    },
    pricing: {
      startingPrice: 499,
      currency: "INR",
      text: "Private video sessions from ₹499",
    },
    stickyCtaText: "Sessions from ₹499 — Find your therapist",
  },

  // Page B: /our-services/mood-disorders
  "mood-disorders": {
    slug: "mood-disorders",
    aliases: ["depression", "mood", "depression-mood-disorders"],
    name: "Mood Disorders",
    h1: "Support for Depression & Low Mood, From Verified Psychologists",
    subhead:
      "Persistent sadness, numbness, or exhaustion isn't something you have to push through alone. Confidential online sessions from ₹499.",
    tagline: "Confidential online sessions from ₹499",
    heroCta: "Find your therapist",
    secondaryCta: SHARED_SECONDARY_CTA,
    trustStrip: SHARED_TRUST_STRIP,
    howItWorks: SHARED_HOW_IT_WORKS,
    isThisYou: [
      "I feel flat — things I enjoyed don't feel like anything anymore.",
      "Getting through the day takes everything I have.",
      "I sleep too much, or barely at all.",
      "People say 'cheer up', but it's not that simple.",
      "I feel like a burden, even to people who love me.",
    ],
    subCategories: [
      {
        id: "depression",
        anchor: "#depression",
        slug: "depression",
        name: "Depression & Low Mood",
        description:
          "A persistent heaviness, loss of interest, and lack of energy that rest and sleep don't seem to cure.",
      },
      {
        id: "postpartum-depression",
        anchor: "#postpartum-depression",
        slug: "postpartum-depression",
        name: "Postpartum Depression",
        description:
          "Overwhelming sadness, anxiety, and fatigue following childbirth, treated with gentle, evidence-based psychological support.",
      },
      {
        id: "academic-stress-depression",
        anchor: "#academic-stress-depression",
        slug: "academic-stress-depression",
        name: "Depression During Academic Prep",
        description:
          "Despair, isolation, and self-worth loss linked to intense competitive exams, career milestones, or educational pressure.",
      },
      {
        id: "mid-life-emptiness",
        anchor: "#mid-life-emptiness",
        slug: "mid-life-emptiness",
        name: "Mid-life Emptiness",
        description:
          "Navigating feelings of numbness, unfulfilled purpose, or existential disconnect during life transitions.",
      },
      {
        id: "bipolar-mood-swings",
        anchor: "#bipolar-mood-swings",
        slug: "bipolar-mood-swings",
        name: "Bipolar & Mood Cycles",
        description:
          "Managing significant fluctuations in mood, energy, and functioning with structured psychological tools.",
      },
    ],
    testimonials: [
      {
        name: "Shreya",
        concern: "Postpartum Depression",
        text: "Everyone expects you to be overjoyed, but I felt completely hollow and terrified. My therapist gave me a safe, non-judgmental space to heal.",
      },
      {
        name: "Diya",
        concern: "Depression During JEE Prep",
        text: "The pressure made me feel completely worthless. Talking to someone who didn't judge my marks helped me rebuild my mental health.",
      },
      {
        name: "Vikram",
        concern: "Mid-life Emptiness",
        text: "I had achieved everything on paper, yet woke up every morning feeling numb. Therapy helped me untangle what I actually needed.",
      },
    ],
    pricingBlock: SHARED_PRICING_BLOCK,
    faq: MOOD_FAQ,
    faqJsonLd: buildFaqJsonLd(MOOD_FAQ),
    finalCta: {
      h2: "The first conversation is the hardest part. Have it this week.",
      buttonText: "Find your therapist",
      secondaryCta: SHARED_SECONDARY_CTA,
    },
    pricing: {
      startingPrice: 499,
      currency: "INR",
      text: "Confidential online sessions from ₹499",
    },
    stickyCtaText: "Sessions from ₹499 — Find your therapist",
  },

  // Page C: /our-services/couples-therapy-marriage-counselling-online
  "couples-therapy-marriage-counselling-online": {
    slug: "couples-therapy-marriage-counselling-online",
    aliases: [
      "relations-personal",
      "relationships",
      "relationship-issues",
      "personality-relationship-issues",
      "couples-therapy",
    ],
    name: "Relationships & Personal",
    h1: "Couples Therapy & Marriage Counselling, Online",
    subhead:
      "Whether you're fighting too often, drifting apart, or preparing for marriage — a trained couples therapist helps you hear each other again. Join from the same room or different cities. From ₹499 per session.",
    tagline: "Join from the same room or different cities. From ₹499 per session.",
    heroCta: "Find your therapist",
    secondaryCta: SHARED_SECONDARY_CTA,
    trustStrip: SHARED_TRUST_STRIP,
    howItWorks: SHARED_HOW_IT_WORKS,
    isThisYou: [
      "Every small disagreement turns into the same big fight.",
      "We feel more like flatmates than partners.",
      "Family pressure is crushing us both.",
      "Trust was broken and we don't know how to rebuild.",
      "We're getting married and want to start right.",
    ],
    subCategories: [
      {
        id: "recurring-conflicts",
        anchor: "#recurring-conflicts",
        slug: "recurring-conflicts",
        name: "Communication & Conflict Resolution",
        description:
          "Breaking recurring blame loops and learning constructive ways to express needs without triggering defense mechanisms.",
      },
      {
        id: "emotional-distance",
        anchor: "#emotional-distance",
        slug: "emotional-distance",
        name: "Emotional Intimacy & Connection",
        description:
          "Restoring warmth and emotional safety when you feel like flatmates living separate lives under the same roof.",
      },
      {
        id: "infidelity-trust",
        anchor: "#infidelity-trust",
        slug: "infidelity-trust",
        name: "Infidelity & Rebuilding Trust",
        description:
          "Structured, professional guidance to address emotional or physical betrayal and explore whether and how trust can be restored.",
      },
      {
        id: "premarital-counselling",
        anchor: "#premarital-counselling",
        slug: "premarital-counselling",
        name: "Premarital Counselling",
        description:
          "Aligning expectations on family, finances, communication, and values before marriage to build a resilient foundation.",
      },
      {
        id: "family-in-law-pressure",
        anchor: "#family-in-law-pressure",
        slug: "family-in-law-pressure",
        name: "Family & In-Law Dynamics",
        description:
          "Setting healthy relationship boundaries while respecting cultural and family expectations without damaging your bond.",
      },
      {
        id: "toxic-relationship-recovery",
        anchor: "#toxic-relationship-recovery",
        slug: "toxic-relationship-recovery",
        name: "Toxic Relationship & Separation Support",
        description:
          "Clarity, self-worth rebuilding, and emotional grounding for individuals navigating or ending emotionally destructive relationships.",
      },
    ],
    testimonials: [
      {
        name: "Karan",
        concern: "Burnout Almost Cost My Marriage",
        text: "Long work hours and burnout almost cost my marriage. Therapy helped my partner and me finally stop reacting in anger and start listening again.",
      },
      {
        name: "Tanvi",
        concern: "Left a Toxic Relationship",
        text: "I couldn't tell where my partner's demands ended and my identity began. Individual therapy gave me the strength to set boundaries and walk away.",
      },
      {
        name: "Kavitha",
        concern: "Empty Nest & Husband Suggested Support",
        text: "When our children moved out for college, my husband and I had forgotten how to just be together. Therapy helped us rediscover our partnership.",
      },
    ],
    pricingBlock: SHARED_PRICING_BLOCK,
    faq: RELATIONS_FAQ,
    faqJsonLd: buildFaqJsonLd(RELATIONS_FAQ),
    finalCta: {
      h2: "Don't wait for things to get worse.",
      buttonText: "Find your therapist",
      secondaryCta: SHARED_SECONDARY_CTA,
    },
    pricing: {
      startingPrice: 499,
      currency: "INR",
      text: "Join from the same room or different cities. From ₹499 per session.",
    },
    stickyCtaText: "Sessions from ₹499 — Find your therapist",
  },

  // Page D: /our-services/self-identity
  "self-identity": {
    slug: "self-identity",
    aliases: ["self-identity", "self-esteem", "identity", "self-worth"],
    name: "Self-Identity & Self-Worth",
    h1: "Therapy for Self-Esteem & Identity, Online Across India",
    subhead:
      "Feeling not good enough, unsure who you are, or stuck about where life is going? A verified psychologist helps you understand yourself and build steadier self-worth. Private video sessions from ₹499.",
    tagline: "Private video sessions from ₹499",
    heroCta: "Find your therapist",
    secondaryCta: SHARED_SECONDARY_CTA,
    trustStrip: SHARED_TRUST_STRIP,
    howItWorks: SHARED_HOW_IT_WORKS,
    isThisYou: [
      "I'm always comparing myself to everyone else.",
      "I don't really know what I want from my life.",
      "Compliments don't land — I just don't believe them.",
      "I've changed so much to fit in that I've lost track of me.",
      "I have a good life on paper, so why do I feel empty?",
    ],
    subCategories: [
      {
        id: "self-worth",
        anchor: "#self-worth",
        slug: "self-worth",
        name: "Self-Worth & Value",
        description:
          "Building a steady sense of inner value that doesn't collapse with outside opinions, mistakes, or setbacks.",
      },
      {
        id: "life-purpose",
        anchor: "#life-purpose",
        slug: "life-purpose",
        name: "Life Purpose & Direction",
        description:
          "Gaining clarity on what truly matters to you when life feels aimless, overwhelming, or misaligned.",
      },
      {
        id: "identity-exploration",
        anchor: "#identity-exploration",
        slug: "identity-exploration",
        name: "Identity Exploration",
        description:
          "A safe, affirming space to explore who you are — including questions about sexuality, gender, culture or faith.",
      },
      {
        id: "low-self-esteem",
        anchor: "#low-self-esteem",
        slug: "low-self-esteem",
        name: "Low Self-Esteem",
        description:
          "Untangling persistent feelings of inadequacy, self-doubt, and the habit of putting yourself last.",
      },
    ],
    testimonials: [
      {
        name: "Rishi",
        concern: "Understanding Myself",
        text: "I kept feeling like I was living someone else's expectations. Therapy gave me the clarity to figure out who I actually was and what I needed.",
      },
      {
        name: "Vikram",
        concern: "Mid-Life Emptiness",
        text: "I had achieved everything on paper, yet woke up every morning feeling numb. Therapy helped me untangle what I actually needed.",
      },
      {
        name: "Kavitha",
        concern: "Identity After Empty Nest",
        text: "When my children moved out, I didn't know who I was outside being a mother. My psychologist helped me rediscover my own voice and purpose.",
      },
    ],
    pricingBlock: SHARED_PRICING_BLOCK,
    faq: SELF_IDENTITY_FAQ,
    faqJsonLd: buildFaqJsonLd(SELF_IDENTITY_FAQ),
    finalCta: {
      h2: "You don't have to figure yourself out alone.",
      buttonText: "Find your therapist",
      secondaryCta: SHARED_SECONDARY_CTA,
    },
    pricing: {
      startingPrice: 499,
      currency: "INR",
      text: "Private video sessions from ₹499",
    },
    stickyCtaText: "Sessions from ₹499 — Find your therapist",
  },

  // Page E: /our-services/lifestyle-habits
  "lifestyle-habits": {
    slug: "lifestyle-habits",
    aliases: ["lifestyle-habits", "habits", "sleep", "lifestyle", "digital-fatigue"],
    name: "Lifestyle & Daily Habits",
    h1: "Support for Sleep, Screen Habits & Patterns That Feel Out of Control",
    subhead:
      "When sleep, screens, food or substances start running your day, a psychologist helps you understand why and change it in small, realistic steps. Private online sessions from ₹499.",
    tagline: "Private online sessions from ₹499",
    heroCta: "Find your therapist",
    secondaryCta: SHARED_SECONDARY_CTA,
    trustStrip: SHARED_TRUST_STRIP,
    howItWorks: SHARED_HOW_IT_WORKS,
    isThisYou: [
      "I'm exhausted but I still can't fall asleep.",
      "I lose hours to my phone or games and feel worse after.",
      "I've tried to cut back so many times and it never sticks.",
      "My relationship with food takes up too much of my head.",
      "I lose my temper faster than I'd like to.",
    ],
    subCategories: [
      {
        id: "digital-fatigue",
        anchor: "#digital-fatigue",
        slug: "digital-fatigue",
        name: "Digital Fatigue & Screen Habits",
        description:
          "Reclaiming focus and evening peace when doomscrolling, gaming, or screen compulsions take over your hours.",
      },
      {
        id: "sleep",
        anchor: "#sleep",
        slug: "sleep",
        name: "Sleep & Insomnia",
        description:
          "Resetting racing thoughts and sleep patterns so you can fall asleep naturally and wake up rested.",
      },
      {
        id: "eating-concerns",
        anchor: "#eating-concerns",
        slug: "eating-concerns",
        name: "Eating Concerns & Body Image",
        description:
          "Exploring the emotional drivers behind stress eating, restrictive patterns, or body image distress in a supportive setting.",
      },
      {
        id: "substance-use",
        anchor: "#substance-use",
        slug: "substance-use",
        name: "Substance & Habit Support",
        description:
          "Confidential psychological support to understand cravings, dependency triggers, and build healthier daily coping tools.",
      },
      {
        id: "anger",
        anchor: "#anger",
        slug: "anger",
        name: "Anger & Emotional Regulation",
        description:
          "Understanding what triggers sudden anger or irritability and learning de-escalation techniques that stick.",
      },
      {
        id: "adult-adhd",
        anchor: "#adult-adhd",
        slug: "adult-adhd",
        name: "Adult ADHD & Focus Habits",
        description:
          "Practical psychological strategies for executive dysfunction, chronic procrastination, and maintaining daily momentum.",
      },
    ],
    testimonials: [
      {
        name: "Nikhil",
        concern: "Gaming & Screen Fatigue",
        text: "I was losing 6 hours every night to gaming and felt terrible every morning. Therapy helped me understand the stress I was avoiding and reset my routines.",
      },
      {
        name: "Sameer",
        concern: "Insomnia & Sleep Cycles",
        text: "My mind wouldn't shut down at night. Learning CBT-I techniques from my psychologist broke the cycle of dreading bedtime.",
      },
      {
        name: "Rahul",
        concern: "Anger & Emotional Control",
        text: "I was snapping at my team and my family over minor things. Therapy gave me pause techniques that helped me respond instead of explode.",
      },
      {
        name: "Farooq",
        concern: "Adult ADHD & Focus",
        text: "I thought I was just lazy or undisciplined. Working with a psychologist who understands neurodivergence changed how I structure my entire day.",
      },
    ],
    pricingBlock: SHARED_PRICING_BLOCK,
    faq: LIFESTYLE_HABITS_FAQ,
    faqJsonLd: buildFaqJsonLd(LIFESTYLE_HABITS_FAQ),
    finalCta: {
      h2: "Small changes, with the right support, add up.",
      buttonText: "Find your therapist",
      secondaryCta: SHARED_SECONDARY_CTA,
    },
    pricing: {
      startingPrice: 499,
      currency: "INR",
      text: "Private online sessions from ₹499",
    },
    stickyCtaText: "Sessions from ₹499 — Find your therapist",
  },

  // Page F: /our-services/trauma-grief (trauma-informed variant)
  "trauma-grief": {
    slug: "trauma-grief",
    aliases: ["trauma", "grief", "ptsd", "loss", "trauma-and-grief"],
    name: "Trauma & Grief",
    h1: "Trauma & Grief Therapy, Online and at Your Pace",
    subhead:
      "For loss, painful memories, or experiences that still feel heavy. A trauma-informed psychologist helps you process safely, without pressure to relive everything. Private sessions from ₹499.",
    tagline: "Private sessions from ₹499",
    heroCta: "Find a trauma-informed therapist",
    secondaryCta: SHARED_SECONDARY_CTA,
    trustStrip: [
      { icon: "✓", label: "Trauma-informed therapists" },
      { icon: "🔒", label: "100% private & confidential" },
      { icon: "₹", label: "Sessions from ₹499" },
      { icon: "🕊️", label: "At your own pace" },
    ],
    contentNote:
      "Take this at your own pace. Nothing here asks you to share more than you want to.",
    howItWorks: SHARED_HOW_IT_WORKS,
    isThisYou: [
      "It happened a long time ago, but it still affects me.",
      "Since the loss, I've been going through the motions.",
      "Certain places, sounds or people put me right back there.",
      "Everyone expects me to have moved on by now.",
    ],
    subCategories: [
      {
        id: "grief-loss",
        anchor: "#grief-loss",
        slug: "grief-loss",
        name: "Grief & Bereavement",
        description:
          "Compassionate support through the disorientation, sadness, and life adjustments after losing someone close.",
      },
      {
        id: "ptsd",
        anchor: "#ptsd",
        slug: "ptsd",
        name: "PTSD & Traumatic Stress",
        description:
          "Evidence-based support for flashbacks, hypervigilance, and nervous system overwhelm following traumatic events.",
      },
      {
        id: "childhood-trauma",
        anchor: "#childhood-trauma",
        slug: "childhood-trauma",
        name: "Childhood Trauma & Neglect",
        description:
          "Safely exploring early emotional wounds, boundary ruptures, and their lasting echoes in adult relationships.",
      },
      {
        id: "abuse-recovery",
        anchor: "#abuse-recovery",
        slug: "abuse-recovery",
        name: "Abuse Recovery & Safety",
        description:
          "Gentle, non-judgmental healing from physical, emotional, or psychological abuse with grounded, trauma-informed psychological care.",
      },
    ],
    testimonials: [
      {
        name: "Aditya",
        concern: "Grief After Losing Father",
        text: "Everyone kept telling me to stay strong for the family. In therapy, I finally had a space where I didn't have to pretend I was okay.",
      },
      {
        name: "Tanvi",
        concern: "Leaving a Controlling Relationship",
        text: "I was terrified that therapy would force me to relive everything immediately. My therapist paced every step around my comfort and safety.",
      },
    ],
    pricingBlock: SHARED_PRICING_BLOCK,
    faq: TRAUMA_GRIEF_FAQ,
    faqJsonLd: buildFaqJsonLd(TRAUMA_GRIEF_FAQ),
    finalCta: {
      h2: "When you're ready, we're here.",
      buttonText: "Find a trauma-informed therapist",
      secondaryCta: SHARED_SECONDARY_CTA,
    },
    pricing: {
      startingPrice: 499,
      currency: "INR",
      text: "Private sessions from ₹499",
    },
    stickyCtaText: "", // No sticky mobile CTA on trauma page
  },

  // Page G: /our-services/thought-concerns
  "thought-concerns": {
    slug: "thought-concerns",
    aliases: ["thought-concerns", "overthinking", "ocd", "intrusive-thoughts", "perfectionism"],
    name: "Thought Concerns & OCD",
    h1: "Therapy for Overthinking, Intrusive Thoughts & OCD",
    subhead:
      "When your thoughts feel loud, repetitive or impossible to switch off, a psychologist trained in CBT helps you loosen their grip. Private online sessions from ₹499.",
    tagline: "Private online sessions from ₹499",
    heroCta: "Find your therapist",
    secondaryCta: SHARED_SECONDARY_CTA,
    trustStrip: SHARED_TRUST_STRIP,
    howItWorks: SHARED_HOW_IT_WORKS,
    isThisYou: [
      "I replay conversations for hours afterwards.",
      "Unwanted thoughts pop into my head and scare me.",
      "I check things again and again, even when I know it's fine.",
      "Nothing I do ever feels good enough.",
      "My inner voice is harsher than anyone else's.",
    ],
    subCategories: [
      {
        id: "overthinking",
        anchor: "#overthinking",
        slug: "overthinking",
        name: "Chronic Overthinking & Mental Loops",
        description:
          "Breaking out of constant analysis paralysis, rumination, and worst-case scenario replays.",
      },
      {
        id: "negative-self-talk",
        anchor: "#negative-self-talk",
        slug: "negative-self-talk",
        name: "Negative Self-Talk & Inner Critic",
        description:
          "Learning to soften an internal monologue that criticizes, belittles, or questions your every move.",
      },
      {
        id: "perfectionism",
        anchor: "#perfectionism",
        slug: "perfectionism",
        name: "Perfectionism & Fear of Failure",
        description:
          "Loosening rigid standards, procrastination driven by fear of mistakes, and all-or-nothing thinking.",
      },
      {
        id: "ocd-intrusive-thoughts",
        anchor: "#ocd-intrusive-thoughts",
        slug: "ocd-intrusive-thoughts",
        name: "OCD & Intrusive Thoughts",
        description:
          "Specialized CBT and Exposure & Response Prevention (ERP) for distressing, recurring thoughts and checking rituals.",
      },
    ],
    testimonials: [
      {
        name: "Meghna",
        concern: "OCD & Intrusive Thoughts",
        text: "I lived with terrifying intrusive thoughts for years thinking something was deeply wrong with me. ERP therapy with my psychologist gave me my life back.",
      },
      {
        name: "Ananya",
        concern: "Overthinking & Decision Paralysis",
        text: "I spent hours second-guessing simple work emails. My therapist helped me identify thought traps and trust my own decisions.",
      },
      {
        name: "Rishi",
        concern: "Patterns & Triggers",
        text: "I learned to spot cognitive distortions the moment they popped up, instead of spiraling down with them for three days.",
      },
    ],
    pricingBlock: SHARED_PRICING_BLOCK,
    faq: THOUGHT_CONCERNS_FAQ,
    faqJsonLd: buildFaqJsonLd(THOUGHT_CONCERNS_FAQ),
    finalCta: {
      h2: "Your thoughts don't have to run the show.",
      buttonText: "Find your therapist",
      secondaryCta: SHARED_SECONDARY_CTA,
    },
    pricing: {
      startingPrice: 499,
      currency: "INR",
      text: "Private online sessions from ₹499",
    },
    stickyCtaText: "Sessions from ₹499 — Find your therapist",
  },

  // Page H: /our-services/catalyst-coach (Repositioned to Focus, Motivation & Direction)
  "catalyst-coach": {
    slug: "catalyst-coach",
    aliases: [
      "catalyst-coach",
      "focus-motivation",
      "focus-motivation-direction",
      "focus",
      "motivation",
    ],
    name: "Focus, Motivation & Direction",
    h1: "Therapy for Focus, Motivation & Life Direction",
    subhead:
      "Stuck, unmotivated, or not following through on what matters? A verified psychologist helps you understand what's getting in the way and build habits that last. Private online sessions from ₹499.",
    tagline: "Private online sessions from ₹499",
    heroCta: "Find your therapist",
    secondaryCta: SHARED_SECONDARY_CTA,
    trustStrip: SHARED_TRUST_STRIP,
    howItWorks: SHARED_HOW_IT_WORKS,
    isThisYou: [
      "I set goals every month and drop them by week two.",
      "I'm busy all day but not moving on what matters.",
      "I'm at a crossroads and don't know which way to go.",
      "I know what to do — I just don't do it consistently.",
      "Everything looks fine on paper, but I feel stuck.",
    ],
    subCategories: [
      {
        id: "goals-direction",
        anchor: "#goals-direction",
        slug: "goals-direction",
        name: "Goals & Life Direction",
        description:
          "Gaining alignment on your values, setting meaningful priorities, and creating a realistic path forward.",
      },
      {
        id: "focus-procrastination",
        anchor: "#focus-procrastination",
        slug: "focus-procrastination",
        name: "Focus & Procrastination",
        description:
          "Overcoming task avoidance, distraction loops, and the mental resistance between intending to work and doing it.",
      },
      {
        id: "habits-consistency",
        anchor: "#habits-consistency",
        slug: "habits-consistency",
        name: "Habits & Consistency",
        description:
          "Designing small, sustainable behavioral changes that survive low-motivation days without relying on willpower alone.",
      },
      {
        id: "resilience",
        anchor: "#resilience",
        slug: "resilience",
        name: "Stress & Resilience",
        description:
          "Building emotional stamina to navigate setbacks, work overload, and uncertainty without burning out.",
      },
      {
        id: "life-transitions",
        anchor: "#life-transitions",
        slug: "life-transitions",
        name: "Life Transitions & Motivation",
        description:
          "Navigating career shifts, relocations, or new life stages with psychological clarity and steady support.",
      },
    ],
    testimonials: [
      {
        name: "Farooq",
        concern: "ADHD, Focus & Motivation",
        text: "I used to beat myself up for not finishing projects. My therapist helped me understand my brain's focus patterns and set up systems that actually stick.",
      },
      {
        name: "Karan",
        concern: "Burnout & Setting Work Limits",
        text: "I was working 14 hours a day and paralyzed by indecision. Therapy helped me draw boundaries and regain clarity on what really mattered.",
      },
      {
        name: "Vikram",
        concern: "Mid-Life Direction",
        text: "I hit all my career targets and felt completely lost. Therapy helped me reflect on my true core values and choose my next chapter deliberately.",
      },
    ],
    pricingBlock: SHARED_PRICING_BLOCK,
    faq: CATALYST_COACH_FAQ,
    faqJsonLd: buildFaqJsonLd(CATALYST_COACH_FAQ),
    finalCta: {
      h2: "Get unstuck, with someone in your corner.",
      buttonText: "Find your therapist",
      secondaryCta: SHARED_SECONDARY_CTA,
    },
    pricing: {
      startingPrice: 499,
      currency: "INR",
      text: "Private online sessions from ₹499",
    },
    stickyCtaText: "Sessions from ₹499 — Find your therapist",
  },

  // Page I: /our-services/red-flag (Safety page: NOT sales template)
  "red-flag": {
    slug: "red-flag",
    aliases: ["red-flag", "safety", "immediate-help"],
    name: "Immediate Safety & Support",
    isSafetyPage: true,
    h1: "If you're not safe right now",
    subhead:
      "If you are having thoughts of harming yourself or need urgent support, please reach out. Support is available.",
    tagline: "Free, confidential psychological guidance",
    heroCta: "Find your therapist",
    secondaryCta: {
      text: "Browse therapists",
      href: "/therapists",
    },
    whenReady: {
      text: "When you're ready to talk to someone, our verified psychologists are here.",
      linkText: "Browse therapist directory",
      href: "/therapists",
    },
    trustStrip: [],
    howItWorks: [],
    isThisYou: [],
    subCategories: [],
    testimonials: [],
    pricingBlock: null,
    faq: [],
    faqJsonLd: null,
    finalCta: {
      h2: "You are not alone. Please reach out for support today.",
      buttonText: "Find your therapist",
      secondaryCta: {
        text: "Browse directory",
        href: "/therapists",
      },
    },
    pricing: {
      startingPrice: 0,
      currency: "INR",
      text: "",
    },
    stickyCtaText: "",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Finds matching curated content by slug or alias.
 */
export function getCuratedCategoryContent(slugOrName: string): CategoryPageContent | undefined {
  if (!slugOrName) return undefined;
  const normalized = slugOrName.toLowerCase().trim();

  // Direct match
  if (CATEGORY_PAGES_CONTENT[normalized]) {
    return CATEGORY_PAGES_CONTENT[normalized];
  }

  // Exact alias match or slug/name match
  for (const item of Object.values(CATEGORY_PAGES_CONTENT)) {
    if (item.slug === normalized) return item;
    if (item.aliases.includes(normalized)) return item;
    if (item.name.toLowerCase() === normalized) return item;
  }

  // Partial match fallbacks
  if (normalized.includes("anxiety") || normalized.includes("stress")) {
    return CATEGORY_PAGES_CONTENT["anxiety-stress"];
  }
  if (normalized.includes("depress") || normalized.includes("mood")) {
    return CATEGORY_PAGES_CONTENT["mood-disorders"];
  }
  if (
    normalized.includes("relation") ||
    normalized.includes("couples") ||
    normalized.includes("marriage")
  ) {
    return CATEGORY_PAGES_CONTENT["couples-therapy-marriage-counselling-online"];
  }
  if (
    normalized.includes("self-identity") ||
    normalized.includes("self-esteem") ||
    normalized.includes("identity") ||
    normalized.includes("self-worth")
  ) {
    return CATEGORY_PAGES_CONTENT["self-identity"];
  }
  if (
    normalized.includes("lifestyle") ||
    normalized.includes("habit") ||
    normalized.includes("screen") ||
    normalized.includes("sleep")
  ) {
    return CATEGORY_PAGES_CONTENT["lifestyle-habits"];
  }
  if (
    normalized.includes("trauma") ||
    normalized.includes("grief") ||
    normalized.includes("ptsd") ||
    normalized.includes("loss")
  ) {
    return CATEGORY_PAGES_CONTENT["trauma-grief"];
  }
  if (
    normalized.includes("thought") ||
    normalized.includes("overthinking") ||
    normalized.includes("ocd") ||
    normalized.includes("intrusive")
  ) {
    return CATEGORY_PAGES_CONTENT["thought-concerns"];
  }
  if (
    normalized.includes("catalyst-coach") ||
    normalized.includes("coach") ||
    normalized.includes("focus") ||
    normalized.includes("motivation")
  ) {
    return CATEGORY_PAGES_CONTENT["catalyst-coach"];
  }
  if (normalized.includes("red-flag") || normalized.includes("safety")) {
    return CATEGORY_PAGES_CONTENT["red-flag"];
  }

  return undefined;
}

/**
 * Strips coaching/discipline language that breaks clinical trust on mental-health pages.
 */
export function sanitizeClinicalCopy(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(
      /Guiding you towards growth, discipline, and purpose/gi,
      "Evidence-based therapy and professional psychological support"
    )
    .replace(
      /journey toward discipline and purpose/gi,
      "journey toward mental wellness and recovery"
    )
    .replace(
      /Connect with our coaches and start your journey toward discipline and purpose/gi,
      "Connect with a verified psychologist"
    )
    .replace(/Connect with our coaches/gi, "Connect with a verified psychologist")
    .replace(/Evidence-Based Coaching/gi, "Evidence-Based Therapy")
    .replace(
      /This is not therapy — it's progress management/gi,
      "Evidence-based therapy and psychological guidance"
    )
    .replace(/Catalyst Coach/gi, "Focus, Motivation & Direction")
    .replace(/\bcoach\b/gi, "psychologist")
    .replace(/\bcoaches\b/gi, "psychologists")
    .replace(/\bcoaching\b/gi, "therapy")
    .replace(/\bdiscipline\b/gi, "balance")
    .trim();
}
