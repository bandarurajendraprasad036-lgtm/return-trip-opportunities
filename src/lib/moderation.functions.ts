import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** AI check for abusive or anti-national text in any Indian language (incl. romanized). */
export const checkPostText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string }) => ({ text: String(input?.text ?? "").slice(0, 3000) }))
  .handler(async ({ data,context }) => {
    if (data.text.trim().length < 2) return { ok: true };
    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "You moderate posts on an Indian jobs/vehicle marketplace. Text may be in any Indian language (Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia, Urdu, Assamese, etc.), English, or romanized/mixed. Block ONLY if it contains abusive/vulgar words, sexual slurs, hate speech, or anti-national/terror/violence promotion. Normal job, vehicle, goods and service details are fine.",
        input: [{ role: "user", content: data.text }],
        text: { format: { type: "json_schema", name: "mod", strict: true, schema: { type: "object", additionalProperties: false, required: ["blocked"], properties: { blocked: { type: "boolean" } } } } },
      });
      let out = "";
      for (const item of res.output ?? []) if (item.type === "message") for (const c of item.content) if (c.type === "output_text") out += c.text;
      const blocked=JSON.parse(out || '{}') as {blocked?:boolean};
      if(blocked.blocked){const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const result=await supabaseAdmin.rpc('block_confirmed_content',{_user:context.userId,_reason:'నిషేధిత దూషణ లేదా హింస ప్రోత్సాహక విషయం · Prohibited abusive or violent content'});if(result.error)throw result.error;}
      return {ok:!blocked.blocked};
    } catch (e) {
      console.error("moderation failed", e);
      return { ok: false }; // Do not publish content if the moderation service is unavailable.
    }
  });
