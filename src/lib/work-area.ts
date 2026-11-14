export function selectedWorkArea(name: string) {
  return `${name.trim().replace(/\s*\/\s*$/, '')} / `;
}