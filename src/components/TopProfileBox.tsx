import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMe } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { AccountProfile } from '@/components/AccountProfile';
import { PhoneSignIn } from '@/components/PhoneSignIn';
import { PhoneNumberChange } from '@/components/PhoneNumberChange';
import { Button } from '@/components/ui/button';
import { useRouterState } from '@tanstack/react-router';
import { PROFILE_ACCESS_MESSAGE } from '@/lib/profile-access';
import { Prime99Payment } from '@/components/Prime99Payment';

export function useProfileAccess() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const { data: me, isLoading } = useMe();
  const access = useQuery({ queryKey: ['profile-access', me?.id], enabled: !!me, queryFn: async () => {
    const result = await supabase.rpc('my_profile_access_ready');
    if (result.error) throw result.error;
    return result.data;
  } });
  return { me, ready: hydrated && (!!me?.isAdmin || access.data === true), loading: !hydrated || isLoading || (!!me && access.isPending) };
}
export function TopProfileBox() {
  const { me, ready, loading } = useProfileAccess();
  return <section id="top-profile-box" className="space-y-3 border-y bg-background px-4 py-4 text-foreground" aria-label="పైన ప్రొఫైల్ బాక్స్">
    <h2 className="text-xl font-bold">{ready ? 'పేమెంట్ చేయండి / చందా పొందండి' : 'మీ పూర్తి వివరాలు'}</h2>
    {loading ? <p role="status">మీ వివరాలు చూస్తున్నాం…</p> : ready ? <Prime99Payment /> : <>
      <p className="text-lg">{PROFILE_ACCESS_MESSAGE}</p>
      {me ? <><AccountProfile completionOnly /><PhoneNumberChange currentPhone={me.profile?.phone ?? ''} verificationRequired /></> : <PhoneSignIn />}
    </>}
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