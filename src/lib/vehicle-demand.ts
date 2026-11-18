export const VEHICLE_DEMAND_TITLE = 'గంట కొట్టిన వాళ్ళు - కావాలి లిస్ట్';
export const VEHICLE_DEMAND_SECTIONS = {
  goods: 'లోకల్ వెహికల్ కోసం గంట కొట్టిన వాళ్ళు',
  returns: 'రిటర్న్ గూడ్స్ & అడ్వాన్స్ వెహికల్స్',
  cars: 'లోకల్ కార్స్ కోసం గంట కొట్టిన వాళ్ళు',
} as const;
const CAR_TYPES = ['car', 'innova', 'swift dzire', 'ertiga', 'bolero', 'suv', 'sedan', 'hatchback', 'taxi'];
/** Same classification the database uses when a post bell is saved, so the list opens on the right tab. */
export function vehicleDemandCategory(post: { from_place: string | null; to_place: string | null; vehicle_type: string | null }): 'goods' | 'returns' | 'cars' {
  const type = (post.vehicle_type ?? '').toLowerCase();
  if (CAR_TYPES.includes(type)) return 'cars';
  return (post.from_place ?? '').trim().toLowerCase() === (post.to_place ?? '').trim().toLowerCase() ? 'goods' : 'returns';
}
