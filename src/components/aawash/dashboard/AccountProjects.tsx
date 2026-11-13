import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Layers, MapPin, Search, Wallet } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { RoleGuard } from "@/components/aawash/AuthGuard";
import { EmptyState, SkeletonBlock, formatINR } from "@/components/aawash/dashboard-kit";
import { HomeSkyline } from "@/components/aawash/landing/HomeSkyline";
import { listProjects } from "@/lib/leader.functions";
import { startingPrice } from "@/lib/public-catalogue";
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
            {projects.map(project => {
              const images = [...new Set([project.hero_banner_url, project.cover_url, project.thumbnail_url].filter((image): image is string => Boolean(image)))];
              const price = startingPrice(project);
              return (
                <li key={project.id}>
                  <Link to="/projects/$slug" params={{ slug: project.slug }} className="account-project-card" aria-label={`View ${project.name}`}>
                    <div className="account-project-card-image">
                      <ProjectPhoto key={images.join("|")} images={images} />
                      {project.tag && <span>{project.tag}</span>}
                    </div>
                    <div className="account-project-card-body">
                      <div className="account-project-card-title">
                        <h2>{project.name}</h2>
                        {project.location && <p><MapPin aria-hidden="true" />{project.location}</p>}
                      </div>
                      <dl>
                        <div><Wallet aria-hidden="true" /><dt>Starting price</dt><dd>{price === null ? "On request" : formatINR(price, { compact: true })}</dd></div>
                        <div><Layers aria-hidden="true" /><dt>Units sold</dt><dd>{project.sold_units ?? 0} / {project.total_units ?? 0}</dd></div>
                      </dl>
                      <span className="account-project-card-action">View project <ArrowRight aria-hidden="true" /></span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </EcoShell>
  );
}

function ProjectPhoto({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  return images[index]
    ? <img src={images[index]} alt="" loading="lazy" decoding="async" onError={() => setIndex(current => current + 1)} />
    : <Building2 className="account-project-photo-placeholder" aria-hidden="true" />;
}
