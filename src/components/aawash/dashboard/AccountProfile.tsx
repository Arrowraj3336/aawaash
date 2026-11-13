import { useId, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, ChevronRight, Crown, IndianRupee, KeyRound, Mail, MapPin, Phone, TrendingUp, Users, Wallet } from "lucide-react";
import { RoleGuard } from "@/components/aawash/AuthGuard";
import { formatINR, initials } from "@/components/aawash/dashboard-kit";
import { HomeSkyline } from "@/components/aawash/landing/HomeSkyline";
import { publishContentUpdate } from "@/hooks/useRealtimeInvalidate";
import { useSession } from "@/hooks/useSession";
import { roleLabel } from "@/lib/auth";
import { changeMyPassword, listMyNotifications, updateMyProfile } from "@/lib/leader.functions";
import { EcoShell } from "./EcoKit";
import "./account-profile.css";

type AccountRole = "team_leader" | "member";

export function AccountProfile({ role }: { role: AccountRole }) {
  return <RoleGuard allow={["team_leader", "member", "super_admin"]}><ProfileContent routeRole={role} /></RoleGuard>;
}

function ProfileContent({ routeRole }: { routeRole: AccountRole }) {
  const { profile, role } = useSession();
  const qc = useQueryClient();
  const updateProfile = useServerFn(updateMyProfile);
  const changePassword = useServerFn(changeMyPassword);
  const loadNotifications = useServerFn(listMyNotifications);
  const { data: notifications } = useQuery({
    queryKey: [routeRole === "team_leader" ? "leader" : "member", "notifications"],
    queryFn: () => loadNotifications(),
  });
  const [emailDraft, setEmail] = useState<string>();
  const [avatarDraft, setAvatar] = useState<string>();
  const [password, setPassword] = useState("");
  const email = emailDraft ?? profile?.email ?? "";
  const avatar = avatarDraft ?? profile?.avatar_url ?? "";
  const canEditAvatar = routeRole === "member";
  const identity = [...new Set([profile?.login_id, profile?.display_code].filter(Boolean))].join(" · ");

  const saveContact = useMutation({
    mutationFn: () => updateProfile({ data: { email: email.trim() || undefined, avatar_url: canEditAvatar ? avatar.trim() || undefined : undefined } }),
    onSuccess: () => {
      publishContentUpdate("accounts");
      void qc.invalidateQueries();
    },
  });
  const savePassword = useMutation({
    mutationFn: () => changePassword({ data: { password } }),
    onSuccess: () => setPassword(""),
  });

  return (
    <EcoShell role={routeRole} profile={profile} architectural showDock={false} profileHeader
      unread={notifications?.filter(item => !item.is_read).length}>
      <div className="account-profile">
        <HomeSkyline className="account-profile-skyline" />
        <h1 className="account-profile-kicker">My Account</h1>
        <section className="account-profile-card" aria-label="Profile details">
          <div className="account-profile-identity">
            <div className="account-profile-avatar">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span aria-hidden="true">{initials(profile?.full_name)}</span>}
            </div>
            <div className="account-profile-name">
              <h2>{profile?.full_name ?? "—"}</h2>
              {identity && <p>{identity}</p>}
              <span className="account-profile-role">{routeRole === "team_leader" ? <Crown aria-hidden="true" /> : <Users aria-hidden="true" />}{roleLabel(role ?? routeRole)}</span>
            </div>
          </div>
          <dl className="account-profile-details">
            <AccountValue icon={<Phone />} label="Mobile" value={profile?.mobile_number || "—"} />
            <AccountValue icon={<Mail />} label="Email" value={profile?.email || "—"} />
            <AccountValue icon={<CalendarDays />} label="Joined" value={profileDate(profile?.joining_date || profile?.created_at)} />
            <AccountValue icon={<Users />} label="Team" value={profile?.team_id ? "Assigned" : "—"} />
            {profile?.address && <AccountValue icon={<MapPin />} label="Address" value={profile.address} />}
          </dl>
        </section>

        <section className="account-profile-overview" aria-labelledby="account-overview-title">
          <h2 id="account-overview-title">Account Overview</h2>
          <dl>
            <AccountValue icon={<Wallet />} label="Wallet Balance" value={formatINR(profile?.wallet_balance)} />
            <AccountValue icon={<IndianRupee />} label="Total Earnings" value={formatINR(profile?.total_earnings)} />
            <AccountValue icon={<TrendingUp />} label="Total Sales" value={formatINR(profile?.total_sales)} />
            <AccountValue icon={<Users />} label="Referrals" value={String(profile?.referral_count ?? 0)} />
          </dl>
        </section>

        <div className="account-profile-settings">
          <AccountAction icon={<Mail />} title="Update Email" description={canEditAvatar ? "Update your contact email and profile photo." : "You can update your contact email."}>
            <form onSubmit={event => { event.preventDefault(); saveContact.mutate(); }}>
              <label>Contact email<input type="email" autoComplete="email" value={email} required={!canEditAvatar}
                onChange={event => { saveContact.reset(); setEmail(event.target.value); }} placeholder="you@example.com" /></label>
              {canEditAvatar && <label>Avatar URL<input type="url" value={avatar} maxLength={500}
                onChange={event => { saveContact.reset(); setAvatar(event.target.value); }} placeholder="https://…" /></label>}
              <button type="submit" disabled={saveContact.isPending || (!email.trim() && !(canEditAvatar && avatar.trim()))}>{saveContact.isPending ? "Saving…" : "Save changes"}</button>
              {saveContact.isSuccess && <p role="status">Profile updated.</p>}
              {saveContact.isError && <p role="alert">{saveContact.error.message}</p>}
            </form>
          </AccountAction>
          <AccountAction icon={<KeyRound />} title="Change Password" description="Use at least 8 characters.">
            <form onSubmit={event => { event.preventDefault(); savePassword.mutate(); }}>
              <label>New password<input type="password" value={password} required minLength={8} maxLength={72} autoComplete="new-password"
                onChange={event => { savePassword.reset(); setPassword(event.target.value); }} /></label>
              <button type="submit" disabled={savePassword.isPending || password.length < 8}>{savePassword.isPending ? "Updating…" : "Change password"}</button>
              {savePassword.isSuccess && <p role="status">Password updated.</p>}
              {savePassword.isError && <p role="alert">{savePassword.error.message}</p>}
            </form>
          </AccountAction>
        </div>
      </div>
    </EcoShell>
  );
}

function profileDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
}

function AccountValue({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="account-profile-value">
    <span aria-hidden="true">{icon}</span>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>;
}

function AccountAction({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  const bodyId = useId();
  return <details className="account-profile-action">
    <summary aria-controls={bodyId}>
      <span className="account-profile-action-icon" aria-hidden="true">{icon}</span>
      <span><strong>{title}</strong><small>{description}</small></span>
      <ChevronRight className="account-profile-chevron" aria-hidden="true" />
    </summary>
    <div id={bodyId}>{children}</div>
  </details>;
}
