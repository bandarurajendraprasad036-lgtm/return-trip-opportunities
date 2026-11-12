import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { findPlaces, placeShard, type PlaceRow, type Coordinates } from '@/lib/india-places';

export function IndiaPlaceInput({ id, value, onChange, onSelect, disabled, maxLength = 120, placeholder }: { id?: string; value: string; onChange: (value: string) => void; onSelect?: (point: Coordinates) => void; disabled?: boolean; maxLength?: number; placeholder?: string }) {
  const generated = useId();
  const listId = `${id ?? generated}-options`;
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open || !value.trim()) { setRows([]); return; }
    const controller = new AbortController();
    setRows([]); setError(false); setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/places/${placeShard(value)}.json`, { signal: controller.signal });
        if (response.status === 404) { setRows([]); return; }
        if (!response.ok) throw new Error('Place list unavailable');
        setRows(findPlaces(await response.json() as PlaceRow[], value));
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, open]);
  return <div className="relative min-w-0" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <Input id={id} placeholder={placeholder} role="combobox" aria-expanded={open && rows.length > 0} aria-controls={listId} aria-autocomplete="list" value={value} disabled={disabled} maxLength={maxLength} onFocus={() => setOpen(true)} onChange={e => { onChange(e.target.value); setOpen(true); }} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'ArrowDown') { e.preventDefault(); document.getElementById(listId)?.querySelector<HTMLElement>('button')?.focus(); } }} />
    {value && <p translate="no" className="mt-1 min-w-0 whitespace-normal break-words text-sm leading-relaxed" aria-label="ఎంచుకున్న ఊరు · Selected place">{value}</p>}
    {open && value.trim() && <div className="absolute inset-x-0 top-full z-50 max-h-80 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-card">
      <div id={listId} role="listbox">{rows.map(row => <Button key={row[0]} type="button" role="option" aria-selected={false} variant="ghost" className="h-auto w-full justify-start whitespace-normal border-b px-2 py-2 text-left" onClick={() => { onChange(row[1]); onSelect?.({ latitude: row[4], longitude: row[5] }); setOpen(false); }}><span>{row[2] ? `${row[2]} · ` : ''}{row[1]}<small className="block text-muted-foreground">{row[3]} · India</small></span></Button>)}</div>
      {loading && <p role="status" className="p-2 text-sm">వస్తున్నాయి · Loading</p>}
      {!loading && !rows.length && <p className="p-2 text-sm">{error ? 'పేర్లు రాలేదు · Unavailable' : 'జాబితాలో లేదు; పేరు రాయవచ్చు · Not listed; enter manually'}</p>}
      <a className="block p-2 text-xs underline" href="https://www.geonames.org/" target="_blank" rel="noreferrer">ప్రాంత సమాచారం · GeoNames</a>
    </div>}
  </div>;
}