import { Link } from "@tanstack/react-router";
import { Building, Building2, Heart, Home, MapPin, PanelsTopLeft, Share2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { formatINR } from "@/components/aawash/dashboard-kit";
import { P_SHREE_SLUG } from "@/lib/p-shree";
import { startingPrice } from "@/lib/public-catalogue";
import { SAVITRI_SLUG } from "@/lib/savitri-enclave-brochure";
import "./project-card.css";

export interface ProjectCardData {
  id: string;
  slug: string;
  name: string;
  location?: string | null;
  address?: string | null;
  price_from?: number | null;
  price_min?: number | null;
  total_flats?: number | null;
  total_units?: number | null;
  total_floors?: number | null;
  cover_url?: string | null;
  thumbnail_url?: string | null;
  hero_banner_url?: string | null;
}

const WISHLIST_KEY = "aawaash-project-wishlist";
const WISHLIST_EVENT = "aawaash:wishlist-changed";

function readWishlist(): string[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(WISHLIST_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((name): name is string => typeof name === "string") : [];
  } catch {
    return [];
  }
}

function WishlistButton({ name }: { name: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(readWishlist().includes(name));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(WISHLIST_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WISHLIST_EVENT, sync);
    };
  }, [name]);

  function toggle() {
    const next = new Set(readWishlist());
    if (saved) next.delete(name);
    else next.add(name);
    setSaved(!saved);
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify([...next]));
      window.dispatchEvent(new Event(WISHLIST_EVENT));
    } catch {
      // The current card remains usable when persistent storage is disabled.
    }
  }

  return (
    <button type="button" className="listing-reference-wish"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved} onClick={toggle}>
      <Heart size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}

function ProjectPhoto({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  return images[index]
    ? <img src={images[index]} alt={`${name} exterior`} loading="lazy" decoding="async" onError={() => setIndex(index + 1)} />
    : <Building2 className="listing-reference-placeholder" aria-hidden="true" />;
}

export function ProjectCard({
  project, image, layout, priceLabel = "Starting from", priceFallback = "On request",
  manage = false, children, onShare, index = 0, animate = true, featuredPrice = false,
}: {
  project: ProjectCardData;
  image?: string | null;
  layout?: string;
  priceLabel?: string;
  priceFallback?: string;
  manage?: boolean;
  children?: ReactNode;
  onShare?: (project: ProjectCardData) => void;
  index?: number;
  animate?: boolean;
  featuredPrice?: boolean;
}) {
  const isSavitri = project.slug === SAVITRI_SLUG;
  const flats = project.total_flats || project.total_units || (isSavitri ? 20 : null);
  const floors = project.total_floors || (isSavitri ? 4 : null);
  const layoutName = layout || (isSavitri || project.slug === "27th" ? "3BHK" : project.slug === P_SHREE_SLUG ? "2 & 3 BHK" : "");
  const facts = [
    { label: "Flats", text: flats == null ? "" : `${flats.toLocaleString("en-IN")} Flats`, Icon: Home },
    { label: "Floors", text: floors == null ? "" : `${String(floors).padStart(2, "0")} Floors`, Icon: Building2 },
    { label: "Layout", text: layoutName, Icon: PanelsTopLeft },
  ].filter(fact => fact.text);
  const images = [...new Set([image, project.hero_banner_url, project.cover_url, project.thumbnail_url,
    isSavitri ? "/images/savitri-enclave-facade.webp" : null]
    .filter((url): url is string => Boolean(url)))];
  const address = (project.location || project.address || (isSavitri ? "JP Chowk, Darbhanga" : ""))
    .split(",").map(part => part.trim()).filter(Boolean).slice(0, 2).join(", ");
  const price = startingPrice(project);
  const amount = price === null ? null : formatINR(price, { compact: true }).replace(/^₹/, "").replace(/\.00(?= [LC])/, "");
  const destination = manage
    ? { to: "/admin/projects/$id", params: { id: project.id } } as const
    : { to: "/projects/$slug", params: { slug: project.slug } } as const;

  return (
    <article className={`listing-reference${animate ? " animate-fade-up" : ""}`}
      style={animate ? { animationDelay: `${Math.min(index * 60, 300)}ms` } : undefined}>
      <div className="listing-reference-photo">
        <Link {...destination} className="listing-reference-image-link" aria-label={`View ${project.name}`}>
          <ProjectPhoto key={JSON.stringify(images)} images={images} name={project.name} />
        </Link>
        <Link {...destination} className="listing-reference-open" aria-label={`${manage ? "Manage" : "Explore"} ${project.name}`}>
          <Building aria-hidden="true" />
        </Link>
        {!manage && <WishlistButton name={project.name} />}
        {onShare && (
          <button type="button" className="listing-reference-share" aria-label="Share project" onClick={() => onShare(project)}>
            <Share2 size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="listing-reference-info">
        <div className="listing-reference-heading">
          <div className="listing-reference-title">
            <h3><Link {...destination}>{project.name}</Link></h3>
            {address && <p><MapPin size={14} aria-hidden="true" />{address}</p>}
          </div>
          <div className={`listing-reference-price${featuredPrice ? " listing-reference-price--featured" : ""}`}>
            {amount !== null && <small>{priceLabel}</small>}
            <strong>
              {(amount !== null || featuredPrice) && (
                <span className="listing-price-currency" aria-hidden={amount === null || undefined}>₹</span>
              )}
              {amount ?? priceFallback}
            </strong>
          </div>
        </div>
        {facts.length > 0 && (
          <ul className="listing-reference-facts" aria-label="Property features">
            {facts.map(({ label, text, Icon }) => <li key={label}><Icon aria-hidden="true" /><span>{text}</span></li>)}
          </ul>
        )}
      </div>
      {children && <div className="listing-reference-extra">{children}</div>}
    </article>
  );
}
