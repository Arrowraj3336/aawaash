import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Aawash admin & leader server functions.
 *
 * All state-changing endpoints:
 *  1. Run inside requireSupabaseAuth (bearer token verified).
 *  2. Verify the caller's role via context.supabase.rpc('has_role', ...) — RLS applies.
 *  3. Only THEN import supabaseAdmin to perform privileged Auth Admin operations.
 */

async function assertSuperAdmin(ctx: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
}) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: Super Admin only");
}

/* ------------------------------------------------------------------ */
/* Team helpers                                                        */
/* ------------------------------------------------------------------ */

export const listTeamsWithLeaders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: teams, error } = await supabaseAdmin
      .from("teams")
      .select("id, letter, name, leader_id, is_deleted")
      .eq("is_deleted", false)
      .order("letter", { ascending: true });
    if (error) throw new Error(error.message);
    const leaderIds = (teams ?? []).map((t) => t.leader_id).filter(Boolean) as string[];
    let leaders: Array<{ id: string; full_name: string; login_id: string }> = [];
    if (leaderIds.length) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, login_id")
        .in("id", leaderIds);
      leaders = data ?? [];
    }
    return (teams ?? []).map((t) => ({
      ...t,
      leader: leaders.find((l) => l.id === t.leader_id) ?? null,
    }));
  });

/* ------------------------------------------------------------------ */
/* Create Team Leader                                                  */
/* ------------------------------------------------------------------ */

const teamLeaderSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  password: z.string().min(8).max(72),
  teamLetter: z.string().regex(/^([1-9]\d*|[A-Z]{1,3})$/, "Team number must be 1 or higher"),
});

export const createTeamLeader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => teamLeaderSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { ensureAvailableLogin, provisionAccount, teamFields } = await import("@/lib/account-provisioning.server");
    const { data: team, error: teamError } = await supabaseAdmin.from("teams")
      .select(teamFields).eq("letter", data.teamLetter).maybeSingle();
    if (teamError) throw new Error(teamError.message);
    if (!team || team.is_deleted) throw new Error(`Team ${data.teamLetter} does not exist.`);
    if (team.leader_id) throw new Error(`Team ${data.teamLetter} already has a Team Leader.`);
    const loginId = data.mobile;
    await ensureAvailableLogin(supabaseAdmin, data.mobile, loginId);
    return provisionAccount(supabaseAdmin, { ...data, loginId, role: "team_leader", team, actor: context.userId });
  });

/* ------------------------------------------------------------------ */
/* Create Member                                                       */
/* ------------------------------------------------------------------ */

const memberSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  password: z.string().min(8).max(72),
  teamLetter: z.string().regex(/^([1-9]\d*|[A-Z]{1,3})$/, "Team number must be 1 or higher"),
});

export const createMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => memberSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { ensureAvailableLogin, provisionAccount, teamFields } = await import("@/lib/account-provisioning.server");
    const { data: team, error: teamError } = await supabaseAdmin.from("teams")
      .select(teamFields).eq("letter", data.teamLetter).maybeSingle();
    if (teamError) throw new Error(teamError.message);
    if (!team || team.is_deleted) throw new Error(`Team ${data.teamLetter} does not exist.`);
    const { resolveAssignableTeam } = await import("@/lib/team-assignment.server");
    await resolveAssignableTeam(supabaseAdmin, team.id, context.userId);
    const loginId = `${team.letter}${data.mobile}`;
    await ensureAvailableLogin(supabaseAdmin, data.mobile, loginId);
    return provisionAccount(supabaseAdmin, { ...data, loginId, role: "member", team, actor: context.userId });
  });

/* ------------------------------------------------------------------ */
/* User list (admin)                                                   */
/* ------------------------------------------------------------------ */

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }, { data: teams }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select(
            "id, display_code, full_name, login_id, mobile_number, team_id, status, is_active, is_deleted, last_login_at, created_at",
          )
          .eq("is_deleted", false)
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("teams").select("id, letter"),
      ]);
    if (pErr) throw new Error(pErr.message);
    if (rErr) throw new Error(rErr.message);

    const roleMap = new Map<string, string>();
    (roles ?? []).forEach((r) => roleMap.set(r.user_id, r.role));
    const teamMap = new Map<string, string>();
    (teams ?? []).forEach((t) => teamMap.set(t.id, t.letter));

    return (profiles ?? []).map((p) => ({
      ...p,
      role: roleMap.get(p.id) ?? "member",
      team_letter: p.team_id ? teamMap.get(p.team_id) ?? null : null,
    }));
  });

/* ------------------------------------------------------------------ */
/* Reset password (admin)                                              */
/* ------------------------------------------------------------------ */

const resetSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8).max(72),
});

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => resetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "reset_password",
      entity_type: "profile",
      entity_id: data.userId,
    });
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Status change (activate / suspend / soft-delete)                    */
/* ------------------------------------------------------------------ */

const statusSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["activate", "suspend", "delete"]),
});

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => statusSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const status: "active" | "suspended" = data.action === "activate" ? "active" : "suspended";
    const isActive = data.action === "activate";
    const isDeleted = data.action === "delete";

    if (data.userId === context.userId && !isActive) throw new Error("You cannot suspend or delete your own account.");
    const { data: before, error: readError } = await context.supabase.from("profiles")
      .select("status, is_active, is_deleted").eq("id", data.userId).maybeSingle();
    if (readError || !before) throw new Error(readError?.message ?? "Account not found.");

    const { data: saved, error } = await context.supabase.from("profiles").update({
      status, is_active: isActive, is_deleted: isDeleted, updated_by: context.userId,
    }).eq("id", data.userId).select("status, is_active, is_deleted").maybeSingle();
    if (error || !saved || saved.status !== status || saved.is_active !== isActive || saved.is_deleted !== isDeleted) {
      throw new Error(error?.message ?? "Account status could not be saved.");
    }

    // Synchronize the sign-in restriction and restore the profile if Auth rejects it.
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: isActive ? "none" : "876000h",
    });
    if (authError) {
      const { data: restored, error: rollbackError } = await context.supabase.from("profiles")
        .update(before).eq("id", data.userId).eq("status", status).eq("is_deleted", isDeleted)
        .select("id").maybeSingle();
      if (rollbackError || !restored) {
        console.error("[Account status] Rollback failed", data.userId, rollbackError);
        throw new Error("Sign-in status could not be synchronized. Check the account before retrying.");
      }
      throw new Error(authError.message);
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: `status_${data.action}`,
      entity_type: "profile",
      entity_id: data.userId,
    });
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Team Leader: list my team                                           */
/* ------------------------------------------------------------------ */

export const listMyTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // RLS enforces "team leader reads own team" — safe to use context.supabase.
    const { data: me, error: meErr } = await context.supabase
      .from("profiles")
      .select("team_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    if (!me?.team_id) return [];

    const { data, error } = await context.supabase
      .from("profiles")
      .select(
        "id, display_code, full_name, login_id, mobile_number, status, is_active, total_sales, total_earnings, referral_count, created_at",
      )
      .eq("team_id", me.team_id)
      .eq("is_deleted", false)
      .neq("id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ------------------------------------------------------------------ */
/* Sign-in status probe (public, but requires bearer via middleware)   */
/* ------------------------------------------------------------------ */

export const getMyStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("status, is_active, is_deleted")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? { status: "active", is_active: true, is_deleted: false };
  });
