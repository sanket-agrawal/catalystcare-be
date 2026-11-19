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

export interface CrisisStrip {
  heading: string;
  body: string;
  teleManasLine: string;
  phoneNumber: string;
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
  /** Pricing transparency section */
  pricingBlock: PricingBlock;
  /** FAQ accordion items */
  faq: CategoryFaq[];
  /** Prebuilt FAQPage JSON-LD string for <script type="application/ld+json"> */
  faqJsonLd: string;
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
  /** Sticky mobile CTA bar text (viewports < 768px) */
  stickyCtaText: string;
  /** Crisis / immediate help strip */
  crisisStrip: CrisisStrip;
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

const SHARED_CRISIS_STRIP: CrisisStrip = {
  heading: "Immediate Help & Support",
  body: "If you or someone you know is in crisis, please reach out immediately.",
  teleManasLine: "If you're in crisis, call Tele-MANAS 14416 (free, 24×7, Govt. of India).",
  phoneNumber: "14416",
};

/** Build FAQPage JSON-LD string from FAQ array */
function buildFaqJsonLd(faqs: CategoryFaq[]): string {
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

// ─── Page content records ──────────────────────────────────────────────────────

const ANXIETY_FAQ: CategoryFaq[] = [
  {
    question: "How do I know if I need therapy for anxiety?",
    answer:
      "If worry, panic, or stress is affecting sleep, work, or relationships for more than a few weeks, a psychologist can help. The free 1-minute check can also guide you.",
  },
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

const MOOD_FAQ: CategoryFaq[] = [
  {
    question: "Is feeling low the same as depression?",
    answer:
      "Everyone has low days. When low mood, numbness, or hopelessness lasts more than two weeks and affects daily life, it's worth talking to a professional.",
  },
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

export const CATEGORY_PAGES_CONTENT: Record<string, CategoryPageContent> = {
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
    crisisStrip: SHARED_CRISIS_STRIP,
  },

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
    crisisStrip: SHARED_CRISIS_STRIP,
  },

  "relations-personal": {
    slug: "relations-personal",
    aliases: [
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
    crisisStrip: SHARED_CRISIS_STRIP,
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

  // Alias match
  for (const item of Object.values(CATEGORY_PAGES_CONTENT)) {
    if (item.slug === normalized) return item;
    if (item.aliases.includes(normalized)) return item;
    if (item.name.toLowerCase() === normalized) return item;
  }

  // Partial match fallback
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
    return CATEGORY_PAGES_CONTENT["relations-personal"];
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
    .replace(/Connect with our coaches/gi, "Connect with a verified psychologist")
    .replace(/\bcoach\b/gi, "psychologist")
    .replace(/\bcoaches\b/gi, "psychologists")
    .replace(/\bcoaching\b/gi, "therapy")
    .replace(/\bdiscipline\b/gi, "balance")
    .trim();
}
