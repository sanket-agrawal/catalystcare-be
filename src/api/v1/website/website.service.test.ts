import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getAllCategories, fetchCategoryBySlugService } from "./website.service";
import { prisma } from "../../../infrastructure/prisma/client";

vi.mock("../../../infrastructure/prisma/client", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    therapistProfile: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe("Website Service - Categories & Condition Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAllCategories", () => {
    it("should return curated production categories when DB is empty", async () => {
      (prisma.category.findMany as any).mockResolvedValue([]);

      const result = await getAllCategories();

      expect(result).toBeDefined();
      expect(result.length).toBe(9);

      const anxiety = result.find((c) => c.slug === "anxiety-stress");
      expect(anxiety).toBeDefined();
      expect(anxiety?.h1).toBe("Therapy for Anxiety & Stress, Online Across India");
      expect(anxiety?.heroCta).toBe("Find your therapist");
      expect(anxiety?.isThisYou.length).toBe(5);

      const mood = result.find((c) => c.slug === "mood-disorders");
      expect(mood).toBeDefined();
      expect(mood?.h1).toBe("Support for Depression & Low Mood, From Verified Psychologists");

      const relations = result.find(
        (c) => c.slug === "couples-therapy-marriage-counselling-online"
      );
      expect(relations).toBeDefined();
      expect(relations?.h1).toBe("Couples Therapy & Marriage Counselling, Online");

      const selfIdentity = result.find((c) => c.slug === "self-identity");
      expect(selfIdentity).toBeDefined();
      expect(selfIdentity?.h1).toBe("Therapy for Self-Esteem & Identity, Online Across India");

      const lifestyle = result.find((c) => c.slug === "lifestyle-habits");
      expect(lifestyle).toBeDefined();
      expect(lifestyle?.h1).toBe(
        "Support for Sleep, Screen Habits & Patterns That Feel Out of Control"
      );

      const trauma = result.find((c) => c.slug === "trauma-grief");
      expect(trauma).toBeDefined();
      expect(trauma?.h1).toBe("Trauma & Grief Therapy, Online and at Your Pace");
      expect(trauma?.stickyCtaText).toBe("");

      const thought = result.find((c) => c.slug === "thought-concerns");
      expect(thought).toBeDefined();
      expect(thought?.h1).toBe("Therapy for Overthinking, Intrusive Thoughts & OCD");

      const coach = result.find((c) => c.slug === "catalyst-coach");
      expect(coach).toBeDefined();
      expect(coach?.name).toBe("Focus, Motivation & Direction");
      expect(coach?.h1).toBe("Therapy for Focus, Motivation & Life Direction");

      const safety = result.find((c) => c.slug === "red-flag");
      expect(safety).toBeDefined();
      expect(safety?.isSafetyPage).toBe(true);
      expect(safety?.h1).toBe("If you're not safe right now");
      expect(safety?.pricingBlock).toBeNull();
    });

    it("should sanitize coaching language from DB category description", async () => {
      (prisma.category.findMany as any).mockResolvedValue([
        {
          id: "cat-1",
          slug: "anxiety-stress",
          name: "Anxiety & Stress",
          description: "Guiding you towards growth, discipline, and purpose with our coaches",
          tagline: "Connect with our coaches for your journey toward discipline and purpose",
          iconUrl: null,
          websiteDesc: null,
          therapists: [],
          subCategories: [
            {
              id: "sub-1",
              slug: "social-anxiety",
              name: "Social Anxiety",
              description: "Guidance with coaches",
              iconUrl: null,
              tagline: null,
              websiteDesc: null,
            },
          ],
        },
      ]);

      const result = await getAllCategories();
      expect(result.length).toBe(9);
      const anxiety = result.find((c) => c.slug === "anxiety-stress")!;

      // Coaching phrases removed / cleaned
      expect(anxiety.subhead).not.toContain("Guiding you towards growth, discipline, and purpose");
      expect(anxiety.subhead).not.toContain("coaches");
      expect(anxiety.heroCta).toBe("Find your therapist");
    });

    it("should include category-filtered therapists (top 4) in categories response", async () => {
      (prisma.category.findMany as any).mockResolvedValue([
        {
          id: "cat-anxiety",
          slug: "anxiety-stress",
          name: "Anxiety & Stress",
          description: "Anxiety therapy",
          tagline: null,
          iconUrl: null,
          websiteDesc: null,
          subCategories: [],
          therapists: [
            {
              id: "t-1",
              slug: "dr-neha-verma",
              professionalTitle: "Clinical Psychologist",
              highestQualification: "M.Phil Clinical Psychology",
              yearOfExperience: 9,
              sessionFee: 799,
              currency: "INR",
              languageSpoken: ["Hindi", "English"],
              about: "Specializes in anxiety and CBT.",
              user: { firstName: "Neha", lastName: "Verma", profilePhoto: null },
              subCategories: [
                { id: "sc-1", slug: "generalized-anxiety", name: "Generalized Anxiety" },
                { id: "sc-2", slug: "panic", name: "Panic Disorders" },
              ],
            },
            {
              id: "t-2",
              slug: "ananya-sen",
              professionalTitle: "Counselling Psychologist",
              highestQualification: "M.A. Applied Psychology",
              yearOfExperience: 4,
              sessionFee: 499,
              currency: "INR",
              languageSpoken: ["Hindi", "Bengali"],
              about: "Works with young adults on stress and anxiety.",
              user: { firstName: "Ananya", lastName: "Sen", profilePhoto: null },
              subCategories: [{ id: "sc-3", slug: "burnout", name: "Burnout" }],
            },
          ],
        },
      ]);

      const result = await getAllCategories();
      expect(result.length).toBe(9);

      const category = result.find((c) => c.slug === "anxiety-stress")!;
      expect(category.slug).toBe("anxiety-stress");

      // Therapists included
      expect(category.therapists).toBeDefined();
      expect(category.therapists).toHaveLength(2);

      const first = category.therapists[0];
      expect(first.slug).toBe("dr-neha-verma");
      expect(first.name).toBe("Neha Verma");
      expect(first.sessionFee).toBe(799);
      expect(first.specializations).toContain("Generalized Anxiety");
      expect(first.specializations).toContain("Panic Disorders");

      const second = category.therapists[1];
      expect(second.slug).toBe("ananya-sen");
      expect(second.sessionFee).toBe(499);
      expect(second.specializations).toContain("Burnout");
    });
  });

  describe("fetchCategoryBySlugService", () => {
    it("should return complete Page A (anxiety-stress) content with anchor sections and FAQs", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("anxiety-stress");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("anxiety-stress");
      expect(result?.h1).toBe("Therapy for Anxiety & Stress, Online Across India");
      expect(result?.subhead).toContain("When your mind won't slow down");
      expect(result?.subhead).toContain("Private video sessions from ₹499");
      expect(result?.heroCta).toBe("Find your therapist");

      // Verify "Is this you?" bullets
      expect(result?.isThisYou).toEqual([
        "My mind races at night and I can't switch off.",
        "Small things trigger a wave of panic or dread.",
        "I keep overthinking conversations and decisions.",
        "Work pressure follows me home every single day.",
        "I'm exhausted from pretending I'm fine.",
      ]);

      // Verify Sub-conditions with anchors
      expect(result?.subCategories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "generalized-anxiety",
            anchor: "#generalized-anxiety",
            name: "Generalized Anxiety",
          }),
          expect.objectContaining({
            id: "social-anxiety",
            anchor: "#social-anxiety",
            name: "Social Anxiety",
          }),
          expect.objectContaining({
            id: "panic",
            anchor: "#panic",
            name: "Panic Disorders",
          }),
          expect.objectContaining({
            id: "stress-management",
            anchor: "#stress-management",
            name: "Stress Management",
          }),
          expect.objectContaining({
            id: "burnout",
            anchor: "#burnout",
            name: "Burnout",
          }),
        ])
      );

      // Verify Testimonials
      expect(result?.testimonials).toHaveLength(3);
      expect(result?.testimonials[0].name).toBe("Ananya");
      expect(result?.testimonials[1].name).toBe("Priya");
      expect(result?.testimonials[2].name).toBe("Sameer");

      // Verify FAQs
      expect(result?.faq).toHaveLength(5);
      expect(result?.faq[0].question).toBe("How do I know if I need therapy for anxiety?");
      expect(result?.faq[1].question).toBe("What happens in the first session?");
      expect(result?.faq[2].question).toBe("How much does it cost?");
      expect(result?.faq[3].question).toBe("Is it really private?");
      expect(result?.faq[4].question).toBe("How soon can I start?");

      // Verify Final CTA
      expect(result?.finalCta.h2).toBe("Start feeling like yourself again.");
      expect(result?.pricing.startingPrice).toBe(499);

      // Verify new Phase 0 landing page fields
      expect(result?.secondaryCta.href).toBe("/self-help/assessment");
      expect(result?.trustStrip).toHaveLength(4);
      expect(result?.trustStrip[0].label).toBe("Verified therapists");
      expect(result?.trustStrip[2].label).toBe("Sessions from ₹499");
      expect(result?.howItWorks).toHaveLength(4);
      expect(result?.howItWorks[0].title).toBe("Tell us");
      expect(result?.howItWorks[3].title).toBe("Track progress");
      expect(result?.pricingBlock.h2).toBe("What it costs");
      expect(result?.pricingBlock.startingPrice).toBe(499);
      expect(result?.pricingBlock.body).toContain("No packages required");
      expect(result?.faqJsonLd).toContain("FAQPage");
      expect(result?.faqJsonLd).toContain("How do I know if I need therapy for anxiety?");
      expect(result?.stickyCtaText).toBe("Sessions from ₹499 — Find your therapist");
      expect(result?.finalCta.secondaryCta.text).toContain("free 1-minute check");
    });

    it("should return complete Page B (mood-disorders) compliant content", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("mood-disorders");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("mood-disorders");
      expect(result?.h1).toBe("Support for Depression & Low Mood, From Verified Psychologists");
      expect(result?.subhead).toBe(
        "Persistent sadness, numbness, or exhaustion isn't something you have to push through alone. Confidential online sessions from ₹499."
      );

      // Policy check: Must never address visitor as if we know their diagnosis ("You have depression")
      expect(result?.subhead).not.toContain("You have depression");
      expect(result?.h1).not.toContain("You have depression");

      // Verify "Is this you?" bullets
      expect(result?.isThisYou).toContain(
        "I feel flat — things I enjoyed don't feel like anything anymore."
      );
      expect(result?.isThisYou).toContain("Getting through the day takes everything I have.");
      expect(result?.isThisYou).toContain("I sleep too much, or barely at all.");
      expect(result?.isThisYou).toContain("People say 'cheer up', but it's not that simple.");
      expect(result?.isThisYou).toContain("I feel like a burden, even to people who love me.");

      // Testimonials
      expect(result?.testimonials.map((t) => t.name)).toEqual(["Shreya", "Diya", "Vikram"]);

      // FAQ Q1
      expect(result?.faq[0].question).toBe("Is feeling low the same as depression?");

      // Final CTA
      expect(result?.finalCta.h2).toBe(
        "The first conversation is the hardest part. Have it this week."
      );
    });

    it("should keep relations-personal as a legacy category alias", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("relations-personal");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("couples-therapy-marriage-counselling-online");
    });

    it("should return complete Page C (couples-therapy-marriage-counselling-online) content", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService(
        "couples-therapy-marriage-counselling-online"
      );

      expect(result).toBeDefined();
      expect(result?.slug).toBe("couples-therapy-marriage-counselling-online");
      expect(result?.h1).toBe("Couples Therapy & Marriage Counselling, Online");
      expect(result?.subhead).toContain(
        "Whether you're fighting too often, drifting apart, or preparing for marriage"
      );
      expect(result?.subhead).toContain("From ₹499 per session");

      // Bullets
      expect(result?.isThisYou).toEqual([
        "Every small disagreement turns into the same big fight.",
        "We feel more like flatmates than partners.",
        "Family pressure is crushing us both.",
        "Trust was broken and we don't know how to rebuild.",
        "We're getting married and want to start right.",
      ]);

      // Testimonials
      expect(result?.testimonials.map((t) => t.name)).toEqual(["Karan", "Tanvi", "Kavitha"]);

      // FAQs
      expect(result?.faq[0].question).toBe("Do we attend together or separately?");
      expect(result?.faq[1].question).toBe("What if my partner won't come?");

      // Final CTA
      expect(result?.finalCta.h2).toBe("Don't wait for things to get worse.");
    });

    it("should return complete Page D (self-identity) compliant content", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("self-identity");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("self-identity");
      expect(result?.h1).toBe("Therapy for Self-Esteem & Identity, Online Across India");
      expect(result?.subhead).toContain("Feeling not good enough, unsure who you are");
      expect(result?.subhead).toContain("Private video sessions from ₹499");

      // Verify "Is this you?" bullets
      expect(result?.isThisYou).toEqual([
        "I'm always comparing myself to everyone else.",
        "I don't really know what I want from my life.",
        "Compliments don't land — I just don't believe them.",
        "I've changed so much to fit in that I've lost track of me.",
        "I have a good life on paper, so why do I feel empty?",
      ]);

      // Sub-conditions
      const subSlugs = result?.subCategories.map((s) => s.id);
      expect(subSlugs).toEqual([
        "self-worth",
        "life-purpose",
        "identity-exploration",
        "low-self-esteem",
      ]);

      // Testimonials
      expect(result?.testimonials.map((t) => t.name)).toEqual(["Rishi", "Vikram", "Kavitha"]);

      // FAQ Q1
      expect(result?.faq[0].question).toBe("Is low self-esteem something therapy can help with?");
      expect(result?.faq).toHaveLength(5);

      // Final CTA
      expect(result?.finalCta.h2).toBe("You don't have to figure yourself out alone.");
    });

    it("should return complete Page E (lifestyle-habits) with ADHD and anger anchors", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("lifestyle-habits");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("lifestyle-habits");
      expect(result?.h1).toBe(
        "Support for Sleep, Screen Habits & Patterns That Feel Out of Control"
      );
      expect(result?.subhead).toContain(
        "When sleep, screens, food or substances start running your day"
      );

      // Bullets
      expect(result?.isThisYou).toEqual([
        "I'm exhausted but I still can't fall asleep.",
        "I lose hours to my phone or games and feel worse after.",
        "I've tried to cut back so many times and it never sticks.",
        "My relationship with food takes up too much of my head.",
        "I lose my temper faster than I'd like to.",
      ]);

      // Sub-conditions include anger and adult-adhd
      const subSlugs = result?.subCategories.map((s) => s.id);
      expect(subSlugs).toContain("digital-fatigue");
      expect(subSlugs).toContain("sleep");
      expect(subSlugs).toContain("eating-concerns");
      expect(subSlugs).toContain("substance-use");
      expect(subSlugs).toContain("anger");
      expect(subSlugs).toContain("adult-adhd");

      // Testimonials
      expect(result?.testimonials.map((t) => t.name)).toEqual([
        "Nikhil",
        "Sameer",
        "Rahul",
        "Farooq",
      ]);

      // FAQ Q1
      expect(result?.faq[0].question).toBe("Is this therapy, or habit coaching?");
      expect(result?.faq[0].answer).toContain("Focus, Motivation & Direction");

      // Final CTA
      expect(result?.finalCta.h2).toBe("Small changes, with the right support, add up.");
    });

    it("should return complete Page F (trauma-grief) trauma-informed variant", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("trauma-grief");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("trauma-grief");
      expect(result?.h1).toBe("Trauma & Grief Therapy, Online and at Your Pace");
      expect(result?.heroCta).toBe("Find a trauma-informed therapist");

      // Trauma-informed specific attributes
      expect(result?.contentNote).toBe(
        "Take this at your own pace. Nothing here asks you to share more than you want to."
      );
      expect(result?.stickyCtaText).toBe(""); // No sticky mobile CTA
      expect(result?.trustStrip[0].label).toBe("Trauma-informed therapists");
      expect(result?.trustStrip.some((t) => t.label.includes("Same-week"))).toBe(false);

      // Bullets (gentle, non-graphic)
      expect(result?.isThisYou).toEqual([
        "It happened a long time ago, but it still affects me.",
        "Since the loss, I've been going through the motions.",
        "Certain places, sounds or people put me right back there.",
        "Everyone expects me to have moved on by now.",
      ]);

      // Sub-conditions: abuse recovery
      const abuseRecovery = result?.subCategories.find((s) => s.id === "abuse-recovery");
      expect(abuseRecovery).toBeDefined();
      expect(abuseRecovery?.description).toContain("trauma-informed");

      // Testimonials
      expect(result?.testimonials.map((t) => t.name)).toEqual(["Aditya", "Tanvi"]);

      // FAQ Q1
      expect(result?.faq[0].question).toBe("Will I have to talk about everything that happened?");

      // Final CTA
      expect(result?.finalCta.h2).toBe("When you're ready, we're here.");
      expect(result?.finalCta.buttonText).toBe("Find a trauma-informed therapist");
    });

    it("should return complete Page G (thought-concerns) with OCD & intrusive thoughts", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("thought-concerns");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("thought-concerns");
      expect(result?.h1).toBe("Therapy for Overthinking, Intrusive Thoughts & OCD");
      expect(result?.subhead).toContain(
        "When your thoughts feel loud, repetitive or impossible to switch off"
      );

      // Bullets
      expect(result?.isThisYou).toEqual([
        "I replay conversations for hours afterwards.",
        "Unwanted thoughts pop into my head and scare me.",
        "I check things again and again, even when I know it's fine.",
        "Nothing I do ever feels good enough.",
        "My inner voice is harsher than anyone else's.",
      ]);

      // Sub-conditions include ocd-intrusive-thoughts
      const subSlugs = result?.subCategories.map((s) => s.id);
      expect(subSlugs).toEqual([
        "overthinking",
        "negative-self-talk",
        "perfectionism",
        "ocd-intrusive-thoughts",
      ]);

      // Testimonials
      expect(result?.testimonials.map((t) => t.name)).toEqual(["Meghna", "Ananya", "Rishi"]);

      // FAQ Q1
      expect(result?.faq[0].question).toBe(
        "Are intrusive thoughts a sign something is wrong with me?"
      );

      // Final CTA
      expect(result?.finalCta.h2).toBe("Your thoughts don't have to run the show.");
    });

    it("should return complete Page H (catalyst-coach) repositioned to Focus, Motivation & Direction", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("catalyst-coach");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("catalyst-coach");
      expect(result?.name).toBe("Focus, Motivation & Direction");
      expect(result?.h1).toBe("Therapy for Focus, Motivation & Life Direction");
      expect(result?.subhead).toContain(
        "Stuck, unmotivated, or not following through on what matters?"
      );
      expect(result?.subhead).toContain("A verified psychologist helps you understand");

      // Bullets
      expect(result?.isThisYou).toEqual([
        "I set goals every month and drop them by week two.",
        "I'm busy all day but not moving on what matters.",
        "I'm at a crossroads and don't know which way to go.",
        "I know what to do — I just don't do it consistently.",
        "Everything looks fine on paper, but I feel stuck.",
      ]);

      // Sub-conditions (renamed away from coaching)
      const subSlugs = result?.subCategories.map((s) => s.id);
      expect(subSlugs).toEqual([
        "goals-direction",
        "focus-procrastination",
        "habits-consistency",
        "resilience",
        "life-transitions",
      ]);

      // Testimonials
      expect(result?.testimonials.map((t) => t.name)).toEqual(["Farooq", "Karan", "Vikram"]);

      // FAQ Q1
      expect(result?.faq[0].question).toBe("Do I need a mental health problem to see a therapist?");

      // Final CTA
      expect(result?.finalCta.h2).toBe("Get unstuck, with someone in your corner.");
    });

    it("should return complete Page I (red-flag) safety page without commercial elements", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("red-flag");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("red-flag");
      expect(result?.isSafetyPage).toBe(true);
      expect(result?.h1).toBe("If you're not safe right now");

      // Safety page guardrails: NO pricing, NO trust strip, NO sticky booking CTA
      expect(result?.pricingBlock).toBeNull();
      expect(result?.stickyCtaText).toBe("");
      expect(result?.trustStrip).toEqual([]);
      expect(result?.isThisYou).toEqual([]);
      expect(result?.testimonials).toEqual([]);
      expect(result?.faq).toEqual([]);
      expect(result?.faqJsonLd).toBeNull();

      // Emergency contacts & crisis strips are completely excluded
      expect((result as any)?.crisisStrip).toBeUndefined();
      expect((result as any)?.emergencyContacts).toBeUndefined();

      // Soft directory link
      expect(result?.whenReady?.href).toBe("/therapists");
    });

    it("should query therapists tagged with the category, limit to 6, and prioritize focus sub-condition", async () => {
      const mockTherapists = [
        {
          id: "t-1",
          slug: "dr-arun-sharma",
          professionalTitle: "Clinical Psychologist",
          highestQualification: "M.Phil Clinical Psychology",
          yearOfExperience: "7",
          sessionFee: 799,
          currency: "INR",
          languageSpoken: ["English", "Hindi"],
          user: {
            firstName: "Arun",
            lastName: "Sharma",
            profilePhoto: "https://example.com/p1.jpg",
          },
          categories: [{ slug: "anxiety-stress", name: "Anxiety & Stress" }],
          subCategories: [{ slug: "generalized-anxiety", name: "Generalized Anxiety" }],
        },
        {
          id: "t-2",
          slug: "dr-neha-verma",
          professionalTitle: "Counseling Psychologist",
          highestQualification: "M.Sc Psychology",
          yearOfExperience: "5",
          sessionFee: 599,
          currency: "INR",
          languageSpoken: ["English"],
          user: {
            firstName: "Neha",
            lastName: "Verma",
            profilePhoto: "https://example.com/p2.jpg",
          },
          categories: [{ slug: "anxiety-stress", name: "Anxiety & Stress" }],
          subCategories: [{ slug: "social-anxiety", name: "Social Anxiety" }],
        },
        {
          id: "t-3",
          slug: "dr-rohit-gupta",
          professionalTitle: "Psychologist",
          highestQualification: "M.A. Applied Psychology",
          yearOfExperience: "4",
          sessionFee: 499,
          currency: "INR",
          languageSpoken: ["English", "Hindi"],
          user: {
            firstName: "Rohit",
            lastName: "Gupta",
            profilePhoto: "https://example.com/p3.jpg",
          },
          categories: [{ slug: "anxiety-stress", name: "Anxiety & Stress" }],
          subCategories: [{ slug: "panic", name: "Panic Disorders" }],
        },
      ];

      (prisma.category.findFirst as any).mockResolvedValue({
        id: "cat-anxiety",
        slug: "anxiety-stress",
        name: "Anxiety & Stress",
        therapists: mockTherapists,
      });

      // Query with ?focus=social-anxiety
      const resultWithFocus = await fetchCategoryBySlugService("anxiety-stress", "social-anxiety");

      expect(resultWithFocus).toBeDefined();
      expect(resultWithFocus?.therapists).toHaveLength(3);
      // Dr. Neha Verma (Social Anxiety specialist) should be re-ordered first
      expect(resultWithFocus?.therapists[0].slug).toBe("dr-neha-verma");
      expect(resultWithFocus?.focus).toBe("social-anxiety");
    });

    it("should return null for unknown category slug that does not exist in DB or curated pages", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("non-existent-category");
      expect(result).toBeNull();
    });
  });
});
