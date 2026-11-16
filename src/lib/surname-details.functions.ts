import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseForebears, supportsForebears, surnameDetailsKey, type SurnameDetails } from "./surname-details";

// Public surname statistics only: never accepts or reads registration emails or names.
export const getSurnameDetails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ surname: z.string().trim().min(1).max(80) }).parse(input))
  .handler(async ({ data }): Promise<SurnameDetails> => {
    const fallback: SurnameDetails = { surname: data.surname, status: "unavailable", reportedCount: null, jurisdictions: [] };
    if (!supportsForebears(data.surname)) return { ...fallback, status: "unsupported" };
    const key = surnameDetailsKey(data.surname);
    const gatewayKey = process.env['LOVABLE_API_KEY'];
    const connectionKey = process.env['UDC_FOREBEARS_ONOGRAPH_API_KEY'];
    if (!gatewayKey || !connectionKey) return fallback;
    try {
      // This privileged access is limited to the public statistics cache, never claims.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: cached } = await supabaseAdmin.from("surname_details").select("surname, match_status, reported_count, jurisdictions, checked_at").eq("surname_key", key).maybeSingle();
      if (cached && Date.now() - Date.parse(cached.checked_at) < 30 * 24 * 60 * 60 * 1000) {
        const parsed = parseForebears(cached.surname, { jurisdictions: Array.isArray(cached.jurisdictions) ? cached.jurisdictions.map((row) => {
          if (!row || typeof row !== "object" || Array.isArray(row)) return null;
          return { jurisdiction: row.country, iso: row.iso, incidence: row.incidence, rank: row.rank };
        }) : [] });
        if (parsed.status !== "unavailable") return parsed;
      }
      const query = new URLSearchParams({ name: data.surname, type: "surname", limit: "250", sanitize: "0" });
      const response = await fetch(`https://connector-gateway.lovable.dev/udc_forebears_onograph/v1/jur?${query}`, {
        headers: { Authorization: `Bearer ${gatewayKey}`, "X-Connection-Api-Key": connectionKey },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        console.error("Forebears lookup failed", response.status);
        return fallback;
      }
      const result = parseForebears(data.surname, await response.json());
      if (result.status === "unavailable") {
        console.error("Forebears returned an unavailable surname response");
        return result;
      }
      const { error } = await supabaseAdmin.from("surname_details").upsert({
        surname_key: key, surname: data.surname, match_status: result.status,
        reported_count: result.reportedCount, jurisdictions: result.jurisdictions,
        checked_at: new Date().toISOString(),
      });
      if (error) console.error("Surname statistics could not be saved", error.code);
      return result;
    } catch {
      console.error("Surname enrichment unavailable");
      return fallback;
    }
  });