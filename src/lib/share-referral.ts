import sharingImage from '@/assets/gayatri-one-sharing-clean.jpg';

/** Shares referral text together with the site's referral image; falls back to WhatsApp text when the phone cannot share files. */
export async function shareReferralWithImage(text: string) {
  try {
    const personal = document.querySelector<HTMLImageElement>('img[data-referral-share]')?.src;
    const blob = await (await fetch(personal || sharingImage)).blob();
    const file = new File([blob], 'gayatri-one-referral.jpg', { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text, title: 'Gayatri One' }); return; }
  } catch (error) { if ((error as Error)?.name === 'AbortError') return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}
