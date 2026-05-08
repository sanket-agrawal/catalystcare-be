import { describe, expect, it } from "vitest";
import { generateResultsEmailHTML } from "./result";

describe("generateResultsEmailHTML", () => {
  it("includes assessment title, explanations, and result rows", () => {
    const html = generateResultsEmailHTML({
      assessmentTitle: "Why You're Stuck",
      results: [
        { name: "Fear", score: 20, label: "Low" },
        { name: "Overload", score: 55, label: "Mid" },
      ],
      highestBlocker: { name: "Overload", score: 55, label: "Mid" },
      contextExplanation: "Context line here.",
      focusAdvice: "Focus line here.",
    });

    expect(html).toContain("Why You're Stuck");
    expect(html).toContain("Fear");
    expect(html).toContain("Overload");
    expect(html).toContain("Context line here.");
    expect(html).toContain("Focus line here.");
    expect(html).toContain("#22c55e");
    expect(html).toContain("#f97316");
  });

  it("treats missing scores as zero for bars", () => {
    const html = generateResultsEmailHTML({
      assessmentTitle: "T",
      results: [{ name: "X", label: "?" }],
      highestBlocker: { name: "X", label: "?" },
      contextExplanation: "c",
      focusAdvice: "f",
    });
    expect(html).toContain("X");
    expect(html).toContain('width="0%"');
  });
});
