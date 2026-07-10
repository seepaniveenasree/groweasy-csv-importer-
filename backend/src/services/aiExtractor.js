const { SYSTEM_PROMPT, buildUserPrompt } = require("./promptBuilder");

/**
 * Strips ```json fences etc, in case a model ignores the "JSON only" instruction.
 */
function safeJsonParse(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

// ---- Provider adapters ------------------------------------------------
// Each adapter takes the batch and returns the raw text response from the model.

async function callGemini(userPrompt) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

async function callOpenAI(userPrompt) {
  const OpenAI = require("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });
  return completion.choices[0].message.content;
}

async function callClaude(userPrompt) {
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
    max_tokens: 4096,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  return message.content.map((b) => b.text || "").join("\n");
}

const PROVIDERS = { gemini: callGemini, openai: callOpenAI, claude: callClaude };

/**
 * Sends one batch of raw rows to the configured AI provider and returns
 * { records: [...], skipped: [...] } parsed from its JSON response.
 * Retries on transient failures / malformed JSON up to MAX_BATCH_RETRIES times.
 */
async function extractBatch(batch) {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const call = PROVIDERS[provider];
  if (!call) {
    throw new Error(
      `Unknown AI_PROVIDER "${provider}". Use one of: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }

  const userPrompt = buildUserPrompt(batch);
  const maxRetries = Number(process.env.MAX_BATCH_RETRIES ?? 2);

  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await call(userPrompt);
      const parsed = safeJsonParse(raw);
      if (!Array.isArray(parsed.records) || !Array.isArray(parsed.skipped)) {
        throw new Error("AI response missing records[] / skipped[] arrays");
      }
      return parsed;
    } catch (err) {
      lastErr = err;
      // brief backoff before retrying a failed batch
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `AI extraction failed for batch after ${maxRetries + 1} attempt(s): ${lastErr.message}`
  );
}

module.exports = { extractBatch };
