export type MapSelection = { from?: string; to?: string; area?: string };

export function areaMap(selection: MapSelection = {}) {
  const places = [selection.from?.trim(), selection.to?.trim()].filter(Boolean);
  const area = selection.area?.trim();
  const query = area ? `${area}, India` : places.length ? `${places.join(' to ')}, India` : 'India';
  const search = `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
  return { embed: `${search}&output=embed`, directions: search, label: query };
}