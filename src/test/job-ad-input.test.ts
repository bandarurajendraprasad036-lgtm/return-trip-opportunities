import { describe, expect, it } from "vitest";
import { buildJobAdInput } from "@/lib/job-ad-input";

describe("Job seeker drafting inputs", () => {
  it("passes the supplied skills, experience and salary without changing their values", () => {
    const input = buildJobAdInput({ skills: "ప్లంబర్", experience: "5 సంవత్సరాలు", salary: "₹18000 నెలకు", location: "గుంటూరు", text: "ఉద్యోగం కావాలి" });
    expect(input).toContain("ప్లంబర్");
    expect(input).toContain("5 సంవత్సరాలు");
    expect(input).toContain("₹18000 నెలకు");
  });
  it("does not invent missing experience or salary", () => {
    expect(buildJobAdInput({ skills: "Driver", experience: "", salary: "", location: "", text: "" })).toBe("Skills / నైపుణ్యాలు: Driver");
  });
});