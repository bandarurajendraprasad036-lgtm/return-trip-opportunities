import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
export function ServiceDirectory({ area = '' }: { area?: string } = {}) {
  return <section className="home-market-section" aria-labelledby="service-directory-title">
    <h2 id="service-directory-title" className="home-section-title">సేవలు అందించేవారు · Service providers</h2>
    <div className="grid grid-cols-2 gap-2">
      <Button asChild className="h-auto min-h-16 whitespace-normal px-2"><Link to="/services" search={{ view: 'providers', area }}>నేను సర్వీస్ ప్రొవైడర్ ను</Link></Button>
      <Button asChild className="h-auto min-h-16 whitespace-normal px-2"><Link to="/services" search={{ view: 'requests', area }}>నీడ్ సర్వీస్ ప్రొవైడర్స్</Link></Button>
    </div>
  </section>;
}