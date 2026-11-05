import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Coordinates } from '@/lib/india-places';
import { approximateDistanceKm, routeRadiusKm } from '@/lib/route-radius';

export function RoutePointPicker({ from, to, onFrom, onTo, disabled }: { from: Coordinates | null; to: Coordinates | null; onFrom: (p: Coordinates) => void; onTo: (p: Coordinates) => void; disabled?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  const [target, setTarget] = useState<'from' | 'to'>('from');
  const [failed, setFailed] = useState(false);
  const current = useRef({ from, to, onFrom, onTo, target, disabled });
  current.current = { from, to, onFrom, onTo, target, disabled };
  const mapRef = useRef<import('leaflet').Map | null>(null);
  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    void import('leaflet').then(L => {
      if (cancelled || !host.current) return;
      const map = L.map(host.current).setView([22.5, 79], 5);
      mapRef.current = map;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).on('tileerror', () => setFailed(true)).addTo(map);
      const marker = L.marker([22.5, 79], { icon: L.divIcon({ className: 'route-point-marker', html: '●', iconSize: [24, 24] }) });
      map.on('click', (event: import('leaflet').LeafletMouseEvent) => {
        if (current.current.disabled) return;
        const point = { latitude: event.latlng.lat, longitude: event.latlng.lng };
        marker.setLatLng(event.latlng).addTo(map);
        if (current.current.target === 'from') { current.current.onFrom(point); setTarget('to'); } else current.current.onTo(point);
      });
    }).catch(() => setFailed(true));
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [opened]);
  useEffect(() => { const point = target === 'from' ? from : to; if (point) mapRef.current?.setView([point.latitude, point.longitude], 12); }, [from, to, target]);
  const distance = from && to ? approximateDistanceKm(from, to) : null;
  return <div className="space-y-2">
    <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpened(v => !v)} className="w-full whitespace-normal"><MapPin />పటంలో స్థానాలు · Select on map</Button>
    {opened && <><div className="grid grid-cols-2 gap-2"><Button type="button" disabled={disabled} aria-pressed={target === 'from'} variant={target === 'from' ? 'default' : 'outline'} onClick={() => setTarget('from')}>నుండి · From</Button><Button type="button" disabled={disabled} aria-pressed={target === 'to'} variant={target === 'to' ? 'default' : 'outline'} onClick={() => setTarget('to')}>వరకు · To</Button></div><div ref={host} aria-label="మార్గపు స్థానాల పటం · Route point map" className="relative z-0 h-80 w-full" />{failed && <p role="alert">పటం పూర్తిగా రాలేదు; ప్రాంత జాబితా వాడవచ్చు · Map unavailable; use place list</p>}</>}
    <p className="text-sm">నుండి · From: {from ? `${from.latitude.toFixed(4)}, ${from.longitude.toFixed(4)}` : '—'}; వరకు · To: {to ? `${to.latitude.toFixed(4)}, ${to.longitude.toFixed(4)}` : '—'}</p>
    {distance !== null && <p className="text-sm">నేరుగా ఉజ్జాయింపు దూరం · Straight-line estimate: {distance.toFixed(1)} కి.మీ.; 20% పరిధి · radius: {routeRadiusKm(distance)?.toFixed(1)} కి.మీ. రోడ్డు దూరం కాదు · Not road distance.</p>}
  </div>;
}