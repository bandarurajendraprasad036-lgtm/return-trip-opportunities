import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AiMatch = { id: string; reason: string };

export const findAiMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string }) => {
    const text = String(input?.text ?? "").trim();
    if (text.length < 3 || text.length > 1000) throw new Error("Please describe your need (3-1000 letters).");
    return { text };
  })
  .handler(async ({ data, context }) => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const { data: posts, error } = await context.supabase
      .from("posts")
      .select("id,module,kind,title,location,skill,salary,from_place,to_place,trip_date,vehicle_type,goods_type,description")
      .eq("status", "active")
      .neq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(150);
    if (error) throw new Error("Could not load posts");
    if (!posts?.length) return { matches: [] as AiMatch[] };

    const compact = posts.map((p) => Object.fromEntries(Object.entries(p).filter(([, v]) => v != null && v !== "")));
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "You match village users in Andhra Pradesh/Telangana to job or return-trip posts. The user may write in Telugu or English. Job seekers match employer posts; employers match job seekers; vehicle owners with empty trips match businesses needing vehicles and vice versa. Consider place names (including Telugu spellings), dates, skills and vehicle/goods types. Return up to 8 best post ids. Write each reason as short Telugu then English, e.g. 'గుంటూరులో డ్రైవర్ పని · Driver job in Guntur'.",
        input: [
          { role: "user", content: `User need: ${data.text}\n\nPosts JSON:\n${JSON.stringify(compact)}\n\nReturn JSON.` },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "matches",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["matches"],
              properties: {
                matches: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "reason"],
                    properties: { id: { type: "string" }, reason: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      });
      let out = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") out += c.text;
      }
      const parsed = JSON.parse(out || "{}") as { matches?: AiMatch[] };
      const ids = new Set(posts.map((p) => p.id));
      return { matches: (parsed.matches ?? []).filter((m) => ids.has(m.id)) };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("AI match failed", e.code, e.ids);
        if (e.code === "rate_limited") throw new Error("Too many requests, try again in a minute.");
        if (e.code === "payment_required") throw new Error("AI credits finished. Please contact admin.");
      }
      console.error(e);
      throw new Error("AI search failed. Please try again.");
    }
  });
