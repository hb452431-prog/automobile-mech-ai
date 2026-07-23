import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  description: z.string().max(2000).optional(),
  imageBase64: z.string().max(6_000_000).optional(),
  imageMime: z.string().max(50).optional(),
  language: z.string().max(40).optional(),
});

export type DiagnosisResult = {
  problem: string;
  explanation: string;
  causes: string[];
  steps: string[];
  solution: string;
  precautions: string[];
  tools: string[];
  diyPossible: boolean;
  severity: "low" | "medium" | "high";
  recommendation: string;
  goToMechanic: boolean;
};

const SYSTEM = `You are an expert vehicle mechanic assistant for bikes, scooters, and cars.
Given a user's problem description or photo, respond with a JSON object matching this exact schema:
{
  "problem": string,           // short name of the likely issue
  "explanation": string,       // 1-2 sentences explaining what's happening
  "causes": string[],          // possible causes
  "steps": string[],           // step-by-step checking process
  "solution": string,          // basic solution / troubleshooting
  "precautions": string[],     // safety precautions
  "tools": string[],           // tools that may be needed
  "diyPossible": boolean,      // whether a normal user can fix it at home
  "severity": "low"|"medium"|"high",
  "recommendation": string,    // final recommendation to the user
  "goToMechanic": boolean      // true if the user should visit a mechanic instead of DIY
}
Set goToMechanic=true and severity="high" for: engine internal damage, brake failure,
fuel leakage, major electrical failure, heavy smoke, overheating with coolant leak.
Respond with ONLY valid JSON, no markdown fences.`;

export const diagnose = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    if (!data.description && !data.imageBase64) throw new Error("Provide description or image");

    const userContent: any[] = [];
    if (data.description) userContent.push({ type: "text", text: data.description });
    else userContent.push({ type: "text", text: "Diagnose the vehicle problem visible in this image." });
    if (data.imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${data.imageMime || "image/jpeg"};base64,${data.imageBase64}` },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "system",
            content: `Respond in ${data.language || "English"}. Translate every string field (problem, explanation, causes, steps, solution, precautions, tools, recommendation) into ${data.language || "English"}. Keep the "severity" field as one of the exact English tokens: "low", "medium", or "high". Keep JSON keys in English.`,
          },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Rate limit — please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
      throw new Error(`AI request failed: ${t}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: DiagnosisResult;
    try { parsed = JSON.parse(content); }
    catch { throw new Error("AI returned invalid JSON"); }
    return parsed;
  });
