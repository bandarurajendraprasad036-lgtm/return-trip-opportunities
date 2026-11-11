import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const HELP = `Gayatri One (గాయత్రి వన్) help facts:
- Free app for jobs (seeker/employer), return-trip vehicles (owner/business) and local services.
- Login: use a phone code or Continue with Google. Phone-number changes request a verification code; older manually entered numbers may not be verified.
- Post: tap "Post" (పోస్ట్), choose type, fill details. Abusive or anti-national words are blocked.
- Job match = same location/area. Vehicle match = same From, To and date. Both sides get an alert.
- Area options per post: local, district, state, all India.
- Jobs and vehicle listing contact are available to signed-in active accounts. Cards and details never expose private identities. Requests are not confirmed bookings.
- Each user has a unique referral code/link. New campaign joins count only direct invitations; no multi-level cash commission. Confirmed received payments earn the direct inviter a 20 percent cash prize balance, not an automatic bank payout. Top 100 ranking gives VIP eligibility, with event details to be announced in fifteen days. Do not describe any retired membership, prices, points or free-month offers.
- My posts page: close or delete your posts. Notifications page shows matches.
- Install the app from the home page "Install" button.`;

export const sendSupportMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { adminId: string; body: string }) => ({
    adminId: String(i?.adminId ?? ""),
    body: String(i?.body ?? "").trim().slice(0, 1000),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.body) throw new Error("Empty");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.adminId, _role: "admin" });
    if (!isAdmin || data.adminId === userId) {
      await supabase.from("messages").insert({ sender_id: userId, receiver_id: data.adminId, body: data.body });
      return { ok: true };
    }
    const { data: hist } = await supabase.from("messages").select("sender_id, body")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${data.adminId}),and(sender_id.eq.${data.adminId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: false }).limit(8);

    const { data: posts } = await supabase.from("posts")
      .select("user_id, module, kind, title, location, district, state, skill, salary, category, from_place, to_place, trip_date, vehicle_type, goods_type, service_type")
      .eq("status", "active").neq("user_id", userId).order("created_at", { ascending: false }).limit(80);
    const listing = (posts ?? []).map((p) => {
      const where = p.module === "vehicle" ? `${p.from_place ?? ""} -> ${p.to_place ?? ""} on ${p.trip_date ?? ""}` : [p.location, p.district, p.state].filter(Boolean).join(", ");
      const what = [p.title, p.skill, p.salary, p.category, p.vehicle_type, p.goods_type, p.service_type].filter(Boolean).join(" | ");
      return `- [${p.module}/${p.kind}] ${what} @ ${where} `;
    }).join("\n");
    let reply = "";
    let handoff = false;
    try {
      const { generateResponse } = await import("@lovable.dev/ai-gateway");
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `You are the Gayatri One support assistant replying on behalf of admin. Reply in the user's language, Telugu first, short and simple. STRICT PRIVACY: never reveal site statistics or private names, phones or identities. Answer only what is asked using these facts:\n${HELP}\nCurrent active posts:\n${listing || "(none)"}\nList matching posts with place/date and tell the user to tap contact; never output direct chat URLs or user IDs. Never invent posts. Set handoff=true for money, payment or uncertain questions.`,
        input: [
          ...((hist ?? []).reverse().map((m) => ({ role: (m.sender_id === userId ? "user" : "assistant") as "user" | "assistant", content: m.body }))),
          { role: "user", content: data.body },
        ],
        text: { format: { type: "json_schema", name: "support", strict: true, schema: { type: "object", additionalProperties: false, required: ["reply", "handoff"], properties: { reply: { type: "string" }, handoff: { type: "boolean" } } } } },
      });
      let out = "";
      for (const item of res.output ?? []) if (item.type === "message") for (const c of item.content) if (c.type === "output_text") out += c.text;
      const p = JSON.parse(out || "{}") as { reply?: string; handoff?: boolean };
      reply = String(p.reply ?? "").slice(0, 1500);
      handoff = !!p.handoff;
    } catch (e) {
      console.error("support AI failed", e);
      handoff = true;
      reply = "మీ ప్రశ్న అడ్మిన్‌కు పంపాము, త్వరలో జవాబు ఇస్తారు · Sent to admin, they will reply soon.";
    }

    const { error } = await supabase.from("messages").insert({ sender_id: userId, receiver_id: data.adminId, body: data.body, needs_admin: handoff });
    if (error) throw new Error(error.message);
    if (reply) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      try { await supabaseAdmin.from("messages").insert({ sender_id: data.adminId, receiver_id: userId, body: `🤖 ${reply}`, is_auto: true }); } catch (e) { console.error(e); }
    }
    return { ok: true };
  });
