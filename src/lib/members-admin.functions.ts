import { fetchAllRows, fetchRowsForIds } from "./supabase-rows";
/**
 * Member Management — server functions (Super Admin only).
 *
 * Single source of truth for Member CRUD, team assignment, status,
 * password reset, and aggregated read models (stats, customers, sales,
 * tip persons, commissions, wallet, withdrawals, activity).
 *
 * Auth pattern is identical to team-leaders.functions.ts:
 *   1. requireSupabaseAuth (bearer verified)
 *   2. verify caller is super_admin via context.supabase RPC
 *   3. only then load supabaseAdmin for privileged Auth Admin work
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AAWASH_AUTH_EMAIL_DOMAIN } from "@/lib/auth";

type Ctx = {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
};

async function assertSuperAdmin(ctx: Ctx) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: Super Admin only");
}

/* ================================================================== */
/* List Members                                                        */
/* ================================================================== */

export const listAllMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { loadTeamAssignments } = await import("@/lib/team-assignment.server");
    const [roles, teams, assignments] = await Promise.all([
      fetchAllRows((from, to) => supabaseAdmin.from("user_roles").select("user_id").eq("role", "member").order("user_id").range(from, to)),
      fetchAllRows((from, to) => supabaseAdmin.from("teams").select("id, letter, name, leader_id, is_deleted").eq("is_deleted", false).order("letter").range(from, to)),
      loadTeamAssignments(supabaseAdmin),
    ]);
    const memberIds = roles.map(role => role.user_id);
    const teamById = new Map(assignments.map(team => [team.team_id, team]));
    const [profiles, sales, txns] = await Promise.all([
      fetchRowsForIds(memberIds, (ids, from, to) => supabaseAdmin.from("profiles")
        .select("id, display_code, full_name, mobile_number, login_id, email, avatar_url, team_id, status, is_active, is_deleted, joining_date, wallet_balance, total_earnings, total_sales, referral_count, last_login_at, created_at")
        .in("id", ids).order("id").range(from, to)),
      fetchRowsForIds(memberIds, (ids, from, to) => supabaseAdmin.from("sales")
        .select("seller_id, deal_value, approval_status").in("seller_id", ids).order("id").range(from, to)),
      fetchRowsForIds(memberIds, (ids, from, to) => supabaseAdmin.from("commission_transactions")
        .select("member_id, member_amount, status").in("member_id", ids).order("id").range(from, to)),
    ]);
    profiles.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const revenueMap = new Map<string, number>();
    const salesCountMap = new Map<string, number>();
    (sales ?? []).forEach((s) => {
      if (!s.seller_id || s.approval_status !== "approved") return;
      revenueMap.set(s.seller_id, (revenueMap.get(s.seller_id) ?? 0) + Number(s.deal_value ?? 0));
      salesCountMap.set(s.seller_id, (salesCountMap.get(s.seller_id) ?? 0) + 1);
    });
    const commissionMap = new Map<string, number>();
    (txns ?? []).forEach((t) => {
      if (!t.member_id || t.status === "reversed") return;
      commissionMap.set(t.member_id, (commissionMap.get(t.member_id) ?? 0) + Number(t.member_amount ?? 0));
    });

    const members = (profiles ?? []).map((p) => {
      const team = p.team_id ? teamById.get(p.team_id) : null;
      return {
        ...p,
        team_letter: team?.letter ?? null,
        team_name: team?.name ?? null,
        leader_id: team?.leader_id ?? null,
        leader_name: team?.leader_name ?? null,
        sales_count: salesCountMap.get(p.id) ?? 0,
        total_revenue: revenueMap.get(p.id) ?? 0,
        member_commission: commissionMap.get(p.id) ?? 0,
      };
    });

    const counts = new Map<string, number>();
    for (const member of members) {
      if (member.team_id && !member.is_deleted) counts.set(member.team_id, (counts.get(member.team_id) ?? 0) + 1);
    }
    return { members, teams, leaders: assignments.map(team => ({ ...team, member_count: counts.get(team.team_id) ?? 0 })) };
  });

/* ================================================================== */
/* Create Member (enterprise form)                                     */
/* ================================================================== */

export const listMemberAssignmentTeams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadTeamAssignments } = await import("@/lib/team-assignment.server");
    return loadTeamAssignments(supabaseAdmin);
  });

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  password: z.string().min(8).max(72),
  teamId: z.string().uuid(),
  leaderId: z.string().uuid().optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  avatarUrl: z.string().trim().url().max(600).optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  remarks: z.string().trim().max(600).optional().or(z.literal("")),
});

