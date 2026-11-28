import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { hasValidMobile } from '@/lib/phone';
import { useMe } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Shown after Google entry when the profile has no mobile number yet.
export function AskMobileNumber() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  if (!me || me.profile?.phone) return null;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidMobile(phone) || busy) { setMsg('సరైన 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి'); return; }
    setBusy(true); setMsg('');
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('NO_USER');
      const free = await supabase.rpc('check_my_new_mobile', { _phone: phone });
      if (free.error || !free.data) { setMsg(free.error?.message.includes('MOBILE_ALREADY_REGISTERED') ? 'ఈ నంబర్ ఇంకో ఖాతాలో ఉంది. వేరే నంబర్ ఇవ్వండి' : 'నంబర్ భద్రపరచలేకపోయాం. మళ్లీ ప్రయత్నించండి'); return; }
      const saved = await supabase.from('profiles').update({ phone }).eq('id', data.user.id).select('phone').single();
      if (saved.error) throw saved.error;
      if (saved.data.phone !== phone) throw new Error('PHONE_NOT_SAVED');
      await qc.invalidateQueries();
      setMsg('మొబైల్ నంబర్ సేవ్ అయింది');
    } catch { setMsg('సేవ్ కాలేదు. మళ్ళీ ప్రయత్నించండి'); }
    finally { setBusy(false); }
  };
  return <form onSubmit={save} className="space-y-2 rounded-lg border-2 border-primary p-3">
    <Label htmlFor="ask-mobile" className="text-lg font-bold">మీ మొబైల్ నంబర్ ఇవ్వండి</Label>
    <Input id="ask-mobile" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setMsg(''); }} placeholder="10 అంకెల నంబర్" className="h-12 text-lg" />
    <Button type="submit" className="min-h-12 w-full text-lg" disabled={busy}>{busy ? 'వేచి ఉండండి…' : 'సేవ్ చేయండి'}</Button>
    {msg && <p role="status" className="text-base">{msg}</p>}
  </form>;
}
