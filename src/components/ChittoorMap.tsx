import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { areaMap } from '@/lib/area-map';

export function AreaMap({ from = '', to = '', id }: { from?: string; to?: string; id: string }) {
  const map = areaMap(from, to);
  return (
    <section className="space-y-3 py-3" aria-labelledby={id}>
      <h3 id={id} className="home-section-title"><MapPin />ప్రాంతం / మార్గం పటం · Area / route map</h3>
      <p className="break-words text-base">ప్రాంతం / మార్గం · Area / route: {map.label}</p>
      <iframe
        title={`ప్రాంతం పటం · Map: ${map.label}`}
        src={map.embed}
        className="h-72 w-full rounded-md border border-gold"
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
      {map.directions && <Button asChild className="w-full whitespace-normal">
        <a href={map.directions} target="_blank" rel="noopener noreferrer"><Navigation />దారి చూపించండి · Get Directions</a>
      </Button>}
    </section>
  );
}