import { describe, expect, it } from "vitest";
import { hasValidMobile } from "@/lib/phone";
import { isOfflinePreview } from "@/lib/offline";
import { MEMBERSHIP_AMOUNT, paymentInput } from "@/lib/membership";

describe("Required mobile before advertisements", () => {
  it("requires a valid Indian ten-digit number", () => {
    expect(hasValidMobile(undefined)).toBe(false);
    expect(hasValidMobile("1234567890")).toBe(false);
    expect(hasValidMobile("9030952010")).toBe(true);
    expect(hasValidMobile("919030952010")).toBe(false);
  });
});
describe("Offline registration safety", () => {
  it("blocks editor previews, iframes, dev and the off switch", () => {
    expect(isOfflinePreview("id-preview--example.lovable.app", false, true, false)).toBe(true);
    expect(isOfflinePreview("preview-2--example.lovable.app", false, true, false)).toBe(true);
    expect(isOfflinePreview("project--example-dev.lovable.app", false, true, false)).toBe(true);
    expect(isOfflinePreview("gayatrione.in", true, true, false)).toBe(true);
    expect(isOfflinePreview("localhost", false, false, false)).toBe(true);
    expect(isOfflinePreview("gayatrione.in", false, true, true)).toBe(true);
  });
  it("allows published domains", () => {
    expect(isOfflinePreview("return-trip-opportunities.lovable.app", false, true, false)).toBe(false);
    expect(isOfflinePreview("gayatrione.in", false, true, false)).toBe(false);
  });
});
describe("Existing membership payment", () => {
  it("keeps the confirmed 499 amount and validates transaction numbers", () => {
    expect(MEMBERSHIP_AMOUNT).toBe(499);
    expect(paymentInput.safeParse({ transaction_id: "123", membership_type: "individual", referral_numbers: [] }).success).toBe(false);
    expect(paymentInput.safeParse({ transaction_id: "123456789012", membership_type: "individual", referral_numbers: [] }).success).toBe(true);
  });
});