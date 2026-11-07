export type SearchExample = { type: 'vehicle'; from: string; to: string; title?: string } | { type: 'job'; location: string; salary: string; title?: string };

// Presentation-only examples have no account, post ID, contact or availability.
export function vehicleExample(from: string, to: string): SearchExample | null {
  if (!from.trim() || !to.trim()) return null;
  return { type: 'vehicle', from: from.trim(), to: to.trim() };
}
export function jobExample(location: string): SearchExample | null {
  return location.trim() ? { type: 'job', location: location.trim(), salary: '₹15,000 / నెల · month' } : null;
}

// Six labeled illustrations per selected category, never persisted as real posts.
export function areaExamples(from: string, to: string, category: 'local' | 'return' | 'cars' | 'seeker' | 'employer'): SearchExample[] {
  const start = from.trim(), end = to.trim();
  const area = end || start;
  if (!area) return [];
  if (category === 'seeker' || category === 'employer') {
    return ['ఎలక్ట్రీషియన్ · Electrician', 'ప్లంబర్ · Plumber', 'డ్రైవర్ · Driver', 'దుకాణ సహాయకులు · Shop assistant', 'వంట పని · Cooking', 'పెయింటింగ్ · Painting'].map(title => ({ type: 'job', title, location: area, salary: 'జీతం: నమూనా · Salary: example' }));
  }
  const titles = category === 'cars'
    ? ['కారు · Car', 'చిన్న కారు · Hatchback', 'సెడాన్ · Sedan', 'పెద్ద కారు · SUV', 'కుటుంబ కారు · MPV', 'టాక్సీ · Taxi']
    : ['లారీ · Lorry', 'మినీ లారీ · Mini truck', 'ట్రక్ · Truck', 'సరకు వ్యాన్ · Goods van', 'పికప్ · Pickup', 'చిన్న సరకు వాహనం · Small goods vehicle'];
  return titles.map(title => ({ type: 'vehicle', title, from: start, to: end }));
}