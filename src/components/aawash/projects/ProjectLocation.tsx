import { ExternalLink, MapPin } from "lucide-react";
import savitriMap from "@/assets/savitri-location.jpg";

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

const projectMapImages: Record<string, { area: RegExp; src: string; caption: string }> = {
  "27th": {
    area: /mabbi|kamtaul/i,
    src: "/projects/27th-avenue/location-map.webp",
    caption: "27th Avenue location map from the project brochure",
  },
  "savitri-enclave": {
    area: /jp chowk|bhagwan das/i,
    src: savitriMap,
    caption: "Savitri Enclave location map from the project brochure",
  },
  "p-shree": {
    area: /chandan\s*patti/i,
    src: "/projects/p-shree/chandanpatti-area.webp",
    caption: "Chandanpatti area · Approximate location",
  },
};

export function ProjectLocation({ project }: { project: Record<string, unknown> }) {
  const address = String(project.address || project.location || "");
  const query = projectMapQuery(project, address);
  const name = String(project.name || "this project");
  const slug = String(project.slug || "");
  const photo = projectMapImages[slug];
  const hasCustomPin = Boolean(project.google_map_url) || (query !== [project.name, address].filter(Boolean).join(", "));
  const snapshot = !hasCustomPin && photo?.area.test(address) ? photo : undefined;
  const directions = googleMapsLink(project, query);

  return (
    <div className="property-location-panel">
      <h2 className="property-location-title">Location</h2>
      {snapshot ? (
        <figure className="property-location-figure">
          <a href={directions} target="_blank" rel="noreferrer" aria-label={`Open directions for ${name}`}>
            <img className="property-location-map" src={snapshot.src} alt={snapshot.caption} loading="lazy" decoding="async" />
          </a>
          {slug === "p-shree" && (
            <figcaption>{snapshot.caption} · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></figcaption>
          )}
        </figure>
      ) : query && (
        <iframe
          className="property-location-map"
          title={`Google Maps location for ${name}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
      {address && <p className="property-location-address"><MapPin size={19} aria-hidden="true" /><span>{address}</span></p>}
      {query && (
        <a className="property-location-directions" href={directions} target="_blank" rel="noreferrer">
          Open in Google Maps <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
