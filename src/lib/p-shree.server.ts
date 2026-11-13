import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { P_SHREE_PROJECT, P_SHREE_SLUG } from "./p-shree";

// The previous catalogue archived this listing. A later archive or private
// visibility change must take precedence over the bundled public record.
const RESTORE_REQUEST_AT = "2026-11-12T21:20:28Z";
export async function getBundledPShree() {
  if (import.meta.env.DEV && !process.env.SUPABASE_SERVICE_ROLE_KEY) return P_SHREE_PROJECT;
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("is_deleted, visibility, updated_at")
      .eq("slug", P_SHREE_SLUG)
      .limit(1)
      .maybeSingle();
    if (error) return null;
    const retiredBeforeRestore = data?.is_deleted && data.visibility === "archived" &&
      Date.parse(data.updated_at) <= Date.parse(RESTORE_REQUEST_AT);
    return !data || retiredBeforeRestore ? P_SHREE_PROJECT : null;
  } catch {
    return null;
  }
}
