export type PermissionStatus = NotificationPermission | 'unsupported' | 'open-in-new-tab' | 'failed';
const PERMISSION_KEY = 'gayatri-notification-permission';
const DENIED_NOTICE_KEY = 'gayatri-notification-denied-notice';
let permissionRequest: Promise<PermissionStatus> | undefined;
function rememberPermission(permission: PermissionStatus) {
  try { localStorage.setItem(PERMISSION_KEY, permission); } catch { /* Browser permission remains authoritative. */ }
  return permission;
}
export const BELL_STATUS_KEY = 'gayatri-bell-status';
export const BELL_STATUS_TOAST = 'gayatri-bell-status';
export function rememberBellStatus(status: 'granted' | 'denied') {
  try { localStorage.setItem(BELL_STATUS_KEY, status); } catch { /* Browser permission remains authoritative. */ }
}
export function shouldShowDeniedNotice() {
  try {
    if (localStorage.getItem(DENIED_NOTICE_KEY) === '1') return false;
    localStorage.setItem(DENIED_NOTICE_KEY, '1');
  } catch { /* Storage may be unavailable. */ }
  return true;
}
export function browserPermission(): PermissionStatus {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}
export async function requestBrowserPermission(): Promise<PermissionStatus> {
  const current = browserPermission();
  if (current !== 'default') return rememberPermission(current);
  if (window.top !== window.self) return 'open-in-new-tab';
  if (permissionRequest) return permissionRequest;
  permissionRequest = (async () => {
    try { return rememberPermission(await Notification.requestPermission()); } catch { return 'failed' as const; }
  })();
  try { return await permissionRequest; } finally { permissionRequest = undefined; }
}
export const permissionHelp: Record<PermissionStatus, string> = {
  granted: 'ఫోన్ సూచనలకు అనుమతి ఉంది · Phone notifications allowed',
  default: 'ఫోన్ సూచనలకు ఇంకా అనుమతి ఇవ్వలేదు · Permission not requested',
  denied: 'అనుమతి లేదు. మీ బ్రౌజర్‌లో ఈ వెబ్‌సైట్ సెట్టింగ్‌లు తెరిచి సూచనలను అనుమతించండి. · Allow notifications in this browser’s site settings.',
  unsupported: 'ఈ పరికరంలో ఫోన్ సూచనలు అందుబాటులో లేవు; యాప్‌లో సమాచారం చూడవచ్చు. · Phone notifications unsupported; inbox remains available.',
  'open-in-new-tab': 'వెబ్‌సైట్‌ను వేరే ట్యాబ్‌లో తెరిచి అనుమతి ఇవ్వండి. · Open the website in its own tab to allow notifications.',
  failed: 'అనుమతి అడగలేకపోయాం. వెబ్‌సైట్ సెట్టింగ్‌లలో సూచనలను తనిఖీ చేయండి. · Permission request failed; check site settings.',
};