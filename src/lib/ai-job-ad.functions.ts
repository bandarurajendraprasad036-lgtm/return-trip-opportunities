import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type JobAdDraft = { skill: string; location: string; salary: string; description: string };

export const draftJobAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; kind: "seeker" | "employer" }) => {
    const text = String(input?.text ?? "").trim();
    if (text.length < 3 || text.length > 1000) throw new Error("మీ గురించి కొంచెం రాయండి (3-1000 అక్షరాలు) / Describe in 3-1000 letters.");
    return { text, kind: input?.kind === "employer" ? "employer" as const : "seeker" as const };
  })
  .handler(async ({ data }) => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const who = data.kind === "seeker" ? "a job seeker describing their skills and the work they want" : "an employer describing the worker they need";
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          `You help village users in Andhra Pradesh/Telangana write a clear job post. The text is from ${who}, in Telugu or English. Extract: skill (short, e.g. "Driver / డ్రైవర్"), location (town/village name as written), salary (as stated, else empty string), and description: a clear, polite job ad of 2-4 short lines, Telugu first then English, max 450 characters. Do not invent facts like phone numbers or salary.`,
        input: [{ role: "user", content: data.text }],
        text: {
          format: {
            type: "json_schema",
            name: "job_ad",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["skill", "location", "salary", "description"],
              properties: {
                skill: { type: "string" },
                location: { type: "string" },
                salary: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
      });
      let out = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") out += c.text;
      }
      const p = JSON.parse(out || "{}") as Partial<JobAdDraft>;
      return {
        skill: String(p.skill ?? "").slice(0, 100),
        location: String(p.location ?? "").slice(0, 80),
        salary: String(p.salary ?? "").slice(0, 40),
        description: String(p.description ?? "").slice(0, 500),
      } satisfies JobAdDraft;
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("AI job ad failed", e.code, e.ids);
        if (e.code === "rate_limited") throw new Error("చాలా రిక్వెస్ట్‌లు, ఒక నిమిషం తర్వాత ట్రై చేయండి / Try again in a minute.");
        if (e.code === "payment_required") throw new Error("AI క్రెడిట్స్ అయిపోయాయి / AI credits finished.");
      }
      console.error(e);
      throw new Error("AI పని చేయలేదు, మళ్ళీ ట్రై చేయండి / AI failed, try again.");
    }
  });
