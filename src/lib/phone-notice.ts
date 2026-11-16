export function phoneNoticeData(notice: { id: string; vehicle_bell?: boolean; message?: string }, route?: { from_place: string | null; to_place: string | null } | null) {
  const routeText = route ? `${route.from_place?.trim() || '…'} → ${route.to_place?.trim() || '…'}` : notice.vehicle_bell ? notice.message : undefined;
  return { id: notice.id, body: routeText || 'గాయత్రి వన్‌లో కొత్త నోటిఫికేషన్ ఉంది', path: '/notifications' };
}