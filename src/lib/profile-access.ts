export function profileFieldsComplete(profile: { full_name?: string; location?: string; phone?: string } | null | undefined, program: { occupation?: string; category?: string; member_kind?: string } | null | undefined) {
  return Boolean(profile?.full_name?.trim() && profile.location?.trim() && /^[6-9]\d{9}$/.test(profile.phone ?? '') && program?.occupation?.trim() && program.category?.trim() && program.member_kind?.trim());
}
export const PROFILE_ACCESS_MESSAGE = 'మీ ప్రొఫైల్ (వివరాలు) నింపండి. వివరాలు నింపిన తర్వాతనే ఈ ఆప్షన్స్ పని చేస్తాయి';