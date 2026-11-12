import { useEffect, useState } from 'react';
import { publicationRemaining } from '@/lib/current-membership';
export function PublicationCountdown({ visibleAfter }: { visibleAfter: string }) {
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  if (!now) return null;
  const remaining = publicationRemaining(visibleAfter, now);
  return <p role="status" className="py-2 font-semibold">{remaining ? `ప్రదర్శనకు ఇంకా ${Math.floor(remaining / 3600)}:${String(Math.floor(remaining % 3600 / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}` : 'ప్రదర్శన సమయం వచ్చింది; తాజా జాబితాలో చూడండి'}</p>;
}