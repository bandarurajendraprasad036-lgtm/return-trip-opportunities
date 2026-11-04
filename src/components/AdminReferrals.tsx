import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listReferrals, askReferrals } from "@/lib/referral-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminReferrals() {
  const list = useServerFn(listReferrals);
  const ask = useServerFn(askReferrals);
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["admin-referrals"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setAns("");
    try { setAns((await ask({ data: { q } })).answer); }
    catch (err) { toast.error(err instanceof Error ? err.message : "AI failed"); }
    finally { setBusy(false); }
  };

  return (
    <section className="space-y-3 rounded-xl bg-card p-4 shadow-card">
      <h3 className="text-xl font-bold">🎁 రిఫరల్ జాబితా · Referrals</h3>
      <form onSubmit={submit} className="space-y-2">
        <Input className="h-12 text-lg" value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder="ఉదా: ఈ నెల ఎవరు ఎక్కువ చేర్పించారు?" />
        <Button type="submit" size="lg" className="w-full" disabled={busy || !q.trim()}>{busy ? "..." : "🤖 AI ని అడగండి · Ask AI"}</Button>
      </form>
      {ans && <p className="whitespace-pre-wrap rounded-lg border bg-muted p-3 text-base">{ans}</p>}
      {isLoading ? <p>...</p> : rows.length === 0 ? <p className="text-muted-foreground">ఇంకా రిఫరల్స్ లేవు · No referrals yet</p> : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="rounded-lg border p-3 text-sm">
              <p><b>{r.referrer || "?"}</b> ({r.referrer_phone}) → <b>{r.new_user || "?"}</b> ({r.new_phone})</p>
              <p className="text-muted-foreground">{new Date(r.joined).toLocaleDateString("en-IN")}</p>
              <p>కొత్త యూజర్ ₹499: {r.new_paid ? "✅ చెల్లించారు" : "❌ లేదు"} · ఉచిత నెలలు: <b>{r.referrer_free_months}</b></p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
