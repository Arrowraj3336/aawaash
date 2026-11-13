/**
 * Team Leader Management — server functions (Super Admin only).
 *
 * Single source of truth for Team Leader CRUD, team assignment, status,
 * password reset, and aggregated read models (stats, members, sales,
 * commissions, wallet, withdrawals, activity).
 *
 * Every state-changing endpoint follows the auth pattern:
 *   1. requireSupabaseAuth (bearer verified)
 *   2. verify caller is super_admin via context.supabase RPC
 *   3. only then load supabaseAdmin for privileged Auth Admin work
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasUsableFirstName, normalizeFullName } from "@/lib/greeting";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchAllRows, fetchRowsForIds } from "./supabase-rows";
import { compareTeamCodes } from "@/lib/team-policy";

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

async function readLimits(admin: import("@supabase/supabase-js").SupabaseClient) {
  void admin;
  // Team Leaders are unlimited — `null` means "no cap".
  return { maxTeamLeaders: null as number | null };
}

/* ================================================================== */
/* System limits                                                       */
/* ================================================================== */

export const getTeamLimits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const limits = await readLimits(supabaseAdmin);
    const { count: leadersCount } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "team_leader");
    return { ...limits, currentTeamLeaders: leadersCount ?? 0 };
  });

/* ================================================================== */
/* List Team Leaders                                                   */
/* ================================================================== */

export const listTeamLeaders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [teams, leaderRoles] = await Promise.all([
      fetchAllRows((from, to) => supabaseAdmin.from("teams").select("id, letter, name, leader_id, is_deleted")
        .eq("is_deleted", false).order("letter").range(from, to)),
      fetchAllRows((from, to) => supabaseAdmin.from("user_roles").select("user_id")
        .eq("role", "team_leader").order("user_id").range(from, to)),
    ]);
    const activeTeams = teams.sort((a, b) => compareTeamCodes(a.letter, b.letter));
    const leaderIds = leaderRoles.map(role => role.user_id);
    const profiles = await fetchRowsForIds(leaderIds, (ids, from, to) => supabaseAdmin.from("profiles")
      .select("id, display_code, full_name, mobile_number, login_id, email, avatar_url, team_id, status, is_active, is_deleted, joining_date, wallet_balance, total_earnings, total_sales, metrics_override, last_login_at, created_at")
      .in("id", ids).order("id").range(from, to));
    profiles.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const teamById = new Map(activeTeams.map((t) => [t.id, t]));

    // Member counts per team (excluding the leader)
    const teamIds = [...new Set(profiles.flatMap(profile => profile.team_id ? [profile.team_id] : []))];
    const leaderIdSet = new Set(leaderIds);
    const memberCounts = new Map<string, number>();
    if (teamIds.length) {
      const members = await fetchRowsForIds(teamIds, (ids, from, to) =>
        supabaseAdmin
          .from("profiles")
          .select("team_id, id")
          .in("team_id", ids)
          .eq("is_deleted", false)
          .order("id")
          .range(from, to),
      );
      members.forEach((m) => {
        if (!m.team_id) return;
        if (leaderIdSet.has(m.id)) return;
        memberCounts.set(m.team_id, (memberCounts.get(m.team_id) ?? 0) + 1);
      });
    }

    // Aggregated sales / commission per leader
    const [sales, commissions] = await Promise.all([
      fetchRowsForIds(leaderIds, (ids, from, to) => supabaseAdmin.from("sales")
        .select("leader_id, deal_value, sale_status, approval_status").in("leader_id", ids).order("id").range(from, to)),
      fetchRowsForIds(leaderIds, (ids, from, to) => supabaseAdmin.from("commission_transactions")
        .select("leader_id, net_leader, status").in("leader_id", ids).order("id").range(from, to)),
    ]);
    const sumBy = <T,>(rows: T[] | null | undefined, key: (r: T) => string | null, val: (r: T) => number) => {
      const m = new Map<string, number>();
      (rows ?? []).forEach((r) => {
        const k = key(r);
        if (!k) return;
        m.set(k, (m.get(k) ?? 0) + Number(val(r) ?? 0));
      });
      return m;
    };
    const revenueMap = sumBy(
      (sales ?? []).filter((s) => s.approval_status === "approved"),
      (s) => s.leader_id,
      (s) => Number(s.deal_value ?? 0),
    );
    const salesCountMap = new Map<string, number>();
    (sales ?? [])
      .filter((s) => s.approval_status === "approved")
      .forEach((s) => {
        if (!s.leader_id) return;
        salesCountMap.set(s.leader_id, (salesCountMap.get(s.leader_id) ?? 0) + 1);
      });
    const commissionMap = sumBy(
      (commissions ?? []).filter((c) => c.status !== "reversed"),
      (c) => c.leader_id,
      (c) => Number(c.net_leader ?? 0),
    );

    const leaders = (profiles ?? []).map((p) => {
      const team = p.team_id ? teamById.get(p.team_id) : null;
      const ov = ((p as { metrics_override?: Record<string, unknown> }).metrics_override ?? {}) as Record<string, unknown>;
      const pick = (key: string, fallback: number) =>
        ov[key] === undefined || ov[key] === null ? fallback : Number(ov[key]);
      return {
        ...p,
        team_letter: team?.letter ?? null,
        team_name: team?.name ?? null,
        member_count: pick("member_count", p.team_id ? memberCounts.get(p.team_id) ?? 0 : 0),
        sales_count: pick("sales_count", salesCountMap.get(p.id) ?? 0),
        total_revenue: pick("total_revenue", revenueMap.get(p.id) ?? 0),
        total_commission: pick("total_commission", commissionMap.get(p.id) ?? 0),
      };
    });

    return { leaders, teams: activeTeams };
  });

