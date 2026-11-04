export type Kind = "seeker" | "employer" | "owner" | "business";
export type Module = "job" | "vehicle";

export interface MatchablePost {
  user_id: string;
  module: Module | string;
  kind: Kind | string;
  status?: string;
  location?: string | null;
  from_place?: string | null;
  to_place?: string | null;
  trip_date?: string | null;
  area_scope?: string;
  district?: string;
  state?: string;
  service_type?: string;
}

export const oppositeKind = (k: string): Kind =>
  k === "seeker" ? "employer" : k === "employer" ? "seeker" : k === "owner" ? "business" : "owner";

const norm = (v?: string | null) => (v ?? "").trim().toLowerCase();

/** Mirrors the database match trigger: job = same location, vehicle = same from, to and date. */
export function isMatch(a: MatchablePost, b: MatchablePost): boolean {
  if (a.user_id === b.user_id || a.module !== b.module || (a.service_type ?? '') !== (b.service_type ?? '')) return false;
  if (b.kind !== oppositeKind(a.kind)) return false;
  if ((a.status ?? "active") !== "active" || (b.status ?? "active") !== "active") return false;
  if (a.module === "job") {
    const sa = a.area_scope ?? 'local'; const sb = b.area_scope ?? 'local';
    if (sa === 'country' || sb === 'country') return true;
    if (sa === 'state' || sb === 'state') return !!norm(a.state) && norm(a.state) === norm(b.state);
    if (sa === 'district' || sb === 'district') return !!norm(a.district) && norm(a.district) === norm(b.district) && !!norm(a.state) && norm(a.state) === norm(b.state);
    return norm(a.location) !== "" && norm(a.location) === norm(b.location);
  }
  return (
    norm(a.from_place) !== "" &&
    norm(a.from_place) === norm(b.from_place) &&
    norm(a.to_place) === norm(b.to_place) &&
    !!a.trip_date &&
    a.trip_date === b.trip_date
  );
}

export const phoneToEmail = (phone: string) => `${phone.replace(/\D/g, "").slice(-10)}@phone.returnconnect.app`;

export const KIND_LABEL: Record<Kind, { te: string; en: string }> = {
  seeker: { te: "ఉద్యోగం కావాలి", en: "Need Job" },
  employer: { te: "పనివాడు కావాలి", en: "Need Employee" },
  owner: { te: "ఖాళీ రిటర్న్ వాహనం", en: "Empty Return Trip" },
  business: { te: "రిటర్న్ వాహనం కావాలి", en: "Need Return Vehicle" },
};
