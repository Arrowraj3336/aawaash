import { useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Building2,
  TrendingUp,
  Wallet,
  User,
  Users,
  UserCog,
  PhoneCall,
  LayoutDashboard,
} from "lucide-react";
import { SplitDock } from "./SplitDock";
import type { AppRole } from "@/lib/auth";

/** Stable, equal-width navigation targets with intent-based route preloading. */

type NavItem = {
  key: string;
  label: string;
  icon: typeof Home;
  to: string;
  hash?: string;
  activePrefix?: string;
  exact?: boolean;
  description: string;
};

export function BottomNav({ role }: { role: AppRole }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <DockList items={itemsFor(pathname, role)} pathname={pathname} />;
}

export function PublicBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <DockList items={itemsFor(pathname, null)} pathname={pathname} />;
}

export function BottomNavSkeleton() {
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      aria-busy="true"
      data-testid="bottom-dock-loading"
      className="aawaash-dock pointer-events-none fixed inset-x-0 bottom-0 z-[90] px-3 sm:px-6"
    >
      <span role="status" aria-live="polite" className="sr-only">
        Loading primary navigation
      </span>
      <SplitDock items={Array.from({ length: 5 }, (_, index) => (
        <li key={index} className="aawaash-dock-placeholder" aria-hidden="true">
          <div className="h-7 w-7 animate-pulse rounded-full bg-[#373932] motion-reduce:animate-none" />
        </li>
      ))} />
    </nav>
  );
}

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.to;
  if (item.activePrefix) return pathname === item.activePrefix || pathname.startsWith(`${item.activePrefix}/`);
  return pathname === item.to;
}

