import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Wallet,
  Bell,
  Coins,
  Clock,
  BadgeCheck,
  Layers,
  Building2,
  TrendingUp,
  Trophy,
  BarChart3,
  MapPin,
} from "lucide-react";
import { DashboardFocus, DashboardOverview, DashboardPageHeading, DashboardTrend, DashboardWallet } from "@/components/aawash/dashboard/ArchitecturalDashboard";
import { useSession } from "@/hooks/useSession";
import { RoleGuard } from "@/components/aawash/AuthGuard";
import { formatINR } from "@/components/aawash/dashboard-kit";
import { greetingName } from "@/lib/greeting";
import {
  EcoShell,
  LightPanel,
  EcoRows,
  EcoZero,
  Avatar,
} from "@/components/aawash/dashboard/EcoKit";
import {
  getLeaderOverview,
  getLeaderTrend,
  getTeamLeaderboard,
  listTeamSales,
  listTeamCommissions,
  listProjects,
  listMyNotifications,
} from "@/lib/leader.functions";
import { getMyTeamLeaderboard } from "@/lib/member.functions";
import { listMyTeamMembers } from "@/lib/admin.functions";
import { ProjectFlatsSnapshot } from "@/components/aawash/dashboard/ProjectFlatsSnapshot";

export const Route = createFileRoute("/_authenticated/leader/")({
  component: LeaderHome,
  head: () => ({
    meta: [
      { title: "Team Leader Dashboard — Aawaash" },
      {
        name: "description",
        content:
          "Lead your Aawaash sales team: live team revenue, commissions, member leaderboard and project inventory in one command centre.",
      },
      { property: "og:title", content: "Team Leader Dashboard — Aawaash" },
      {
        property: "og:description",
        content:
          "Live team revenue, commissions, leaderboard and inventory for Aawaash team leaders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LeaderHome() {
  return (
    <RoleGuard allow={["team_leader", "super_admin"]}>
      <LeaderContent />
    </RoleGuard>
  );
}

function LeaderContent() {
  const { profile, loading } = useSession();
  const displayName = greetingName(profile?.full_name, loading || !profile);

  const overviewFn = useServerFn(getLeaderOverview);
  const trendFn = useServerFn(getLeaderTrend);
  const membersFn = useServerFn(listMyTeamMembers);
  const boardFn = useServerFn(getTeamLeaderboard);
  const rankFn = useServerFn(getMyTeamLeaderboard);
  const salesFn = useServerFn(listTeamSales);
  const commsFn = useServerFn(listTeamCommissions);
  const projectsFn = useServerFn(listProjects);
  const notifFn = useServerFn(listMyNotifications);

  const overview = useQuery({ queryKey: ["leader", "overview"], queryFn: () => overviewFn() });
  const trend = useQuery({ queryKey: ["leader", "trend"], queryFn: () => trendFn() });
  const members = useQuery({ queryKey: ["leader", "members"], queryFn: () => membersFn() });
  const board = useQuery({ queryKey: ["leader", "board"], queryFn: () => boardFn() });
  const standings = useQuery({ queryKey: ["leader", "standings"], queryFn: () => rankFn() });
  const leaderRank = standings.data?.members.find(entry => entry.id === standings.data?.meId)?.rank ?? null;
  const sales = useQuery({ queryKey: ["leader", "sales"], queryFn: () => salesFn() });
  const comms = useQuery({ queryKey: ["leader", "commissions"], queryFn: () => commsFn() });
  const projects = useQuery({ queryKey: ["leader", "projects"], queryFn: () => projectsFn() });
  const notifs = useQuery({ queryKey: ["leader", "notifications"], queryFn: () => notifFn() });

  const o = overview.data;
  const unread = (notifs.data ?? []).filter((n) => !n.is_read).length;
  const memberList = members.data ?? [];
  const topMembers = (board.data ?? []).slice(0, 5);
  const months = trend.data?.months ?? [];

  const target = Math.max(1, Number(o?.totalRevenue ?? 0) * 1.4 || 1);
  const activeMembers = memberList.filter((m) => m.status === "active").length;
  const activePct = o?.memberCount ? Math.round((activeMembers / o.memberCount) * 100) : 0;
  const rankPct = Math.max(
    activePct,
    Math.min(100, Math.round((Number(o?.totalRevenue ?? 0) / target) * 100)),
  );

  return (
    <EcoShell role="team_leader" profile={profile} architectural unread={unread}>
      <DashboardFocus
        name={displayName}
        rank={{
          label: "Team Rank",
          percent: rankPct,
          rank: leaderRank,
          total: standings.data?.members.length ?? 0,
          loading: overview.isLoading || members.isLoading || standings.isLoading,
          info: "Rank is your sales position among active people in your team. Progress reflects team activity and revenue.",
        }}
        metrics={[
          { icon: <TrendingUp />, label: "Total Sales", value: String(o?.salesCount ?? 0), to: "/leader/analytics", loading: overview.isLoading },
          { icon: <Wallet />, label: "Wallet", value: formatINR(profile?.wallet_balance, { compact: true }), to: "/leader/withdrawals" },
          { icon: <Users />, label: "Active Members", value: String(activeMembers), to: "/leader/members", loading: members.isLoading },
          { icon: <Building2 />, label: "Projects", value: String(projects.data?.length ?? 0), to: "/leader/projects", loading: projects.isLoading },
        ]}
        quick={[
          { icon: <Users />, label: "Members", value: String(o?.memberCount ?? 0), to: "/leader/members", loading: overview.isLoading },
          { icon: <Wallet />, label: "Withdraw", value: formatINR(o?.pendingWithdrawals ?? 0, { compact: true }), to: "/leader/withdrawals", loading: overview.isLoading },
          { icon: <BarChart3 />, label: "Analytics", value: "Open", to: "/leader/analytics" },
          { icon: <Bell />, label: "Alerts", value: String(unread), to: "/leader/notifications", loading: notifs.isLoading },
        ]}
        highlights={[
          { icon: <Coins />, label: "Total Commission Earned", value: formatINR(o?.totalCommission, { compact: true }), to: "/leader/analytics", loading: overview.isLoading },
          { icon: <BarChart3 />, label: "Team Sales", value: formatINR(o?.totalRevenue, { compact: true }), to: "/leader/analytics", loading: overview.isLoading },
        ]}
        projectsTo="/leader/projects"
        placeholder="Search members, sales or projects…"
        destinations={[
          { label: "Members", to: "/leader/members", keywords: "team people" },
          { label: "Sales analytics", to: "/leader/analytics", keywords: "revenue deals" },
          { label: "Projects", to: "/leader/projects", keywords: "property inventory flats" },
          { label: "Wallet & withdrawals", to: "/leader/withdrawals", keywords: "payouts" },
          ...memberList.map(member => ({ label: member.full_name, to: `/leader/members/${member.id}`, keywords: member.login_id ?? "" })),
          ...(projects.data ?? []).map(project => ({ label: project.name, to: "/leader/projects", keywords: project.location })),
          ...(sales.data ?? []).map(sale => ({ label: `Sale · ${sale.buyer_name}`, to: "/leader/analytics", keywords: sale.unit_label ?? "" })),
        ]}
      />

      <DashboardOverview title="Team Overview" active={activePct} stats={[
        { label: "Members", value: String(activeMembers), amount: activeMembers, hint: "Active" },
        { label: "Sales", value: String(o?.salesCount ?? 0), amount: o?.salesCount ?? 0, hint: "Recorded" },
        { label: "Payouts", value: formatINR(o?.approvedWithdrawals ?? 0, { compact: true }), amount: o?.approvedWithdrawals ?? 0, hint: "Approved" },
      ]} />
      <DashboardTrend months={months} loading={trend.isLoading} />
      <section className="arch-wallet-section">
        <DashboardPageHeading title="Wallet & Payouts" description="Manage your earnings and withdrawals." />
        <DashboardWallet balance={formatINR(profile?.wallet_balance)}
          withdrawTo="/leader/withdrawals" withdrawHash="request-withdrawal" walletTo="/leader/withdrawals" stats={[
            { label: "Approved", value: formatINR(o?.approvedWithdrawals), icon: <BadgeCheck /> },
            { label: "Pending withdrawal", value: formatINR(o?.pendingWithdrawals), icon: <Clock /> },
            { label: "Lifetime earnings", value: formatINR(profile?.total_earnings), icon: <Layers /> },
            { label: "This month", value: formatINR(o?.monthlyCommission), icon: <BarChart3 /> },
            { label: "Pending commission", value: formatINR(o?.pendingCommission), icon: <Coins /> },
          ]} />
      </section>

      <section className="mt-4 sm:mt-5">
        <LightPanel
          title="Flats at a glance"
          action={<Link to="/leader/projects" className="text-[12px] font-semibold text-primary">Open inventory</Link>}
        >
          <ProjectFlatsSnapshot projects={projects.data ?? []} />
        </LightPanel>
      </section>

      {/* ---------------- Leaderboard + members ---------------- */}
      <section className="mt-4 sm:mt-5 grid gap-4 lg:grid-cols-2">
        <LightPanel
          title="Team Leaderboard"
          action={
            <Link to="/leader/leaderboard" className="text-[12px] font-semibold text-primary">
              View all
            </Link>
          }
        >
          {board.isLoading ? (
            <EcoRows rows={4} />
          ) : topMembers.length === 0 ? (
            <EcoZero
              icon={<Trophy size={22} />}
              title="Ranking slots are live"
              body="They fill the moment your members close their first sale."
              cta={{ label: "Your members", to: "/leader/members" }}
            />
          ) : (
            <ol className="flex flex-col gap-3.5">
              {topMembers.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[12px] font-bold text-primary">
                    {m.rank}
                  </span>
                  <Avatar name={m.full_name} src={m.avatar_url} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-foreground">
                      {m.full_name}
                    </div>
                    <div className="truncate text-[11px] font-light text-muted-foreground">
                      {m.login_id}
                    </div>
                  </div>
                  <div className="shrink-0 text-[13px] font-bold text-foreground">
                    {formatINR(m.total_sales, { compact: true })}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </LightPanel>

        <LightPanel
          title="Your Members"
          action={
            <Link to="/leader/members" className="text-[12px] font-semibold text-primary">
              View all
            </Link>
          }
        >
          {members.isLoading ? (
            <EcoRows rows={4} />
          ) : memberList.length === 0 ? (
            <EcoZero
              icon={<Users size={22} />}
              title="No members yet"
              body="Ask your Super Admin to add members to your team — they show up here instantly."
              cta={{ label: "Team page", to: "/leader/members" }}
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {memberList.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <Link
                    to="/leader/members/$id"
                    params={{ id: m.id }}
                    className="flex items-center gap-3 rounded-[22px] bg-surface-warm p-2.5 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <Avatar name={m.full_name} size={34} online={m.status === "active"} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-foreground">
                        {m.full_name}
                      </div>
                      <div className="truncate text-[10.5px] font-light text-muted-foreground">
                        {m.login_id}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </LightPanel>
      </section>

      {/* ---------------- Footer CTA ---------------- */}
      <section className="mt-4 sm:mt-5">
        <Link
          to="/leader/analytics"
          className="flex items-center gap-3 rounded-[28px] bg-surface p-4 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-forest to-forest-deep text-forest-foreground">
            <BarChart3 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold text-foreground">Deep-dive team analytics</div>
            <div className="truncate text-[11px] font-light text-muted-foreground">
              Conversion, funnel and member-by-member performance.
            </div>
          </div>
          <MapPin size={16} className="shrink-0 text-muted-foreground" />
        </Link>
      </section>
    </EcoShell>
  );
}
