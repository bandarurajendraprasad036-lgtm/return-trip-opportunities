export type ServiceListing = { user_id: string; service: string; town: string; category: string };
const normalize = (value: string) => value.trim().toLocaleLowerCase();
const all = (value: string) => ['', 'all', 'అన్నీ', 'అందరూ'].includes(normalize(value));
const categoryName = (value: string) => {
  const text = normalize(value);
  if (['electrician', 'electrition', 'ఎలక్ట్రిషియన్', 'ఎలక్ట్రీషియన్'].includes(text)) return 'electrician';
  if (['plumber', 'ప్లంబర్'].includes(text)) return 'plumber';
  if (['driver', 'డ్రైవర్'].includes(text)) return 'driver';
  return text;
};
export function filterServiceListings(rows: ServiceListing[], town: string, category: string) {
  return rows.filter(row => (all(town) || normalize(row.town) === normalize(town))
    && (all(category) || categoryName(row.category || row.service) === categoryName(category)));
}