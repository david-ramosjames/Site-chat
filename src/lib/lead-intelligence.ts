import type { FeatureToggles } from "@prisma/client";

type TranscriptEntry = { role: "bot" | "user"; text: string; stepKey?: string };

type LeadIntelligenceInput = {
  businessName: string;
  serviceRequested?: string | null;
  qualified?: string | null;
  referral?: string | null;
  answers: Record<string, unknown>;
  transcript: TranscriptEntry[];
  features: FeatureToggles | null;
};

type LeadIntelligenceResult = {
  aiSummary?: string | null;
  leadScore?: number | null;
};

export async function generateLeadIntelligence({
  businessName,
  serviceRequested,
  qualified,
  referral,
  answers,
  transcript,
  features,
}: LeadIntelligenceInput): Promise<LeadIntelligenceResult | null> {
  if (!features?.enableAiSummary && !features?.enableLeadScoring) return null;
  if (!features?.llmApiKey?.trim()) {
    console.warn(`Lead intelligence skipped for ${businessName}: missing LLM API token`);
    return null;
  }

  const prompt = buildPrompt({
    businessName,
    serviceRequested,
    qualified,
    referral,
    answers,
    transcript,
    includeSummary: features.enableAiSummary,
    includeScore: features.enableLeadScoring,
  });

  const content = await callLlm({
    provider: features.llmProvider,
    model: features.llmModel || "gpt-4o-mini",
    apiKey: features.llmApiKey,
    prompt,
  });
  const parsed = parseJsonObject(content);
  if (!parsed) return null;

  const result: LeadIntelligenceResult = {};
  if (features.enableAiSummary && typeof parsed.aiSummary === "string") {
    result.aiSummary = parsed.aiSummary.trim().slice(0, 1200) || null;
  }
  if (features.enableLeadScoring) {
    const score = Number(parsed.leadScore);
    result.leadScore = Number.isFinite(score)
      ? Math.max(0, Math.min(100, Math.round(score)))
      : null;
  }
  return result.aiSummary != null || result.leadScore != null ? result : null;
}

function buildPrompt({
  businessName,
  serviceRequested,
  qualified,
  referral,
  answers,
  transcript,
  includeSummary,
  includeScore,
}: {
  businessName: string;
  serviceRequested?: string | null;
  qualified?: string | null;
  referral?: string | null;
  answers: Record<string, unknown>;
  transcript: TranscriptEntry[];
  includeSummary: boolean;
  includeScore: boolean;
}) {
  const transcriptText = transcript
    .slice(0, 80)
    .map((t) => `${t.role}: ${t.text}`)
    .join("\n")
    .slice(0, 12000);

  return [
    "You analyze chat-widget leads for a business.",
    "Return only valid JSON with no markdown, no prose, and no code fences.",
    `Business: ${businessName}`,
    `Requested service: ${serviceRequested || "unknown"}`,
    `Qualified flag: ${qualified || "unknown"}`,
    `Referral flag: ${referral || "unknown"}`,
    "",
    "Requested output shape:",
    JSON.stringify({
      aiSummary: includeSummary ? "1-3 concise sentences for an admin reviewing the lead" : null,
      leadScore: includeScore ? "integer from 0 to 100" : null,
    }),
    "",
    includeScore
      ? "Scoring rubric: 85-100 urgent/high-intent and contactable; 60-84 relevant but less urgent or less complete; 30-59 weak fit, incomplete, or uncertain; 0-29 spam, irrelevant, or not actionable."
      : "",
    "",
    "Answers JSON:",
    JSON.stringify(answers).slice(0, 12000),
    "",
    "Transcript:",
    transcriptText || "No transcript captured.",
  ].join("\n");
}

async function callLlm({
  provider,
  model,
  apiKey,
  prompt,
}: {
  provider: string;
  model: string;
  apiKey: string;
  prompt: string;
}) {
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic returned ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return data.content?.find((part) => part.type === "text")?.text ?? "";
  }

  const baseUrl =
    provider === "custom"
      ? (process.env.CUSTOM_LLM_BASE_URL || "").replace(/\/$/, "")
      : "https://api.openai.com/v1";
  if (!baseUrl) throw new Error("CUSTOM_LLM_BASE_URL is required for custom LLM provider");

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You return strict JSON for lead analysis.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM provider returned ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  const jsonText = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed;
  try {
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch (err) {
    console.warn("Lead intelligence JSON parse failed:", err);
    return null;
  }
}