/* ================================================================== */
/* Create Team Leader (enterprise form)                                */
/* ================================================================== */

const fullNameSchema = z
  .string()
  .transform(normalizeFullName)
  .refine((v) => v.length >= 2 && v.length <= 80, "Full name must be 2-80 characters")
  .refine(hasUsableFirstName, "Enter a real first name (letters only), e.g. Ravi Kumar");

const createSchema = z.object({
  fullName: fullNameSchema,
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  password: z.string().min(8).max(72),
  /** Existing empty team, or omit / "new" to auto-create the next team. */
  teamId: z.string().uuid().optional().or(z.literal("new")).or(z.literal("")),
  teamName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  avatarUrl: z.string().trim().url().max(600).optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  remarks: z.string().trim().max(600).optional().or(z.literal("")),
});

export const createTeamLeaderFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createNumberedTeam, ensureAvailableLogin, provisionAccount, teamFields } =
      await import("@/lib/account-provisioning.server");
    await ensureAvailableLogin(supabaseAdmin, data.mobile, data.mobile);

    const existingId = data.teamId && data.teamId !== "new" ? data.teamId : null;
    let team;
    if (existingId) {
      const { data: row, error } = await supabaseAdmin.from("teams").select(teamFields).eq("id", existingId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!row || row.is_deleted) throw new Error("Selected team no longer exists.");
      if (row.leader_id) throw new Error(`Team ${row.letter} already has a Team Leader.`);
      team = row;
    } else {
      team = await createNumberedTeam(supabaseAdmin, context.userId, data.teamName);
    }

    try {
      return await provisionAccount(supabaseAdmin, {
        ...data, loginId: data.mobile, role: "team_leader", team, actor: context.userId,
        profile: {
          email: data.email || null, avatar_url: data.avatarUrl || null,
          address: data.address || null, remarks: data.remarks || null,
          joining_date: data.joiningDate || null,
        },
      });
    } catch (failure) {
      if (!existingId) {
        const { error } = await supabaseAdmin.from("teams").delete().eq("id", team.id).is("leader_id", null);
        if (error) console.error("[Account provisioning] Empty team cleanup failed", team.id, error);
      }
      throw failure;
    }
  });

/* ================================================================== */
/* Update Team Leader profile                                          */
/* ================================================================== */

const updateProfileSchema = z.object({
  userId: z.string().uuid(),
  fullName: fullNameSchema.optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  avatarUrl: z.string().trim().url().max(600).optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  remarks: z.string().trim().max(600).optional().or(z.literal("")),
  teamName: z.string().trim().min(2).max(80).optional(),
});

