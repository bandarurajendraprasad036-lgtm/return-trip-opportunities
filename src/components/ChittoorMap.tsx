import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChittoorMap() {
  return (
    <section className="home-market-section space-y-3" aria-labelledby="chittoor-map-heading">
      <h2 id="chittoor-map-heading" className="home-section-title"><MapPin />చిత్తూరు పటం · Chittoor map</h2>
      <p className="break-words text-base">చిరునామా · Address: చిత్తూరు, ఆంధ్రప్రదేశ్, భారతదేశం · Chittoor, Andhra Pradesh, India</p>
      <iframe
        title="చిత్తూరు పటం · Chittoor map"
        src="https://maps.google.com/maps?q=Chittoor%2C%20Andhra%20Pradesh%2C%20India&z=13&output=embed"
        className="h-72 w-full rounded-md border border-gold"
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
      <Button asChild className="w-full whitespace-normal">
        <a href="https://www.google.com/maps/dir/?api=1&destination=Chittoor%2C%20Andhra%20Pradesh%2C%20India" target="_blank" rel="noopener noreferrer"><Navigation />దారి చూపించండి · Get Directions</a>
      </Button>
    </section>
  );
}