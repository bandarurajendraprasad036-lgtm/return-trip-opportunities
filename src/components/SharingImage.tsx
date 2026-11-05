import sharingImage from '@/assets/gayatri-monthly-membership.jpg';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SharingImage() {
  return <section className="space-y-3 border-t py-5">
    <h2 className="text-xl font-bold">పంచుకునే చిత్రం · Sharing image</h2>
    <img src={sharingImage} alt="గాయత్రి వన్: ఒక్కరికి నెలకు ₹699, నలుగురికి నెలకు ₹1,999 · Monthly membership prices" width={768} height={1024} className="h-auto w-full" loading="lazy" />
    <Button asChild variant="outline" className="h-auto min-h-12 w-full whitespace-normal py-3"><a href={sharingImage} download="gayatri-one-membership.jpg" target="_blank" rel="noreferrer"><Download />చిత్రం తీసుకోండి · Download image</a></Button>
  </section>;
}