import { SharingImage } from '@/components/SharingImage';

export function PostingLimitShare() {
  return <section data-subscription-exempt className="space-y-3 border-y py-4" aria-label="చిత్రం పంచుకోండి">
    <h2 className="text-xl font-bold">ప్రకటనల పరిమితి పూర్తయింది · చిత్రం పంచుకోండి</h2>
    <SharingImage />
  </section>;
}