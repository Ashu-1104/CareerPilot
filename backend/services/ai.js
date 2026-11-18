// Text generation through any OpenAI-compatible chat API. By default the free,
// keyless Pollinations service; set AI_BASE_URL, AI_API_KEY and AI_MODEL to use
// another (for example Groq: https://api.groq.com/openai/v1).
const BASE_URL = () => (process.env.AI_BASE_URL || "https://text.pollinations.ai/openai").replace(/\/$/, "");
const MODEL = () => process.env.AI_MODEL || "openai";

const endpoint = () => (/\/chat\/completions$/.test(BASE_URL()) || /pollinations/.test(BASE_URL()) ? BASE_URL() : `${BASE_URL()}/chat/completions`);

exports.generate = async (system, user, { maxTokens = 700, attempts = 3 } = {}) => {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const res = await fetch(endpoint(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(process.env.AI_API_KEY && { Authorization: `Bearer ${process.env.AI_API_KEY}` }),
                },
                body: JSON.stringify({
                    model: MODEL(),
                    messages: [
                        { role: "system", content: system },
                        { role: "user", content: user },
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.4,
                }),
                signal: AbortSignal.timeout(45000),
            });
            if (res.status === 429 || res.status === 402 || res.status >= 500) {
                throw new Error(`AI service busy (${res.status})`);
            }
            if (!res.ok) throw new Error(`AI service error (${res.status})`);
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (!text) throw new Error("AI returned an empty answer");
            return text;
        } catch (error) {
            lastError = error;
            // free services rate-limit bursts: wait a little longer each time
            if (attempt < attempts) await new Promise((r) => setTimeout(r, attempt * 4000));
        }
    }
    throw lastError;
};
