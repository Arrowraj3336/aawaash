import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";
import { openContentUpdateChannel } from "./useRealtimeInvalidate";

export interface AawashProfile {
  id: string;
  display_code: string;
  full_name: string;
  mobile_number: string;
  login_id: string;
  email: string | null;
  address?: string | null;
  updated_at?: string;
  joining_date?: string | null;
  created_at?: string;
  avatar_url: string | null;
  team_id: string | null;
  wallet_balance: number;
  total_earnings: number;
  total_sales: number;
  referral_count: number;
  is_active: boolean;
}

export interface SessionState {
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: AawashProfile | null;
  role: AppRole | null;
}

/* ------------------------------------------------------------------ *
 * Shared session store.
 *
 * `useSession()` is called from ~66 components. Previously every caller
 * created its own effect: a `profiles` query, a realtime channel, a 20s
 * poll and a focus listener. That meant N duplicate requests and N
 * subscriptions per page. The store below does that work exactly once,
 * refcounted across subscribers, and hands every consumer the same
 * immutable snapshot.
 * ------------------------------------------------------------------ */

const EMPTY: SessionState = {
  loading: true,
  user: null,
  session: null,
  profile: null,
  role: null,
};

const SERVER_SNAPSHOT: SessionState = { ...EMPTY, loading: true };

let state: SessionState = EMPTY;
const listeners = new Set<() => void>();

function setState(next: Partial<SessionState>) {
  state = { ...state, ...next };
  for (const l of listeners) l();
}

let refCount = 0;
let teardown: (() => void) | null = null;
/** Guards against redundant profile loads for the same user id. */
let loadedUserId: string | null = null;

function start() {
  let cancelled = false;
  let authObserved = false;
  let profileChannel: ReturnType<typeof supabase.channel> | null = null;
  let pollTimer: number | undefined;
  let updates: BroadcastChannel | null = null;
  let profileRead = 0;
  let onFocus: (() => void) | null = null;

  async function refreshProfile(userId: string) {
    const read = ++profileRead;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (cancelled || loadedUserId !== userId || read !== profileRead || !profile) return;
    if (profile.updated_at && state.profile?.id === userId && state.profile.updated_at === profile.updated_at) return;
    setState({ profile: profile as AawashProfile });
  }

  /** Live-follow the signed-in user's own profile row so admin-side
   *  wallet / status edits appear on their dashboard immediately. */
  function watchProfile(userId: string) {
    if (profileChannel) return;
    profileChannel = supabase
      .channel(`self-profile-${userId}`)
      .on(
        "postgres_changes" as never,
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` } as never,
        () => void refreshProfile(userId),
      )
      .subscribe();
    pollTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshProfile(userId);
    }, 5_000);
    updates = openContentUpdateChannel();
    if (updates) updates.onmessage = event => {
      if (event.data === "accounts") void refreshProfile(userId);
    };
    onFocus = () => void refreshProfile(userId);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
  }

  function unwatchProfile() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = undefined;
    if (onFocus) {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
    }
    updates?.close();
    updates = null;
    onFocus = null;
    if (profileChannel) void supabase.removeChannel(profileChannel);
    profileChannel = null;
  }

  async function loadProfileAndRole(userId: string) {
    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("role", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);
    if (cancelled || loadedUserId !== userId) return;
    setState({
      loading: false,
      profile: (profile as AawashProfile | null) ?? null,
      role: (roleRow?.role as AppRole | null) ?? null,
    });
    watchProfile(userId);
  }

  // Register listener FIRST (Supabase best practice).
  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
    if (cancelled) return;
    authObserved = true;
    setState({ session, user: session?.user ?? null });

    if (event === "SIGNED_OUT" || !session?.user) {
      loadedUserId = null;
      unwatchProfile();
      state = { loading: false, user: null, session: null, profile: null, role: null };
      for (const l of listeners) l();
      return;
    }

    // Token refreshes and repeat INITIAL_SESSION events must not re-run
    // the profile + role fetch for a user we already have loaded.
    if (loadedUserId === session.user.id) return;
    unwatchProfile();
    loadedUserId = session.user.id;
    setState({ loading: true, profile: null, role: null });

    // Defer to avoid deadlock with Supabase internals.
    setTimeout(() => {
      void loadProfileAndRole(session.user.id);
    }, 0);
  });

  // Then read the existing session.
  void supabase.auth.getSession().then(({ data }) => {
    if (cancelled || authObserved) return;
    setState({ session: data.session, user: data.session?.user ?? null });
    const uid = data.session?.user?.id;
    if (uid) {
      if (loadedUserId === uid) return;
      loadedUserId = uid;
      void loadProfileAndRole(uid);
    } else {
      setState({ loading: false });
    }
  });

  return () => {
    cancelled = true;
    unwatchProfile();
    sub.subscription.unsubscribe();
    loadedUserId = null;
    state = EMPTY;
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!teardown) teardown = start();
  refCount += 1;

  return () => {
    listeners.delete(listener);
    refCount -= 1;
    if (refCount === 0 && teardown) {
      // Defer teardown by a tick so route transitions (unmount old page,
      // mount new page) don't tear down and re-open the subscription.
      const t = teardown;
      window.setTimeout(() => {
        if (refCount !== 0 || teardown !== t) return;
        teardown = null;
        t();
      }, 0);
    }
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => SERVER_SNAPSHOT;

/**
 * Central session hook. All callers share one auth listener, one profile
 * fetch, one realtime subscription and one poll timer.
 */
export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
