import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { managedBrokerReturn } from '@/lib/auth-navigation';

// Managed hosting intercepts this path. External hosting needs this public bridge.
export const Route = createFileRoute('/~oauth/initiate')({
  head: () => ({ meta: [
    { title: 'గూగుల్ ప్రవేశం — గాయత్రి వన్' },
    { name: 'description', content: 'గాయత్రి వన్ గూగుల్ ప్రవేశ పేజీ.' },
    { property: 'og:title', content: 'గూగుల్ ప్రవేశం — గాయత్రి వన్' },
    { property: 'og:description', content: 'గాయత్రి వన్ గూగుల్ ప్రవేశ పేజీ.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: BrokerBridge,
});

function BrokerBridge() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const target = managedBrokerReturn(window.location.search, window.location.origin);
    if (target) window.location.replace(target);
    else setFailed(true);
  }, []);
  return <main className="mx-auto max-w-md space-y-4 p-6 text-center text-lg">
    {failed ? <><p role="alert">ప్రవేశం పూర్తి కాలేదు. మళ్లీ ప్రయత్నించండి.</p><Link to="/auth" className="text-primary underline">ప్రవేశ పేజీ</Link></> : <p role="status">గూగుల్ ప్రవేశం తెరుస్తున్నాం…</p>}
  </main>;
}