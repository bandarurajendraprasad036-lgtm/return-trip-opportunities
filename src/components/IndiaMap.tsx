import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { areaMap } from '@/lib/area-map';

export function IndiaMap() {
  const map = areaMap();
  return <section className="space-y-3 py-3" aria-labelledby="india-map-heading">
    <h3 id="india-map-heading" className="home-section-title"><MapPin />భారతదేశం పటం · India map</h3>
    <iframe title="భారతదేశం పటం · India map" src={map.embed} width="100%" height="300" className="h-[300px] w-full border-0" loading="lazy" referrerPolicy="no-referrer" allowFullScreen />
    <Button asChild className="w-full whitespace-normal"><a href={map.directions} target="_blank" rel="noopener noreferrer"><Navigation />దారి చూపించండి · Get Directions</a></Button>
  </section>;
}