function DockList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [focusIndex, setFocusIndex] = useState(-1);
  const hash = useRouterState({ select: (s) => s.location.hash });
  // Hash destinations take precedence over their parent route (Contact vs Home).
  const hashIndex = hash ? items.findIndex((item) => item.to === pathname && item.hash === hash) : -1;
  const activeIndex = hashIndex >= 0 ? hashIndex : items.findIndex((item) => !item.hash && isActive(pathname, item));
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;

  /** Roving keyboard navigation: ←/→ move, Home/End jump, Enter/Space activate. */
  const focusAt = (i: number) => {
    const next = (i + items.length) % items.length;
    setFocusIndex(next);
    const link = itemRefs.current[next]?.querySelector("a");
    (link as HTMLAnchorElement | null)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, i: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusAt(i + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusAt(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(items.length - 1);
        break;
      case " ":
      case "Spacebar":
        e.preventDefault();
        (e.currentTarget as HTMLAnchorElement).click();
        break;
      default:
        break;
    }
  };

  if (!items.length) return null;

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      data-testid="bottom-dock"
      className="aawaash-dock pointer-events-none fixed inset-x-0 bottom-0 z-[90] px-3 sm:px-6"
    >
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {activeItem ? `${activeItem.label} section active` : "Navigation ready"}
      </span>

      <SplitDock keyboardToolbar items={items.map((item, i) => {
          const { label, icon: Icon, to, hash, description, key } = item;
          const active = i === activeIndex;
          const tabbable = i === (focusIndex >= 0 ? focusIndex : activeIndex >= 0 ? activeIndex : 0);
          return (
            <li
              key={key}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              role="none"
              className="relative flex min-w-0 flex-1"
            >
              <Link
                to={to}
                hash={hash}
                preload="intent"
                hashScrollIntoView={{ behavior: "instant", block: "start" }}
                resetScroll={!hash}
                aria-label={`${label} — ${description}`}
                title={label}
                aria-current={active ? "page" : undefined}
                tabIndex={tabbable ? 0 : -1}
                onFocus={() => {
                  setFocusIndex(i);
                }}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  // Router navigation can be a no-op when the URL is already active.
                  // A repeated Home/Contact tap should still restore that destination.
                  if (pathname === to) {
                    if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: "instant", block: "start" });
                    else window.scrollTo({ top: 0, behavior: "instant" });
                  }
                }}
                onKeyDown={(e) => onKeyDown(e, i)}
                data-testid={`dock-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`aawaash-dock-link relative flex flex-1 touch-manipulation flex-col items-center justify-center gap-1 ${active ? "is-active" : ""}`}
              >
                <Icon size={21} strokeWidth={active ? 1.9 : 1.6} aria-hidden="true" />
                <span className="aawaash-dock-label">{label}</span>
              </Link>

            </li>
          );
      })} />
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Context-aware destination sets                                      */
/* ------------------------------------------------------------------ */

const HOME = { key: "home", label: "Home", icon: Home, description: "Aawaash home" };

/** Public site (home + project pages) — same set for guests and signed-in users. */
function publicItems(role: AppRole | null): NavItem[] {
  const salesTo =
    role === "super_admin" ? "/sales-workflow" : role === "team_leader" ? "/leader" : role === "member" ? "/member/sales" : "/auth";
  const accountTo =
    role === "super_admin"
      ? "/admin/profile"
      : role === "team_leader"
        ? "/leader/profile"
        : role === "member"
          ? "/member/profile"
          : "/auth";
  return [
    { ...HOME, to: "/", exact: true },
    { key: "projects", label: "Projects", icon: Building2, to: "/projects", activePrefix: "/projects", description: "Browse residences" },
    { key: "contact", label: "Contact", icon: PhoneCall, to: "/", hash: "contact", description: "Talk to the Aawaash team" },
    { key: "sales", label: "Sales", icon: TrendingUp, to: salesTo, activePrefix: salesTo, description: "Sales console" },
    { key: "account", label: "Account", icon: User, to: accountTo, activePrefix: accountTo, description: "Your account" },
  ];
}

function leaderItems(): NavItem[] {
  return [
    { ...HOME, to: "/leader", exact: true, description: "Team leader home" },
    { key: "projects", label: "Projects", icon: Building2, to: "/leader/projects", activePrefix: "/leader/projects", description: "Team projects" },
    { key: "members", label: "Members", icon: Users, to: "/leader/members", activePrefix: "/leader/members", description: "Your team members" },
    { key: "wallet", label: "Wallet", icon: Wallet, to: "/leader/withdrawals", activePrefix: "/leader/withdrawals", description: "Wallet and withdrawals" },
    { key: "account", label: "Account", icon: User, to: "/leader/profile", activePrefix: "/leader/profile", description: "Leader profile" },
  ];
}

function memberItems(): NavItem[] {
  return [
    { ...HOME, to: "/member", exact: true, description: "Member home" },
    { key: "projects", label: "Projects", icon: Building2, to: "/projects", activePrefix: "/projects", description: "Browse residences" },
    { key: "sales", label: "Sales", icon: TrendingUp, to: "/member/sales", activePrefix: "/member/sales", description: "Your sales" },
    { key: "wallet", label: "Wallet", icon: Wallet, to: "/member/wallet", activePrefix: "/member/wallet", description: "Your wallet" },
    { key: "account", label: "Account", icon: User, to: "/member/profile", activePrefix: "/member/profile", description: "Your account" },
  ];
}

function adminItems(): NavItem[] {
  return [
    { ...HOME, to: "/admin", exact: true, description: "Admin control centre" },
    { key: "projects", label: "Projects", icon: Building2, to: "/admin/projects", activePrefix: "/admin/projects", description: "Manage projects" },
    { key: "leaders", label: "Leaders", icon: UserCog, to: "/admin/team-leaders", activePrefix: "/admin/team-leaders", description: "Team leader console" },
    { key: "members", label: "Members", icon: Users, to: "/admin/members", activePrefix: "/admin/members", description: "Member console" },
    { key: "wallets", label: "Wallets", icon: Wallet, to: "/admin/finance", activePrefix: "/admin/finance", description: "Wallets and finance" },
  ];
}

/** Public surfaces keep the marketing dock even when signed in. */
function isPublicSurface(pathname: string) {
  return pathname === "/" || pathname === "/projects" || pathname.startsWith("/projects/");
}

export function itemsFor(pathname: string, role: AppRole | null): NavItem[] {
  if (isPublicSurface(pathname)) return publicItems(role);
  if (pathname.startsWith("/admin")) return adminItems();
  if (pathname.startsWith("/leader")) return leaderItems();
  if (pathname.startsWith("/member")) return memberItems();
  if (role === "super_admin") return adminItems();
  if (role === "team_leader") return leaderItems();
  if (role === "member") return memberItems();
  return publicItems(role);
}

export function itemsForRole(role: AppRole): NavItem[] {
  return itemsFor("", role);
}

export const _DashboardIcon = LayoutDashboard;
