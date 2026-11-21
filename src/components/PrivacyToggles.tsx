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
  const toggle = async (key: typeof FIELDS[number][0]) => {
    if (busy) return; setBusy(true);
    const changes: { hide_photo?: boolean; hide_name?: boolean; hide_phone?: boolean } = {}; changes[key] = !profile[key];
    const r = await supabase.from('profiles').update(changes).eq('id', me.id);
    setBusy(false);
    if (r.error) { toast.error('మార్పు భద్రపడలేదు; మళ్లీ ప్రయత్నించండి'); return; }
    await qc.invalidateQueries(); toast.success(profile[key] ? 'ఇప్పుడు ఇతరులకు కనబడుతుంది' : 'ఇప్పుడు ఇతరులకు దాచబడింది');
  };
  return <section data-subscription-exempt className="space-y-2 rounded-xl border p-3" aria-label="చూపించు / దాచు">
    <h3 className="text-lg font-bold">ఇతరులకు చూపించు / దాచు</h3>
    <label className="flex items-start gap-2 py-2"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={profile.public_bell_consent} disabled={busy} onChange={async e => {
      const consent = e.target.checked;
      if (consent && !window.confirm('మీరు గంట కొట్టిన ప్రకటనల్లో మీ ఫోటో, పేరు, ఫోన్ నంబర్ అందరికీ చూపించాలా? దాచిన వివరాలు బయట కనిపించవు.')) return;
      setBusy(true);
      const r = await supabase.from('profiles').update({ public_bell_consent: consent }).eq('id', me.id);
      setBusy(false);
      if (r.error) { toast.error('మార్పు భద్రపడలేదు'); return; }
      await qc.invalidateQueries();
    }} /><span>నేను గంట కొట్టిన ప్రకటనల్లో నా వివరాలు అందరికీ చూపించేందుకు అంగీకరిస్తున్నాను</span></label>
    {FIELDS.map(([key, label]) => { const hidden = profile[key]; return <div key={key} className="flex items-center justify-between gap-2">
      <span className="text-lg">{label}: <b>{hidden ? 'దాచారు' : 'కనబడుతుంది'}</b></span>
      <Button type="button" variant={hidden ? 'default' : 'outline'} disabled={busy} className="min-h-11" onClick={() => void toggle(key)}>{hidden ? <><Eye />చూపించు</> : <><EyeOff />దాచు</>}</Button>
    </div>; })}
  </section>;
}
