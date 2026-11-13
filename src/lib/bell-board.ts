export const BELL_BOARD_LABELS = {
  goods: 'ఈ వాహనం కోసం గంట కొట్టిన వాళ్ళు',
  returns: 'ఈ రిటర్న్ వెహికల్ కోసం గంట కొట్టిన వాళ్ళు',
  cars: 'ఈ కార్ కోసం గంట కొట్టిన వాళ్ళు',
  'work-wanted': 'పని కోసం గంట కొట్టిన వాళ్ళు',
  'work-offered': 'పని ఇస్తాను అని టచ్ చేసిన వాళ్ళు',
  'service-providers': 'నా సర్వీస్ కోసం గంట కొట్టిన వాళ్ళు',
  'service-wanted': 'సర్వీస్ కోసం గంట కొట్టిన వాళ్ళు',
} as const;
export type BellBoardSection = keyof typeof BELL_BOARD_LABELS;
export function bellBoardSection(value: unknown): BellBoardSection {
  return typeof value === 'string' && value in BELL_BOARD_LABELS ? value as BellBoardSection : 'goods';
}