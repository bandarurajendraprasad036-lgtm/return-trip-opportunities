import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { useMe } from '@/lib/session';
import { supabase } from '@/integrations/supabase/client';
import { submitProgramEvidence } from '@/lib/program-evidence.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SHARE_IMAGES } from '@/lib/account-program';
import { artworkFileError } from '@/lib/upload-rules';

export function ProgramEvidence({ postId }: { postId?: string }) {
  const { data: me } = useMe(); const qc = useQueryClient(); const send = useServerFn(submitProgramEvidence);
  const [files, setFiles] = useState<File[]>([]), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const id = `program-evidence-${postId || 'account'}`;
  return <section className="space-y-3 border-y py-3"><h3 className="text-lg font-bold">ఉచిత సభ్యత్వం · Free subscription</h3>
    <p className="text-sm">సర్, డబ్బులు తీసుకోము. మా చిత్రాన్ని మీ స్థితి + 5 సమూహాల్లో పంచుకుని, ఆధార చిత్రాలు నిర్వాహక సంభాషణకు పంపండి. చిత్రాలు అందగానే ఉచిత సభ్యత్వం కొనసాగుతుంది. · Share our photo to status + 5 groups; upload screenshots for free membership.</p>
    <Label htmlFor={id}>స్థితి + 5 సమూహాల ఆధారాలు · Status + 5 groups screenshots</Label>
    <Input id={id} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { setFiles(Array.from(e.target.files || [])); setStatus(''); }} />
    <p className="text-xs text-muted-foreground">ఒక స్థితి చిత్రం, ఐదు సమూహాల చిత్రాలు; ఇతరుల వ్యక్తిగత వివరాలు కప్పండి. నిర్వాహకులకే వీక్షణ, 24 గంటల గడువు. · Six images, redact private information; admin-only, 24 hours.</p>
    <Button disabled={busy || files.length !== SHARE_IMAGES || !me} className="h-auto min-h-12 w-full whitespace-normal" onClick={async () => {
      if (!me || busy) return; const paths: string[] = []; setBusy(true); setStatus('');
      try {
        for (const file of files) {
          const error = artworkFileError(file); if (error) throw new Error(error);
          const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
          const path = `${me.id}/${crypto.randomUUID()}.${ext}`;
          const upload = await supabase.storage.from('sharing-evidence').upload(path, file, { contentType: file.type }); if (upload.error) throw upload.error; paths.push(path);
        }
        await send({ data: { paths, ...(postId ? { post: postId } : {}) } });
        setFiles([]); setStatus('చిత్రాలు అందాయి; ఉచిత సభ్యత్వం ప్రారంభమైంది · Screenshots received; free membership active'); await qc.invalidateQueries();
      } catch (e) { if (paths.length) await supabase.storage.from('sharing-evidence').remove(paths); toast.error(e instanceof Error ? e.message : 'పంపలేకపోయాం · Could not send'); }
      finally { setBusy(false); }
    }}>నిర్వాహక సంభాషణకు పంపండి · Send to admin</Button>
    {status && <p role="status">{status}</p>}
  </section>;
}