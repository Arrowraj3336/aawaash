import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DIRECT_ADMIN_EMAIL } from "./auth";
import {
  PASSCODE_MAX_FAILURES,
  evaluateRateLimit,
  formatRetryAfter,
  getAdminPasscodeSession,
  passcodeMatches,
  readRecentFailures,
  recordAttempt,
  requestFingerprint,
} from "./admin-passcode.server";

type UnlockFailure = {
  ok: false;
  reason: "not_configured" | "invalid_format" | "incorrect" | "rate_limited";
  message: string;
  attemptsRemaining: number | null;
  retryAfterSeconds: number | null;
  tokenHash: null;
  email: null;
};

function fail(
  reason: UnlockFailure["reason"],
  message: string,
  extra: Partial<Pick<UnlockFailure, "attemptsRemaining" | "retryAfterSeconds">> = {},
): UnlockFailure {
  return {
    ok: false,
    reason,
    message,
    attemptsRemaining: extra.attemptsRemaining ?? null,
    retryAfterSeconds: extra.retryAfterSeconds ?? null,
    tokenHash: null,
    email: null,
  };
}

export const isAdminPanelUnlocked = createServerFn({ method: "GET" }).handler(async () => {
  if (!process.env.ADMIN_PASSCODE_SESSION_SECRET) return { unlocked: false };
  const session = await getAdminPasscodeSession();
  return { unlocked: session.data.unlocked === true };
});

/** Check the signed-in user's current role before opening the admin layout. */
export const getAuthenticatedAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data: isAdmin, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "super_admin",
    });
    if (error) throw new Error("Could not verify admin access.");
    if (!isAdmin) return { allowed: false, unlocked: false };

    if (claims.email?.toLowerCase() === DIRECT_ADMIN_EMAIL) {
      return { allowed: true, unlocked: true };
    }

    if (!process.env.ADMIN_PASSCODE_SESSION_SECRET) return { allowed: true, unlocked: false };
    const session = await getAdminPasscodeSession();
    return { allowed: true, unlocked: session.data.unlocked === true };
  });

export const unlockAdminPanel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ passcode: z.string().trim() }).parse(data))
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PANEL_PASSCODE;
    if (!expected || !/^\d{4}$/.test(expected.trim()) ||
      !process.env.ADMIN_PASSCODE_SESSION_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Fail closed: never fall back to a well-known default passcode.
      return fail(
        "not_configured",
        "Admin access is not configured on this environment yet. Ask an administrator to set the admin passcode.",
      );
    }

    const fingerprint = requestFingerprint();

    // Brute-force guard first: a locked caller learns nothing about the code.
    const limit = evaluateRateLimit(await readRecentFailures(fingerprint));
    if (limit.blocked) {
      return fail(
        "rate_limited",
        `Too many incorrect attempts. Admin access is locked for ${formatRetryAfter(limit.retryAfterMs)}.`,
        { retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000), attemptsRemaining: 0 },
      );
    }

    if (!/^\d{4}$/.test(data.passcode)) {
      // Malformed input is not counted as a brute-force attempt.
      return fail("invalid_format", "Enter the 4-digit admin passcode (digits only).", {
        attemptsRemaining: limit.remaining,
      });
    }

    if (!passcodeMatches(data.passcode, expected)) {
      await recordAttempt(fingerprint, false);
      const after = evaluateRateLimit(await readRecentFailures(fingerprint));
      if (after.blocked) {
        return fail(
          "rate_limited",
          `Too many incorrect attempts. Admin access is locked for ${formatRetryAfter(after.retryAfterMs)}.`,
          { retryAfterSeconds: Math.ceil(after.retryAfterMs / 1000), attemptsRemaining: 0 },
        );
      }
      return fail(
        "incorrect",
        `Incorrect passcode. ${after.remaining} of ${PASSCODE_MAX_FAILURES} attempts left before admin access is locked.`,
        { attemptsRemaining: after.remaining },
      );
    }

    await recordAttempt(fingerprint, true);
    const session = await getAdminPasscodeSession();
    await session.update({ unlocked: true });

    // The passcode IS the admin credential: mint a Supabase session for the
    // super admin so the admin panel's authenticated server fns work without
    // a second (user-facing) sign-in.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin")
        .limit(1)
        .maybeSingle();
      if (!roleRow?.user_id) return { ok: true as const, reason: null, message: null, attemptsRemaining: null, retryAfterSeconds: null, tokenHash: null, email: null };

      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(roleRow.user_id);
      const email = userRes?.user?.email ?? null;
      if (!email) return { ok: true as const, reason: null, message: null, attemptsRemaining: null, retryAfterSeconds: null, tokenHash: null, email: null };

      const { data: link } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      return {
        ok: true as const,
        reason: null,
        message: null,
        attemptsRemaining: null,
        retryAfterSeconds: null,
        tokenHash: link?.properties?.hashed_token ?? null,
        email,
      };
    } catch {
      return { ok: true as const, reason: null, message: null, attemptsRemaining: null, retryAfterSeconds: null, tokenHash: null, email: null };
    }
  });


export const lockAdminPanel = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAdminPasscodeSession();
  await session.clear();
  return { ok: true as const };
});