import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { requireHomeBell } from '@/lib/home-bell';
import { BellBoardLink } from '@/components/BellBoardLink';
export function ServiceDirectory({ area = '', rung = true }: { area?: string; rung?: boolean } = {}) {
  return <section className="home-market-section" aria-labelledby="service-directory-title">
    <h2 id="service-directory-title" className="home-section-title">సేవలు అందించేవారు · Service providers</h2>
    <div className="grid grid-cols-2 gap-2">
      <div className="min-w-0 space-y-2"><Button asChild className="h-auto min-h-16 w-full whitespace-normal px-2"><Link to="/services" search={{ view: 'providers', area }} onClick={event => requireHomeBell(rung, event)}>నేను సర్వీస్ ప్రొవైడర్ ను</Link></Button><BellBoardLink section="service-providers" /></div>
      <div className="min-w-0 space-y-2"><Button asChild className="h-auto min-h-16 w-full whitespace-normal px-2"><Link to="/services" search={{ view: 'requests', area }} onClick={event => requireHomeBell(rung, event)}>నీడ్ సర్వీస్ ప్రొవైడర్స్</Link></Button><BellBoardLink section="service-wanted" /></div>
    </div>
  </section>;
}