export const PROFILE_POINTS = 265;
export const TRIAL_DAYS = 10;
export const SHARE_GROUPS = 5;
export const SHARE_IMAGES = SHARE_GROUPS + 1;
export const REFERRAL_JOINS = 100;
export const REFERRAL_MONTHS = 3;
export const MAX_BELL_RECIPIENTS = 5;
export const REMINDER_DAYS = 4;
export function trialActive(start: string | null | undefined, now = new Date()) {
  return Boolean(start && now.getTime() < Date.parse(start) + TRIAL_DAYS * 86400000);
}
export function reminderDay(start: string, now = new Date(), zone = 'Asia/Kolkata') {
  const day = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const field = (type: string) => parts.find(p => p.type === type)?.value || '';
    return Date.parse(`${field('year')}-${field('month')}-${field('day')}T00:00:00Z`);
  };
  const age = (day(now) - day(new Date(start))) / 86400000;
  return age >= TRIAL_DAYS && age < TRIAL_DAYS + REMINDER_DAYS;
}
export const PROFILE_REQUEST = '🙏 అన్నయ్యా, మీకు దండం పెట్టి చెప్తున్నాం. మీరు గంట కొట్టారు కానీ మీ వివరాలు ఇంకా నింపలేదు. మీరు ఎలక్ట్రీషియన్ అయితే ఎలక్ట్రీషియన్ అని, నిరుద్యోగి అయితే నిరుద్యోగి అని తెలిస్తేనే సరిపోయే సమాచారం పంపగలం. వివరాలు తెలియకుంటే గాయత్రి కూడా ఏం చేయలేకపోతుంది. దయచేసి అర్థం చేసుకుని మీ వివరాలు పంపండి!';
export const HOME_PROFILE_REQUEST = [
  '🙏 అన్నయ్య, మీకు దండం పెట్టి చెప్తున్నా.. మీరు గంట కొట్టారు. ఇంకా మీ వివరాలు ఇవ్వకపోతే దయచేసి పూర్తి వివరాలు నింపండి.',
  'మీరు ఎలక్ట్రీషియన్ లేదా ప్లంబర్ అయితే మీ పని, ప్రాంతం చెప్పండి. మీ ప్రాంతంలో ఆ పని అవసరమని ఎవరైనా ప్రకటిస్తే, మీ వివరాలకు సరిపోయే సమాచారం అందేందుకు ఉపయోగపడుతుంది.',
  'మీరు నిరుద్యోగి అయితే ఏ పని కావాలో, ఎక్కడ పని కావాలో చెప్పండి. మీరు కంపెనీ అధిపతి లేదా దుకాణదారు అయితే ఎలాంటి సిబ్బంది కావాలో చెప్పి ప్రకటన పెట్టండి. సంబంధిత వారు గంట కొట్టి మన వ్యక్తిగత సంభాషణలో మాట్లాడవచ్చు.',
  'మీరు వ్యాపారస్తులు అయితే ఏ వాహనం కావాలో, ఎక్కడి నుండి ఎక్కడికి తరచూ అవసరమో మీ వివరాల్లో నమోదు చేయండి. ఆ మార్గంలో సరిపోయే తిరిగి వచ్చే వాహనం ప్రకటించినప్పుడు, మీ సూచనల అనుమతులు, పరిమితులకు లోబడి సమాచారం అందేందుకు ఈ వివరాలు ఉపయోగపడతాయి. వాహనం నిజంగా తిరిగి వస్తోందని లేదా బుకింగ్ అయిందని ఇది నిర్ధారణ కాదు.',
  'ఉదాహరణకు సాధారణ ధర ₹10,000 ఉండగా తిరుగు వాహనం ధర ₹3,000–₹4,000గా యజమాని ఇస్తే 60–70% ఆదా కావచ్చు. ఇది ఉదాహరణ మాత్రమే; ప్రతి వాహనానికి ఈ ధర లేదా తగ్గింపు హామీ లేదు. అసలు ధరను వాహన యజమానితో మాట్లాడి నిర్ధారించండి.',
  'కాబట్టి మీ పని, ప్రాంతం, కావాల్సిన సిబ్బంది లేదా వాహనం, తరచూ అవసరమయ్యే మార్గం వివరాలు ఇవ్వండి. ఇప్పటికే వివరాలు నింపితే అవసరమైనప్పుడు మార్చుకోవచ్చు. మీ వ్యక్తిగత వివరాలు అందరికీ కనిపించవు.',
  'వివరాలు నమోదు చేయడం, ప్రకటనలు పెట్టడం, ఉద్యోగాలు–కార్ల వివరాలు మరియు సంభాషణ ఉచితం. సరకు వాహన వివరాలు–గంట–సంభాషణకు వర్తించే సభ్యత్వ నిబంధనలు వేరుగా ఉంటాయి. సమాచారం మీ ఫోన్‌కు తప్పకుండా చేరుతుందని హామీ లేదు.',
];
export function referralLink(code: string) { return `https://gayatrione.com/?ref=${encodeURIComponent(code)}`; }