import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';

const FIELDS = [['hide_photo', 'నా ఫోటో'], ['hide_name', 'నా పేరు'], ['hide_phone', 'నా ఫోన్ నంబర్']] as const;

export function PrivacyToggles() {
  const { data: me } = useMe(); const qc = useQueryClient(); const [busy, setBusy] = useState(false);
  if (!me?.profile) return null;
  const profile = me.profile;
  const shownToOthers = (key: typeof FIELDS[number][0]) => Boolean(profile.public_bell_consent) && !profile[key];
  const toggle = async (key: typeof FIELDS[number][0]) => {
    if (busy) return; setBusy(true);
    // "Shown" means others really see it: consent given AND this item not hidden. Showing an item also gives consent.
    const show = !shownToOthers(key);
    if (show && !profile.public_bell_consent && !window.confirm('మీరు గంట కొట్టిన ప్రకటనల్లో ఇది అందరికీ చూపించాలా?')) { setBusy(false); return; }
    const changes: { hide_photo?: boolean; hide_name?: boolean; hide_phone?: boolean; public_bell_consent?: boolean } = {};
    if (show && !profile.public_bell_consent) {
      for (const [f] of FIELDS) changes[f] = f !== key;
      changes.public_bell_consent = true;
    } else {
      changes[key] = !show;
      if (show) changes.public_bell_consent = true;
    }
    const r = await supabase.from('profiles').update(changes).eq('id', me.id);
    setBusy(false);
    if (r.error) { toast.error('మార్పు భద్రపడలేదు; మళ్లీ ప్రయత్నించండి'); return; }
    await qc.invalidateQueries(); toast.success(show ? 'ఇప్పుడు ఇతరులకు కనబడుతుంది' : 'ఇప్పుడు అందరికీ దాచబడింది');
  };
  return <section data-subscription-exempt className="space-y-2 rounded-xl border p-3" aria-label="చూపించు / దాచు">
    <h3 className="text-lg font-bold">ఇతరులకు చూపించు / దాచు</h3>
    <label className="flex items-start gap-2 py-2"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={profile.public_bell_consent} disabled={busy} onChange={async e => {
      const consent = e.target.checked;
      if (consent && !window.confirm('మీరు గంట కొట్టిన ప్రకటనల్లో మీ ఫోటో, పేరు, ఫోన్ నంబర్ అందరికీ చూపించాలా? దాచిన వివరాలు బయట కనిపించవు.')) return;
      setBusy(true);
      const patch = consent
        ? { public_bell_consent: true }
        : { public_bell_consent: false, hide_photo: true, hide_name: true, hide_phone: true };
      const r = await supabase.from('profiles').update(patch).eq('id', me.id);
      setBusy(false);
      if (r.error) { toast.error('మార్పు భద్రపడలేదు'); return; }
      await qc.invalidateQueries();
    }} /><span>నేను గంట కొట్టిన ప్రకటనల్లో నా వివరాలు అందరికీ చూపించేందుకు అంగీకరిస్తున్నాను</span></label>
    {FIELDS.map(([key, label]) => { const hidden = !shownToOthers(key); return <div key={key} className="flex items-center justify-between gap-2">
      <span className="text-lg">{label}: <b>{hidden ? 'దాచారు' : 'కనబడుతుంది'}</b></span>
      <Button type="button" variant={hidden ? 'default' : 'outline'} disabled={busy} className="min-h-11" onClick={() => void toggle(key)}>{hidden ? <><Eye />చూపించు</> : <><EyeOff />దాచు</>}</Button>
    </div>; })}
  </section>;
}
