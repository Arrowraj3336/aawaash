import { createFileRoute } from "@tanstack/react-router";
import { AccountProjects } from "@/components/aawash/dashboard/AccountProjects";

export const Route = createFileRoute("/_authenticated/leader/projects")({
  component: () => <AccountProjects role="team_leader" />,
  head: () => ({ meta: [{ title: "Projects — Aawaash" }] }),
});
