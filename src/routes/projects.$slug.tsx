import { SplitDock } from "@/components/aawash/SplitDock";
import { getPShreeContent, P_SHREE_SLUG, P_SHREE_STARTING_PRICE, P_SHREE_SUMMARY } from "@/lib/p-shree";
import { PlanNavigation } from "@/components/aawash/projects/PlanNavigation";
import { PShreePlans } from "@/components/aawash/projects/PShreePlans";
import { SAVITRI_SLUG } from "@/lib/savitri-enclave-brochure";
import { startingPrice } from "@/lib/public-catalogue";
import { AVENUE_PRICE_LABEL, AVENUE_STARTING_PRICE } from "@/lib/27th-avenue-brochure";
import "@/project-detail.css";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  Play,
  ArrowUpRight,
  BedDouble,
  CarFront,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  ShieldCheck,
  Trees,
  Zap,
  Box,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Grid3x3,
  Home as HomeIcon,
  Images,
  Info,
  Layers,
  Link2,
  MapPin,
  Maximize2,
  Phone,
  Ruler,
  X,
} from "lucide-react";
import { LandingNav } from "@/components/aawash/landing/LandingNav";
import { formatINR, SkeletonBlock } from "@/components/aawash/dashboard-kit";
import { FlatInventoryBoard } from "@/components/aawash/projects/FlatInventoryBoard";
import { getPublicProject } from "@/lib/projects.functions";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { getPublicProjectPlans } from "@/lib/project-flats";
import { getProjectInventory } from "@/lib/inventory.functions";
import { ProjectLocation } from "@/components/aawash/projects/ProjectLocation";

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  pre_launch: "Pre-Launch",
  under_construction: "Under Construction",
  nearing_completion: "Nearing Completion",
  ready_to_move: "Ready to Move",
  completed: "Completed",
  on_hold: "On Hold",
  sold_out: "Sold Out",
};

type TabId = "overview" | "gallery" | "tour" | "availability" | "location";

export const Route = createFileRoute("/projects/$slug")({
  component: ProjectDetailPage,
  loader: async ({ params }) => {
    const data = { slug: params.slug };
    const [project, inventory] = await Promise.all([
      getPublicProject({ data }),
      getProjectInventory({ data }).catch(() => undefined),
    ]);
    if (!project) throw notFound();
    return { project, inventory };
  },
  staleTime: 30_000,
  head: ({ params, loaderData }) => {
    const details = loaderData?.project as { name?: string; seo_title?: string; seo_description?: string } | null | undefined;
    const title = details?.seo_title?.trim() || `${details?.name || prettify(params.slug)} — Aawaash`;
    const desc = details?.seo_description?.trim() || (params.slug === P_SHREE_SLUG ? P_SHREE_SUMMARY : `Explore ${prettify(params.slug)}: floor plans, live availability, gallery, 3D tour and location. A premium Aawaash residence.`);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
    };
  },
});

function isPublicProjectLink(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^\/(?![\/\\])[^\\\r\n]*$/.test(value) ||
    /^https?:\/\//i.test(value) && URL.canParse(value);
}

