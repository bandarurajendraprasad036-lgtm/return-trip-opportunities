import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminPayments() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const payments = useQuery({ queryKey: ["admin-payments"], refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await supabase.from("membership_payments").select("id,transaction_id,amount,status,user_id,created_at").eq("status", "pending").order("created_at");
    if (error) throw error;
    return data ?? [];
  }});
  const review = async (id: string, approve: boolean) => {
    if (approve && !window.confirm("బ్యాంకులో చెల్లింపు అందిందని నిర్ధారించారా? · Have you verified receipt in the bank?")) return;
    setBusy(true);
    const { error } = await supabase.rpc("review_membership", { _id: id, _approve: approve, _note: approve ? "కార్యాలయం చెల్లింపును నిర్ధారించింది" : "కార్యాలయం చెల్లింపును ఆమోదించలేదు" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["admin-payments"] });
    await qc.invalidateQueries({ queryKey: ["my-payments"] });
    await qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("పరిశీలన నమోదు అయింది · Review saved");
  };
  return <section className="space-y-3 border-y py-4"><h3 className="text-xl font-bold">చెల్లింపుల పరిశీలన · Payment review</h3>
    {payments.isError && <Button onClick={() => payments.refetch()}>మళ్లీ చూడండి · Retry</Button>}
    {payments.data?.length === 0 && <p>పరిశీలనకు చెల్లింపులు లేవు · No pending payments</p>}
    {payments.data?.map(payment => <article key={payment.id} className="space-y-2 border-b py-3"><p className="break-all">₹{payment.amount} · {payment.transaction_id}</p><p className="break-all text-xs">{payment.id}</p><div className="flex gap-2"><Button disabled={busy} onClick={() => review(payment.id, true)}>ఆమోదించు · Approve</Button><Button variant="outline" disabled={busy} onClick={() => review(payment.id, false)}>తిరస్కరించు · Reject</Button></div></article>)}
  </section>;
}