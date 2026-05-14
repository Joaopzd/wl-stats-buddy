import { createServerFn } from "@tanstack/react-start";

export interface CoachInsight {
  weakestLink: string;
  balance: string;
  tilt: string;
  efficiency: string;
  summary: string;
}

export interface CoachBriefing {
  tips: string[];
}

interface AnalysisInput {
  mode: "analysis" | "briefing";
  payload: unknown;
}

const SYSTEM_PROMPT = `You are an elite EA FC 26 Weekend League performance coach (PZD-style).
Be concise, tactical, and specific. Use plain English. Avoid filler.
Always respond with the exact JSON tool call requested — no prose outside it.`;

export const runCoach = createServerFn({ method: "POST" })
  .inputValidator((d: AnalysisInput) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("AI Coach is not configured (missing LOVABLE_API_KEY).");
    }

    const isAnalysis = data.mode === "analysis";

    const tool = isAnalysis
      ? {
          type: "function" as const,
          function: {
            name: "coach_report",
            description: "Diagnostic report on the latest WL performance.",
            parameters: {
              type: "object",
              properties: {
                weakestLink: { type: "string", description: "Identify the weakest player and a tactic/replacement suggestion. Reference name & avg rating." },
                balance: { type: "string", description: "Defensive vs offensive balance based on Scored/Conceded ratio. Suggest CDM/tactic adjustments if needed." },
                tilt: { type: "string", description: "Tilt-factor analysis based on losing streaks. Recommend mental break strategy if 2+ losses in a row." },
                efficiency: { type: "string", description: "Efficiency gap between MVP and rest of squad. Flag over-reliance." },
                summary: { type: "string", description: "One-sentence final verdict (max 18 words)." },
              },
              required: ["weakestLink", "balance", "tilt", "efficiency", "summary"],
              additionalProperties: false,
            },
          },
        }
      : {
          type: "function" as const,
          function: {
            name: "coach_briefing",
            description: "3 personalized pre-WL tips based on historical patterns.",
            parameters: {
              type: "object",
              properties: {
                tips: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: { type: "string", description: "One actionable, data-driven tip (max 22 words)." },
                },
              },
              required: ["tips"],
              additionalProperties: false,
            },
          },
        };

    const userMsg = isAnalysis
      ? `Analyze this latest Weekend League data and produce a coach report.\n\n${JSON.stringify(data.payload, null, 2)}`
      : `Based on this club's historical performance, give exactly 3 sharp pre-WL tips.\n\n${JSON.stringify(data.payload, null, 2)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached, try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("AI Coach failed to respond.");
    }

    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argStr = call?.function?.arguments;
    if (!argStr) throw new Error("AI Coach returned an empty response.");
    const parsed = JSON.parse(argStr);
    return parsed as CoachInsight | CoachBriefing;
  });
