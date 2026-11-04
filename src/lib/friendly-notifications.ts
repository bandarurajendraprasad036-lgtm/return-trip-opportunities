export function permissionThanks(granted: boolean): string | null {
  return granted ? 'అన్నా… సమాచారం అందుకోవడానికి అనుమతి ఇచ్చినందుకు ధన్యవాదాలు 🙏 మీకు సరిపోయే నిజమైన ఉద్యోగ సమాచారం వచ్చినప్పుడు తెలియజేస్తాం. — ప్రసాద్ అన్న · Thank you; we will notify you about genuine matching jobs.' : null;
}
export function matchedJobMessage(title: string): string {
  return `🔔 టన్ టన్… అన్నా… మీ అవసరానికి సరిపోయే ఉద్యోగ సమాచారం వచ్చింది: ${title}. చూస్తారా? — ప్రసాద్ అన్న · A genuine matching job is available.`;
}