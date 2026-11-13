import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Building2, Users, TrendingUp, Wallet, User } from "lucide-react";

import { SplitDock } from "@/components/aawash/SplitDock";
import type { AppRole } from "@/lib/auth";
import { DOCK_DURATION_MS, DOCK_EASE } from "@/components/aawash/dashboard/dock-motion";

/* ------------------------------------------------------------------ *
 * EcoDock — bottom variant of the forest rail.
 * Shown on Team Leader / Team Member dashboard sub-pages (projects,
 * wallet, members, account, alerts, analytics). The dashboard homepage
 * keeps the left WaveRail instead.
 * ------------------------------------------------------------------ */

export type EcoDockItem = {
  key: string;
  label: string;
  icon: typeof Home;
  to: string;
  exact?: boolean;
  activePrefix?: string;
};

export function ecoDockItems(role: AppRole): EcoDockItem[] {
  if (role === "team_leader") {
    return [
      { key: "home", label: "Home", icon: Home, to: "/leader", exact: true },
      {
        key: "projects",
        label: "Projects",
        icon: Building2,
        to: "/leader/projects",
        activePrefix: "/leader/projects",
      },
      {
        key: "members",
        label: "Members",
        icon: Users,
        to: "/leader/members",
        activePrefix: "/leader/members",
      },
      {
        key: "wallet",
        label: "Wallet",
        icon: Wallet,
        to: "/leader/withdrawals",
        activePrefix: "/leader/withdrawals",
      },
      {
        key: "account",
        label: "Profile",
        icon: User,
        to: "/leader/profile",
        activePrefix: "/leader/profile",
      },
    ];
  }
  return [
    { key: "home", label: "Home", icon: Home, to: "/member", exact: true },
    {
      key: "projects",
      label: "Projects",
      icon: Building2,
      to: "/member/projects",
      activePrefix: "/member/projects",
    },
    {
      key: "sales",
      label: "Sales",
      icon: TrendingUp,
      to: "/member/sales",
      activePrefix: "/member/sales",
    },
    {
      key: "wallet",
      label: "Wallet",
      icon: Wallet,
      to: "/member/wallet",
      activePrefix: "/member/wallet",
    },
    {
      key: "account",
      label: "Profile",
      icon: User,
      to: "/member/profile",
      activePrefix: "/member/profile",
    },
  ];
}

function isActive(pathname: string, item: EcoDockItem) {
  if (item.key === "wallet" && pathname === "/member/withdrawals") return true;
  if (item.exact) return pathname === item.to;
  if (item.activePrefix)
    return pathname === item.activePrefix || pathname.startsWith(`${item.activePrefix}/`);
  return pathname === item.to;
}

export function EcoDock({ role, architectural = false }: { role: AppRole; architectural?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = ecoDockItems(role).map(item =>
    architectural && role === "member" && item.key === "sales"
      ? { key: "members", label: "Members", icon: Users, to: "/member/leaderboard" }
      : item,
  );

  return (
    <nav
      aria-label="Dashboard navigation"
      data-testid="eco-dock"
      style={{ animationDuration: `${DOCK_DURATION_MS}ms`, animationTimingFunction: DOCK_EASE }}
      className="aawaash-dock pointer-events-none fixed inset-x-0 bottom-0 z-[90] animate-fade-in px-3 motion-reduce:animate-none sm:px-6"
    >
      <SplitDock items={items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <li key={item.key} className="flex min-w-0 flex-1">
              <Link
                to={item.to}
                preload="render"
                aria-label={item.label}
                title={item.label}
                aria-current={active ? "page" : undefined}
                data-dock-item={item.key}
                data-active={active ? "true" : "false"}
                className={`aawaash-dock-link relative flex flex-1 touch-manipulation flex-col items-center justify-center gap-1 ${active ? "is-active" : ""}`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} className="shrink-0" aria-hidden="true" />
                <span className="aawaash-dock-label">{item.label}</span>
              </Link>
            </li>
          );
      })} />

    </nav>
  );
}
