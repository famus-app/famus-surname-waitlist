export type SurnameJurisdiction = {
  country: string;
  iso: string;
  incidence: number;
  rank: number | null;
};

export type SurnameDetails = {
  surname: string;
  status: "matched" | "not_found" | "unavailable" | "unsupported";
  reportedCount: number | null;
  jurisdictions: SurnameJurisdiction[];
};

export function supportsForebears(surname: string) {
  return surname.length >= 2 && surname.length <= 80 &&
    /^[\p{Script=Latin}\p{M} '\-]+$/u.test(surname) && /\p{Script=Latin}/u.test(surname);
}

export function surnameDetailsKey(surname: string) {
  return surname.trim().toLowerCase().replace(/[\s']+/g, "-");
}

export function parseForebears(surname: string, payload: unknown): SurnameDetails {
  const empty: SurnameDetails = { surname, status: "unavailable", reportedCount: null, jurisdictions: [] };
  if (!payload || typeof payload !== "object") return empty;
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.status) && record.status.some((s) => s && typeof s === "object" && s.type === "error")) return empty;
  if (!Array.isArray(record.jurisdictions)) return empty;
  const jurisdictions: SurnameJurisdiction[] = [];
  for (const row of record.jurisdictions) {
    if (!row || typeof row !== "object") return empty;
    const incidence = Number(row.incidence);
    const rank = Number(row.rank);
    if (typeof row.jurisdiction !== "string" || typeof row.iso !== "string" ||
      row.incidence === null || row.incidence === "" || !Number.isSafeInteger(incidence) || incidence < 0) return empty;
    jurisdictions.push({ country: row.jurisdiction, iso: row.iso, incidence,
      rank: Number.isSafeInteger(rank) && rank > 0 ? rank : null });
  }
  const reportedCount = jurisdictions.reduce((total, row) => total + row.incidence, 0);
  if (!Number.isSafeInteger(reportedCount)) return empty;
  return { surname, status: jurisdictions.length ? "matched" : "not_found",
    reportedCount: jurisdictions.length ? reportedCount : null,
    jurisdictions: jurisdictions.sort((a, b) => b.incidence - a.incidence) };
}