import { Link } from '@tanstack/react-router';
import { PlusCircle } from 'lucide-react';

export function AddCategoryBox({ label, kind, service }: { label: string; kind?: 'seeker' | 'employer'; service?: boolean }) {
  return <Link to="/post/new" search={{ kind, loc: undefined, service }} className="flex min-h-16 items-center gap-3 rounded-xl border-2 border-dashed border-primary px-4 py-3 text-lg font-bold text-primary"><PlusCircle className="size-7 shrink-0" />{label}</Link>;
}
