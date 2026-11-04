import sharingImage from '@/assets/gayatri-one-sharing-english.png.asset.json';
import { Link } from '@tanstack/react-router';
import { Download, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SharingImage() {
  return <section className="space-y-3 border-t py-5">
    <h2 className="text-xl font-bold">పంచుకునే చిత్రం · Sharing image</h2>
    <img src={sharingImage.url} alt="గాయత్రి వన్ పంచుకునే చిత్రం · Gayatri One sharing image" width={768} height={1376} className="h-auto w-full" loading="lazy" />
    <Button asChild variant="outline" className="h-auto min-h-12 w-full whitespace-normal py-3"><a href={sharingImage.url} download="gayatri-one.png" target="_blank" rel="noreferrer"><Download />చిత్రం తీసుకోండి · Download image</a></Button>
    <Button asChild className="h-auto min-h-12 w-full whitespace-normal py-3"><Link to="/service-profile"><UserRound />నా పరిచయ వివరాలు · My profile details</Link></Button>
  </section>;
}