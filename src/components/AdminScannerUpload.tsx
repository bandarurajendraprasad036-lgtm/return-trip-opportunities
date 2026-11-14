import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PaymentScanner, PAYMENT_SCANNER_SETTING } from '@/components/PaymentScanner';

async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const scale = Math.min(1, 900 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally { URL.revokeObjectURL(url); }
}

export function AdminScannerUpload() {
  const input = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const qc = useQueryClient();
  return <section className="space-y-3 rounded-xl border-2 border-primary bg-card p-3">
    <h3 className="text-xl font-bold">అడ్మిన్ స్కానర్ సెండ్ చేయండి</h3>
    <p>మీ UPI స్కానర్ ఫోటో పెట్టండి. అది వాడుకరుల పేమెంట్ పేజీలో కనిపిస్తుంది.</p>
    <Button type="button" className="h-auto min-h-14 w-full whitespace-normal" disabled={busy} onClick={() => input.current?.click()}><Plus />{busy ? 'పంపుతున్నాం…' : 'స్కానర్ ఫోటో ఎంచుకోండి'}</Button>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="స్కానర్ ఫోటో" onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; setBusy(true);
      try {
        const value = await shrink(file);
        const { error } = await supabase.from('app_settings').upsert({ key: PAYMENT_SCANNER_SETTING, value, updated_at: new Date().toISOString() });
        if (error) throw error; await qc.invalidateQueries({ queryKey: ['payment-scanner-image'] }); toast.success('స్కానర్ పెట్టాం');
      } catch { toast.error('స్కానర్ పెట్టలేకపోయాం; మళ్లీ ప్రయత్నించండి'); } finally { setBusy(false); }
    }} />
    <PaymentScanner />
  </section>;
}

// Shows a "new payment" alert while any screenshot waits for admin approval.
export function AdminNewPaymentAlert() {
  const { data: count = 0 } = useQuery({ queryKey: ['admin-pending-payments'], refetchInterval: 10000, queryFn: async () => { const r = await supabase.from('membership_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'); if (r.error) throw r.error; return r.count ?? 0; } });
  const seen = useRef(-1);
  useEffect(() => { if (seen.current >= 0 && count > seen.current) toast.info('కొత్త పేమెంట్ వచ్చింది'); seen.current = count; }, [count]);
  if (!count) return null;
  return <Button className="h-auto min-h-16 w-full whitespace-normal text-lg" onClick={() => document.getElementById('admin-pending-payments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><Bell />కొత్త పేమెంట్ వచ్చింది ({count}) — చూడండి</Button>;
}
