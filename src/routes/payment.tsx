import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { Prime99Payment } from '@/components/Prime99Payment';
import { PaymentScanner } from '@/components/PaymentScanner';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { useMe } from '@/lib/session';

export const Route = createFileRoute('/payment')({
  head: () => ({ meta: [
    { title: 'చాట్, గంట చందాలు — గాయత్రి వన్' },
    { name: 'description', content: 'మూడు నెలల చాట్ చందా ₹100; గంట, కాల్స్ మరియు అనుమతించిన వివరాలకు ₹349. నిర్వాహకుల ఆమోదం అవసరం.' },
    { property: 'og:title', content: 'గాయత్రి వన్ — చందా వివరాలు' },
    { property: 'og:description', content: '₹100 చాట్ మాత్రమే; ₹349 చాట్, గంట, కాల్స్. దాచిన వివరాలు చూపించము.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Payment,
});
function Payment() {
  const { data: me, isPending } = useMe();
  return <AppShell><section className="space-y-4 p-4"><h1 className="text-2xl font-bold">చందా వివరాలు</h1>{isPending ? <p>వివరాలు వస్తున్నాయి…</p> : <><Prime99Payment />{!me && <GoogleSignIn returnTo="/payment" />}</>}</section></AppShell>;
}