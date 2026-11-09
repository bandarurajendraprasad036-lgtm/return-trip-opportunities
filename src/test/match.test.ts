import { describe, expect, it } from "vitest";
import { isMatch, phoneToEmail } from "@/lib/match";

describe("matching rules", () => {
  it("job seeker and employer in same location match", () => {
    expect(
      isMatch(
        { user_id: "a", module: "job", kind: "seeker", location: "Guntur " },
        { user_id: "b", module: "job", kind: "employer", location: "guntur" },
      ),
    ).toBe(true);
  });
  it("job posts in different locations do not match", () => {
    expect(
      isMatch(
        { user_id: "a", module: "job", kind: "seeker", location: "Guntur" },
        { user_id: "b", module: "job", kind: "employer", location: "Vijayawada" },
      ),
    ).toBe(false);
  });
  it("two seekers never match", () => {
    expect(
      isMatch(
        { user_id: "a", module: "job", kind: "seeker", location: "Guntur" },
        { user_id: "b", module: "job", kind: "seeker", location: "Guntur" },
      ),
    ).toBe(false);
  });
  it("vehicle owner and businessman with same from, to and date match", () => {
    const base = { module: "vehicle", from_place: "Hyderabad", to_place: "Warangal", trip_date: "2026-11-05" };
    expect(isMatch({ ...base, user_id: "a", kind: "owner" }, { ...base, user_id: "b", kind: "business" })).toBe(true);
  });
  it("vehicle posts on different dates do not match", () => {
    const base = { module: "vehicle", from_place: "Hyderabad", to_place: "Warangal" };
    expect(
      isMatch(
        { ...base, user_id: "a", kind: "owner", trip_date: "2026-11-05" },
        { ...base, user_id: "b", kind: "business", trip_date: "2026-11-06" },
      ),
    ).toBe(false);
  });
  it("phone login maps the last 10 digits to one account", () => {
    expect(phoneToEmail("+91 98765 43210")).toBe("9876543210@phone.returnconnect.app");
  });
});

import { locationMatches, FREE_DAILY_ALERTS, PRIME_PRICE } from "@/lib/jobs";
describe("job search & plan rules", () => {
  it("anywhere in India matches every city", () => expect(locationMatches("Delhi", "anywhere")).toBe(true));
  it("city filter excludes other cities", () => expect(locationMatches("Bombay", "Hyderabad")).toBe(false));
  it("free users get 5 alerts a day, Prime costs 699", () => { expect(FREE_DAILY_ALERTS).toBe(5); expect(PRIME_PRICE).toBe(699); });
});
