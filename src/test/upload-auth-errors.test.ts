import { describe, expect, it } from "vitest";
import { artworkFileError } from "@/lib/upload-rules";
import { googleAuthHelp } from "@/lib/google-auth-errors";
describe("Devotional upload validation", () => {
  it("accepts only JPEG PNG WebP images", () => {
    expect(artworkFileError({ type: "text/plain", size: 100 })).not.toBeNull();
    for (const type of ["image/jpeg", "image/png", "image/webp"]) expect(artworkFileError({ type, size: 100 })).toBeNull();
  });
  it("limits images to five megabytes and rejects empty files", () => {
    expect(artworkFileError({ type: "image/png", size: 5*1024*1024 })).toBeNull();
    expect(artworkFileError({ type: "image/png", size: 5*1024*1024+1 })).not.toBeNull();
    expect(artworkFileError({ type: "image/png", size: 0 })).not.toBeNull();
  });
});
describe("Google failures", () => {
  it("distinguishes denied permission redirect failure and network failure", () => {
    expect(googleAuthHelp("access_denied")).not.toBe(googleAuthHelp("redirect failed"));
    expect(googleAuthHelp("network error")).not.toBe(googleAuthHelp("redirect failed"));
  });
});