import sharingImage from '@/assets/gayatri-one-sharing-final.jpg';
import { Download, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const qc = useQueryClient();
  const [resolvedCode, setResolvedCode] = useState<{ userId: string; code: string } | null>(null);
  const code = me?.profile?.referral_code || (resolvedCode?.userId === me?.id ? resolvedCode?.code : '') || '';
  const canPhoto = Boolean(program && !trialActive(program.completed_at));
  useEffect(() => {
    if (!me || code) return;
    let cancelled = false;
    void supabase.rpc('ensure_my_referral_code').then(result => {
      if (!cancelled && !result.error && result.data) {
        setResolvedCode({ userId: me.id, code: result.data });
        void qc.invalidateQueries({ queryKey: ['me'] });
      }
    });
    return () => { cancelled = true; };
  }, [me?.id, code, qc]);
  useEffect(() => {
    let cancelled = false;
    setPreview(''); canvas.current = null;
    const draw = async () => {
      if (!me || !code) return;
      const image = new Image(); image.src = sharingImage; await image.decode();
      const target = document.createElement('canvas'); target.width = image.naturalWidth; target.height = image.naturalHeight;
      const ctx = target.getContext('2d'); if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      if (code) {
        const theme = getComputedStyle(document.documentElement);
        ctx.fillStyle = theme.getPropertyValue('--gold').trim();
        const footerY = target.height * .88;
        const textWidth = target.width - 264;
        ctx.font = 'bold 54px sans-serif';
        const codeSize = Math.min(54, 54 * textWidth / ctx.measureText(code).width);
        ctx.font = `bold ${codeSize}px sans-serif`;
        ctx.fillText(code, 36, footerY + 8, textWidth);
        const url = referralLink(code);
        ctx.font = 'bold 26px sans-serif'; ctx.fillText('gayatrione.com', 36, footerY + 54, textWidth);
        ctx.font = '22px sans-serif'; ctx.fillText(`/?ref=${code}`, 36, footerY + 86, textWidth);
        const qr = document.createElement('canvas');
        const color = (token: string) => { const sample = document.createElement('canvas').getContext('2d'); if (!sample) return ''; sample.fillStyle = theme.getPropertyValue(token).trim(); sample.fillRect(0, 0, 1, 1); return '#' + Array.from(sample.getImageData(0, 0, 1, 1).data).slice(0, 3).map(value => value.toString(16).padStart(2, '0')).join(''); };
        await QRCode.toCanvas(qr, url, { width: 160, margin: 4, color: { dark: color('--royal'), light: color('--gold') } });
        ctx.drawImage(qr, target.width - 204, footerY - 38, 160, 160);
        if (canPhoto && photoConsent && me) {
          const profile = await getProfile({ data: { id: me.id } });
          if (profile?.photo) { const photo = new Image(); photo.crossOrigin = 'anonymous'; photo.src = profile.photo; await photo.decode(); ctx.drawImage(photo, target.width - 284, footerY + 50, 64, 64); }
          else toast.error('పంచుకునేందుకు అనుమతించిన పరిచయ ఫోటో లేదు · No published profile photo');
        }
      }
      if (!cancelled) { canvas.current = target; setPreview(target.toDataURL('image/jpeg', .92)); }
    };
    void draw().catch(() => { if (!cancelled) { setPreview(''); toast.error('వ్యక్తిగత చిత్రం తయారు కాలేదు · Could not generate personal image'); } });
    return () => { cancelled = true; };
  }, [code, canPhoto, photoConsent, me?.id]);
  const download = () => { if (!code || !preview || !canvas.current) return; const anchor = document.createElement('a'); anchor.href = preview; anchor.download = 'gayatri-one-sharing.jpg'; anchor.click(); };
  return <section className="space-y-3 border-t py-5"><h2 className="text-xl font-bold">పంచుకునే చిత్రం · Sharing image</h2>
    <img src={preview || sharingImage} alt="గాయత్రి వన్ పంచుకునే చిత్రం · Gayatri One sharing image" width={768} height={1280} className="h-auto w-full" loading="lazy" />
    {canPhoto && <label className="flex gap-2 text-sm"><input type="checkbox" checked={photoConsent} onChange={e => setPhotoConsent(e.target.checked)} />నా ప్రచురిత పరిచయ ఫోటోను ఈ చిత్రంలో పంచుకోవడానికి అనుమతిస్తున్నాను · Include my published photo</label>}
    <div className="flex gap-2"><Button disabled={!code || !preview} variant="outline" className="min-h-12 flex-1 whitespace-normal" onClick={download}><Download />చిత్రం తీసుకోండి · Download</Button><Button disabled={busy || !code || !preview} className="min-h-12 flex-1 whitespace-normal" onClick={async () => {
      setBusy(true);
      try {
        const target = canvas.current;
        if (!target) { download(); return; }
        const blob = await new Promise<Blob | null>(resolve => target.toBlob(resolve, 'image/jpeg', .92)); if (!blob) throw new Error();
        const file = new File([blob], 'gayatri-one-sharing.jpg', { type: 'image/jpeg' });
        const text = `నేను గాయత్రి వన్ లో చేరాను.. మీరు చేరండి\nలింక్: ${code ? referralLink(code) : 'https://gayatrione.com'}\nరిఫరల్ కోడ్: ${code}`;
        if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text, title: 'Gayatri One' });
        else { download(); window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); }
      } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) toast.error('పంచుకోలేకపోయాం · Could not share'); }
      finally { setBusy(false); }
    }}><Share2 />పంచుకోండి · Share</Button></div>
  </section>;
}
