export const PROFILE_NEEDS = [
  { value: 'seeker', te: 'నాకు పని కావాలి', en: 'I Want Job' },
  { value: 'employer', te: 'నాకు పనికి మనిషి కావాలి', en: 'I Want Worker' },
  { value: 'owner', te: 'నా దగ్గర వాహనం ఉంది', en: 'I Have Vehicle' },
  { value: 'business', te: 'నాకు వాహనం కావాలి', en: 'I Want Vehicle' },
  { value: 'service', te: 'నేను పని చేస్తాను - ఎలక్ట్రిషియన్, ప్లంబర్', en: 'I am Technician' },
] as const;
export const PROFILE_OCCUPATIONS = [
  { value: 'Business', te: 'బిజినెస్', en: 'Business' },
  { value: 'Job', te: 'ఉద్యోగం', en: 'Job' },
  { value: 'Driver', te: 'డ్రైవర్', en: 'Driver' },
  { value: 'Technician', te: 'టెక్నీషియన్', en: 'Technician' },
] as const;
export const TECHNICIAN_WORKS = [
  { value: 'Electrician', te: 'ఎలక్ట్రిషియన్', en: 'Electrician' },
  { value: 'Plumber', te: 'ప్లంబర్', en: 'Plumber' },
  { value: 'Mason', te: 'మేసన్', en: 'Mason' },
  { value: 'Carpenter', te: 'కార్పెంటర్', en: 'Carpenter' },
  { value: 'Painter', te: 'పెయింటర్', en: 'Painter' },
  { value: 'Welder', te: 'వెల్డర్', en: 'Welder' },
  { value: 'AC / Fridge mechanic', te: 'ఏసీ / ఫ్రిడ్జ్ మెకానిక్', en: 'AC / Fridge Mechanic' },
] as const;
export const ROUTE_VEHICLES = ['Mini Truck', 'Truck', 'Lorry', 'Pickup', 'Auto', 'Tata Ace'] as const;
export const ROUTE_TONNES = [1, 2, 3, 5, 10, 15] as const;
export function validDetailedRoute(from: string, to: string, vehicle: string, tonnes: number) {
  return !!from.trim() && !!to.trim() && from.trim().toLowerCase() !== to.trim().toLowerCase()
    && ROUTE_VEHICLES.some(value => value === vehicle) && ROUTE_TONNES.some(value => value === tonnes);
}
export function paymentUtr(text: string) { return text.match(/(?:^|\D)(\d{12})(?!\d)/)?.[1] ?? null; }
export const FINAL_PROFILE_PARAGRAPHS = [
  '🙏 దయచేసి మీ పూర్తి వివరాలు నింపండి - మీ ప్రొఫైల్ పూర్తిగా నింపండి!',
  'ఎందుకు అంటే:',
  'మీరు ఎలక్ట్రీషియన్ అయితే - ఎలక్ట్రీషియన్ కు సంబంధించిన పనులు మాత్రమే వస్తాయి!',
  'మీరు ప్లంబర్ అయితే - ప్లంబర్ కు సంబంధించిన పనులు మాత్రమే వస్తాయి!',
  'మీరు సాఫ్ట్వేర్ ఇంజనీర్ అయితే - సాఫ్ట్వేర్ ఇంజనీర్ కు సంబంధించిన పనులు మాత్రమే వస్తాయి!',
  'మీకు కారు కావాలంటే - కారుకు సంబంధించిన నోటిఫికేషన్ మాత్రమే వస్తుంది!',
  'మీకు రిటర్న్ గూడ్స్ వెహికల్ కావాలంటే - రిటర్న్ గూడ్స్ వెహికల్ నోటిఫికేషన్ మాత్రమే వస్తుంది!',
  'మీకు ఏది కావాలంటే - అలాంటి నోటిఫికేషన్ మాత్రమే వస్తుంది! వేరే ఏమీ రాదు!',
  '🚚 వ్యాపారస్తులకు - వెహికల్ ఓనర్లకు - స్పెషల్!',
  'మీరు బిజినెస్ మేన్ అయినా - వెహికల్ ఓనర్ అయినా - ఈ రెండూ చెప్పండి!',
  '1. మీ వెహికల్ ఏ ఏ రూట్ లో వెళ్తుంది?',
  '2. మీకు ఏ ఏ రూట్ లో వెహికల్ అవసరం ఉంటుంది?',
  'కాబట్టి - మీ ప్రొఫైల్ పూర్తిగా నింపండి!',
];