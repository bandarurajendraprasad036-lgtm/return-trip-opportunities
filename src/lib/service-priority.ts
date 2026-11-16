export function rotateServicePriority<T extends { priority: number }>(rows: readonly T[], rotation: number): T[] {
  const paid = rows.filter(row => row.priority > 0).sort((a,b) => a.priority-b.priority);
  const ordinary = rows.filter(row => row.priority <= 0);
  const rotate = (list: T[]) => list.length ? [...list.slice(rotation % list.length), ...list.slice(0, rotation % list.length)] : [];
  return [...rotate(paid), ...rotate(ordinary)];
}