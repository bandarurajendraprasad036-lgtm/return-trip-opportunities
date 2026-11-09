import { capacityInput } from '@/lib/vehicle-experience';

const TONS_SUFFIX = / · (\d+(?:\.\d+)?) టన్నులు$/;

export function parseVehicleCategory(value: string | null | undefined) {
  const category = value?.trim() ?? '';
  const match = category.match(TONS_SUFFIX);
  return {
    vehicleType: match ? category.slice(0, match.index).trim() : category,
    tons: match?.[1] ?? '',
  };
}

export function vehicleCategory(vehicleType: string, tons: string) {
  const type = vehicleType.trim();
  const weight = tons.trim();
  if (!weight) return type;
  const parsed = capacityInput.safeParse(weight);
  if (!parsed.success) return null;
  return `${type} · ${parsed.data} టన్నులు`.slice(0, 100);
}
