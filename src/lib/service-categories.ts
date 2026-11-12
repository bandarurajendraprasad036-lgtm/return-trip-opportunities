export const SERVICE_CATEGORIES = [
  { key: 'electrician', label: 'ఎలక్ట్రీషియన్' },
  { key: 'plumber', label: 'ప్లంబర్' },
  { key: 'technician', label: 'టెక్నీషియన్' },
  { key: 'tv mechanic', label: 'టీవీ మెకానిక్' },
] as const;
export function serviceLabel(key: string) {
  return SERVICE_CATEGORIES.find(category => category.key === key)?.label ?? key;
}