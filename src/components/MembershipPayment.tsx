import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { AdminChatButton } from '@/components/AdminChatButton';
import { MEMBERSHIP_AMOUNT, GROUP_MEMBERSHIP_AMOUNT, membershipAmount, paymentInput } from "@/lib/membership";
import qr from "@/assets/gayatri-bank-qr.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccountProgram } from '@/lib/use-account-program';
import { trialActive } from '@/lib/account-program';

export function MembershipPayment() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data: program } = useAccountProgram(me?.id);
  const free = !program || trialActive(program.completed_at) || program.sharing_active || Boolean(program.referral_free_until && Date.parse(program.referral_free_until)>Date.now());
  const [transaction, setTransaction] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<'individual' | 'group'>('individual');
  const [members, setMembers] = useState(['', '', '']);
  const amount = membershipAmount(plan);
  const payments = useQuery({ queryKey: ["my-payments", me?.id], enabled: !!me, refetchInterval: 15000, queryFn: async () => {
    if (!me) return [];
    const { data, error } = await supabase.from("membership_payments").select("id,transaction_id,amount,status,admin_note,created_at").eq("user_id", me.id).order("created_at", { ascending: false }).limit(10);
    if (error) throw error;
    return data ?? [];
  }});
  const pending = payments.data?.some(payment => payment.status === "pending");
  return <section className="space-y-4 border-y py-4" aria-label="సభ్యత్వ చెల్లింపు">
    <h2 className="text-xl font-bold">సభ్యత్వ చెల్లింపు · Membership payment</h2>
    <div className="space-y-3 bg-royal px-4 py-5 text-on-royal">
      <div className="flex items-center gap-2 text-gold"><BadgeCheck className="size-6" /><h3 className="text-xl font-bold">మీ అవకాశాలకు ప్రాధాన్యం · Prime membership</h3></div>
      <p className="text-2xl font-bold text-gold">ఒక్కరికి ₹{MEMBERSHIP_AMOUNT} / నెల · Individual</p>
      
      <p className="text-base">సరకు వాహన వివరాలు, గంట, సంభాషణకు మాత్రమే నెలకు ₹699. ఉద్యోగాలు, కార్ల సంభాషణ, అన్ని వాహన ప్రకటనలు ఉచితం. · ₹699 monthly for goods details, bells and chat only; jobs, car chat and all vehicle posts are free.</p>
      <ul className="space-y-3 text-sm"><li className="flex gap-2"><Bell className="size-5 shrink-0 text-gold" />సరకు వాహన వివరాలు, గంట, వ్యక్తిగత సంభాషణ · Goods details, bells and private chat</li><li className="flex gap-2"><BadgeCheck className="size-5 shrink-0 text-gold" />చెల్లింపు ఆమోదించిన తరువాతే · After payment approval</li></ul>
      <p className="text-xs text-on-royal/80">ఉద్యోగం లేదా వాహనం దొరుకుతుందని హామీ కాదు · No job or vehicle booking guarantee.</p>
    </div>
    {free && <p role="status">పది రోజుల ఉచిత కాలంలో చెల్లింపు అవసరం లేదు; ఆధారాలు పంపిన వారికి ఉచిత సభ్యత్వం కొనసాగుతుంది. · No payment during trial; sharing membership remains free.</p>}
    {!pending && !free && <form className="space-y-3" onSubmit={async event => {
      event.preventDefault();
      if (!me) return;
      const selectedPlan = plan;
      const input = paymentInput.safeParse({ transaction_id: transaction, membership_type: selectedPlan, referral_numbers: selectedPlan === 'group' ? members.map(number => number.trim()) : [] });
      if (!input.success) { toast.error(input.error.issues[0]?.message); return; }
      setBusy(true);
      try {
        const { error } = await supabase.from("membership_payments").insert({ ...input.data, user_id: me.id, amount: membershipAmount(selectedPlan), status: "pending" });
        if (error) throw error;
        setTransaction("");
        await qc.invalidateQueries({ queryKey: ["my-payments"] });
        toast.success("కార్యాలయ పరిశీలనకు పంపాము · Submitted for review");
      } catch { toast.error("వివరాలు నమోదు కాలేదు; ఈ లావాదేవీ ఇప్పటికే నమోదు అయిందేమో చూసి మళ్లీ ప్రయత్నించండి · Could not submit"); }
      finally { setBusy(false); }
    }}>
      <p className="text-lg font-bold">₹{MEMBERSHIP_AMOUNT} / నెల · month</p>
      <img src={qr.url} alt="సభ్యత్వ చెల్లింపు బ్యాంకు గుర్తు · Bank payment QR" width={300} height={300} className="mx-auto w-full max-w-64 object-contain" />
      <Label htmlFor="payment-transaction">లావాదేవీ సంఖ్య · Transaction ID</Label>
      <Input id="payment-transaction" value={transaction} onChange={event => setTransaction(event.target.value)} maxLength={64} required className="h-12 text-lg" />
      <p className="text-sm text-muted-foreground">చెల్లింపు చేసిన తరువాత వివరాలు ఇవ్వండి. కార్యాలయం నిర్ధారించిన తరువాతే సభ్యత్వం అమలవుతుంది. · Membership starts after payment approval.</p>
      <Button className="h-auto min-h-12 w-full whitespace-normal py-3" disabled={busy || payments.isLoading || payments.isError} type="submit">{busy ? "పంపుతున్నాము…" : "పరిశీలనకు పంపండి · Submit for review"}</Button>
    </form>}
    {payments.isError && <div role="alert"><p>చెల్లింపు వివరాలు రాలేదు · Could not load payments</p><Button variant="outline" onClick={() => payments.refetch()}>మళ్లీ చూడండి · Retry</Button></div>}
    {payments.data?.map(payment => <article key={payment.id} className="space-y-2 border-b py-3 last:border-0">
      <p className="font-bold" role="status">{payment.status === "pending" ? "కార్యాలయ పరిశీలనలో ఉంది · Under review" : payment.status === "approved" ? "చెల్లింపు ఆమోదించబడింది · Approved" : "చెల్లింపు ఆమోదించలేదు · Rejected"}</p>
      <p className="break-all text-sm">₹{payment.amount} · {payment.transaction_id}</p>
      {payment.admin_note && <p className="text-sm">{payment.admin_note}</p>}
      <AdminChatButton />
    </article>)}
  </section>;
}