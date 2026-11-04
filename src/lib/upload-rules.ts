export function artworkFileError(file: { type: string; size: number }): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "చిత్రం రకం సరైంది కాదు. ఫోటో మాత్రమే ఇవ్వండి · Choose JPG, PNG or WebP";
  if (file.size === 0) return "ఖాళీ చిత్రం ఇవ్వకండి · The file is empty";
  if (file.size > 5 * 1024 * 1024) return "చిత్రం చాలా పెద్దది. ఐదు మెగాబైట్లలోపు ఇవ్వండి · Maximum 5 MB";
  return null;
}