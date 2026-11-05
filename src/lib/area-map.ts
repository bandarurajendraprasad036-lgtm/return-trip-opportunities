export function areaMap(from: string, to: string) {
  const start = from.trim();
  const end = to.trim();
  const qualify = (place: string) => `${place}, India`;
  const embed = new URL('https://maps.google.com/maps');
  embed.searchParams.set('output', 'embed');
  const directions = new URL('https://www.google.com/maps/dir/');
  directions.searchParams.set('api', '1');
  if (start && end) {
    embed.searchParams.set('saddr', qualify(start));
    embed.searchParams.set('daddr', qualify(end));
    directions.searchParams.set('origin', qualify(start));
    directions.searchParams.set('destination', qualify(end));
  } else {
    embed.searchParams.set('q', start || end ? qualify(start || end) : 'India');
    embed.searchParams.set('z', start || end ? '13' : '5');
    if (start || end) directions.searchParams.set('destination', qualify(start || end));
  }
  return { embed: embed.toString(), directions: start || end ? directions.toString() : null, label: start && end ? `${start} → ${end}` : start || end || 'భారతదేశం · India' };
}