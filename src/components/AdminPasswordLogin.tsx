import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { phoneToEmail } from '@/lib/match';
import { adminSignInError, signInAdministrator } from '@/lib/admin-auth';
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
    <p>మీ పాత నిర్వాహక ఖాతా ఈమెయిల్ లేదా మొబైల్ నంబరు, ఆ ఖాతా రహస్య పదం ఇవ్వండి.</p>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setError('');
      try {
        const email = /^[6-9]\d{9}$/.test(identity.trim()) ? phoneToEmail(identity) : identity.trim();
        await qc.cancelQueries(); qc.clear();
        await signInAdministrator(email, password);
        setPassword('');
        await qc.invalidateQueries(); await navigate({ to: '/admin', replace: true });
      } catch (cause) { setError(adminSignInError(cause)); } finally { setBusy(false); }
    }}>
      <Label htmlFor="admin-identity">అడ్మిన్ ఈమెయిల్ / మొబైల్ నంబర్</Label><Input id="admin-identity" autoComplete="username" value={identity} onChange={e => setIdentity(e.target.value)} required disabled={busy}/>
      <Label htmlFor="admin-password">పాస్‌వర్డ్</Label><Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy}/>
      <Button type="submit" disabled={busy} className="w-full">అడ్మిన్ ప్రవేశం</Button>{error && <p role="alert" className="text-destructive">{error}</p>}
    </form>
    <ForgotPassword /></section>;
}
function ForgotPassword() {
  const [open, setOpen] = useState(false); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  if (!open) return <Button type="button" variant="link" className="w-full" onClick={() => setOpen(true)}>పాస్‌వర్డ్ మర్చిపోయారా?</Button>;
  return <form className="space-y-2 rounded-md border p-3" onSubmit={async e => {
    e.preventDefault(); if (busy) return; setBusy(true); setMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
      setMsg(error ? 'లింక్ పంపలేకపోయాం. ఈమెయిల్ సరిచూసి మళ్లీ ప్రయత్నించండి.' : 'ఈమెయిల్‌లో చివరిగా వచ్చిన లింక్ మాత్రమే తెరవండి. అక్కడ కొత్త పాస్‌వర్డ్ రాసి మార్చండి బటన్ నొక్కండి.');
    } catch { setMsg('లింక్ పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.'); } finally { setBusy(false); }
  }}>
    <Label htmlFor="reset-email">అడ్మిన్ ఈమెయిల్</Label><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
    <Button type="submit" className="w-full" disabled={busy}>పాస్‌వర్డ్ మార్చే లింక్ పంపండి</Button>{msg && <p role="status">{msg}</p>}
  </form>;
}
