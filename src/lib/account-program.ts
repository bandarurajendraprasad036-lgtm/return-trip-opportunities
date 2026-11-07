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
export function referralLink(code: string) { return `https://gayatrione.com/?ref=${encodeURIComponent(code)}`; }