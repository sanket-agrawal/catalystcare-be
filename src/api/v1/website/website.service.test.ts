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
      expect(result.length).toBeGreaterThanOrEqual(3);

      const anxiety = result.find((c) => c.slug === "anxiety-stress");
      expect(anxiety).toBeDefined();
      expect(anxiety?.h1).toBe("Therapy for Anxiety & Stress, Online Across India");
      expect(anxiety?.heroCta).toBe("Find your therapist");
      expect(anxiety?.isThisYou.length).toBe(5);

      const mood = result.find((c) => c.slug === "mood-disorders");
      expect(mood).toBeDefined();
      expect(mood?.h1).toBe("Support for Depression & Low Mood, From Verified Psychologists");

      const relations = result.find((c) => c.slug === "relations-personal");
      expect(relations).toBeDefined();
      expect(relations?.h1).toBe("Couples Therapy & Marriage Counselling, Online");
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
      expect(result.length).toBe(1);
      const anxiety = result[0];

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
      expect(result.length).toBe(1);

      const category = result[0];
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
      expect(result?.crisisStrip.phoneNumber).toBe("14416");
      expect(result?.crisisStrip.teleManasLine).toContain("Tele-MANAS");
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

    it("should return complete Page C (relations-personal) content", async () => {
      (prisma.category.findFirst as any).mockResolvedValue(null);

      const result = await fetchCategoryBySlugService("relations-personal");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("relations-personal");
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
