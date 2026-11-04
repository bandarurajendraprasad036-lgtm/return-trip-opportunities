export type PermissionStatus = NotificationPermission | 'unsupported' | 'open-in-new-tab' | 'failed';
export function browserPermission(): PermissionStatus {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}
export async function requestBrowserPermission(): Promise<PermissionStatus> {
  if (browserPermission() === 'unsupported') return 'unsupported';
  if (window.top !== window.self) return 'open-in-new-tab';
  try { return await Notification.requestPermission(); } catch { return 'failed'; }
}
export const permissionHelp: Record<PermissionStatus, string> = {
  granted: 'ఫోన్ సూచనలకు అనుమతి ఉంది · Phone notifications allowed',
  default: 'ఫోన్ సూచనలకు ఇంకా అనుమతి ఇవ్వలేదు · Permission not requested',
  denied: 'అనుమతి లేదు. మీ బ్రౌజర్‌లో ఈ వెబ్‌సైట్ సెట్టింగ్‌లు తెరిచి సూచనలను అనుమతించండి. · Allow notifications in this browser’s site settings.',
  unsupported: 'ఈ పరికరంలో ఫోన్ సూచనలు అందుబాటులో లేవు; యాప్‌లో సమాచారం చూడవచ్చు. · Phone notifications unsupported; inbox remains available.',
  'open-in-new-tab': 'వెబ్‌సైట్‌ను వేరే ట్యాబ్‌లో తెరిచి అనుమతి ఇవ్వండి. · Open the website in its own tab to allow notifications.',
  failed: 'అనుమతి అడగలేకపోయాం. వెబ్‌సైట్ సెట్టింగ్‌లలో సూచనలను తనిఖీ చేయండి. · Permission request failed; check site settings.',
};