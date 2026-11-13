import { ExternalLink, MapPin } from "lucide-react";

function googleMapsLink(project: Record<string, unknown>, query: string) {
  if (typeof project.google_map_url === "string") {
    try {
      const configured = new URL(project.google_map_url);
      if (configured.protocol === "https:" && !configured.username && !configured.password) {
        const host = configured.hostname;
        if (host === "maps.app.goo.gl" || host === "maps.google.com" || host === "maps.google.co.in" ||
          ((host === "www.google.com" || host === "www.google.co.in" || host === "google.com") &&
            (configured.pathname === "/maps" || configured.pathname.startsWith("/maps/"))) ||
          (host === "goo.gl" && configured.pathname.startsWith("/maps/"))) {
          return configured.href;
        }
      }
    } catch {
      // Fall back to the saved project coordinates or address.
    }
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function projectMapQuery(project: Record<string, unknown>, address: string) {
  const { latitude, longitude } = project;
  if (typeof latitude === "number" && typeof longitude === "number" &&
    Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 &&
    (latitude !== 0 || longitude !== 0)) return `${latitude},${longitude}`;

  if (typeof project.google_map_url === "string") {
    try {
      const link = new URL(googleMapsLink(project, ""));
      const marker = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(link.href);
      const query = link.searchParams.get("query") || link.searchParams.get("q");
      if (marker) return `${marker[1]},${marker[2]}`;
      if (query?.trim()) return query.trim();
    } catch {
      // Use the published project name and address.
    }
  }
  return [project.name, address].filter(Boolean).join(", ");
}

export function ProjectLocation({ project }: { project: Record<string, unknown> }) {
  const address = String(project.address || project.location || "");
  const query = projectMapQuery(project, address);
  const name = String(project.name || "this project");

  return (
    <div className="property-location-panel">
      <div className="property-location-copy">
        <span className="property-location-kicker"><MapPin size={15} aria-hidden="true" /> Neighbourhood</span>
        <h2>Location</h2>
        {address && <p>{address}</p>}
        <a className="property-location-directions" href={googleMapsLink(project, query)} target="_blank" rel="noreferrer">
          Open in Google Maps <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
      {query && <iframe
        className="property-location-map"
        title={`Google Maps location for ${name}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />}
    </div>
  );
}
