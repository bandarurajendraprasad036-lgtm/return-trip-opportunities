import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) setReady(true);
    const { data } = supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  return <main className="mx-auto max-w-md space-y-4 p-6">
    <h1 className="text-2xl font-bold">కొత్త పాస్‌వర్డ్</h1>
    {!ready ? <p>ఈమెయిల్ లో వచ్చిన లింక్ నొక్కి ఈ పేజీకి రండి.</p> : <form className="space-y-3" onSubmit={async e => {
      e.preventDefault(); if (busy || password.length < 6) return; setBusy(true); setMessage('');
      const { error } = await supabase.auth.updateUser({ password });
      setBusy(false);
      if (error) { setMessage('పాస్‌వర్డ్ మారలేదు. మళ్లీ ప్రయత్నించండి.'); return; }
      setPassword(''); setMessage('పాస్‌వర్డ్ మారింది.'); await navigate({ to: '/admin-login', replace: true });
    }}>
      <Label htmlFor="new-password">కొత్త పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు)</Label>
      <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required disabled={busy} />
      <Button type="submit" className="w-full" disabled={busy || password.length < 6}>పాస్‌వర్డ్ మార్చండి</Button>
    </form>}
    {message && <p role="status">{message}</p>}
  </main>;
}
