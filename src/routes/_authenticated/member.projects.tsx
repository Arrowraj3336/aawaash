import { createFileRoute } from "@tanstack/react-router";
import { AccountProjects } from "@/components/aawash/dashboard/AccountProjects";

export const Route = createFileRoute("/_authenticated/member/projects")({
  component: () => <AccountProjects role="member" />,
  head: () => ({ meta: [{ title: "Projects — Aawaash" }] }),
});
