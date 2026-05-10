// scripts/test-groq.ts
import "dotenv/config";

async function main() {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
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
  });

  const data = await res.json();
  console.log(JSON.stringify(data.choices?.[0]?.message?.content, null, 2));
}

main().catch(console.error);