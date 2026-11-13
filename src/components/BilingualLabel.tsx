export function BilingualLabel({ te, en }: { te: string; en: string }) {
  return <span className="block"><span className="block text-lg font-bold">{te}</span><span translate="no" className="block text-xs font-normal text-muted-foreground">{en}</span></span>;
}