export const updateTeamLeader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateProfileSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, team_id, full_name, email, address, avatar_url, joining_date, remarks")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("Team Leader not found");

    const updates: Record<string, unknown> = { updated_by: context.userId };
    if (data.fullName !== undefined) updates.full_name = data.fullName;
    if (data.email !== undefined)
      updates.email = data.email.length > 0 ? data.email : null;
    if (data.address !== undefined)
      updates.address = data.address.length > 0 ? data.address : null;
    if (data.avatarUrl !== undefined)
      updates.avatar_url = data.avatarUrl.length > 0 ? data.avatarUrl : null;
    if (data.joiningDate !== undefined)
      updates.joining_date = data.joiningDate.length > 0 ? data.joiningDate : null;
    if (data.remarks !== undefined)
      updates.remarks = data.remarks.length > 0 ? data.remarks : null;

    const { data: saved, error } = await context.supabase.from("profiles").update(updates as never)
      .eq("id", data.userId).select("id").maybeSingle();
    if (error || !saved) throw new Error(error?.message ?? "The account changes were not saved.");

    if (data.teamName && profile.team_id) {
      const { data: renamed, error: renameError } = await supabaseAdmin.from("teams")
        .update({ name: data.teamName, updated_by: context.userId })
        .eq("id", profile.team_id).eq("leader_id", data.userId).select("id").maybeSingle();
      if (renameError || !renamed) {
        throw new Error("The profile was saved, but the team name could not be updated.");
      }
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "update_team_leader",
      entity_type: "profile",
      entity_id: data.userId,
      new_value: updates as never,
      previous_value: profile,
    });

    return { ok: true as const };
  });

/* ================================================================== */
/* Team Leader detail (profile + aggregated read models)               */
/* ================================================================== */

const idSchema = z.object({ userId: z.string().uuid() });

