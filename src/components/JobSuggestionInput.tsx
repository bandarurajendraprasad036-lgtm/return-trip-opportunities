import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { jobSuggestions } from '@/lib/job-entry';

/** Point 8: suggestions begin only after two entered characters. */
export function JobSuggestionInput({ id, label, value, options, onChange, maxLength }: { id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void; maxLength: number }) {
  const [open, setOpen] = useState(false);
  const suggestions = open ? jobSuggestions(value, options) : [];
  return <div className="space-y-1">
    <Label htmlFor={id} className="text-base">{label}</Label>
    <Input id={id} className="h-12 text-lg" value={value} maxLength={maxLength} required autoComplete="off" aria-expanded={suggestions.length > 0} aria-controls={`${id}-suggestions`} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onChange={event => { onChange(event.target.value); setOpen(true); }} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }} />
    {suggestions.length > 0 && <div id={`${id}-suggestions`} className="grid border bg-card" aria-label={`${label} సూచనలు`}>{suggestions.map(option => <Button key={option} type="button" variant="ghost" className="h-auto min-h-11 justify-start whitespace-normal text-left" onMouseDown={event => event.preventDefault()} onClick={() => { onChange(option); setOpen(false); }}>{option}</Button>)}</div>}
  </div>;
}