export const createMemberFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { resolveAssignableTeam } = await import("@/lib/team-assignment.server");
    const team = await resolveAssignableTeam(supabaseAdmin, data.teamId, context.userId, data.leaderId);
    const loginId = `${team.letter}${data.mobile}`;

    const { ensureAvailableLogin, provisionAccount } = await import("@/lib/account-provisioning.server");
    await ensureAvailableLogin(supabaseAdmin, data.mobile, loginId);
    return provisionAccount(supabaseAdmin, {
      ...data, loginId, role: "member", team, actor: context.userId,
      profile: {
        email: data.email || null, avatar_url: data.avatarUrl || null,
        address: data.address || null, remarks: data.remarks || null,
        joining_date: data.joiningDate || null,
      },
    });
  });

/* ================================================================== */
/* Update Member profile (non-team fields)                             */
/* ================================================================== */

const updateSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  avatarUrl: z.string().trim().url().max(600).optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  remarks: z.string().trim().max(600).optional().or(z.literal("")),
});

export const updateMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, address, avatar_url, joining_date, remarks")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("Member not found");

    const updates: Record<string, unknown> = { updated_by: context.userId };
    if (data.fullName !== undefined) updates.full_name = data.fullName;
    if (data.email !== undefined) updates.email = data.email.length > 0 ? data.email : null;
    if (data.address !== undefined) updates.address = data.address.length > 0 ? data.address : null;
    if (data.avatarUrl !== undefined)
      updates.avatar_url = data.avatarUrl.length > 0 ? data.avatarUrl : null;
    if (data.joiningDate !== undefined)
      updates.joining_date = data.joiningDate.length > 0 ? data.joiningDate : null;
    if (data.remarks !== undefined) updates.remarks = data.remarks.length > 0 ? data.remarks : null;

    const { data: saved, error } = await context.supabase.from("profiles").update(updates as never)
      .eq("id", data.userId).select("id").maybeSingle();
    if (error || !saved) throw new Error(error?.message ?? "The account changes were not saved.");

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "update_member",
      entity_type: "profile",
      entity_id: data.userId,
      new_value: updates as never,
      previous_value: profile,
    });
    return { ok: true as const };
  });

/* ================================================================== */
/* Change team assignment (regenerates Login ID)                       */
/* ================================================================== */

const changeTeamSchema = z.object({
  userId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export const changeMemberTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => changeTeamSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, mobile_number, login_id, team_id, email")
      .eq("id", data.userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error("Member not found");
    const { data: role, error: roleError } = await supabaseAdmin.from("user_roles")
      .select("role").eq("user_id", data.userId).eq("role", "member").maybeSingle();
    if (roleError) throw new Error(roleError.message);
    if (!role) throw new Error("Only member accounts can be reassigned here.");
    if (profile.team_id === data.teamId) return { ok: true as const, unchanged: true };

    const { resolveAssignableTeam } = await import("@/lib/team-assignment.server");
    const team = await resolveAssignableTeam(supabaseAdmin, data.teamId, context.userId);

    const newLoginId = `${team.letter}${profile.mobile_number}`;

    // Duplicate check across the platform
    const { data: dupe, error: duplicateError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("login_id", newLoginId)
      .neq("id", data.userId)
      .maybeSingle();
    if (duplicateError) throw new Error(duplicateError.message);
    if (dupe) throw new Error(`Login ID ${newLoginId} is already taken.`);

    // Profile email is a contact field. Auth holds the actual sign-in email.
    const { data: auth, error: authError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (authError || !auth.user) throw new Error(authError?.message ?? "Member sign-in account was not found.");
    const oldEmail = auth.user.email;
    const oldMeta = auth.user.user_metadata;
    const synthesized = oldEmail?.toLowerCase().endsWith(`@${AAWASH_AUTH_EMAIL_DOMAIN}`);
    const { error: loginError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ...(synthesized ? { email: `${newLoginId.toLowerCase()}@${AAWASH_AUTH_EMAIL_DOMAIN}`, email_confirm: true } : {}),
      user_metadata: { login_id: newLoginId, team_letter: team.letter },
    });
    if (loginError) throw new Error(loginError.message);

    const { data: saved, error: saveError } = await context.supabase.from("profiles").update({
      team_id: team.id, login_id: newLoginId, updated_by: context.userId,
    }).eq("id", data.userId).eq("login_id", profile.login_id).select("id, team_id, login_id").maybeSingle();
    if (saveError || saved?.team_id !== team.id || saved.login_id !== newLoginId) {
      const { error: rollbackError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ...(synthesized && oldEmail ? { email: oldEmail, email_confirm: true } : {}),
        user_metadata: { login_id: oldMeta.login_id ?? null, team_letter: oldMeta.team_letter ?? null },
      });
      if (rollbackError) {
        console.error("[Member reassignment] Sign-in rollback failed", data.userId, rollbackError);
        throw new Error("Member team change could not finish. Check the member’s login details before retrying.");
      }
      throw new Error(saveError?.message ?? "Member changed during the request. Please refresh and retry.");
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "change_member_team",
      entity_type: "profile",
      entity_id: data.userId,
      previous_value: { team_id: profile.team_id, login_id: profile.login_id },
      new_value: { team_id: team.id, login_id: newLoginId, team_letter: team.letter },
    });

    return { ok: true as const, loginId: newLoginId, teamLetter: team.letter };
  });

