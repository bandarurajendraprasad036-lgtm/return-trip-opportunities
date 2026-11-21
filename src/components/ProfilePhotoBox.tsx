import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { SignedImg } from '@/components/SignedImg';

// Round photo box; + opens the phone's own choice of camera or gallery. Tapping again replaces the photo.
export function ProfilePhotoBox() {
  const { data: me } = useMe(); const qc = useQueryClient(); const input = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false);
  if (!me?.profile) return null;
  const path = me.profile.photo_path ?? '';
  const upload = async (file: File | undefined) => {
    if (!file || busy) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error('ఫోటో 5MB లోపు JPG / PNG ఉండాలి'); return; }
    setBusy(true);
    try {
      const next = `${me.id}/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'}`;
      const up = await supabase.storage.from('profile-photos').upload(next, file, { contentType: file.type });
      if (up.error) throw up.error;
      const saved = await supabase.from('profiles').update({ photo_path: next }).eq('id', me.id);
      if (saved.error) throw saved.error;
      if (path) await supabase.storage.from('profile-photos').remove([path]);
      await qc.invalidateQueries(); toast.success('ఫోటో పెట్టారు');
    } catch { toast.error('ఫోటో పెట్టలేదు; మళ్లీ ప్రయత్నించండి'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <div data-subscription-exempt className="flex flex-col items-center gap-1">
    <button type="button" disabled={busy} onClick={() => input.current?.click()} aria-label={path ? 'ఫోటో మార్చండి' : 'ఫోటో పెట్టండి'} className="relative flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-primary bg-card">
      {path ? <SignedImg src={path} className="size-full object-cover" /> : <Plus className="size-12 text-primary" />}
      {path && <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus className="size-5" /></span>}
    </button>
    <span className="text-sm">{busy ? 'పెడుతున్నాం…' : path ? 'మార్చడానికి + నొక్కండి' : 'ఫోటో పెట్టడానికి + నొక్కండి'}</span>
    <input ref={input} type="file" accept="image/*" className="hidden" onChange={e => void upload(e.target.files?.[0])} />
  </div>;
}
