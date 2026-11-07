import sharingImage from '@/assets/gayatri-one-sharing-final.jpg';
import { Download, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { useAccountProgram } from '@/lib/use-account-program';
import { referralLink, trialActive } from '@/lib/account-program';
import { getServiceProfile } from '@/lib/service-profile.functions';

export function SharingImage() {
  const { data: me } = useMe(); const { data: program } = useAccountProgram(me?.id);
  const [preview, setPreview] = useState(''), [busy, setBusy] = useState(false), [photoConsent, setPhotoConsent] = useState(false);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const getProfile = useServerFn(getServiceProfile);
  const code = me?.profile?.referral_code || '';
  const canPhoto = Boolean(program && !trialActive(program.completed_at));
  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      const image = new Image(); image.src = sharingImage; await image.decode();
      const target = document.createElement('canvas'); target.width = image.naturalWidth; target.height = image.naturalHeight;
      const ctx = target.getContext('2d'); if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      if (code) {
        const theme = getComputedStyle(document.documentElement);
        ctx.fillStyle = theme.getPropertyValue('--gold').trim();
        const footerY = target.height * .88;
        ctx.font = 'bold 32px sans-serif'; ctx.fillText(`Ref: ${code}`, 36, footerY, target.width - 240);
        const url = referralLink(code);
        ctx.font = '20px sans-serif'; ctx.fillText(url, 36, footerY + 50, target.width - 240);
        const qr = document.createElement('canvas');
        await QRCode.toCanvas(qr, url, { width: 140, margin: 2, color: { dark: theme.getPropertyValue('--royal').trim(), light: theme.getPropertyValue('--gold').trim() } });
        ctx.drawImage(qr, target.width - 188, footerY - 38, 140, 140);
        if (canPhoto && photoConsent && me) {
          const profile = await getProfile({ data: { id: me.id } });
          if (profile?.photo) { const photo = new Image(); photo.crossOrigin = 'anonymous'; photo.src = profile.photo; await photo.decode(); ctx.drawImage(photo, 36, footerY + 65, 64, 64); }
          else toast.error('పంచుకునేందుకు అనుమతించిన పరిచయ ఫోటో లేదు · No published profile photo');
        }
      }
      if (!cancelled) { canvas.current = target; setPreview(target.toDataURL('image/jpeg', .92)); }
    };
    void draw().catch(() => { if (!cancelled) { setPreview(''); toast.error('వ్యక్తిగత చిత్రం తయారు కాలేదు · Could not generate personal image'); } });
    return () => { cancelled = true; };
  }, [code, canPhoto, photoConsent, me?.id]);
  const download = () => { const anchor = document.createElement('a'); anchor.href = preview || sharingImage; anchor.download = 'gayatri-one-sharing.jpg'; anchor.click(); };
  return <section className="space-y-3 border-t py-5"><h2 className="text-xl font-bold">పంచుకునే చిత్రం · Sharing image</h2>
    <img src={preview || sharingImage} alt="గాయత్రి వన్ పంచుకునే చిత్రం · Gayatri One sharing image" width={768} height={1366} className="h-auto w-full" loading="lazy" />
    {canPhoto && <label className="flex gap-2 text-sm"><input type="checkbox" checked={photoConsent} onChange={e => setPhotoConsent(e.target.checked)} />నా ప్రచురిత పరిచయ ఫోటోను ఈ చిత్రంలో పంచుకోవడానికి అనుమతిస్తున్నాను · Include my published photo</label>}
    <div className="flex gap-2"><Button variant="outline" className="min-h-12 flex-1 whitespace-normal" onClick={download}><Download />చిత్రం తీసుకోండి · Download</Button><Button disabled={busy || Boolean(code && !preview)} className="min-h-12 flex-1 whitespace-normal" onClick={async () => {
      setBusy(true);
      try {
        const target = canvas.current;
        if (!target) { download(); return; }
        const blob = await new Promise<Blob | null>(resolve => target.toBlob(resolve, 'image/jpeg', .92)); if (!blob) throw new Error();
        const file = new File([blob], 'gayatri-one-sharing.jpg', { type: 'image/jpeg' });
        const text = `గాయత్రి వన్ — స్థితి + 5 సమూహాల్లో పంచుకోండి. ${code ? referralLink(code) : 'https://gayatrione.com'}`;
        if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text, title: 'Gayatri One' });
        else { download(); window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); }
      } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) toast.error('పంచుకోలేకపోయాం · Could not share'); }
      finally { setBusy(false); }
    }}><Share2 />పంచుకోండి · Share</Button></div>
  </section>;
}
