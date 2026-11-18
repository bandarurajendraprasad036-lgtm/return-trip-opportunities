import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveRecoveredPassword } from '@/lib/admin-auth';
import { useMe } from '@/lib/session';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'కొత్త పాస్‌వర్డ్ — గాయత్రి వన్ · Gayatri One' },
    { name: 'description', content: 'మీ ఖాతాకు కొత్త పాస్‌వర్డ్ పెట్టుకోండి.' },
    { property: 'og:title', content: 'కొత్త పాస్‌వర్డ్ — గాయత్రి వన్' },
    { property: 'og:description', content: 'మీ ఖాతాకు కొత్త పాస్‌వర్డ్ పెట్టుకోండి.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const recovery = params.get('type') === 'recovery';
    if (recovery) sessionStorage.setItem('gayatri-admin-recovery', 'pending');
    const { data } = supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') setReady(true); });
    const initialize = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const exchanged = await supabase.auth.exchangeCodeForSession(code);
        if (exchanged.error) { if (active) setMessage('లింక్ గడువు ముగిసింది లేదా ఇప్పటికే వాడారు. కొత్త లింక్ పొందండి.'); return; }
        sessionStorage.setItem('gayatri-admin-recovery', 'pending');
      }
      const user = await supabase.auth.getUser();
      if (active && !user.error && user.data.user && sessionStorage.getItem('gayatri-admin-recovery') === 'pending') setReady(true);
    };
    void initialize().catch(() => { if (active) setMessage('లింక్ తనిఖీ కాలేదు. కొత్త లింక్‌తో ప్రయత్నించండి.'); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <main className="mx-auto max-w-md space-y-4 p-6">
    <h1 className="text-2xl font-bold">కొత్త పాస్‌వర్డ్</h1>
    {!ready ? <p>ఈమెయిల్ లో వచ్చిన లింక్ నొక్కి ఈ పేజీకి రండి.</p> : <form className="space-y-3" onSubmit={async e => {
      e.preventDefault(); if (busy || password.length < 6) return;
      if (password !== confirmation) { setMessage('రెండుసార్లు ఒకే పాస్‌వర్డ్ ఇవ్వండి.'); return; }
      setBusy(true); setMessage('');
      try {
        await saveRecoveredPassword(password);
        sessionStorage.removeItem('gayatri-admin-recovery');
        setPassword(''); setConfirmation(''); setReady(false);
        setMessage('కొత్త పాస్‌వర్డ్ భద్రపడింది. అదే పాస్‌వర్డ్‌తో ప్రవేశం నిర్ధారించాం.');
      } catch { setMessage('కొత్త పాస్‌వర్డ్‌తో ప్రవేశం నిర్ధారణ కాలేదు. కొత్త లింక్ పొందండి.'); }
      finally { setBusy(false); }
    }}>
      <Label htmlFor="new-password">కొత్త పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు)</Label>
      <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required disabled={busy} />
      <Label htmlFor="confirm-password">మళ్లీ కొత్త పాస్‌వర్డ్</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} minLength={6} required disabled={busy} />
      <Button type="submit" className="w-full" disabled={busy || password.length < 6}>పాస్‌వర్డ్ మార్చండి</Button>
    </form>}
    {message && <p role="status">{message}</p>}
    {me?.isAdmin === true && <Button variant="outline" onClick={() => void navigate({ to: '/admin-login', replace: true })}>అడ్మిన్ ప్రవేశం</Button>}
  </main>;
}
