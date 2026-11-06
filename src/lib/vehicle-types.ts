export const VEHICLE_TYPES = [
  { value: 'Car', te: 'కారు', en: 'Car' },
  { value: 'Lorry', te: 'లారీ', en: 'Lorry' },
  { value: 'Mini truck', te: 'చిన్న సరకు వాహనం', en: 'Mini truck' },
  { value: 'Goods auto', te: 'సరకు ఆటో', en: 'Goods auto' },
  { value: 'Other goods vehicle', te: 'ఇతర సరకు వాహనం', en: 'Other goods vehicle' },
] as const;

export function isCar(value: string | null | undefined) {
  return ['car', 'cars', 'కారు', 'కార్లు', 'కార్'].includes(value?.trim().toLowerCase() ?? '');
}

export function vehicleTypeLabel(value: string | null | undefined) {
  const type = VEHICLE_TYPES.find(type => type.value.toLowerCase() === value?.trim().toLowerCase());
  return type ? `${type.te} · ${type.en}` : value;
}
export function listedVehicle(post: { module: string; vehicle_type?: string | null }) {
  return true;
}