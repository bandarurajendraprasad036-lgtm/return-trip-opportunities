/** Deterministic check shared by normal posting and optional drafting helpers.
 * The database repeats this check; browser checks never authorize a write. */
export function hasProhibitedPostText(text: string): boolean {
  return /(^|[^a-z0-9_])(fuck|bitch|bastard|asshole|motherfucker|madarchod|behenchod|bhenchod|chutiya|randi|gandu|harami|lanja|lanjakodaka|dengu|dengey|pooku|modda|sulli)([^a-z0-9_]|$)|లంజ|దెంగ|పూకు|మొడ్డ|సుల్లి|promote terrorism|join isis|terror attack planning|ఉగ్రదాడి ప్రణాళిక|ఉగ్రవాదాన్ని ప్రోత్సహించ|దేశాన్ని నాశనం చేయండి|భారత్ ముర్దాబాద్/i.test(text);
}