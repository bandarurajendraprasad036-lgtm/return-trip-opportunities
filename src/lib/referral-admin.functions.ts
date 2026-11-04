import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReferralRow = {
  referrer: string; referrer_phone: string; referrer_free_months: number; referrer_prime: boolean;
  new_user: string; new_phone: string; joined: string; new_paid: boolean;
};

async function loadRows(supabase: any): Promise<ReferralRow[]> {
  const { data: kids } = await supabase.from("profiles").select("id, full_name, phone, referred_by, referred_at").not("referred_by", "is", null).order("referred_at", { ascending: false }).limit(1000);
  const list = (kids ?? []) as { id: string; full_name: string; phone: string; referred_by: string; referred_at: string }[];
  const refIds = [...new Set(list.map((k) => k.referred_by))];
  const { data: refs } = refIds.length ? await supabase.from("profiles").select("id, full_name, phone, free_months, is_prime").in("id", refIds) : { data: [] };
  const { data: pays } = list.length ? await supabase.from("membership_payments").select("user_id").eq("status", "approved").in("user_id", list.map((k) => k.id)) : { data: [] };
  const paid = new Set(((pays ?? []) as { user_id: string }[]).map((p) => p.user_id));
  const rm = new Map(((refs ?? []) as { id: string; full_name: string; phone: string; free_months: number; is_prime: boolean }[]).map((r) => [r.id, r]));
  return list.map((k) => {
    const r = rm.get(k.referred_by);
    return { referrer: r?.full_name ?? "", referrer_phone: r?.phone ?? "", referrer_free_months: r?.free_months ?? 0, referrer_prime: !!r?.is_prime, new_user: k.full_name, new_phone: k.phone, joined: k.referred_at, new_paid: paid.has(k.id) };
  });
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Admin only");
}

export const listReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    return loadRows(context.supabase);
  });

export const askReferrals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { q: string }) => ({ q: String(i?.q ?? "").trim().slice(0, 500) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.q) throw new Error("ప్రశ్న రాయండి / Type a question");
    const rows = await loadRows(context.supabase);
    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    const now = new Date().toISOString().slice(0, 10);
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: `You answer the app admin's questions about referral records. Today is ${now}. Monthly target = 3 x days in month. Answer in the admin's language (Telugu first if Telugu), short, clear, with exact numbers computed only from this data. If the data cannot answer, say so.\nDATA (JSON): ${JSON.stringify(rows)}`,
      input: [{ role: "user", content: data.q }],
    });
    let out = "";
    for (const item of res.output ?? []) if (item.type === "message") for (const c of item.content) if (c.type === "output_text") out += c.text;
    return { answer: out.trim() || "జవాబు రాలేదు / No answer" };
  });