function prettify(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProjectDetailPage() {
  const { slug } = Route.useParams();
  const fetchProject = useServerFn(getPublicProject);
  const { project: initialProject, inventory: initialInventory } = Route.useLoaderData();
  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["project", "public", slug],
    queryFn: () => fetchProject({ data: { slug } }),
    initialData: initialProject ?? undefined,
    staleTime: 15_000,
  });

  // Realtime: admin edits to projects or flats invalidate this page instantly.
  useRealtimeInvalidate(
    `project-public-${slug}`,
    ["projects", "buildings", "floors", "flats"],
    [
      ["project", "public", slug],
      ["inventory", slug],
    ],
    { pollMs: 5_000, contentScope: "projects" },
  );

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  useEffect(() => {
    const sync = () => setActiveSection(window.location.hash.slice(1) || "overview");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [slug]);

  const p = (project ?? {}) as Record<string, unknown>;
  const fetchInventory = useServerFn(getProjectInventory);
  const inventory = useQuery({
    queryKey: ["inventory", slug],
    queryFn: () => fetchInventory({ data: { slug } }),
    enabled: Boolean(project),
    initialData: initialInventory ?? undefined,
  });
  const isAvenue = slug === "27th";
  const isSavitri = slug === SAVITRI_SLUG;
  const isPShree = slug === P_SHREE_SLUG;
  const pShreeContent = isPShree ? getPShreeContent(p.extra) : null;
  const floorCount = inventory.data?.floors.length || (p.total_floors as number) || 0;
  const total = inventory.data?.flats.length || (p.total_flats as number) || 0;
  const available = inventory.data?.flats.length
    ? inventory.data.flats.filter(flat => flat.status === "available").length
    : (p.available_flats as number) ?? 0;
  const availabilityUnconfirmed = isPShree
    ? !inventory.data?.flats.some(flat => flat.status !== "not_released") && p.available_flats == null
    : p.available_flats == null && isAvenue && !inventory.data?.flats.length;
  const availabilityValue = availabilityUnconfirmed
    ? isAvenue && inventory.isPending ? "—" : "Enquire"
    : String(available);
  const price = startingPrice(p);

  const gallery = useMemo<string[]>(() => {
    const raw = p.gallery;
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string" && !!v);
    return [];
  }, [p.gallery]);

  const projectPhotos = useMemo<string[]>(() => {
    const arr = [
      p.hero_banner_url as string | null,
      p.cover_url as string | null,
      p.thumbnail_url as string | null,
      ...gallery,
    ];
    return [...new Set(arr.filter((v): v is string => !!v))];
  }, [p.hero_banner_url, p.cover_url, p.thumbnail_url, gallery]);
  const primaryPhoto = projectPhotos[0];
  const heroPhoto = isAvenue && primaryPhoto === "/projects/27th-avenue/exterior-front.webp"
    ? projectPhotos.find(photo => photo === "/projects/27th-avenue/exterior-perspective.webp") ?? primaryPhoto
    : primaryPhoto;
  const videoLinks = Array.isArray(p.videos) ? p.videos.filter(isPublicProjectLink) : [];
  const walkthrough = isPublicProjectLink(p.virtual_walkthrough_url) ? p.virtual_walkthrough_url : null;
  const modelUrl = isPublicProjectLink(p.three_d_tour_url) ? p.three_d_tour_url : null;
  const isGlb = !!modelUrl && /\.(glb|gltf)(\?|$)/i.test(modelUrl);
  const hasTour = !!(modelUrl || walkthrough);
  const plans = getPublicProjectPlans(slug, p.extra, inventory.data);
  const labelledFloorPhotos = projectPhotos.filter(photo => /(?:floor[-_ ]?plan|site[-_ ]?plan)/i.test(photo));
  const floorPhotos = [...new Set([
    ...labelledFloorPhotos,
    ...(pShreeContent ? pShreeContent.towers.map(tower => tower.image) : plans.map(plan => plan.image)),
  ].filter((photo): photo is string => !!photo && isPublicProjectLink(photo)))];
  const exteriorPhotos = projectPhotos.filter(photo => !floorPhotos.includes(photo));
  const lightboxPhotos = [...new Set([...exteriorPhotos, ...floorPhotos])];
  const openPhoto = (photo: string) => {
    const index = lightboxPhotos.indexOf(photo);
    if (index >= 0) setLightbox(index);
  };
  const typeLabel = isPShree ? "2 & 3 BHK" : isAvenue || isSavitri ? "3 BHK" : p.project_type === "entire_building"
    ? "Entire Building" : p.project_type === "villa" ? "Villa" : "Flat Inventory";
  const facts = (
    <dl className="property-facts" aria-label="Project at a glance">
      <PropertyFact icon={BedDouble} label="Type" value={typeLabel} />
      <PropertyFact icon={Layers} label={floorCount ? "Floors" : "Status"} value={floorCount ? String(floorCount) : STATUS_LABELS[String(p.construction_status)] ?? "—"} />
      <PropertyFact icon={Building2} label="Total Flats" value={String(total || ((p.total_units as number) ?? 0))} />
      <PropertyFact icon={ShieldCheck} label={availabilityUnconfirmed ? "Availability" : "Available"} value={availabilityValue} highlight />
    </dl>
  );

  const shareUrl = typeof window !== "undefined" ? window.location.href : `/projects/${slug}`;
  const doShare = useCallback(async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    const name = (p.name as string) || prettify(slug);
    try {
      if (nav.share) {
        await nav.share({ title: `${name} — Aawaash`, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  }, [p.name, shareUrl, slug]);

  if (!isLoading && !isError && !project) throw notFound();

  return (
    <div className={`property-page ${slug === "27th" ? "avenue-page" : ""} relative min-h-screen pb-24 sm:pb-0`}>
      <LandingNav project />

      <main className="property-content mx-auto">
        {isError ? (
          <div className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-semibold text-destructive">We couldn't load this project.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110"
            >
              Retry
            </button>
          </div>
        ) : isLoading || !project ? (
          <div className="mt-4 space-y-4" aria-busy="true" aria-live="polite">
            <SkeletonBlock className="h-72 rounded-[2rem]" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
            <SkeletonBlock className="h-40 rounded-3xl" />
            <SkeletonBlock className="h-64 rounded-3xl" />
          </div>
        ) : (
          <>
            <section id="overview" className="property-hero" aria-labelledby="project-name">
              <div className="property-hero-image">
                {heroPhoto ? <img src={heroPhoto} alt={p.name as string} loading="eager" fetchPriority="high" decoding="async" />
                  : <EmptyTile icon={<Building2 size={26} />} label="Project photo coming soon" />}
              </div>
              <h1 id="project-name" className="property-project-title">{String(p.name)}</h1>
              <div className="property-hero-info">
                <p className="property-address"><MapPin size={23} aria-hidden="true" /><span>{String(p.address || p.location || "")}</span></p>
                <div className="property-hero-actions">
                  <dl className="property-price">
                    <dt className="property-price-label">Starting Price</dt>
                    <dd className="property-price-value">
                      {isAvenue && price === AVENUE_STARTING_PRICE ? AVENUE_PRICE_LABEL : isPShree && price === P_SHREE_STARTING_PRICE ? "₹45 lakh" : price !== null ? formatINR(price, { compact: true }) : "On Request"}
                    </dd>
                  </dl>
                  <a href="#availability" className="property-price-arrow" aria-label="Check availability"><ArrowRight size={20} /></a>
                </div>
              </div>
            </section>

            {facts}
            <nav className="property-jumps" aria-label="Explore this residence">
              {[["overview", "Overview"], ["flats", "Plans"], ["gallery", "Gallery"], ...(hasTour ? [["tour", "3D Tour"]] : []), ["location", "Location"]].map(([id, label]) => (
                <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined}>{label}</a>
              ))}
            </nav>

            <ProjectAmenities amenities={Array.isArray(p.amenities) ? p.amenities.filter((item): item is string => typeof item === "string") : []} />
            {heroPhoto && (
              <Link to="/" hash="contact" className="property-enquire-banner" style={{ backgroundImage: `linear-gradient(90deg, #2a2c26f5, #2a2c26cb 40%, #2a2c2635 78%), url(${JSON.stringify(exteriorPhotos[1] || heroPhoto)})` }}>
                <HomeIcon size={32} aria-hidden="true" /><span>Your Dream Home Awaits</span><ArrowRight size={23} aria-hidden="true" />
              </Link>
            )}

            <div className="property-plan-section">
              {isPShree ? <PShreePlans extra={p.extra} /> : <FlatShowcase key={slug} flats={plans} loading={inventory.isLoading && plans.length === 0} />}
              {isSavitri && <SavitriSpecifications extra={p.extra} />}
            </div>

            {/* AVAILABILITY (seatmap) */}
            <section id="availability" className="property-detail-section scroll-mt-24">
              <SectionHeader title="Availability" eyebrow={String(p.name)} description="Find live availability by tower and floor." />
              {pShreeContent?.availabilityNote && <p className="property-inventory-note mb-3">{pShreeContent.availabilityNote}</p>}
              <FlatInventoryBoard key={slug} slug={slug} projectName={p.name as string} />
            </section>

            {/* GALLERY */}
            <section id="gallery" className="property-detail-section scroll-mt-24">
              <SectionHeader title="Project Gallery" description="Visual Highlights" />
              <div className="mt-4">
                {pShreeContent?.renderings && (
                  <a className="p-shree-doc-link mb-3" href={pShreeContent.renderings} target="_blank" rel="noreferrer">
                    View architectural renderings PDF <ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
                <GalleryPanel key={slug} exterior={exteriorPhotos} plans={floorPhotos} tour={hasTour} onOpen={openPhoto} />
                {videoLinks.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Project videos">
                  {videoLinks.map((href, index) => <a key={`${href}-${index}`} href={href} target="_blank" rel="noreferrer" className="p-shree-doc-link rounded-xl border border-border px-3">
                    Project video {index + 1} <ExternalLink size={14} aria-hidden="true" />
                  </a>)}
                </div>}
              </div>
            </section>

            {/* 3D MODEL */}
            {hasTour && <section id="tour" className="property-detail-section scroll-mt-24">
              <SectionHeader title="Explore in 3D" />
              <div className="mt-4">
                <TourPanel key={modelUrl || walkthrough} modelUrl={modelUrl} walkthrough={walkthrough} isGlb={isGlb} heroPhoto={heroPhoto} />
                {slug === "27th" && <p className="brochure-model-note">Exterior reconstructed from brochure images. Dimensions and unseen details are approximate.</p>}
              </div>
            </section>}

            {/* LOCATION */}
            <section id="location" className="property-detail-section scroll-mt-24">
              <ProjectLocation project={p} />
            </section>

            {/* Desktop CTAs */}
            <div className="mt-10 hidden flex-wrap gap-3 sm:flex">
              <Link
                to="/auth"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110"
              >
                <Phone size={14} /> Enquire Now
              </Link>
              <button
                onClick={doShare}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-input bg-surface px-6 text-sm font-bold text-foreground hover:bg-muted"
              >
                <Link2 size={14} /> Copy Share Link
              </button>
            </div>
          </>
        )}
      </main>

      {/* Project dock */}
      {project && <ProjectDock />}

      {/* Lightbox */}
      {lightbox !== null && lightboxPhotos.length > 0 && (
        <Lightbox
          images={lightboxPhotos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox(i)}
        />
      )}
    </div>
  );
}

/* ================== PANELS ================== */

const AMENITY_ICONS = [
  [/pool|water/i, Droplets],
  [/gym|fitness/i, Dumbbell],
  [/fire/i, Flame],
  [/power/i, Zap],
  [/security|cctv|earthquake/i, ShieldCheck],
  [/parking/i, CarFront],
  [/jog|walk|play/i, Footprints],
  [/lawn|green|garden/i, Trees],
  [/lift|elevator|temple/i, Building2],
] as const;

function amenityIcon(label: string) {
  return AMENITY_ICONS.find(([pattern]) => pattern.test(label))?.[1] ?? Check;
}

function ProjectAmenities({ amenities }: { amenities: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const unique = [...new Set(amenities)];
  if (!unique.length) return null;
  return (
    <section className="property-amenity-section" aria-labelledby="project-amenities">
      <div className="property-amenity-heading">
        <h2 id="project-amenities">Amenities</h2>
        {unique.length > 8 && <button type="button" aria-expanded={expanded} aria-controls="property-amenities-list" onClick={() => setExpanded(value => !value)}>
          {expanded ? "Show Less" : "View All"} <ArrowRight size={17} aria-hidden="true" />
        </button>}
      </div>
      <ul id="property-amenities-list" className="property-amenity-grid">
        {(expanded ? unique : unique.slice(0, 8)).map(amenity => {
          const Icon = amenityIcon(amenity);
          return <li key={amenity}><span><Icon size={25} strokeWidth={1.55} aria-hidden="true" /></span><strong>{amenity}</strong></li>;
        })}
      </ul>
    </section>
  );
}

function SavitriSpecifications({ extra }: { extra: unknown }) {
  if (!extra || typeof extra !== "object") return null;
  const { developer, specifications } = extra as Record<string, unknown>;
  if (!Array.isArray(specifications) || !specifications.length) return null;
  return (
    <details className="property-specifications">
      <summary>
        <span>
          <strong>Building specifications</strong>
          {typeof developer === "string" && <small>Developed by {developer}</small>}
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </summary>
      <dl>
        {specifications.map((specification, index) => {
          if (!specification || typeof specification.title !== "string" || typeof specification.description !== "string") return null;
          return <div key={index}><dt>{specification.title}</dt><dd>{specification.description}</dd></div>;
        })}
      </dl>
    </details>
  );
}

function FlatShowcase({ flats, loading }: { flats: ReturnType<typeof getPublicProjectPlans>; loading: boolean }) {
  const [active, setActive] = useState(() => Math.max(0, flats.findIndex(plan => /\bType 3$/i.test(plan.title))));
  const touch = useRef<{ x: number; y: number } | null>(null);
  const index = Math.min(active, flats.length - 1);
  const flat = flats[index];
  if (!flat) return (
    <section id="flats" className="property-plans">
      <div className="property-plan-heading"><SectionHeader title={<>Choose <em>Your Plan</em></>} /></div>
      <p className="text-sm text-muted-foreground">{loading ? "Loading floor plans…" : "Floor plans will appear here when released."}</p>
    </section>
  );

  const move = (direction: number) => {
    setActive(current => (Math.min(current, flats.length - 1) + direction + flats.length) % flats.length);
  };

  const [layout, planType] = flat.title.split(" · ", 2);
  return (
    <section id="flats" aria-label="Choose your plan" className="property-plans">
      <div className="property-plan-heading">
        <SectionHeader title={<>Choose <em>Your Plan</em></>} />
      </div>
      <article className="property-plan-card" aria-label={flat.title}
        onTouchStart={event => {
          const start = event.changedTouches[0];
          if (start) touch.current = { x: start.clientX, y: start.clientY };
        }}
        onTouchEnd={event => {
          const start = touch.current;
          touch.current = null;
          const end = event.changedTouches[0];
          if (!start || !end) return;
          const dx = end.clientX - start.x;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(end.clientY - start.y)) move(dx < 0 ? 1 : -1);
        }}
        onTouchCancel={() => { touch.current = null; }}
      >
        <div className="property-plan-visual">
          <PlanPhoto key={`${index}-${flat.image}-${flat.fallbackImage ?? ""}`} flat={flat} />
          <PlanNavigation labels={flats.map(plan => plan.title)} index={index} onChange={setActive} />
        </div>
        <div className="property-plan-copy" aria-live="polite">
          <p className="property-plan-kicker">Floor plan</p>
          <h3>{layout}</h3>
          {planType && <span className="property-plan-type">{planType}</span>}
          {flat.area && <p className="property-plan-area"><Ruler size={16} aria-hidden="true" />{flat.area}</p>}
          {flat.amenities.length > 0 && (
            <ul className="property-plan-features">
              {flat.amenities.map((item, index) => (
                <li key={`${item}-${index}`}><Check size={13} aria-hidden="true" />{item}</li>
              ))}
            </ul>
          )}
          {flat.note && <p className="property-plan-note">{flat.note}</p>}
        </div>
      </article>
    </section>
  );
}

function PlanPhoto({ flat }: { flat: ReturnType<typeof getPublicProjectPlans>[number] }) {
  const [src, setSrc] = useState(flat.image);
  if (!src) {
    return <div className="property-plan-image property-plan-placeholder"><HomeIcon size={23} /><span>Plan image unavailable</span></div>;
  }
  return (
    <a className="property-plan-image" href={src} target="_blank" rel="noreferrer" aria-label={`Open full image for ${flat.title}`}>
      <img src={src} alt={`${flat.title} floor plan`} loading="lazy" decoding="async" onError={() => setSrc(src === flat.fallbackImage ? "" : flat.fallbackImage ?? "")} />
      <span className="property-gallery-expand"><Maximize2 size={17} aria-hidden="true" /></span>
    </a>
  );
}

function GalleryPanel({ exterior, plans, tour, onOpen }: { exterior: string[]; plans: string[]; tour: boolean; onOpen: (photo: string) => void }) {
  const [filter, setFilter] = useState<"all" | "exterior" | "plans">("all");
  const [page, setPage] = useState(0);
  const photos = filter === "plans" ? plans : filter === "exterior" ? exterior : [...exterior, ...plans];
  const ordered = filter === "all" && exterior.length > 1 && plans.length
    ? [...exterior.slice(0, 2), plans[0], ...exterior.slice(2), ...plans.slice(1)]
    : photos;
  const pages = Math.ceil(ordered.length / 3);
  const activePage = Math.min(page, Math.max(pages - 1, 0));
  const [featured, second, third] = ordered.slice(activePage * 3, activePage * 3 + 3);
  const tile = (src: string, primary = false) => (
    <button type="button" className={primary ? "property-gallery-main" : ""} aria-label={plans.includes(src) ? "Open floor plan" : "Open exterior photo"} onClick={() => onOpen(src)}>
      <img src={src} alt={plans.includes(src) ? "Floor plan" : "Project exterior"} loading="lazy" decoding="async" />
      {primary && <><span className="property-gallery-caption">{plans.includes(src) ? "Floor Plan" : "Exterior View"}</span><span className="property-gallery-expand"><Maximize2 size={18} aria-hidden="true" /></span></>}
    </button>
  );
  return (
    <>
      <div className="property-gallery-filters" role="group" aria-label="Gallery categories">
        <button type="button" aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setPage(0); }}>All</button>
        {!!exterior.length && <button type="button" aria-pressed={filter === "exterior"} onClick={() => { setFilter("exterior"); setPage(0); }}><Building2 size={18} aria-hidden="true" /> Exterior</button>}
        {!!plans.length && <button type="button" aria-pressed={filter === "plans"} onClick={() => { setFilter("plans"); setPage(0); }}><Grid3x3 size={18} aria-hidden="true" /> Floor Plan</button>}
        {tour && <a href="#tour"><Box size={18} aria-hidden="true" /> 3D Tour</a>}
      </div>
      {featured ? (
        <>
          <div className={`property-gallery-mosaic${second || third ? "" : " single-image"}`}>
            {tile(featured, true)}
            {(second || third) && <div className="property-gallery-side">
              {second && (tour && filter === "all" && activePage === 0 && !plans.includes(second) ? (
                <a href="#tour" aria-label="Watch 3D tour" className="property-gallery-video">
                  <img src={second} alt="" loading="lazy" decoding="async" />
                  <span><Play size={18} fill="currentColor" aria-hidden="true" /></span>
                </a>
              ) : tile(second))}
              {third && tile(third)}
            </div>}
          </div>
          {pages > 1 && <div className="property-gallery-pages" aria-label="Gallery pages">
            {Array.from({ length: pages }, (_, index) => <button key={index} type="button" aria-label={`Show gallery page ${index + 1}`} aria-pressed={activePage === index} onClick={() => setPage(index)} />)}
          </div>}
        </>
      ) : <EmptyTile icon={<Images size={26} />} label="No photos yet" />}
    </>
  );
}

function TourPanel({ modelUrl, walkthrough, isGlb, heroPhoto }: { modelUrl: string | null; walkthrough: string | null; isGlb: boolean; heroPhoto?: string }) {
  const [opened, setOpened] = useState(false);
  const source = modelUrl || walkthrough;
  if (!source) return null;
  return (
    <div className="property-tour">
      {opened && modelUrl ? (
        <div className="property-tour-stage">
          {isGlb ? <ModelViewerFrame src={modelUrl} /> : <IframeFrame src={modelUrl} title="3D tour" />}
        </div>
      ) : (
        <div className="property-tour-poster">
          {heroPhoto && <div className="property-tour-art"><img src={heroPhoto} alt="" loading="lazy" decoding="async" /><span aria-hidden="true">360°</span></div>}
          <div className="property-tour-copy">
            <h3><Box size={22} aria-hidden="true" /> Virtual Tour</h3>
            <p>Explore the project in an immersive 3D experience.</p>
            {modelUrl ? <button type="button" onClick={() => setOpened(true)} className="property-pill-action">Open Tour <ArrowRight size={18} aria-hidden="true" /></button>
              : <a href={source} target="_blank" rel="noreferrer" className="property-pill-action">Open Tour <ArrowRight size={18} aria-hidden="true" /></a>}
          </div>
        </div>
      )}
      {opened && <a href={source} target="_blank" rel="noreferrer" className="property-tour-source">Open tour in a new tab <ExternalLink size={13} aria-hidden="true" /></a>}
    </div>
  );
}

function ModelViewerFrame({ src }: { src: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(Boolean(entry?.isIntersecting));
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Remove the browser-only dependency from the server bundle entirely.
    if (import.meta.env.SSR || !inView) return;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) { setErrored(true); return; }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    let cancelled = false;
    import("@google/model-viewer").then(() => customElements.whenDefined("model-viewer")).then(() => {
      if (!cancelled) setReady(true);
    }).catch(() => { if (!cancelled) setErrored(true); });
    return () => { cancelled = true; };
  }, [inView]);

  useEffect(() => {
    if (!inView || loaded || errored) return;
    const timeout = window.setTimeout(() => setErrored(true), 20_000);
    return () => window.clearTimeout(timeout);
  }, [inView, loaded, errored]);

  return (
    <div ref={frameRef} className="relative h-full w-full">
      {errored ? (
        src.includes("27th-avenue") ? <div className="flex h-full flex-col items-center justify-center p-3"><img src="/projects/27th-avenue/model-preview.webp" alt="Rendered preview of the brochure-based 27th Avenue exterior model" className="min-h-0 w-full flex-1 object-contain" /><p className="mt-2 text-center text-xs text-muted-foreground">The interactive model could not load here. You can download the model file below.</p></div> : <EmptyTile icon={<Box size={22} />} label="Couldn't load 3D model" />
      ) : (
        <>
          {(!inView || !ready || !loaded) && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-background/70 text-muted-foreground backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Box size={22} />
                <span className="text-xs font-semibold">{inView ? "Loading 3D model…" : "3D model ready when you are"}</span>
              </div>
            </div>
          )}
          {ready && (
            // @ts-expect-error - custom element
            <model-viewer
              src={src}
              camera-controls
              environment-image="neutral"
              camera-orbit="35deg 68deg auto"
              tone-mapping="commerce"
              auto-rotate={inView ? true : undefined}
              auto-rotate-delay="300"
              rotation-per-second="18deg"
              touch-action="pan-y"
              interaction-prompt="none"
              loading="lazy"
              reveal="auto"
              shadow-intensity="0"
              exposure="1"
              power-preference="high-performance"
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              style={{ width: "100%", height: "100%", background: "transparent" }}
            />
          )}
        </>
      )}
    </div>
  );
}

