import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { RoleGuard } from "@/components/aawash/AuthGuard";
import { EmptyState, SkeletonBlock } from "@/components/aawash/dashboard-kit";
import { HomeSkyline } from "@/components/aawash/landing/HomeSkyline";
import { listProjects } from "@/lib/leader.functions";
import { ProjectCard } from "@/components/aawash/projects/ProjectCard";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { EcoShell } from "./EcoKit";
import "./account-projects.css";

export function AccountProjects({ role }: { role: "team_leader" | "member" }) {
  return <RoleGuard allow={["team_leader", "super_admin", "member"]}><ProjectList role={role} /></RoleGuard>;
}

function ProjectList({ role }: { role: "team_leader" | "member" }) {
  const { profile } = useSession();
  const load = useServerFn(listProjects);
  const [query, setQuery] = useState("");
  const { data, isLoading, isError } = useQuery({ queryKey: ["projects", "all"], queryFn: () => load() });
  useRealtimeInvalidate("account-project-catalogue", ["projects"], [["projects", "all"]], { pollMs: 5_000, contentScope: "projects" });
  const term = query.trim().toLowerCase();
  const projects = (data ?? []).filter(project => [project.name, project.location].some(value => value?.toLowerCase().includes(term)));

  return (
    <EcoShell role={role} profile={profile} architectural showDock={false}>
      <section className="account-projects" aria-labelledby="account-projects-title">
        <header className="account-projects-heading">
          <HomeSkyline className="account-projects-skyline" />
          <p>Project Inventory</p>
          <h1 id="account-projects-title">Find your next project.</h1>
        </header>
        <label className="account-projects-search">
          <Search aria-hidden="true" />
          <input type="search" placeholder="Search by project or location" aria-label="Search projects" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
        {isLoading ? <SkeletonBlock className="h-56" /> : projects.length === 0 ? (
          <EmptyState icon={<Building2 />} title={isError ? "Projects unavailable" : term ? "No matches" : "No projects yet"} body={term && !isError ? "Try a different name or location." : "Check back for new listings."} />
        ) : (
          <ul className="account-projects-grid">
            {projects.map(project => (
              <li key={project.id}><ProjectCard project={project} animate={false} /></li>
            ))}
          </ul>
        )}
      </section>
    </EcoShell>
  );
}
