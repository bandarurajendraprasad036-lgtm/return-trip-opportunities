// Loose name comparison: ignores case, spaces, dots and word order (initials such as "B." still need the other words to match).
export function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
}
export function aadhaarNameMatches(profileName: string, cardName: string) {
  const a = normalizeName(profileName), b = normalizeName(cardName);
  if (!a.length || !b.length) return false;
  const full = a.filter(word => word.length > 1), card = new Set(b);
  if (!full.length) return false;
  return full.every(word => card.has(word)) || b.filter(w => w.length > 1).every(word => a.includes(word));
}
