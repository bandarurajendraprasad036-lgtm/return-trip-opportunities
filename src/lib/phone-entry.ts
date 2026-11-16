export const PHONE_DEVICE_KEY = 'gayatri-phone-entry-device';
export async function phoneDeviceIdentity() {
  let secret = localStorage.getItem(PHONE_DEVICE_KEY);
  if (!secret || !/^[a-f0-9]{64}$/.test(secret)) {
    secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(PHONE_DEVICE_KEY, secret);
  }
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))), b => b.toString(16).padStart(2, '0')).join('');
  return { secret, hash };
}