import "dotenv/config";
import { generate, stream, countTokens } from "../services/ai/aiProvider.service.js";

async function main() {
  console.log("1. Testing non-streaming generate()...");
  const result = await generate({
    systemPrompt:
      "You are MONE AI, a personal finance and productivity assistant. Be concise.",
    messages: [{ role: "user", content: "In one sentence, what can you help me with?" }],
    tier: "fast",
  });
  console.log("Response:", result.text);
  console.log("Usage:", result.usage, "Model:", result.model);

  console.log("\n2. Testing token counting...");
  const tokenCount = await countTokens("How much did I spend on food this month?");
  console.log("Token count:", tokenCount);

  console.log("\n3. Testing stream()...");
  process.stdout.write("Streamed response: ");
  for await (const chunk of stream({
    systemPrompt: "You are MONE AI. Be concise.",
    messages: [{ role: "user", content: "List 3 things you can help with, briefly." }],
    tier: "fast",
  })) {
    if (chunk.type === "token") process.stdout.write(chunk.text);
    if (chunk.type === "done") console.log("\n[stream complete]", chunk.usage);
  }
}

main().catch((err) => {
  console.error("\nTest failed:", err.message);
  process.exit(1);
});