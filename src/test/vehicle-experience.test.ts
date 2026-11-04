import { describe, expect, it } from "vitest";
import { capacityInput, replyGroupKey, welcomeDue } from "@/lib/vehicle-experience";

describe("vehicle experience", () => {
  it("welcomes once per Indian day", () => {
    expect(welcomeDue("2026-11-04", new Date("2026-11-04T18:29:59Z"))).toBe(false);
    expect(welcomeDue("2026-11-04", new Date("2026-11-04T18:30:00Z"))).toBe(true);
  });
  it("groups different vehicle replies under the same request", () => {
    expect(replyGroupKey({ post_id: "request", sender_id: "owner-1", receiver_id: "business" }, "business")).toBe("request");
    expect(replyGroupKey({ post_id: "request", sender_id: "owner-2", receiver_id: "business" }, "business")).toBe("request");
  });
  it("accepts numeric ton capacity and rejects invalid capacity", () => {
    expect(capacityInput.parse("10")).toBe(10);
    expect(capacityInput.safeParse("0").success).toBe(false);
    expect(capacityInput.safeParse("-5").success).toBe(false);
    expect(capacityInput.safeParse("101").success).toBe(false);
  });
});