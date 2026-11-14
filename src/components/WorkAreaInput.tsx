import { IndiaPlaceInput } from '@/components/IndiaPlaceInput';
import { selectedWorkArea } from '@/lib/work-area';

export function WorkAreaInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><label htmlFor={id} className="block font-bold">మీ ప్రాంతం</label><p className="text-sm">మీది ఏ ఊరు / వాడ</p><IndiaPlaceInput id={id} value={value} onChange={onChange} selectedValue={selectedWorkArea} maxLength={80} placeholder="మీ ఊరు / వాడ పేరు రాయండి" /></div>;
}