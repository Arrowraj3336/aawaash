import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  UserRound,
  UserRoundCheck,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DIRECT_ADMIN_LOGIN_ID,
  loginIdToEmail,
  validateLoginId,
  homePathForRole,
  toInternalPath,
  roleLabel,
  type AppRole,
} from "@/lib/auth";
import { bootstrapSuperAdmin, superAdminExists, touchLastLogin } from "@/lib/auth.functions";
import { getAuthenticatedAdminAccess } from "@/lib/admin-passcode.functions";
import { getRememberPreference, setRememberPreference } from "@/lib/session-persistence";
import { SignInArtwork } from "@/components/aawash/SignInArtwork";
import "@/sign-in.css";
import logoAsset from "@/assets/aawaash-logo.png.asset.json";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => searchSchema.parse(search),
  component: AuthPage,
  head: ({ match }) => ({
    meta: [
      { title: match.search.mode === "signup" ? "Request an account — Aawaash" : "Sign in — Aawaash" },
      {
        name: "description",
        content: "Sign in to Aawaash — nature-friendly constructions and the premium real estate sales ecosystem.",
      },
      { property: "og:title", content: "Sign in — Aawaash" },
      {
        property: "og:description",
        content: "Sign in to Aawaash — nature-friendly constructions and the premium real estate sales ecosystem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SURFACE = "#f7f7f7";

/* ------------------------------------------------------------------ */
/*  Account branding                                                    */
/* ------------------------------------------------------------------ */

function AccountHeader() {
  return (
    <header className="account-header">
      <Link to="/" aria-label="Aawaash home" className="account-wordmark">
        <img src={logoAsset.url} alt="" width={38} height={38} />
        Aawaash
      </Link>
      <img className="account-line-art" src="/images/auth-architecture-line.png" alt="" width={420} height={240} decoding="async" />
    </header>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [checking, setChecking] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  const check = useServerFn(superAdminExists);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      if (data.user) {
        const { data: r } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .order("role", { ascending: true })
          .limit(1)
          .maybeSingle();
        const role = (r?.role as AppRole | null) ?? null;
        navigate({ to: toInternalPath(search.redirect) ?? homePathForRole(role), replace: true });
        return;
      }
      try {
        const res = await check();
        if (!cancelled) setNeedsBootstrap(!res.exists);
      } catch {
        if (!cancelled) setNeedsBootstrap(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!needsBootstrap && search.mode !== "signup") {
    return <LoginForm checking={checking} />;
  }

  if (checking) {
    return (
      <div className="relative grid min-h-dvh place-items-center" style={{ background: SURFACE }}>
        <div className="relative">
          <div className="absolute inset-0 -m-6 rounded-full bg-primary/10 blur-2xl" />
          <Loader2 className="relative h-9 w-9 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <main className="account-main">
        <AccountHeader />
        <div className="auth-sheet account-card">
          {needsBootstrap ? <BootstrapForm onDone={() => setNeedsBootstrap(false)} /> : <AccountRequest />}
        </div>

        <div className="pt-3">
          <Link
            to="/"
            className="mx-auto block rounded-md text-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            ← Back to home
          </Link>
        </div>
      </main>



      <style>{`
        @keyframes cardIn {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .auth-card-in { animation: cardIn 0.22s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes sheetIn {
          0% { opacity: 0; transform: translateY(26px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .auth-sheet { animation: sheetIn 0.24s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .auth-sheet, .auth-card-in { animation: none; }
        }

        @keyframes successPop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .success-pop { animation: successPop 0.5s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes shakeX {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .shake-x { animation: shakeX 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared pieces                                                      */
/* ------------------------------------------------------------------ */

function SectionHead({
  eyebrow = "Aawaash",
  eyebrowLarge = false,
  title,
  subtitle,
}: {
  eyebrow?: string;
  eyebrowLarge?: boolean;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="auth-card-in text-center">
      <span
        className={
          eyebrowLarge
            ? "mx-auto inline-flex items-center gap-2 rounded-lg bg-primary/[0.08] px-4 py-1.5 text-[clamp(1rem,4.4vw,1.35rem)] font-extrabold uppercase tracking-[0.26em] text-primary"
            : "mx-auto inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-primary"
        }
      >
        <Leaf size={eyebrowLarge ? 18 : 12} aria-hidden="true" />
        {eyebrow}
      </span>
      {title && (
        <h2
          className="mt-2 text-[clamp(1.4rem,5.8vw,1.9rem)] font-bold leading-[1.12] tracking-[-0.03em] text-[oklch(0.22_0.03_160)]"
          style={{ fontFamily: '"Fraunces", "Plus Jakarta Sans", serif', fontOpticalSizing: "auto" }}
        >
          {title}
        </h2>
      )}
      {subtitle && <p className="mt-1.5 text-[12.5px] text-muted-foreground sm:text-sm">{subtitle}</p>}
    </div>
  );
}

function Field({
  icon,
  hint,
  children,
}: {
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="group/field relative flex items-center gap-3 overflow-hidden rounded-[18px] bg-white/85 px-2 py-1.5 ring-1 ring-inset ring-primary/12 transition-all duration-300 focus-within:bg-white focus-within:ring-primary/35 focus-within:shadow-[0_18px_40px_-30px_color-mix(in_oklab,var(--primary)_95%,transparent)]">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-primary/[0.07] text-primary transition-all duration-300 group-focus-within/field:scale-[1.04] group-focus-within/field:bg-[linear-gradient(150deg,oklch(0.36_0.085_155),oklch(0.22_0.05_155))] group-focus-within/field:text-primary-foreground"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1 pr-1">{children}</div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-[linear-gradient(90deg,var(--primary),transparent)] transition-transform duration-500 group-focus-within/field:scale-x-100"
        />
      </div>
      {hint && <p className="mt-1 px-2 text-[11px] text-muted-foreground">{hint}</p>}
    </label>
  );
}

const inputClass =
  "w-full bg-transparent text-[15px] font-medium tracking-[-0.01em] text-foreground outline-none placeholder:font-normal placeholder:tracking-[0.01em] placeholder:text-muted-foreground/60";


/* ------------------------------------------------------------------ */
/*  Login form                                                         */
/* ------------------------------------------------------------------ */

function LoginForm({ checking }: { checking: boolean }) {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const touch = useServerFn(touchLastLogin);
  const verifyAdminAccess = useServerFn(getAuthenticatedAdminAccess);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [desiredRole, setDesiredRole] = useState<AppRole>("member");
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setRemember(getRememberPreference());
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checking || submitting || success) return;
    setError(null);
    const v = validateLoginId(loginId);
    const email = z.string().email().safeParse(loginId.trim());
    const directAdmin = desiredRole === "team_leader" && v.normalized === DIRECT_ADMIN_LOGIN_ID;
    if (!v.ok && !directAdmin && !email.success) {
      setError("Invalid login credentials.");
      return;
    }
    if (password.length < 6) {
      setError("Invalid login credentials.");
      return;
    }
    setSubmitting(true);
    try {
      setRememberPreference(remember);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.success ? email.data : loginIdToEmail(v.normalized),
        password,
      });
      if (signInError || !data.user) {
        setError("Invalid login credentials.");
        return;
      }

      if (directAdmin) {
        try {
          const access = await verifyAdminAccess();
          if (!access.allowed || !access.unlocked) throw new Error("Admin access denied");
        } catch {
          await supabase.auth.signOut({ scope: "local" });
          setError("This account could not open the admin panel.");
          return;
        }
        touch().catch(() => undefined);
        setSuccess(true);
        await navigate({ to: "/admin", replace: true });
        return;
      }

      const { data: rows, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .order("role", { ascending: true });
      if (roleError || !rows?.length) {
        await supabase.auth.signOut({ scope: "local" });
        setError("Your account access could not be verified. Contact your team administrator.");
        return;
      }
      const roles = rows.map((x) => x.role as AppRole);
      const role = roles[0] ?? null;
      // Honour the compact role selector when the account actually holds that role.
      const matches = roles.includes(desiredRole);
      const target = matches ? homePathForRole(desiredRole) : homePathForRole(role);

      if (!matches) {
        toast.warning(`No ${roleLabel(desiredRole)} dashboard on this account`, {
          description: `You signed in as ${roleLabel(role)}. Taking you to your ${roleLabel(role)} dashboard instead.`,
          duration: 6000,
        });
      }

      touch().catch(() => undefined);
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: toInternalPath(search.redirect) ?? target, replace: true });
      }, 600);
    } catch {
      setError("Invalid login credentials.");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <main className="signin-page">
      <div className="signin-stage">
        <div className="signin-scene">
          <SignInArtwork />
          <header className="signin-brand">
            <Link to="/" aria-label="Aawaash home" className="signin-wordmark">Aawaash</Link>
            <p className="signin-tagline">
              <span>Real Estate</span><b aria-hidden="true">·</b>
              <span>Construction</span><b aria-hidden="true">·</b>
              <span>Development</span>
            </p>
          </header>

          <form className="signin-form" onSubmit={onSubmit} aria-busy={checking || submitting}>
            <div className="signin-heading">
              <h1>Sign <em>In</em></h1>
              <p>Access your Aawaash account</p>
            </div>
            <label className="signin-field">
              <UserRound aria-hidden="true" />
              <input id="auth-login-id" name="loginId" autoComplete="username" spellCheck={false}
                value={loginId} onChange={event => setLoginId(event.target.value)}
                placeholder="User ID" aria-label="User ID or email" />
            </label>
            <div className="signin-field">
              <Lock aria-hidden="true" />
              <input id="auth-password" name="password" autoComplete="current-password"
                type={showPwd ? "text" : "password"} value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Password" aria-label="Password" />
              <button type="button" className="signin-password-toggle"
                onClick={() => setShowPwd(visible => !visible)}
                aria-label={showPwd ? "Hide password" : "Show password"} aria-pressed={showPwd}>
                {showPwd ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
              </button>
            </div>
            <button type="submit" disabled={checking || submitting || success} className="signin-submit">
              {success ? <><CheckCircle2 aria-hidden="true" /> Signed in</>
                : submitting ? <><Loader2 className="animate-spin" aria-hidden="true" /> Signing in</>
                : <>Sign In <ArrowRight aria-hidden="true" /></>}
            </button>
            {error && <p className="signin-error" role="alert">{error}</p>}
          </form>

          <fieldset className="signin-roles">
            <legend className="sr-only">Sign in as</legend>
            {([{ role: "team_leader", label: "Team Leader", Icon: UserRoundCheck },
                { role: "member", label: "Member", Icon: UserRound }] as const).map(({ role, label, Icon }) => (
              <label key={role}>
                <input id={`auth-role-${role}`} className="sr-only" type="radio" name="signin-role" value={role}
                  checked={desiredRole === role} onChange={() => setDesiredRole(role)} />
                <span><Icon aria-hidden="true" />{label}</span>
              </label>
            ))}
          </fieldset>
        </div>

        <footer className="signin-support">
          <div className="signin-support-row">
            <label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Remember me</label>
            <button type="button" aria-expanded={showHelp} aria-controls="auth-forgot-help"
              onClick={() => setShowHelp(visible => !visible)}>Forgot password?</button>
            <Link to="/auth" search={previous => ({ ...previous, mode: "signup" })}>Request an account</Link>
          </div>
          <div id="auth-forgot-help" hidden={!showHelp}>
            Ask your team leader or <Link to="/" hash="contact">contact Aawaash</Link> to reset your password.
          </div>
        </footer>
      </div>
    </main>
  );
}

function AccountRequest() {
  return (
    <section aria-labelledby="signup-heading">
      <h1 id="signup-heading" className="account-title">Request an account</h1>
      <p className="account-subtitle">Aawaash creates Team Leader accounts. Your Team Leader can set up your Member account.</p>
      <Link to="/" hash="contact" className="account-request-link">
        Contact Aawaash <ArrowRight size={17} aria-hidden="true" />
      </Link>
      <p className="account-switch">
        Already have an account? <Link to="/auth" search={previous => ({ ...previous, mode: undefined })}>Sign in</Link>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bootstrap form                                                     */
/* ------------------------------------------------------------------ */

function BootstrapForm({ onDone }: { onDone: () => void }) {
  const bootstrap = useServerFn(bootstrapSuperAdmin);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (!/^\d{10}$/.test(mobile)) return setError("Mobile must be 10 digits.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setSubmitting(true);
    try {
      await bootstrap({ data: { fullName: fullName.trim(), mobile, password } });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-label="Create super admin">
      <SectionHead title="Create Super Admin" subtitle="No admin exists yet — this screen locks after setup." />

      <form onSubmit={onSubmit} className="auth-card-in mt-4 space-y-2.5">
        <Field icon={<User size={19} aria-hidden="true" />}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            aria-label="Full name"
            className={inputClass}
          />
        </Field>

        <Field icon={<User size={19} aria-hidden="true" />} hint="10 digits. Becomes your Login ID.">
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="Mobile number"
            aria-label="Mobile number"
            className={inputClass}
          />
        </Field>

        <Field icon={<Lock size={19} aria-hidden="true" />} hint="Minimum 8 characters.">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a strong password"
            aria-label="Password"
            className={inputClass}
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="relative mt-1 flex h-11 w-full items-center justify-center rounded-[22px] bg-[linear-gradient(140deg,oklch(0.38_0.09_155),oklch(0.21_0.05_155))] px-6 text-[16px] font-semibold text-primary-foreground shadow-[0_26px_50px_-24px_oklch(0.3_0.08_155)] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {submitting ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : "Create Super Admin"}
        </button>
      </form>
    </section>
  );
}
