import { useEffect, useState } from 'react';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { HOME_SETTINGS_KEY, useHomeSettings, type HomeSettings } from '@/lib/home-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_authenticated/admin-settings')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: admin } = user ? await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }) : { data: false };
    if (!user || !admin) throw redirect({ to: '/admin-login', replace: true });
  },
  head: () => ({
    meta: [
      { title: 'అడ్మిన్ సెట్టింగులు · Admin Settings — గాయత్రి వన్ · Gayatri One' },
      { name: 'description', content: 'Manage public home locations and visible sections in గాయత్రి వన్ · Gayatri One.' },
      { property: 'og:title', content: 'Admin Settings — గాయత్రి వన్ · Gayatri One' },
      { property: 'og:description', content: 'Manage public home locations and visible sections.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: AdminSettings,
});

const toggles: { key: keyof Pick<HomeSettings, 'showAdminChat' | 'showLocation' | 'showVehicles' | 'showJobs' | 'showServices' | 'showSharing'>; label: string }[] = [
  { key: 'showAdminChat', label: 'అడ్మిన్ చాట్ పెట్టె · Admin chat box' },
  { key: 'showLocation', label: 'స్థానం మార్పు పెట్టె · Location box' },
  { key: 'showVehicles', label: 'వాహన ఎంపికలు · Vehicle choices' },
  { key: 'showJobs', label: 'పనుల పెట్టెలు · Job boxes' },
  { key: 'showServices', label: 'సేవల జాబితా · Services' },
  { key: 'showSharing', label: 'పంచుకునే చిత్రం · Sharing image' },
];

function AdminSettings() {
  const { data, isPending, isError } = useHomeSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HomeSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [eventLabel, setEventLabel] = useState('డిసెంబర్ 31');
  useEffect(() => { if (data) setForm(data); }, [data]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || busy) return;
    setBusy(true);
    const { error } = await supabase.from('app_settings').upsert({ key: HOME_SETTINGS_KEY, value: JSON.stringify(form), updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { toast.error('సెట్టింగులు భద్రపడలేదు · Settings not saved'); return; }
    await queryClient.invalidateQueries({ queryKey: ['home-settings'] });
    toast.success('సెట్టింగులు భద్రపడ్డాయి · Settings saved');
  };
  return <div className="space-y-4 p-4">
    <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">అడ్మిన్ సెట్టింగులు · Settings</h2><Button asChild variant="outline"><Link to="/admin">డాష్‌బోర్డు · Dashboard</Link></Button></div>
    {isPending && <p role="status">సెట్టింగులు వస్తున్నాయి · Loading</p>}
    {isError && <p role="alert">సెట్టింగులు రాలేదు · Could not load settings</p>}
    {form && <form className="space-y-4" onSubmit={save}>
      <section className="space-y-3 rounded-xl border bg-card p-4"><h3 className="text-xl font-bold">ముఖపు ప్రారంభ స్థానాలు · Home locations</h3>
        <div><Label htmlFor="setting-from">నుండి · From</Label><Input id="setting-from" value={form.fromLocation} maxLength={80} onChange={event => setForm({ ...form, fromLocation: event.target.value })} className="h-12" /></div>
        <div><Label htmlFor="setting-to">వరకు · To</Label><Input id="setting-to" value={form.toLocation} maxLength={80} onChange={event => setForm({ ...form, toLocation: event.target.value })} className="h-12" /></div>
      </section>
      <section className="space-y-2 rounded-xl border bg-card p-4"><h3 className="text-xl font-bold">ఏ పెట్టెలు చూపించాలి · Visible boxes</h3>{toggles.map(toggle => <label key={toggle.key} className="flex min-h-12 items-center gap-3 border-b py-2 last:border-0"><input type="checkbox" className="size-6 shrink-0" checked={form[toggle.key]} onChange={event => setForm({ ...form, [toggle.key]: event.target.checked })} /><span>{toggle.label}</span></label>)}</section>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? 'భద్రపరుస్తున్నాం…' : 'సెట్టింగులు భద్రపరచండి · Save settings'}</Button>
    </form>}
    <section className="space-y-3 border-y py-4"><Label htmlFor="event-label">వేడుక తేదీ / సందర్భం · Event date</Label><Input id="event-label" value={eventLabel} maxLength={80} onChange={e => setEventLabel(e.target.value)} /><Button disabled={busy || !eventLabel.trim()} onClick={async () => { setBusy(true); const result = await supabase.rpc('configure_referral_event', { _label: eventLabel.trim() }); setBusy(false); if (result.error) toast.error('వేడుక తేదీ భద్రపడలేదు.'); else toast.success('వేడుక తేదీ భద్రపడింది.'); }}>వేడుక తేదీ భద్రపరచండి · Save event date</Button><p>పూర్తి వివరాలు మరో పదిహేను రోజుల్లో తెలియజేస్తాం.</p></section>
  </div>;
}
