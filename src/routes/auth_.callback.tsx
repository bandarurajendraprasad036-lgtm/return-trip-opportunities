import { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

// Public return page for Google sign-in; navigates only after the session exists.
export const Route = createFileRoute('/auth_/callback')({
  head: () => ({ meta: [
    { title: 'ప్రవేశిస్తున్నాం — గాయత్రి వన్ · Gayatri One' },
    { name: 'description', content: 'గూగుల్ ప్రవేశం పూర్తవుతోంది.' },
    { property: 'og:title', content: 'ప్రవేశిస్తున్నాం — గాయత్రి వన్' },
    { property: 'og:description', content: 'గూగుల్ ప్రవేశం పూర్తవుతోంది.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let done = false;
    const stored = sessionStorage.getItem('gayatri-auth-destination');
    const to = stored === '/admin-login' ? '/admin-login' : '/feed';
    const go = () => { if (done) return; done = true; sessionStorage.removeItem('gayatri-auth-destination'); void navigate({ to, replace: true }); };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session) go(); });
    void supabase.auth.getSession().then(({ data }) => { if (data.session) go(); });
    const timer = setTimeout(() => { if (!done) setFailed(true); }, 12000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, [navigate]);
  return <main className="mx-auto max-w-md space-y-4 p-6 text-center text-lg">
    {failed ? <><p role="alert">ప్రవేశం పూర్తి కాలేదు. మళ్లీ ప్రయత్నించండి.</p><Link to="/auth" className="text-primary underline">ప్రవేశ పేజీ</Link></> : <p role="status">ప్రవేశిస్తున్నాం…</p>}
  </main>;
}
