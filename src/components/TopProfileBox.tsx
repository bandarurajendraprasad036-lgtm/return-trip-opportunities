import { useEffect, useState } from 'react';
import { ScanLine, Plus, UserRound } from 'lucide-react';
import { useMe } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { AccountProfile } from '@/components/AccountProfile';
import { PhoneSignIn } from '@/components/PhoneSignIn';
import { PhoneNumberChange } from '@/components/PhoneNumberChange';
import { Button } from '@/components/ui/button';
import { useRouterState } from '@tanstack/react-router';
import { PROFILE_ACCESS_MESSAGE } from '@/lib/profile-access';
import { Prime99Payment } from '@/components/Prime99Payment';
import { AdminChatButton } from '@/components/AdminChatButton';

export function useProfileAccess() {
  const { data: me } = useMe();
  return { me, ready: true, loading: false };
}

export function TopProfileBox({ compact = false }: { compact?: boolean }) {
  const { me, ready, loading } = useProfileAccess();
  const [selected, setSelected] = useState<'payment' | 'profile' | null>(null);

  if (!compact) return <section id="top-profile-box" className="space-y-3 border-y bg-background px-4 py-4 text-foreground" aria-label="పైన ప్రొఫైల్ బాక్స్">
    <h2 className="text-xl font-bold">{ready ? 'పేమెంట్ చేయండి / చందా పొందండి' : 'మీ పూర్తి వివరాలు'}</h2>
    {loading ? <p role="status">మీ వివరాలు చూస్తున్నాం…</p> : ready ? <Prime99Payment /> : <>
      <p className="text-lg">{PROFILE_ACCESS_MESSAGE}</p>
      {me ? <><AccountProfile completionOnly /><PhoneNumberChange currentPhone={me.profile?.phone ?? ''} verificationRequired /></> : <PhoneSignIn />}
    </>}
  </section>;

  const open = selected;
  return <section id="top-profile-box" className="space-y-3 border-y bg-background px-3 py-3 text-foreground" aria-label="చెల్లింపు మరియు ప్రొఫైల్">
    <div className="grid grid-cols-2 gap-3">
      <Button type="button" variant={open === 'payment' ? 'default' : 'outline'} className="h-auto min-h-24 flex-col gap-1 whitespace-normal py-3 text-lg" aria-expanded={open === 'payment'} aria-controls="home-payment-details" onClick={() => setSelected(open === 'payment' ? null : 'payment')}><ScanLine className="size-6" /><span>స్కానర్</span><span className="text-base">నింపండి</span></Button>
      <Button type="button" variant={open === 'profile' ? 'default' : 'outline'} className="h-auto min-h-24 flex-col gap-1 whitespace-normal py-3 text-lg" aria-expanded={open === 'profile'} aria-controls="home-profile-details" onClick={() => setSelected(open === 'profile' ? null : 'profile')}><UserRound className="size-6" /><span>మీ వివరాలు</span><span className="text-base">నింపండి</span></Button>
    </div>
    {open !== 'payment' && <Button type="button" variant="outline" className="h-auto min-h-20 w-full justify-start gap-3 whitespace-normal border-2 border-primary px-3 py-3 text-left text-lg" aria-controls="home-payment-details" onClick={() => setSelected('payment')}><Plus className="size-9 shrink-0" /><span className="min-w-0 break-words"><span className="block">మీ పేమెంట్ స్కానర్ స్క్రీన్ షాట్ అటాచ్ చేయండి</span><span className="mt-1 block text-base">నింపండి</span></span></Button>}
    {open === 'payment' && <div id="home-payment-details"><Prime99Payment compact />{!loading && !me && <PhoneSignIn />}</div>}
    {open === 'profile' && <div id="home-profile-details">
      {me && <div className="mb-3"><AdminChatButton /></div>}
      <p className="mb-3 text-lg">{PROFILE_ACCESS_MESSAGE}</p>
      {loading ? <p role="status">మీ వివరాలు చూస్తున్నాం…</p> : me ? <>
        {!ready && <p className="mb-3 text-lg">{PROFILE_ACCESS_MESSAGE}</p>}
        <AccountProfile completionOnly={!ready} />
        {!ready && <PhoneNumberChange currentPhone={me.profile?.phone ?? ''} verificationRequired />}
      </> : <PhoneSignIn />}
    </div>}
  </section>;
}

export function GuestCategories() {
  const [requested, setRequested] = useState(false);
  return <section className="space-y-3 px-4 py-4" aria-label="బయటి వర్గాలు"><div className="grid grid-cols-2 gap-3">{['వాహనాలు', 'ఉద్యోగాలు', 'షాప్', 'వ్యాపారం', 'సేవలు'].map(label => <Button key={label} variant="outline" className="min-h-16 whitespace-normal text-lg" onClick={() => { setRequested(true); document.getElementById('top-profile-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{label}</Button>)}</div>{requested && <p role="alert" className="text-lg">పైన ఉన్న ప్రొఫైల్ బాక్స్ ఫిలప్ చేయండి</p>}</section>;
}

export function ProfileAccessGate({ children }: { children: React.ReactNode }) {
  const { ready, loading } = useProfileAccess();
  const pathname = useRouterState({ select: state => state.location.pathname });
  const excluded = ['/', '/admin-login', '/admin', '/reset-password', '/auth', '/auth/callback', '/~oauth/initiate'];
  if (excluded.includes(pathname) || ready) return children;
  if (loading) return <main className="p-6" role="status">మీ వివరాలు చూస్తున్నాం…</main>;
  return <main className="mx-auto min-h-screen max-w-md bg-background"><TopProfileBox /><GuestCategories /></main>;
    }
