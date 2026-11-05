export const VEHICLE_TYPES = [
  { value: 'Car', te: 'కారు', en: 'Car' },
  { value: 'Lorry', te: 'లారీ', en: 'Lorry' },
  { value: '407', te: '407', en: '407' },
  { value: 'Trolley', te: 'ట్రాలీ', en: 'Trolley' },
  { value: 'Tata Ace', te: 'చిన్న సరుకు వాహనం', en: 'Tata Ace' },
  { value: 'Other', te: 'ఇతర', en: 'Other' },
] as const;

export function isCar(value: string | null | undefined) {
  return ['car', 'cars', 'కారు', 'కార్లు', 'కార్'].includes(value?.trim().toLowerCase() ?? '');
}

export function vehicleTypeLabel(value: string | null | undefined) {
  const type = VEHICLE_TYPES.find(type => type.value.toLowerCase() === value?.trim().toLowerCase());
  return type ? `${type.te} · ${type.en}` : value;
}