function IframeFrame({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 grid animate-pulse place-items-center text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Box size={22} />
            <span className="text-xs font-semibold">Loading tour…</span>
          </div>
        </div>
      )}
      <iframe
        title={title}
        src={src}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="h-full w-full"
        allow="fullscreen; xr-spatial-tracking; vr; accelerometer; gyroscope"
        allowFullScreen
      />
    </>
  );
}

/* ================== BITS ================== */

function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, images.length, onClose, onIndex]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-3 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Project photo gallery"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onIndex((index - 1 + images.length) % images.length);
        }}
        className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onIndex((index + 1) % images.length);
        }}
        className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>
      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
      />
      <div
        className="absolute bottom-3 left-1/2 flex max-w-[92vw] -translate-x-1/2 flex-col items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
          {index + 1} / {images.length}
        </div>
        {images.length > 1 && (
          <div className="flex max-w-[92vw] gap-2 overflow-x-auto rounded-2xl bg-white/10 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((src, i) => (
              <button
                key={`thumb-${src}-${i}`}
                type="button"
                onClick={() => onIndex(i)}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === index}
                className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyFact({ icon: Icon, label, value, highlight = false }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "property-fact is-available" : "property-fact"}>
      <span className="property-fact-icon"><Icon size={23} strokeWidth={1.65} aria-hidden="true" /></span>
      <dt>{label}</dt><dd>{value}</dd>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-extrabold text-foreground">{value}</div>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <li className="mb-4 last:mb-0">
      <span
        className={`absolute -left-[7px] mt-1 grid h-3 w-3 place-items-center rounded-full ${
          highlight ? "bg-primary shadow-[var(--shadow-glow)]" : "bg-muted-foreground/40"
        }`}
      />
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </li>
  );
}

function EmptyTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="property-empty grid h-full w-full place-items-center text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
    </div>
  );
}

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host.includes("matterport.com") || host.includes("sketchfab.com")) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/* ================== SECTION HEADER + PROJECT DOCK ================== */

function SectionHeader({ title, eyebrow, description, illustration = false }: { title: React.ReactNode; eyebrow?: string; description?: string; illustration?: boolean }) {
  return (
    <div className={`property-section-intro${illustration ? " property-section-illustrated" : ""}`}>
      {eyebrow && <p className="property-section-eyebrow">{eyebrow}</p>}
      <h2 className="property-section-heading">{title}</h2>
      {description && <p className="property-section-description">{description}</p>}
    </div>
  );
}

const projectDockItems: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    href: string;
    targetId?: string;
  }> = [
    { id: "home", label: "Home", icon: HomeIcon, href: "/" },
    { id: "gallery", label: "Gallery", icon: Images, href: "#gallery", targetId: "gallery" },
    { id: "flats", label: "Plans", icon: Layers, href: "#flats", targetId: "flats" },
    {
      id: "availability",
      label: "Availability",
      icon: Grid3x3,
      href: "#availability",
      targetId: "availability",
    },
    { id: "location", label: "Location", icon: MapPin, href: "#location", targetId: "location" },
  ];