/* ================================================================== */
/* Member detail                                                       */
/* ================================================================== */

const idSchema = z.object({ userId: z.string().uuid() });

export const getMemberDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw new Error("Member not found");

    const { data: team } = profile.team_id
      ? await supabaseAdmin
          .from("teams")
          .select("id, letter, name, leader_id, status")
          .eq("id", profile.team_id)
          .maybeSingle()
      : { data: null };

    const { data: leader } = team?.leader_id
      ? await supabaseAdmin
          .from("profiles")
          .select("id, full_name, mobile_number, avatar_url")
          .eq("id", team.leader_id)
          .maybeSingle()
      : { data: null };

    const [
      { data: customers },
      { data: sales },
      { data: txns },
      { data: withdrawals },
      { data: tips },
      { data: audit },
    ] = await Promise.all([
      supabaseAdmin
        .from("customers")
        .select("id, full_name, mobile_number, status, created_at")
        .eq("assigned_member_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("sales")
        .select(
          "id, sale_number, deal_value, sale_status, approval_status, buyer_name, unit_label, created_at, approval_at",
        )
        .eq("seller_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("commission_transactions")
        .select("id, txn_number, sale_id, member_amount, tip_amount, status, created_at")
        .eq("member_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("withdrawals")
        .select("id, reference_number, amount, status, requested_at, completed_at")
        .eq("user_id", profile.id)
        .order("requested_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("tip_persons")
        .select("*")
        .eq("member_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, metadata, new_value, created_at, actor_id")
        .eq("entity_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    // Aggregates
    const approved = (sales ?? []).filter((s) => s.approval_status === "approved");
    const pending = (sales ?? []).filter((s) =>
      ["pending", "submitted", "changes_requested"].includes(String(s.approval_status)),
    );
    const draft = (sales ?? []).filter((s) =>
      ["draft", "flat_locked"].includes(String(s.sale_status)),
    );
    const cancelled = (sales ?? []).filter((s) =>
      ["cancelled", "rejected"].includes(String(s.approval_status)),
    );
    const revenue = approved.reduce((a, s) => a + Number(s.deal_value ?? 0), 0);
    const highestSale = approved.reduce((m, s) => Math.max(m, Number(s.deal_value ?? 0)), 0);
    const avgSale = approved.length ? revenue / approved.length : 0;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const inWindow = (from: string) =>
      approved
        .filter((s) => (s.approval_at ?? s.created_at) >= from)
        .reduce((a, s) => a + Number(s.deal_value ?? 0), 0);

    const activeTxns = (txns ?? []).filter((t) => t.status !== "reversed");
    const memberCommission = activeTxns.reduce((a, t) => a + Number(t.member_amount ?? 0), 0);
    const pendingCommission = activeTxns
      .filter((t) => t.status === "pending")
      .reduce((a, t) => a + Number(t.member_amount ?? 0), 0);
    const approvedCommission = activeTxns
      .filter((t) => t.status === "credited" || t.status === "approved")
      .reduce((a, t) => a + Number(t.member_amount ?? 0), 0);
    const tipEarned = activeTxns.reduce((a, t) => a + Number(t.tip_amount ?? 0), 0);

    const wSummary = {
      pending: (withdrawals ?? []).filter((w) => w.status === "pending").length,
      approved: (withdrawals ?? []).filter((w) => w.status === "approved").length,
      processing: (withdrawals ?? []).filter((w) => w.status === "processing").length,
      completed: (withdrawals ?? []).filter((w) => w.status === "completed").length,
      rejected: (withdrawals ?? []).filter((w) => w.status === "rejected").length,
      cancelled: (withdrawals ?? []).filter((w) => w.status === "cancelled").length,
    };

    return {
      profile,
      team,
      leader,
      customers: customers ?? [],
      customerCount: customers?.length ?? 0,
      sales: sales ?? [],
      salesSummary: {
        approved: approved.length,
        pending: pending.length,
        draft: draft.length,
        cancelled: cancelled.length,
        revenue,
        highestSale,
        avgSale,
        today: inWindow(startOfDay),
        month: inWindow(startOfMonth),
        year: inWindow(startOfYear),
      },
      transactions: txns ?? [],
      commissionSummary: {
        total: memberCommission,
        pending: pendingCommission,
        approved: approvedCommission,
        tips: tipEarned,
      },
      withdrawals: withdrawals ?? [],
      withdrawalSummary: wSummary,
      tipPersons: tips ?? [],
      audit: audit ?? [],
    };
  });

/* ================================================================== */
/* Delete tip person (super admin)                                     */
/* ================================================================== */

export const deleteTipPerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tipId: string }) => z.object({ tipId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tip_persons").delete().eq("id", data.tipId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
