import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Row = { user_id: string; name: string; region: string; joins: number; paid: number; percent: number; eligible: boolean };
export function AdminReferralEligibility() {
  const { data = [], isError, refetch } = useQuery({ queryKey: ['admin-ref-elig'], queryFn: async () => { const r = await supabase.rpc('admin_referral_eligibility'); if (r.error) throw r.error; return r.data as unknown as Row[]; } });
  const km = useQuery({ queryKey: ['nearby-km'], queryFn: async () => { const r = await supabase.from('app_settings').select('value').eq('key', 'nearby_vehicle_km').maybeSingle(); if (r.error) throw r.error; return r.data?.value ?? '7'; } });
  const [value, setValue] = useState('7');
  useEffect(() => { if (km.data) setValue(km.data); }, [km.data]);
  const save = async () => { const n = Number(value); if (!(n >= 0.5 && n <= 50)) { toast.error('0.5 నుండి 50 కి.మీ మధ్య'); return; } const r = await supabase.from('app_settings').upsert({ key: 'nearby_vehicle_km', value: String(n), updated_at: new Date().toISOString() }); if (r.error) toast.error('భద్రపడలేదు'); else { toast.success('దూరం భద్రపడింది'); void km.refetch(); } };
  return <section className="space-y-3 rounded-lg border p-3">
    <h2 className="text-xl font-bold text-primary">దగ్గరి వాహనాల గంట దూరం · Nearby bell distance</h2>
    <Label htmlFor="nearby-km">కిలోమీటర్లు · Kilometres (ఇప్పుడు 7, తర్వాత 1 లేదా 2)</Label>
    <div className="flex gap-2"><Input id="nearby-km" type="number" min="0.5" max="50" step="0.5" value={value} onChange={e => setValue(e.target.value)} /><Button onClick={() => void save()}>భద్రపరచు · Save</Button></div>
    <div className="flex gap-2">{['1', '2', '7'].map(v => <Button key={v} variant="outline" onClick={() => setValue(v)}>{v} కి.మీ</Button>)}</div>
    <h2 className="text-xl font-bold text-primary">పరిచయ అర్హత · Referral eligibility</h2>
    {isError && <Button variant="outline" onClick={() => void refetch()}>మళ్లీ · Retry</Button>}
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-primary"><th>పేరు</th><th>రాష్ట్రం</th><th>చేరికలు (OK)</th><th>చెల్లించినవి</th><th>%</th><th>అర్హత</th></tr></thead>
      <tbody>{data.map(r => <tr key={r.user_id} className="border-t"><td className="py-2">{r.name}</td><td>{r.region || '—'}</td><td>{r.joins}</td><td>{r.paid}</td><td>{r.percent}%</td><td className={r.eligible ? 'font-bold text-primary' : ''}>{r.eligible ? 'అర్హులు · Eligible' : 'అనర్హులు · Not eligible'}</td></tr>)}</tbody></table></div>
    {data.length === 0 && <p>ఇంకా చేరికలు లేవు · No joins yet</p>}
  </section>;
}
