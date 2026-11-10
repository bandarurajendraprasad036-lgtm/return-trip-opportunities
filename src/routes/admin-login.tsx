import { useEffect } from 'react';
import { ClientOnly, createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/Brand';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { PhoneSignIn } from '@/components/PhoneSignIn';
import { DesignFooter } from '@/components/DesignFooter';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { clearAccountSession } from '@/lib/sign-out';

export const Route = createFileRoute('/admin-login')({
  head: () => ({
    meta: [
      { title: 'అడ్మిన్ ప్రవేశం · Admin Login — గాయత్రి వన్ · Gayatri One' },
      { name: 'description', content: 'Separate administrator sign-in for గాయత్రి వన్ · Gayatri One; admin role required.' },
      { property: 'og:title', content: 'Admin Login — గాయత్రి వన్ · Gayatri One' },
      { property: 'og:description', content: 'Separate administrator sign-in; admin role required.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const { data: me, isLoading } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (me?.isAdmin) void navigate({ to: '/admin', replace: true });
  }, [me?.isAdmin, navigate]);
  return <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
    <header className="bg-royal px-5 py-8 text-on-royal"><h1 className="text-3xl font-bold"><Brand /></h1><p className="mt-3 flex items-center gap-2 text-lg"><ShieldCheck />అడ్మిన్ ప్రవేశం · Admin login</p></header>
    <main className="flex-1 space-y-5 px-5 py-6">
      <ClientOnly fallback={<p role="status">అనుమతి చూస్తున్నాం · Checking access</p>}>
      {isLoading && <p role="status">అనుమతి చూస్తున్నాం · Checking access</p>}
      {!isLoading && me && !me.isAdmin && <section className="space-y-3 rounded-xl border p-4" role="alert"><h2 className="text-xl font-bold">అడ్మిన్ అనుమతి లేదు · Admin access required</h2><p>ఈ ఖాతాతో అడ్మిన్ డాష్‌బోర్డు తెరవలేరు. అడ్మిన్ ఖాతాకు మారండి.</p><Button variant="outline" className="w-full" onClick={async () => { await clearAccountSession(queryClient); await navigate({ to: '/admin-login', replace: true }); }}>ఖాతా మార్చండి · Switch account</Button></section>}
      {!me && <><PhoneSignIn destination="/admin-login" /><GoogleSignIn destination="/admin-login" redirectPath="/admin-login" /></>}
      </ClientOnly>
      <Link to="/" className="block py-3 text-center text-primary underline">ముఖపు పేజీ · Home</Link>
    </main>
    <DesignFooter />
  </div>;
}
