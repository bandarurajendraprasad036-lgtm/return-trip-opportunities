/** Everyday-speech replacements applied to displayed Telugu/English interface text. Longest phrases first. */
const TE: [string, string][] = [
  ['మొబైల్ నంబర్ + పాస్వర్డ్‌తో లాగిన్', 'మొబైల్ నంబర్ + పిన్‌తో లాగిన్'], ['ధృవీకరణ లేకుండా అతిథిగా కొనసాగించండి', 'లాగిన్ లేకుండా చూడండి'], ['ధృవీకరణ', 'చెకింగ్'], ['కొనసాగించండి', 'ముందుకు వెళ్ళండి'],
  ['ఖాతా తయారు చేయండి', 'నమోదు చేయండి'], ['కొత్త ఖాతా', 'ఖాతా నమోదు'],
  ['ప్రవేశించండి', 'లాగిన్ అవ్వండి'], ['ప్రవేశించిన', 'లాగిన్ అయిన'], ['ప్రవేశం', 'లాగిన్'],
  ['మళ్ళీ ప్రయత్నించండి', 'మళ్ళీ చేయండి'], ['వేచి ఉండండి', 'ఆగండి'],
  ['అభ్యర్థనలు', 'రిక్వెస్ట్‌లు'], ['అభ్యర్థన', 'రిక్వెస్ట్'],
  ['నిర్ధారించిన', 'చెక్ చేసిన'], ['నిర్ధారించి', 'చెక్ చేసి'], ['నిర్ధారించండి', 'చెక్ చేయండి'], ['నిర్ధారణ', 'చెకింగ్'],
  ['సమర్పించండి', 'పంపండి'], ['సంప్రదించండి', 'మాట్లాడండి'], ['చరవాణి', 'ఫోన్'],
  ['ప్రకటనలు', 'యాడ్‌లు'], ['ప్రకటన', 'యాడ్'], ['సందేశాలు', 'మెసేజ్‌లు'], ['సందేశాల', 'మెసేజ్‌ల'], ['సందేశం', 'మెసేజ్'],
  ['ఆమోదించండి', 'ఓకే చేయండి'], ['ఆమోదం', 'ఓకే'], ['తిరస్కరించండి', 'వద్దు అనండి'],
  ['అనుమతి', 'పర్మిషన్'], ['గోప్యత', 'ప్రైవసీ'],
];
const EN: [RegExp, string][] = [
  [/\bSign in\b/g, 'Log in'], [/\bsign in\b/g, 'log in'], [/\bCreate account\b/g, 'Register'],
  [/\bSubmit\b/g, 'Send'], [/\bsubmit\b/g, 'send'], [/\bVerify\b/g, 'Check'], [/\bverify\b/g, 'check'],
  [/\bAdvertisement\b/g, 'Ad'], [/\badvertisement\b/g, 'ad'], [/\bProceed\b/g, 'Go'],
  [/\bPlease wait\b/g, 'Wait'], [/\bContact\b/g, 'Call'],
];
export function simplifyWords(text: string, language: string): string {
  if (language === 'te') { let out = text; for (const [a, b] of TE) out = out.split(a).join(b); return out; }
  if (language === 'en') { let out = text; for (const [a, b] of EN) out = out.replace(a, b); return out; }
  return text;
}
