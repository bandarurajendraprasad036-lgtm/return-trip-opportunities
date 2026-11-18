import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { findPlaces, placeShards, type PlaceRow, type Coordinates } from '@/lib/india-places';

// Our own bundled village list (no map, no external lookup); shard files are cached for instant repeat searches.
const shardCache = new Map<string, Promise<PlaceRow[] | null>>();
function loadShard(name: string) {
  let hit = shardCache.get(name);
  if (!hit) {
    hit = fetch(`/places/${name}.json`).then(async response => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Place list unavailable');
      return await response.json() as PlaceRow[];
    });
    hit.catch(() => shardCache.delete(name));
    shardCache.set(name, hit);
  }
  return hit;
}
async function searchPlaces(query: string) {
  for (const name of placeShards(query)) {
    const rows = await loadShard(name);
    if (rows) return findPlaces(rows, query);
  }
  return [];
}

export function IndiaPlaceInput({ id, value, onChange, onSelect, disabled, maxLength = 120, placeholder, selectedValue }: { id?: string; value: string; onChange: (value: string) => void; onSelect?: (point: Coordinates) => void; disabled?: boolean; maxLength?: number; placeholder?: string; selectedValue?: (name: string) => string }) {
  const generated = useId();
  const listId = `${id ?? generated}-options`;
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open || !value.trim()) { setRows([]); return; }
    const controller = new AbortController();
    setError(false); setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchPlaces(value);
        if (!controller.signal.aborted) setRows(found);
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 60);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, open]);
  return <div className="relative min-w-0" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <Input id={id} placeholder={placeholder} role="combobox" aria-expanded={open && rows.length > 0} aria-controls={listId} aria-autocomplete="list" value={value} disabled={disabled} maxLength={maxLength} onFocus={() => setOpen(true)} onChange={e => { onChange(e.target.value); setOpen(true); }} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'ArrowDown') { e.preventDefault(); document.getElementById(listId)?.querySelector<HTMLElement>('button')?.focus(); } }} />
    {open && value.trim() && <div className="absolute inset-x-0 top-full z-50 max-h-80 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-card">
      <div id={listId} role="listbox">{rows.map(row => <Button key={row[0]} type="button" role="option" aria-selected={false} variant="ghost" className="h-auto w-full justify-start whitespace-normal border-b px-2 py-2 text-left" onClick={() => { onChange(selectedValue ? selectedValue(row[1]) : row[1]); onSelect?.({ latitude: row[4], longitude: row[5] }); setOpen(false); if(selectedValue) document.getElementById(id ?? '')?.focus(); }}><span translate="no">{row[1]}{row[2] ? ` · ${row[2]}` : ''}<small className="block text-muted-foreground">{row[3]} · India</small></span></Button>)}</div>
      {loading && <p role="status" className="p-2 text-sm">వస్తున్నాయి · Loading</p>}
      {!loading && !rows.length && <p className="p-2 text-sm">{error ? 'పేర్లు రాలేదు · Unavailable' : 'జాబితాలో లేదు; పేరు రాయవచ్చు · Not listed; enter manually'}</p>}
      <p className="p-2 text-xs text-muted-foreground">ప్రాంత సమాచారం: GeoNames</p>
    </div>}
  </div>;
}