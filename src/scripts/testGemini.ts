// scripts/testGemini.ts
import "dotenv/config";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is not set in .env");
    process.exit(1);
  }

  console.log("🔄 Testing Gemini (OpenAI-compatible endpoint)...\n");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_FALLBACK_MODEL ?? "gemini-2.5-flash",
        max_tokens: 512,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are Manasi, a mental wellness AI. If the message is wellness-related respond with {"valid": true, "reply": "..."}. If not, respond with {"valid": false, "message": "..."}. JSON only.`,
          },
          {
            role: "user",
            content: "I've been feeling very anxious about my job lately",
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ Gemini API error ${res.status}:\n`, err);
    process.exit(1);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  console.log("✅ Status:", res.status);
  console.log("📦 Model used:", data.model);
  console.log("📝 Response:\n", content);

  if (!content) {
    console.error("\n⚠️  Empty response — this is the issue we saw with Cerebras");
  } else {
    try {
      const parsed = JSON.parse(content);
      console.log("\n✅ JSON parsed successfully:", JSON.stringify(parsed, null, 2));
    } catch {
      console.error("\n⚠️  Response is not valid JSON:", content);
    }
  }
}

main().catch(console.error);