export const getTeamLeaderDetail = createServerFn({ method: "GET" })
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
    if (!profile) throw new Error("Team Leader not found");

    const { data: team } = profile.team_id
      ? await supabaseAdmin
          .from("teams")
          .select("id, letter, name, description, status")
          .eq("id", profile.team_id)
          .maybeSingle()
      : { data: null };

    const membersQuery = supabaseAdmin
      .from("profiles")
      .select(
        "id, display_code, full_name, mobile_number, login_id, avatar_url, status, is_active, total_sales, total_earnings, referral_count, last_login_at, created_at",
      )
      .eq("team_id", profile.team_id ?? "00000000-0000-0000-0000-000000000000")
      .eq("is_deleted", false)
      .neq("id", profile.id)
      .order("created_at", { ascending: false });

    const [{ data: members }, { data: sales }, { data: txns }, { data: withdrawals }, { data: audit }] =
      await Promise.all([
        membersQuery,
        supabaseAdmin
          .from("sales")
          .select(
            "id, sale_number, deal_value, sale_status, approval_status, seller_id, customer_id, buyer_name, unit_label, created_at, approval_at",
          )
          .eq("leader_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabaseAdmin
          .from("commission_transactions")
          .select(
            "id, txn_number, sale_id, leader_gross, net_leader, member_amount, bonus_amount, status, created_at",
          )
          .eq("leader_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabaseAdmin
          .from("withdrawals")
          .select("id, reference_number, amount, status, requested_at, completed_at, admin_notes")
          .eq("user_id", profile.id)
          .order("requested_at", { ascending: false })
          .limit(100),
        supabaseAdmin
          .from("audit_logs")
          .select("id, action, entity_type, entity_id, metadata, new_value, created_at, actor_id")
          .eq("entity_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);


    const customerCount = profile.team_id
      ? (
          await supabaseAdmin
            .from("customers")
            .select("*", { count: "exact", head: true })
            .eq("team_id", profile.team_id)
        ).count ?? 0
      : 0;

    // Sales aggregates
    const approvedSales = (sales ?? []).filter((s) => s.approval_status === "approved");
    const pendingSales = (sales ?? []).filter((s) =>
      ["pending", "submitted", "changes_requested"].includes(String(s.approval_status)),
    );
    const draftSales = (sales ?? []).filter((s) => s.sale_status === "draft" || s.sale_status === "flat_locked");
    const cancelledSales = (sales ?? []).filter((s) =>
      ["cancelled", "rejected"].includes(String(s.approval_status)),
    );
    const revenue = approvedSales.reduce((a, s) => a + Number(s.deal_value ?? 0), 0);
    const highestSale = approvedSales.reduce((m, s) => Math.max(m, Number(s.deal_value ?? 0)), 0);
    const avgSale = approvedSales.length ? revenue / approvedSales.length : 0;

    // Time windows
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const inWindow = (from: string) =>
      approvedSales
        .filter((s) => (s.approval_at ?? s.created_at) >= from)
        .reduce((a, s) => a + Number(s.deal_value ?? 0), 0);

    // Commission aggregates
    const activeTxns = (txns ?? []).filter((t) => t.status !== "reversed");
    const totalCommission = activeTxns.reduce((a, t) => a + Number(t.net_leader ?? 0), 0);
    const pendingCommission = activeTxns
      .filter((t) => t.status === "pending")
      .reduce((a, t) => a + Number(t.net_leader ?? 0), 0);
    const approvedCommission = activeTxns
      .filter((t) => t.status === "credited" || t.status === "approved")
      .reduce((a, t) => a + Number(t.net_leader ?? 0), 0);
    const memberCommission = activeTxns.reduce((a, t) => a + Number(t.member_amount ?? 0), 0);
    const bonusTotal = activeTxns.reduce((a, t) => a + Number(t.bonus_amount ?? 0), 0);

    // Withdrawal aggregates
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
      customerCount,
      members: members ?? [],
      sales: sales ?? [],
      salesSummary: {
        approved: approvedSales.length,
        pending: pendingSales.length,
        draft: draftSales.length,
        cancelled: cancelledSales.length,
        revenue,
        highestSale,
        avgSale,
        today: inWindow(startOfDay),
        month: inWindow(startOfMonth),
        year: inWindow(startOfYear),
      },
      transactions: txns ?? [],
      commissionSummary: {
        total: totalCommission,
        pending: pendingCommission,
        approved: approvedCommission,
        memberShare: memberCommission,
        bonus: bonusTotal,
      },
      withdrawals: withdrawals ?? [],
      withdrawalSummary: wSummary,
      audit: audit ?? [],
    };
  });

/* ================================================================== */
/* Admin metric overrides + delete                                     */
/* ================================================================== */

const metricsSchema = z.object({
  userId: z.string().uuid(),
  salesCount: z.number().min(0).max(1_000_000).nullable().optional(),
  walletBalance: z.number().min(0).max(1_000_000_000).nullable().optional(),
  totalCommission: z.number().min(0).max(1_000_000_000).nullable().optional(),
  totalRevenue: z.number().min(0).max(1_000_000_000_000).nullable().optional(),
  memberCount: z.number().min(0).max(10_000).nullable().optional(),
});

/**
 * Super-admin override of a Team Leader's headline analytics.
 * Values are stored in `profiles.metrics_override`; `null` clears the
 * override and falls back to the computed value. Finance owns wallet mutations.
 */
export const setLeaderMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => metricsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, metrics_override, wallet_balance")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("Team Leader not found");

    const prev = ((profile as { metrics_override?: Record<string, unknown> }).metrics_override ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = { ...prev };
    const apply = (key: string, value: number | null | undefined) => {
      if (value === undefined) return;
      if (value === null) delete next[key];
      else next[key] = value;
    };
    apply("sales_count", data.salesCount);
    apply("total_commission", data.totalCommission);
    apply("total_revenue", data.totalRevenue);
    apply("member_count", data.memberCount);

    const updates: Record<string, unknown> = {
      metrics_override: next,
      updated_by: context.userId,
    };
    if (data.walletBalance != null && data.walletBalance !== Number(profile.wallet_balance ?? 0)) {
      throw new Error("Use Finance → Wallets to post a ledger-backed wallet adjustment.");
    }

    const { data: saved, error } = await context.supabase.from("profiles").update(updates as never)
      .eq("id", data.userId).select("id").maybeSingle();
    if (error || !saved) throw new Error(error?.message ?? "The account changes were not saved.");

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "set_leader_metrics",
      entity_type: "profile",
      entity_id: data.userId,
      previous_value: { metrics_override: prev, wallet_balance: profile.wallet_balance } as never,
      new_value: updates as never,
    });

    return { ok: true as const };
  });

/**
 * Soft-delete a Team Leader: revokes the role, detaches the team, and
 * deactivates the profile. History (sales, commissions) is preserved.
 */
export const deleteTeamLeader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, team_id, login_id")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("Team Leader not found");

    if (profile.team_id) {
      await supabaseAdmin
        .from("teams")
        .update({ leader_id: null, updated_by: context.userId } as never)
        .eq("id", profile.team_id);
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "team_leader");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_deleted: true,
        is_active: false,
        status: "suspended",
        team_id: null,
        updated_by: context.userId,
      } as never)
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: "876000h" }).catch(() => undefined);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "delete_team_leader",
      entity_type: "profile",
      entity_id: data.userId,
      previous_value: profile as never,
    });

    return { ok: true as const };
  });
