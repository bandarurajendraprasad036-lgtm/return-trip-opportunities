import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { Prime99Payment } from '@/components/Prime99Payment';
import { PaymentScanner } from '@/components/PaymentScanner';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { useMe } from '@/lib/session';

export const Route = createFileRoute('/payment')({
  head: () => ({ meta: [
    { title: '₹100 మూడు నెలల చందా — గాయత్రి వన్' },
    { name: 'description', content: 'గాయత్రి వన్ మూడు నెలల చందా ₹100. చెల్లింపు చిత్రాన్ని పంపి నిర్వాహకుల ఆమోదం పొందండి.' },
    { property: 'og:title', content: 'గాయత్రి వన్ — ₹100 మూడు నెలల చందా' },
    { property: 'og:description', content: 'గంట, వ్యక్తిగత సంభాషణ కోసం ₹100 మూడు నెలల చందా.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Payment,
});
function Payment() {
  const { data: me, isPending } = useMe();
  return <AppShell><section className="space-y-4 p-4"><h1 className="text-2xl font-bold">₹100కు మూడు నెలల చందా</h1>{isPending ? <p>వివరాలు వస్తున్నాయి…</p> : me ? <Prime99Payment bellPayment /> : <><PaymentScanner /><GoogleSignIn returnTo="/payment" /></>}</section></AppShell>;
}