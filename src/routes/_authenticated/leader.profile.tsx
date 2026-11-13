import { createFileRoute } from "@tanstack/react-router";
import { AccountProfile } from "@/components/aawash/dashboard/AccountProfile";

export const Route = createFileRoute("/_authenticated/leader/profile")({
  component: () => <AccountProfile role="team_leader" />,
  head: () => ({ meta: [{ title: "My Account — Aawaash" }] }),
});
