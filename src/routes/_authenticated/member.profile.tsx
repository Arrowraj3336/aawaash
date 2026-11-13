import { createFileRoute } from "@tanstack/react-router";
import { AccountProfile } from "@/components/aawash/dashboard/AccountProfile";

export const Route = createFileRoute("/_authenticated/member/profile")({
  component: () => <AccountProfile role="member" />,
  head: () => ({ meta: [{ title: "My Account — Aawaash" }] }),
});