function ProjectDock() {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(entry => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
        else setActiveId(active => entries.some(entry => entry.target.id === active) ? null : active);
      },
      { rootMargin: "-25% 0px -55% 0px" },
    );
    for (const { targetId } of projectDockItems) {
      if (!targetId) continue;
      const section = document.getElementById(targetId);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const section = document.getElementById(targetId);
    if (!section) return;
    event.preventDefault();
    setActiveId(targetId);
    section.scrollIntoView({
      behavior: "instant",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="Project sections"
      className="property-dock aawaash-dock pointer-events-none fixed inset-x-0 bottom-0 z-[95] px-3 sm:px-6"
    >
      <SplitDock items={projectDockItems.map(({ id, label, icon: Icon, href, targetId }) => {
          const isActive = !!targetId && activeId === targetId;
          const className = `aawaash-dock-link relative flex flex-1 touch-manipulation flex-col items-center justify-center gap-1 ${isActive ? "is-active" : ""}`;
          const contents = <><Icon size={21} strokeWidth={isActive ? 2.2 : 1.7} aria-hidden="true" /><span className="aawaash-dock-label">{label}</span></>;
          return (
            <li key={id} className="flex min-w-0 flex-1">
              {targetId ? (
                <a href={href} onClick={event => scrollToSection(event, targetId)} aria-current={isActive ? "location" : undefined} className={className}>{contents}</a>
              ) : (
                <Link to={href} className={className}>{contents}</Link>
              )}
            </li>
          );
      })} />
    </nav>
  );
}
