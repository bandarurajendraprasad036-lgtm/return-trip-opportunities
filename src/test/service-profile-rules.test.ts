import { describe, it, expect } from "vitest";
import { canPublishPhoto, canReviewService, serviceReviewSchema } from "../lib/service-profile-rules";
describe("service profile rules", () => {
  it("requires explicit photo permission", () => { expect(canPublishPhoto("image/jpeg", 100, false)).toBe(false); expect(canPublishPhoto("image/jpeg", 100, true)).toBe(true); });
  it("limits images to 5MB and safe raster types", () => { expect(canPublishPhoto("image/jpeg", 5 * 1024 * 1024 + 1, true)).toBe(false); expect(canPublishPhoto("image/svg+xml", 100, true)).toBe(false); });
  it("does not permit self reviews", () => { expect(canReviewService("owner", "owner")).toBe(false); expect(canReviewService("visitor", "owner")).toBe(true); });
  it("accepts only ratings one through five", () => { expect(serviceReviewSchema.safeParse({ rating: 0, body: "Real service" }).success).toBe(false); expect(serviceReviewSchema.safeParse({ rating: 6, body: "Real service" }).success).toBe(false); expect(serviceReviewSchema.safeParse({ rating: 5, body: "Real service" }).success).toBe(true); });
});