import { Link } from '@tanstack/react-router';
import { DASHBOARD_PUBLIC_PAGE, DASHBOARD_LISTS, DASHBOARD_LIST_LABELS, type DashboardList, type ListCount } from '@/lib/dashboard-counts';

/** Real-record count cards; each card opens the matching filtered list. */
export function DashboardCountCards({ counts, to, active }: { counts: Record<DashboardList, ListCount> | undefined; to: '/admin' | '/my-posts'; active?: DashboardList | undefined }) {
  return <div className="grid grid-cols-2 gap-3">{DASHBOARD_LISTS.map(key => <Link key={key} to={to} search={{ list: key }} data-subscription-exempt aria-pressed={active === key} className={`min-w-0 rounded-xl border-2 bg-card p-3 text-left shadow-card ${active === key ? 'border-primary' : 'border-border'}`}>
    <p translate="no" className="font-display text-3xl font-extrabold text-primary">{counts ? counts[key].total : '—'}</p>
    <p className="break-words font-semibold">{DASHBOARD_LIST_LABELS[key]}</p>
    <p className="text-sm text-muted-foreground">ఇప్పుడు కనిపించేవి: <span translate="no">{counts ? counts[key].visible : '—'}</span></p>
  </Link>)}</div>;
}

export function PublicListLink({ list }: { list: DashboardList }) {
  const page = DASHBOARD_PUBLIC_PAGE[list];
  const label = 'బయటి జాబితా పేజీ తెరవండి';
  return page.to === '/vehicles' ? <Link to="/vehicles" search={{ category: page.category, from: '', to: '' }} className="inline-flex min-h-11 items-center rounded-md border px-3 font-semibold">{label}</Link>
    : <Link to="/work" search={{ kind: page.kind, area: '' }} className="inline-flex min-h-11 items-center rounded-md border px-3 font-semibold">{label}</Link>;
}
