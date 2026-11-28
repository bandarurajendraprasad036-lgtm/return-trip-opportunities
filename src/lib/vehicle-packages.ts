export const CHAT_PACKAGE_AMOUNT = 100;
export const FULL_PACKAGE_AMOUNT = 349;
export const VEHICLE_PACKAGE_MONTHS = 3;
export function validVehiclePackage(amount: number) {
  return amount === CHAT_PACKAGE_AMOUNT || amount === FULL_PACKAGE_AMOUNT;
}
export function vehiclePackagePermissions(amount: number, approved: boolean) {
  return { chat: approved && validVehiclePackage(amount), bell: approved && amount === FULL_PACKAGE_AMOUNT, identity: approved && amount === FULL_PACKAGE_AMOUNT, calls: approved && amount === FULL_PACKAGE_AMOUNT };
}