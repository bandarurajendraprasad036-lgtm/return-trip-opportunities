export type SearchExample = { type: 'vehicle'; from: string; to: string } | { type: 'job'; location: string; salary: string };

// Presentation-only examples have no account, post ID, contact or availability.
export function vehicleExample(from: string, to: string): SearchExample | null {
  if (!from.trim() || !to.trim()) return null;
  return { type: 'vehicle', from: from.trim(), to: to.trim() };
}
export function jobExample(location: string): SearchExample | null {
  return location.trim() ? { type: 'job', location: location.trim(), salary: '₹15,000 / నెల · month' } : null;
}