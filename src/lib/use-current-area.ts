import { useCallback, useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { resolveCurrentArea } from './current-area.functions';
import { shouldResolveArea, type AreaResult, type PositionPoint } from './current-area';

export function useCurrentArea(userId?: string) {
  const resolve = useServerFn(resolveCurrentArea);
  const [area, setArea] = useState<AreaResult | null>(null);
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [restart, setRestart] = useState(0);
  const locate = useCallback(() => setRestart(n => n + 1), []);
  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;
  useEffect(() => {
    setArea(null);
    if (!userId) { setMessage('ప్రస్తుత ప్రాంతం కోసం ప్రవేశించండి · Sign in for current area'); setLocating(false); return; }
    if (!navigator.geolocation) { setMessage('ఈ పరికరంలో స్థానం అందుబాటులో లేదు · Location unavailable'); return; }
    let disposed = false;
    let watch: number | undefined;
    let previous: PositionPoint | null = null;
    let lastLookup = 0;
    let busy = false;
    let blocked = false;
    let cached: { point: PositionPoint; area: AreaResult | null }[] = [];
    setLocating(true);
    setMessage('మీ ప్రాంతం చూస్తున్నాం · Finding your area…');
    const stop = () => { if (watch !== undefined) navigator.geolocation.clearWatch(watch); watch = undefined; };
    const success = async (position: GeolocationPosition) => {
      if (disposed || busy || blocked || document.visibilityState !== 'visible') return;
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      const now = Date.now();
      if (!shouldResolveArea(previous, point, now - lastLookup)) return;
      previous = point; lastLookup = now; busy = true; setLocating(true);
      try {
        const hit = cached.find(item => !shouldResolveArea(item.point, point, 60000));
        const result = hit ? hit.area : await resolveRef.current({ data: point });
        if (disposed) return;
        if (!hit) cached = [...cached.slice(-19), { point, area: result }];
        setArea(result);
        setMessage(result ? '' : 'ప్రాంతం పేరు లేదా చిరునామా రాలేదు; ఊరి పేరు నమోదు చేయండి · No address found; enter place');
      } catch (error) {
        if (!disposed) { blocked = true; stop(); setMessage(`${error instanceof Error ? error.message : 'ప్రాంతం వివరాలు రాలేదు · Area lookup failed'}; ఊరి పేరు నమోదు చేయండి · Enter place manually`); }
      } finally { busy = false; if (!disposed) setLocating(false); }
    };
    const failure = (error: GeolocationPositionError) => {
      if (disposed) return;
      setLocating(false);
      setMessage(error.code === 1 ? 'స్థానానికి అనుమతి ఇవ్వండి లేదా ఊరి పేరు నమోదు చేయండి · Allow location or enter place' : 'స్థానం రాలేదు; ఊరి పేరు నమోదు చేయండి · Location unavailable; enter place');
      if (error.code === 1) stop();
    };
    const start = () => { if (watch === undefined && !blocked) watch = navigator.geolocation.watchPosition(success, failure, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); };
    const visible = () => { if (document.visibilityState === 'visible') start(); else stop(); };
    start(); document.addEventListener('visibilitychange', visible);
    return () => { disposed = true; stop(); document.removeEventListener('visibilitychange', visible); cached = []; };
  }, [userId, restart]);
  return { area, message, locating, locate };
}