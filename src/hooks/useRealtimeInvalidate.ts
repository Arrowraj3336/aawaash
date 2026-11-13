import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const contentChannel = "aawaash-content-published";
type UpdateScope = "homepage" | "projects" | "brand" | "pages" | "accounts";

export function openContentUpdateChannel() {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(contentChannel);
}

export function publishContentUpdate(scope: UpdateScope) {
  const channel = openContentUpdateChannel();
  if (!channel) return;
  channel.postMessage(scope);
  channel.close();
}

type TableSpec = { table: string; filter?: string };

/**
 * Subscribe to Supabase Realtime changes on one or more tables and
 * invalidate the given TanStack Query keys whenever a row changes.
 *
 * Use this to give any KPI / list / dashboard tile live updates without
 * manual polling. Falls back to a lightweight polling interval so tiles
 * still refresh even when realtime is temporarily unavailable.
 */
export function useRealtimeInvalidate(
  channelName: string,
  tables: Array<string | TableSpec>,
  invalidateKeys: readonly (readonly unknown[])[],
  opts?: { pollMs?: number; enabled?: boolean; contentScope?: UpdateScope },
) {
  const qc = useQueryClient();
  const enabled = opts?.enabled ?? true;
  const pollMs = opts?.pollMs ?? 30_000;
  const scope = opts?.contentScope;

  useEffect(() => {
    if (!enabled) return;

    const invalidate = () => {
      for (const key of invalidateKeys) {
        qc.invalidateQueries({ queryKey: key as unknown[] });
      }
    };

    let channel = supabase.channel(channelName);
    for (const t of tables) {
      const spec: TableSpec = typeof t === "string" ? { table: t } : t;
      channel = channel.on(
        // Realtime typings for postgres_changes are narrow; cast so we can pass a runtime table name.
        "postgres_changes" as never,
        { event: "*", schema: "public", ...spec } as never,
        invalidate,
      );
    }
    let subscribed = false;
    channel.subscribe(status => {
      if (status !== "SUBSCRIBED") return;
      if (subscribed) invalidate();
      subscribed = true;
    });

    const updates = scope ? openContentUpdateChannel() : null;
    if (updates) updates.onmessage = (event) => { if (event.data === scope) invalidate(); };
    const refreshVisible = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    const timer = window.setInterval(refreshVisible, pollMs);
    window.addEventListener("focus", refreshVisible);
    window.addEventListener("online", refreshVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      window.removeEventListener("online", refreshVisible);
      updates?.close();
      supabase.removeChannel(channel);
    };
    // channelName + serialized keys are stable identity for consumers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled, pollMs, qc, scope]);
}
