export function googleAuthHelp(reason: string): string {
  const error = reason.toLowerCase();
  if (/denied|cancel|access_denied/.test(error)) return "గూగుల్ అనుమతి ఇవ్వలేదు లేదా ప్రవేశం ఆపారు. మళ్లీ ప్రయత్నించి అనుమతి ఇవ్వండి.";
  if (/popup|blocked/.test(error)) return "ప్రవేశపు కిటికీ తెరుచుకోలేదు. మీ బ్రౌజర్‌లో కొత్త కిటికీ తెరవడానికి అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి.";
  if (/redirect|callback|origin/.test(error)) return "గూగుల్ నుంచి తిరిగి రావడం జరగలేదు. వెబ్‌సైట్‌ను నేరుగా తెరిచి మళ్లీ ప్రయత్నించండి.";
  if (/network|fetch|offline/.test(error)) return "నెట్ అందుబాటులో లేదు. నెట్ వచ్చిన తరువాత మళ్లీ ప్రయత్నించండి.";
  return "గూగుల్ ప్రవేశం పూర్తికాలేదు. మళ్లీ ప్రయత్నించండి.";
}