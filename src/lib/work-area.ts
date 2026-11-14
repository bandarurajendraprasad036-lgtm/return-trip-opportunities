export function selectedWorkArea(name: string) {
  return `${name.trim().replace(/\s*\/\s*$/, '')} / `;
}

export function canOpenWorkArea(value: string) {
  return /[\p{L}\p{N}]/u.test(value.trim());
}