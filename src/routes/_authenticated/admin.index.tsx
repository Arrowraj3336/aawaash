import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, Building2, ClipboardList,
  Coins, Files, LayoutGrid, Settings2, UserCog, UserPlus, Users, Wallet,
} from "lucide-react";
import { getAdminOverview } from "@/lib/admin-overview.functions";
import { WalletQuickPanel } from "@/components/aawash/admin/WalletQuickPanel";
import { formatINR } from "@/components/aawash/dashboard-kit";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Workspace — Aawaash Admin" }] }),
});

const modules = [
  { title: "Website", icon: LayoutGrid, links: [
    { label: "Edit homepage", to: "/admin/homepage" },
    { label: "Pages and builder", to: "/admin/cms/pages" },
    { label: "Brand and theme", to: "/admin/cms/brand" },
    { label: "Global content", to: "/admin/cms/global" },
    { label: "Media library", to: "/admin/media" },
  ] },
  { title: "Projects and sales", icon: Building2, links: [
    { label: "Manage projects and inventory", to: "/admin/projects" },
    { label: "Add a project", to: "/admin/projects/new" },
    { label: "Sales workflow", to: "/sales-workflow" },
    { label: "Customers", to: "/admin/customers" },
  ] },
  { title: "People", icon: Users, links: [
    { label: "Team leaders", to: "/admin/team-leaders" },
    { label: "Members", to: "/admin/members" },
    { label: "User directory", to: "/admin/users" },
  ] },
  { title: "Finance", icon: Wallet, links: [
    { label: "Wallets, ledger and reconciliation", to: "/admin/finance" },
    { label: "Commission rates and transactions", to: "/admin/commissions" },
    { label: "Withdrawal requests", to: "/admin/withdrawals" },
  ] },
  { title: "Reporting", icon: Files, links: [
    { label: "Analytics", to: "/admin/analytics" },
    { label: "Reports and exports", to: "/admin/reports" },
    { label: "System health", to: "/admin/system" },
  ] },
  { title: "Account", icon: Settings2, links: [
    { label: "Notifications", to: "/admin/notifications" },
    { label: "My profile", to: "/admin/profile" },
  ] },
] as const;

function AdminDashboard() {
  const fetchOverview = useServerFn(getAdminOverview);
  const overview = useQuery({
    queryKey: ["admin", "overview"], queryFn: () => fetchOverview(), staleTime: 45_000,
  });
  const [walletOpen, setWalletOpen] = useState(false);
  const data = overview.data;
  const metrics = [
    { label: "Projects", value: data?.projects_total, icon: Building2 },
    { label: "Available flats", value: data?.flats_available, icon: LayoutGrid },
    { label: "Team leaders", value: data?.team_leaders, icon: UserCog },
    { label: "Members", value: data?.members, icon: Users },
    { label: "Sales this month", value: data?.sales_month, icon: ClipboardList },
    { label: "Available wallet balance", value: data ? formatINR(data.wallet_available_total, { compact: true }) : undefined, icon: Coins },
  ];

  return (
    <div className="workspace-home">
      <header className="workspace-welcome">
        <div>
          <h1>Admin workspace</h1>
          <p>Manage properties, people, sales and the public website.</p>
        </div>
        <a className="workspace-public-link" href="/" target="_blank" rel="noreferrer">View website <ArrowUpRight size={16} aria-hidden="true" /></a>
      </header>

      <nav className="workspace-actions" aria-label="Common admin actions">
        <Link to="/admin/projects/new"><Building2 aria-hidden="true" /> Add project</Link>
        <Link to="/admin/team-leaders/new"><UserCog aria-hidden="true" /> Add leader</Link>
        <Link to="/admin/members/new"><UserPlus aria-hidden="true" /> Add member</Link>
        <button type="button" onClick={() => setWalletOpen(true)}><ArrowDownLeft aria-hidden="true" /> Adjust wallet</button>
      </nav>

      {overview.isError && <p className="workspace-load-error" role="alert">Overview could not be loaded. <button type="button" onClick={() => void overview.refetch()}>Retry</button></p>}
      <dl className="workspace-metrics" aria-label="Business overview" aria-busy={overview.isLoading}>
        {metrics.map(({ icon: Icon, label, value }) => <div key={label}>
          <Icon size={17} aria-hidden="true" /><dt>{label}</dt><dd>{value ?? "—"}</dd>
        </div>)}
      </dl>

      <section aria-labelledby="workspace-tools">
        <h2 id="workspace-tools">Workspace tools</h2>
        <div className="workspace-modules">
          {modules.map(({ title, icon: Icon, links }) => <section key={title} className="workspace-module">
            <h3><Icon size={19} aria-hidden="true" /> {title}</h3>
            <ul>{links.map(({ label, to }) => <li key={to}>
              <Link to={to}>{label}<ArrowRight size={15} aria-hidden="true" /></Link>
            </li>)}</ul>
          </section>)}
        </div>
      </section>

      {data?.activity.length ? <section aria-labelledby="workspace-activity" className="workspace-activity">
        <h2 id="workspace-activity"><Activity size={19} aria-hidden="true" /> Recent activity</h2>
        <ul>{data.activity.slice(0, 6).map(item => <li key={item.id}>
          <span>{item.action.replaceAll("_", " ")}</span>
          <time dateTime={item.created_at}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(item.created_at))}</time>
        </li>)}</ul>
      </section> : null}
      {walletOpen && <WalletQuickPanel open onClose={() => setWalletOpen(false)} />}
    </div>
  );
}
