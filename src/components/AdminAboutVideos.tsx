import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { aboutVideoSource, parseAboutVideos, type AboutVideo } from '@/lib/about-videos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminAboutVideos() {
  const qc = useQueryClient();
  const [url, setUrl] = useState(''); const [title, setTitle] = useState(''); const [busy, setBusy] = useState(false);
  const settings = useQuery({ queryKey: ['setting', 'youtube_url'], queryFn: async () => {
    const result = await supabase.from('app_settings').select('value').eq('key', 'youtube_url').maybeSingle();
    if (result.error) throw result.error;
    return result.data?.value ?? '';
  } });
  const rows = parseAboutVideos(settings.data ?? '');
  async function save(next: AboutVideo[]) {
    if (busy || settings.isPending || settings.isError) return;
    setBusy(true);
    try {
      const role = await supabase.auth.getUser();
      if (!role.data.user) throw new Error('AUTH');
      const allowed = await supabase.rpc('has_role', { _user_id: role.data.user.id, _role: 'admin' });
      if (allowed.error || allowed.data !== true) throw new Error('ADMIN');
      const result = await supabase.from('app_settings').upsert({ key: 'youtube_url', value: JSON.stringify(next), updated_at: new Date().toISOString() }).select('key');
      if (result.error || !result.data?.length) throw new Error('SAVE');
      await qc.invalidateQueries({ queryKey: ['setting', 'youtube_url'] });
      setUrl(''); setTitle(''); toast.success('వీడియోల మార్పు భద్రపరిచాం.');
    } catch { toast.error('వీడియోల మార్పు భద్రపడలేదు. మళ్లీ ప్రయత్నించండి.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 border-y py-4" aria-label="నిర్వాహకుల వీడియోలు">
    <h2 className="text-xl font-bold">మా గురించి వీడియోలు</h2>
    {settings.isError && <p role="alert">వీడియోల వివరాలు రాలేదు.</p>}
    {rows.map((row, index) => <div key={row.url} className="flex min-w-0 items-center gap-2 border-b py-2"><p translate="no" className="min-w-0 flex-1 break-words">{row.title || 'గాయత్రి వన్ గురించి'}</p><Button variant="outline" size="icon" aria-label="వీడియో తొలగించండి" title="వీడియో తొలగించండి" disabled={busy} onClick={() => { if (window.confirm('ఈ వీడియో తొలగించాలా?')) void save(rows.filter((_, i) => i !== index)); }}><Trash2 /></Button></div>)}
    <form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      const source = aboutVideoSource(url.trim());
      if (!source) { toast.error('సరైన వీడియో చిరునామా ఇవ్వండి.'); return; }
      if (rows.some(row => aboutVideoSource(row.url)?.src === source.src)) { toast.error('ఈ వీడియో ఇప్పటికే ఉంది.'); return; }
      void save([...rows, { url: url.trim(), title: title.trim() || 'గాయత్రి వన్ గురించి' }]);
    }}>
      <div><Label htmlFor="about-title">వీడియో పేరు</Label><Input id="about-title" value={title} maxLength={120} onChange={event => setTitle(event.target.value)} /></div>
      <div><Label htmlFor="about-url">వీడియో చిరునామా</Label><Input id="about-url" type="url" value={url} onChange={event => setUrl(event.target.value)} required /></div>
      <Button type="submit" disabled={busy || settings.isPending || settings.isError}><Plus />వీడియో జోడించండి</Button>
    </form>
  </section>;
}