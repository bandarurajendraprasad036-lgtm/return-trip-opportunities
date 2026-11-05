export const VEHICLE_TYPES = [
  { value: 'Car', te: 'కారు', en: 'Car' },
] as const;

export function isCar(value: string | null | undefined) {
  return ['car', 'cars', 'కారు', 'కార్లు', 'కార్'].includes(value?.trim().toLowerCase() ?? '');
}

export function vehicleTypeLabel(value: string | null | undefined) {
  const type = VEHICLE_TYPES.find(type => type.value.toLowerCase() === value?.trim().toLowerCase());
  return type ? `${type.te} · ${type.en}` : value;
}
export function listedVehicle(post: { module: string; vehicle_type?: string | null }) {
  return post.module !== 'vehicle' || isCar(post.vehicle_type);
}