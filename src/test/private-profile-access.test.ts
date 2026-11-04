import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const sessionPath = join(homedir(), ".cache/lovable-auth/session.json");
let session: { access_token: string; user: { id: string } } | undefined;
try { session = JSON.parse(readFileSync(sessionPath, "utf8")).session; } catch { /* Optional authenticated integration fixture. */ }

describe.skipIf(!session)("private profile API authorization", () => {
  const key = "sb_publishable_mt_ficWmT4BtHokB-lP8Dw_wPQsvLBV";
  async function get(path: string, authenticated = true) {
    if (!session) throw new Error("Authenticated fixture required");
    const payload = JSON.parse(Buffer.from(session.access_token.split(".")[1], "base64url").toString());
    const base = payload.iss.replace(/\/auth\/v1$/, "");
    const response = await fetch(`${base}/rest/v1/${path}`, { headers: {
      apikey: key, ...(authenticated ? { Authorization: `Bearer ${session.access_token}` } : {}),
    } });
    return { response, data: await response.json() };
  }
  it("the owner can read their own saved profile", async () => {
    const { response, data } = await get(`profiles?select=id&id=eq.${session?.user.id}`);
    expect(response.ok).toBe(true);
    expect(data.map((row: { id: string }) => row.id)).toEqual([session?.user.id]);
  });
  it("a non-admin cannot read another member's private profile", async () => {
    const roles = await get(`user_roles?select=role&user_id=eq.${session?.user.id}`);
    expect(roles.data.some((row: { role: string }) => row.role === "admin")).toBe(false);
    const { response, data } = await get(`profiles?select=id,phone&id=neq.${session?.user.id}`);
    expect(response.ok).toBe(true);
    expect(data).toEqual([]);
  });
  it("guests cannot read private profiles", async () => {
    const { response } = await get("profiles?select=id,phone", false);
    expect(response.ok).toBe(false);
    expect([401, 403]).toContain(response.status);
  });
});