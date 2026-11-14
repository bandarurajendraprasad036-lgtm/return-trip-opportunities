import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { phoneToEmail } from '@/lib/match';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminPasswordLogin() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient(); const navigate = useNavigate();
  return <section className="space-y-3 border-y py-4"><h2 className="text-xl font-bold">పాస్‌వర్డ్ తో అడ్మిన్ ప్రవేశం</h2>
    <p>మీ అడ్మిన్ ఖాతా ఈమెయిల్ లేదా పాత మొబైల్ నంబర్, ఆ ఖాతా పాస్‌వర్డ్ ఇవ్వండి. పాస్‌వర్డ్ లేకపోతే కింద గూగుల్ తో ప్రవేశించండి.</p>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setError('');
      try {
        const email = /^[6-9]\d{9}$/.test(identity.trim()) ? phoneToEmail(identity) : identity.trim();
        const result = await supabase.auth.signInWithPassword({ email, password });
        setPassword('');
        if (result.error || !result.data.user) { setError('ఈమెయిల్ లేదా పాస్‌వర్డ్ సరికాలేదు'); return; }
        const role = await supabase.rpc('has_role', { _user_id: result.data.user.id, _role: 'admin' });
        if (role.error || !role.data) { await supabase.auth.signOut(); qc.clear(); setError('ఈ ఖాతాకు అడ్మిన్ అనుమతి లేదు'); return; }
        await qc.invalidateQueries(); await navigate({ to: '/admin', replace: true });
      } catch { setError('ప్రవేశించలేకపోయాం. మళ్లీ ప్రయత్నించండి'); } finally { setBusy(false); }
    }}>
      <Label htmlFor="admin-identity">అడ్మిన్ ఈమెయిల్ / మొబైల్ నంబర్</Label><Input id="admin-identity" autoComplete="username" value={identity} onChange={e => setIdentity(e.target.value)} required disabled={busy}/>
      <Label htmlFor="admin-password">పాస్‌వర్డ్</Label><Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy}/>
      <Button type="submit" disabled={busy} className="w-full">అడ్మిన్ ప్రవేశం</Button>{error && <p role="alert" className="text-destructive">{error}</p>}
    </form>
    <ForgotPassword /></section>;
}
function ForgotPassword() {
  const [open, setOpen] = useState(false); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  if (!open) return <button type="button" className="block w-full py-2 text-center text-primary underline" onClick={() => setOpen(true)}>పాస్‌వర్డ్ మర్చిపోయారా? · Forgot password</button>;
  return <form className="space-y-2 rounded-md border p-3" onSubmit={async e => {
    e.preventDefault(); if (busy) return; setBusy(true); setMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false); setMsg(error ? 'లింక్ పంపలేకపోయాం. ఈమెయిల్ సరిచూసి మళ్లీ ప్రయత్నించండి.' : 'ఈ ఈమెయిల్ కు ఖాతా ఉంటే, పాస్‌వర్డ్ మార్చే లింక్ పంపాం. ఈమెయిల్ చూడండి.');
  }}>
    <Label htmlFor="reset-email">అడ్మిన్ ఈమెయిల్</Label><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
    <Button type="submit" className="w-full" disabled={busy}>పాస్‌వర్డ్ మార్చే లింక్ పంపండి</Button>{msg && <p role="status">{msg}</p>}
  </form>;
}
