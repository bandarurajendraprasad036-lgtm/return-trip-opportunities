export function hasValidMobile(phone: string | null | undefined): boolean {
  return /^[6-9]\d{9}$/.test(phone ?? "");
}