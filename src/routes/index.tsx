import { SiteFooter } from "@/components/aawash/landing/SiteFooter";
import { BuildingExplorer } from "@/components/aawash/landing/BuildingExplorer";
import "@/homepage.css";
import "@/homepage-future.css";
import "@/homepage-atelier.css";
import "@/homepage-reference-hero.css";
import "@/homepage-reference-sections.css";
import { HomepageMotion } from "@/components/aawash/landing/HomepageMotion";
import { HomeSkyline } from "@/components/aawash/landing/HomeSkyline";
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicProject } from "@/lib/projects.functions";
import { ProjectCard } from "@/components/aawash/projects/ProjectCard";
import { getHomepageContent } from "@/lib/homepage.functions";
import { DEFAULT_HOMEPAGE, type HomeItem, type HomepageDoc, type HomeSection } from "@/lib/homepage-content";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BedDouble,
  BadgeIndianRupee,
  DraftingCompass,
  HousePlug,
  HandCoins,
  ChartCandlestick,
  Tag,
  ParkingSquare,
  Coins,
  TrendingUp,
  Building2,
  Wallet,
  LineChart,
  Smartphone,
  BarChart3,
  Leaf,
  Sparkles,
  MapPin,
  Star,
  Phone,
  Mail,
  MapPinned,
  Send,
  CheckCircle2,
  Search,
  Home,
  Landmark,
  Trees,
  Store,
  Gem,
  Waves,
  Dumbbell,
  Armchair,
  Plus,
  Bike,
  ChevronRight,
  X,
  Ruler,
  Layers,
  ShieldAlert,
  Zap,
  Droplet,
  DoorOpen,
  Paintbrush,
  ArrowUpDown,
} from "lucide-react";

import heroTowerTreesAsset from "@/assets/savitri-hero-tower.png.asset.json";
const heroTowerTrees = heroTowerTreesAsset.url;
const heroResidence = heroTowerTreesAsset.url;
import { SAVITRI_ASSET, SAVITRI_GALLERY } from "@/lib/savitri-enclave-brochure";
import savitriLocationMap from "@/assets/savitri-location.jpg";
import { Dialog, DialogContent } from "@/components/ui/dialog";



import { AmbientBackground } from "@/components/aawash/AmbientBackground";
import { useBrand } from "@/components/aawash/cms/BrandProvider";
import { BrandMark } from "@/components/aawash/BrandMark";
import { LandingNav } from "@/components/aawash/landing/LandingNav";
import { Reveal } from "@/components/aawash/landing/Reveal";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import * as Accordion from "@radix-ui/react-accordion";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Buy and Sell Flats | Aawaash" },
      {
        name: "description",
        content:
          "Browse residential flats for sale or enquire about selling your flat directly to Aawaash.",
      },
      { property: "og:title", content: "Buy and Sell Flats | Aawaash" },
      {
        property: "og:description",
        content:
          "Browse residential flats for sale or enquire about selling your flat directly to Aawaash.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Buy and Sell Flats | Aawaash" },
      {
        name: "twitter:description",
        content:
          "Browse residential flats for sale or enquire about selling your flat directly to Aawaash.",
      },
    ],
  }),
});

/* ---------------------- Admin-editable homepage content ---------------------- */

const HomeContentCtx = createContext<HomepageDoc>(DEFAULT_HOMEPAGE);

/** Section content for `id`, always falling back to the shipped defaults. */
function useSection(id: string): HomeSection {
  const doc = useContext(HomeContentCtx);
  return doc[id] ?? DEFAULT_HOMEPAGE[id] ?? { enabled: true };
}

function items(sec: HomeSection): HomeItem[] {
  return sec.items ?? [];
}

// The private review deployment shows the proposed wording over the saved CMS document.
function withBuyingAndSellingDraft(content: HomepageDoc): HomepageDoc {
  const draft = DEFAULT_HOMEPAGE;
  return {
    ...content,
    header: {
      ...content.header,
      copy: {
        ...content.header?.copy,
        projects: draft.header.copy!.projects,
        how: draft.header.copy!.how,
        contact: draft.header.copy!.contact,
        explore: draft.header.copy!.explore,
        mobileExplore: draft.header.copy!.mobileExplore,
      },
    },
    hero: {
      ...content.hero,
      eyebrow: draft.hero.eyebrow,
      title: draft.hero.title,
      accent: draft.hero.accent,
      subtitle: draft.hero.subtitle,
      copy: {
        ...content.hero?.copy,
        action: draft.hero.copy!.action,
        searchLabel: draft.hero.copy!.searchLabel,
        searchPlaceholder: draft.hero.copy!.searchPlaceholder,
      },
    },
    services: { ...content.services, items: draft.services.items },
    projects: {
      ...content.projects,
      eyebrow: draft.projects.eyebrow,
      title: draft.projects.title,
      accent: draft.projects.accent,
      copy: { ...content.projects?.copy, action: draft.projects.copy!.action },
    },
    contact: {
      ...content.contact,
      copy: {
        ...content.contact?.copy,
        messageLabel: draft.contact.copy!.messageLabel,
        action: draft.contact.copy!.action,
        subject: draft.contact.copy!.subject,
      },
    },
    footer: {
      ...content.footer,
      subtitle: draft.footer.subtitle,
      copy: {
        ...content.footer?.copy,
        projects: draft.footer.copy!.projects,
        how: draft.footer.copy!.how,
        closing: draft.footer.copy!.closing,
      },
    },
  };
}

function Landing() {
  // The public homepage is intentionally session-agnostic: signed-in members,
  // team leaders and admins all stay here. Never redirect to a dashboard or
  // any login route from `/` — that produced the "homepage → admin login" bug
  // (admin sessions were bounced to /admin, which requires the passcode gate).


  const brand = useBrand();
  const loadContent = useServerFn(getHomepageContent);
  const { data: contentData } = useQuery({
    queryKey: ["homepage-content"],
    queryFn: () => loadContent(),
    // `placeholderData` (not `initialData`) — initial data would be treated as
    // fresh and suppress the fetch, so saved admin edits never appeared.
    placeholderData: DEFAULT_HOMEPAGE,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const savedContent = contentData ?? DEFAULT_HOMEPAGE;
  const content = withBuyingAndSellingDraft(savedContent);
  const on = (id: string) => content[id]?.enabled !== false;
  useRealtimeInvalidate(
    "homepage-public-content",
    [{ table: "cms_global_content", filter: "key=eq.homepage" }],
    [["homepage-content"]],
    { pollMs: 5_000, contentScope: "homepage" },
  );

  return (
    <HomeContentCtx.Provider value={content}>
      <div id="aawaash-home" style={brand.style} className="aawaash-home future-home relative min-h-screen overflow-x-hidden">

        {on("header") && <LandingNav copy={content.header?.copy} />}

        <div className="architectural-background" aria-hidden="true">
          <svg className="blueprint-tower" viewBox="0 0 600 1000" fill="none"><path d="M70 990V370L270 260V990M270 990V90L500 210V990M500 990V490L570 530V990M10 990H590M110 430L230 360M110 510L230 440M110 590L230 520M110 670L230 600M310 190L460 270M310 300L460 380M310 410L460 490M310 520L460 600M310 630L460 710M310 740L460 820" /></svg>
          <svg className="blueprint-plan" viewBox="0 0 600 700" fill="none"><path d="M30 30H570V670H30ZM60 60H330V310H60ZM360 60H540V310H360ZM60 340H250V640H60ZM280 340H540V480H280ZM280 510H540V640H280M30 310H570M250 340V670M330 30V310M280 480H570M60 460H250" /><path d="M100 30V15H500V30M570 95H585V590H570M90 670V685H510V670" strokeDasharray="3 6" /><path d="M330 170A80 80 0 0 1 410 250M250 520A75 75 0 0 1 325 595" /></svg>
          <svg className="blueprint-contours" viewBox="0 0 600 650" fill="none"><path d="M10 620V240Q10 25 225 25H590M45 650V250Q45 60 235 60H600M80 650V260Q80 95 245 95H600M115 650V270Q115 130 255 130H600" /></svg>
        </div>
        <HomepageMotion />
        <main className="relative overflow-x-hidden">
          {on("hero") && <Hero />}

          {on("projects") && <Projects />}
          {on("lifestyle") && <Lifestyle />}
          <BuildingExplorer />
          {on("faq") && <FAQ />}
          {on("residencesBanner") && <ResidencesBanner />}
          {on("contact") && <Contact />}
        </main>

        {on("footer") && <Footer />}
      </div>
    </HomeContentCtx.Provider>
  );
}

/* ------------------------------ HERO ------------------------------ */

function Hero() {
  const navigate = useNavigate();
  const hero = useSection("hero");
  const services = useSection("services");
  const { copy } = hero;
  return (
    <section id="home" className="future-hero reference-opening-hero">
      <div className="reference-hero-stage">
        <div className="reference-hero-art" aria-hidden="true">
          <img
            src="/images/home/reference-hero-restored.webp"
            srcSet="/images/home/reference-hero-mobile.webp 560w, /images/home/reference-hero-restored.webp 887w"
            sizes="(max-width: 560px) 100vw, 887px"
            width={887}
            height={1774}
            alt=""
            fetchPriority="high"
          />
        </div>
        <div className="reference-hero-content">
          <p className="reference-hero-eyebrow">Real Estate · Construction · Development</p>
          <h1>More Than <span>Just A Home.</span></h1>
          <p className="reference-hero-description">Better living starts here.</p>
          <ul className="reference-amenities" aria-label="Amenities">
            <li><BadgeIndianRupee aria-hidden="true" /><span>Best Prices</span></li>
            <li><ParkingSquare aria-hidden="true" /><span>Free parking</span></li>
            <li><DraftingCompass aria-hidden="true" /><span>Modern Designs</span></li>
          </ul>
        </div>
      </div>
      {services.enabled && <ul className="reference-hero-services" aria-label="Aawaash services and amenities">
        {[
          { title: "By a Home", Icon: HousePlug },
          { title: "sell your flat", Icon: HandCoins },
          { title: "Invest on", Icon: ChartCandlestick },
          { title: "Best Prices", Icon: Tag },
        ].map(({ title, Icon }) => (
          <li key={title}>
            <Icon aria-hidden="true" strokeWidth={1.55} />
            <strong>{title}</strong>
          </li>
        ))}
      </ul>}
      <details id="homepage-search" className="hero-search-panel">
        <summary><Search size={17} /> {copy?.searchLabel} <ChevronRight size={16} /></summary>
        <div className="pb-5">        <form
          onSubmit={event => {
            event.preventDefault();
            const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
            void navigate({ to: "/projects", search: { q: query || undefined } });
          }}
          role="search"
          aria-label="Search projects"
          className="group mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/60 bg-white/70 py-1.5 pl-5 pr-1.5 shadow-[var(--shadow-float)] backdrop-blur-2xl transition-all focus-within:-translate-y-0.5 focus-within:shadow-[var(--shadow-glow)]"
        >
          <Search size={18} className="shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="search"
            name="q"
            maxLength={120}
            placeholder={copy?.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search"
          />
          <button
            type="submit"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform active:scale-95"
          >
            <Search size={14} />
            <span className="hidden sm:inline">{copy?.searchAction}</span>
          </button>
        </form>

        {/* Suggestion chips */}
        <div className="mx-auto mt-3 flex max-w-2xl flex-wrap justify-center gap-2">
          {items(hero).map(item => item.title).map((query, i) => (
            <Link key={i} to="/projects" search={{ q: query }} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-primary">
              {query}
            </Link>
          ))}
        </div>

</div>
      </details>
    </section>
  );
}

/* ---- Lightweight interactive 3D miniature building ---- */
function Mini3DBuilding({
  className = "",
  style,
  hue,
  floors,
  label,
}: {
  className?: string;
  style?: React.CSSProperties;
  hue: string;
  floors: number;
  label: string;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -14, y: px * 18 });
  };
  const reset = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      className={`group animate-tilt-float pointer-events-auto [perspective:900px] ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      <div
        className="relative h-32 w-24 rounded-2xl border border-white/50 bg-white/60 p-2 shadow-[var(--shadow-float)] backdrop-blur-xl [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        {/* Building silhouette */}
        <div className={`relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-b ${hue}`}>
          <div className="absolute inset-x-2 bottom-0 top-2 flex flex-col-reverse gap-[3px]">
            {Array.from({ length: floors }).map((_, i) => (
              <div key={i} className="grid grid-cols-3 gap-[2px]">
                {Array.from({ length: 3 }).map((_, j) => (
                  <span
                    key={j}
                    className="h-2 rounded-[2px] bg-white/70 motion-safe:animate-pulse"
                    style={{ animationDelay: `${(i * 3 + j) * 220}ms`, opacity: 0.55 + ((i + j) % 3) * 0.15 }}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Rooftop */}
          <div className="absolute inset-x-1 top-1 h-2 rounded-md bg-white/40" />
          {/* Reflection */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/40 to-transparent" />
        </div>
        {/* Floating label chip */}
        <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/60 bg-white/90 px-2 py-0.5 text-[9px] font-bold text-primary shadow-[var(--shadow-soft)]">
          {label}
        </div>
      </div>
    </div>
  );
}


/* ------------------------------ CATEGORIES ------------------------------ */

const CATEGORIES: { label: string; icon: typeof Home; hue: string; count: string; accent: string }[] = [
  { label: "Apartments", icon: Home, hue: "from-primary/20 to-primary/5 text-primary", count: "1,240+ homes", accent: "bg-primary/10" },
  { label: "Villas", icon: Trees, hue: "from-leaf/25 to-leaf/5 text-primary", count: "320 estates", accent: "bg-leaf/15" },
  { label: "Towers", icon: Building2, hue: "from-gold/25 to-primary/10 text-gold-foreground", count: "78 landmarks", accent: "bg-gold/15" },
  { label: "Plots", icon: Landmark, hue: "from-primary/15 to-gold/15 text-primary", count: "540 parcels", accent: "bg-primary/10" },
  { label: "Commercial", icon: Store, hue: "from-leaf/20 to-leaf/5 text-primary", count: "96 spaces", accent: "bg-leaf/15" },
  { label: "Luxury", icon: Gem, hue: "from-gold/25 to-gold/5 text-gold-foreground", count: "42 signature", accent: "bg-gold/20" },
];

function Categories() {
  const sec = useSection("categories");
  // Item text is admin-editable; icon/hue styling stays positional from CATEGORIES.
  const cats = items(sec).map((it, i) => ({
    ...(CATEGORIES[i % CATEGORIES.length]!),
    label: it.title,
    count: it.body ?? "",
  }));
  const mobileCats = cats.slice(0, 4);
  return (
    <section aria-labelledby="cats-title" className="relative px-5 py-11 sm:px-8 sm:py-14">
      {/* soft ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(70%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_7%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="glass-card inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              <Sparkles size={12} /> {sec.eyebrow}
            </div>
            <h2
              id="cats-title"
              className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-[2.75rem]"
            >
              {sec.title}{" "}
              <span className="text-primary">
                {sec.accent}
              </span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {sec.subtitle}
            </p>
          </div>
          <Link
            to="/projects"
            className="glass-card inline-flex h-11 shrink-0 items-center gap-1.5 self-start rounded-full px-5 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)] sm:self-auto"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {/* Mobile / tablet: compact 4-icon grid */}
        <ul className="mt-8 grid grid-cols-4 gap-2.5 lg:hidden">
          {mobileCats.map((c, i) => (
            <li key={`${c.label}-${i}`}>
              <Link
                to="/projects"
                aria-label={`Browse ${c.label}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group relative flex min-h-[112px] w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[22px] border border-white/70 bg-white/75 p-3 text-center shadow-[var(--shadow-soft)] backdrop-blur-xl transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              >
                <span
                  aria-hidden
                  className={`absolute -top-6 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-gradient-to-br ${c.hue} opacity-50 blur-2xl`}
                />
                <span
                  className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${c.hue} shadow-[var(--shadow-soft)] transition-transform duration-500 group-hover:-rotate-6 group-active:scale-110`}
                >
                  <c.icon size={22} className="motion-safe:animate-[float_6s_ease-in-out_infinite]" />
                </span>
                <span className="relative text-[12px] font-semibold tracking-tight text-foreground">
                  {c.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop: editorial category grid */}
        <ul className="mt-10 hidden gap-5 lg:grid lg:grid-cols-3">
          {cats.map((c, i) => (
            <li key={`${c.label}-${i}`}>
              <Link
                to="/projects"
                aria-label={`Browse ${c.label}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group relative flex h-full min-h-[188px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-6 text-left shadow-[var(--shadow-soft)] backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-primary/30 hover:shadow-[var(--shadow-float)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              >
                {/* ambient blob */}
                <span
                  aria-hidden
                  className={`absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${c.hue} opacity-60 blur-3xl transition-transform duration-700 group-hover:scale-125`}
                />
                {/* diagonal sheen */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-all duration-[900ms] ease-out group-hover:translate-x-full group-hover:opacity-100"
                />

                <div className="relative flex items-start justify-between">
                  <span
                    className={`inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${c.hue} shadow-[var(--shadow-soft)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}
                  >
                    <c.icon size={24} />
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-border/50 text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>

                <div className="relative mt-6">
                  <div className="text-lg font-semibold tracking-tight text-foreground">
                    {c.label}
                  </div>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 rounded-full ${c.accent} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary`}
                  >
                    {c.count}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}



/* ------------------------------ LIFESTYLE ------------------------------ */

const AMENITY_ICONS = [Waves, Dumbbell, Armchair, Bike];

function Lifestyle() {
  const sec = useSection("lifestyle");
  return (
    <section id="living-spaces" className="home-reference-section home-lifestyle" aria-labelledby="lifestyle-title">
      <div className="home-reference-inner">
        <header className="home-lifestyle-copy future-project-intro">
          <p className="listing-section-eyebrow">{sec.eyebrow}</p>
          <h2 id="lifestyle-title">{sec.title}{sec.accent && <> <span>{sec.accent}</span></>}</h2>
          <p className="home-reference-description">{sec.subtitle}</p>
        </header>
        {sec.image && <img className="home-lifestyle-art" src={sec.image} alt="" width={976} height={808} loading="lazy" decoding="async" />}
        <ul className="home-amenities-grid">
          {items(sec).map((item, index) => {
            const Icon = AMENITY_ICONS[index % AMENITY_ICONS.length]!;
            return (
              <li key={index}>
                <Icon aria-hidden="true" strokeWidth={1.55} />
                <span>{item.title}</span>
                {item.body && <p>{item.body}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------ PROJECTS ------------------------------ */

type UnitPlan = {
  code: string;
  area: string;
  config: string;
  balconies: number;
  washrooms: number;
  flats: string;
};

type ProjectDetail = {
  slug: string;
  name: string;
  tagline: string;
  developer: string;
  developerNote: string;
  location: string;
  address: string;
  units: string;
  tag: string;
  images: string[];
  highlights: string[];
  usps: { title: string; body: string }[];
  unitPlans: UnitPlan[];
  specs: { icon: typeof Building2; label: string; body: string }[];
  amenities: string[];
  contact: { phone: string; email: string; office: string; website: string };
};

const SAVITRI: ProjectDetail = {
  slug: "savitri-enclave",
  name: "Savitri Enclave",
  tagline: "Unveil a new chapter of refined living.",
  developer: "S.B.P. Buildcon Pvt. Ltd.",
  developerNote:
    "A construction company committed to high-quality residential & commercial developments with a focus on innovation, sustainability, and customer satisfaction.",
  location: "Near JP Chowk, Bhagwan Das Mohalla, Darbhanga",
  address: "Near JP Chowk, Bhagwan Das Mohalla, Darbhanga, Bihar",
  units: "3 BHK · 1,763 – 2,016 sqft",
  tag: "New Launch",
  images: SAVITRI_GALLERY,
  highlights: [
    "5 unit types across 4 floors",
    "Dual vertical circulation cores",
    "Earthquake-resistant RCC frame",
    "Automatic Johnson / Kone elevator",
  ],
  usps: [
    {
      title: "Maximised parking density",
      body: "High ratio of dedicated resident spots with generous turning radius and wide aisles.",
    },
    {
      title: "Dual vertical circulation",
      body: "Two independent cores serve Lobby A and Lobby B — enhanced privacy and reduced traffic.",
    },
    {
      title: "Integrated perimeter greenery",
      body: "A lush aesthetic and natural screen buffer wrapping the entire site.",
    },
    {
      title: "Controlled, secure entry",
      body: "A defined single entrance with layered security for peace of mind.",
    },
  ],
  unitPlans: [
    { code: "Unit 1", area: "2,016 sqft", config: "3 BHK · Drawing + Dining · Kitchen", balconies: 4, washrooms: 3, flats: "101, 201, 301, 401" },
    { code: "Unit 2", area: "1,821 sqft", config: "3 BHK · Drawing + Dining · Kitchen", balconies: 3, washrooms: 3, flats: "102, 202, 302, 402" },
    { code: "Unit 3", area: "1,894 sqft", config: "3 BHK · Drawing + Dining · Kitchen", balconies: 4, washrooms: 3, flats: "103, 203, 303, 403" },
    { code: "Unit 4", area: "1,782 sqft", config: "3 BHK · Drawing + Dining · Kitchen", balconies: 3, washrooms: 3, flats: "104, 204, 304, 404" },
    { code: "Unit 5", area: "1,763 sqft", config: "3 BHK · Drawing + Dining · Kitchen", balconies: 4, washrooms: 3, flats: "105, 205, 305, 405" },
  ],
  specs: [
    { icon: ShieldAlert, label: "Structure", body: "Earthquake-resistant RCC frame with cement-mortar brickwork per structural consultants." },
    { icon: DoorOpen, label: "Doors & Windows", body: "Laminated flush doors. Aluminium / UPVC two-track sliding windows with MS safety grills." },
    { icon: Layers, label: "Flooring", body: "Glazed vitrified tiles in living, bedrooms & kitchen. Anti-skid tiles in washrooms & balconies." },
    { icon: Droplet, label: "Kitchen", body: "Granite counter with SS sink, 2 ft tiled dado, hot & cold water, RO point." },
    { icon: Waves, label: "Bathrooms", body: "Jaguar / Hindware chinaware & CP fittings with concealed hot & cold supply." },
    { icon: Zap, label: "Electrical", body: "Concealed copper wiring with Anchor / Havells modular switches and generous outlets." },
    { icon: Paintbrush, label: "Finishes", body: "White-putty walls with premium paint. Birla Opus / Asian Paints exterior with elevation railings." },
    { icon: ArrowUpDown, label: "Elevator", body: "Automatic Johnson / Kone brand elevator serving both cores." },
  ],
  amenities: [
    "Intercom in every flat",
    "Covered parking",
    "24×7 security & controlled entry",
    "Landscaped perimeter",
    "Dual lobbies",
    "Power backup provision",
  ],
  contact: {
    phone: "+91 82103 36686",
    email: "rahul8580@gmail.com",
    office: "VIP Road, Bela Fardan, Darbhanga",
    website: "www.satyabhawani.com",
  },
};

function Projects() {
  const sec = useSection("projects");
  const fetchFeatured = useServerFn(getPublicProject);
  const requestedSlug = sec.copy?.featuredSlug?.trim();
  const featuredSlug = requestedSlug && /^[a-z0-9-]+$/.test(requestedSlug) ? requestedSlug : SAVITRI.slug;
  const isSavitri = featuredSlug === SAVITRI.slug;
  const { data: featured } = useQuery({
    queryKey: ["project", "public", featuredSlug],
    queryFn: () => fetchFeatured({ data: { slug: featuredSlug } }),
  });
  useRealtimeInvalidate("homepage-featured-project", ["projects"], [["project", "public", featuredSlug]], { pollMs: 5_000, contentScope: "projects" });
  const liveImages = featured ? [featured.hero_banner_url, featured.cover_url, featured.thumbnail_url, ...(Array.isArray(featured.gallery) ? featured.gallery : [])]
    .filter((url): url is string => typeof url === "string" && !!url) : [];
  const images = [...new Set([sec.image, ...liveImages, ...(!isSavitri || (Array.isArray(featured?.gallery) && featured.gallery.length) ? [] : SAVITRI.images)].filter((url): url is string => !!url))];
  const project = { ...SAVITRI, slug: featuredSlug, name: featured?.name ?? SAVITRI.name, images };
  const activeIndex = (value = 0) => images.length ? ((value % images.length) + images.length) % images.length : 0;
  const [activeImg, setActiveImg] = useState<Record<string, number>>({});
  const [openProject, setOpenProject] = useState<ProjectDetail | null>(null);

  return (
    <section id="projects" className="future-projects editorial-projects home-featured-projects relative px-5 sm:px-8">
      <div className="project-container relative mx-auto max-w-3xl">
        <div className="future-project-intro">
          <p className="listing-section-eyebrow">{sec.eyebrow}</p>
          <h2>{sec.title} <span>{sec.accent}</span></h2>
        </div>
        <div className="home-featured-list">
          {(featured || (isSavitri && featured === undefined) ? [project] : []).map((p, i) => {
            // Admins can replace the card cover from /admin/homepage → Projects.
            const idx = activeIndex(activeImg[SAVITRI.name]);
            // Admins can replace the card cover from /admin/homepage → Projects.
            const cover = p.images[idx];
            return (
              <Reveal key={p.name} variant="up" delay={i * 100}>
                <div className="home-featured-frame">
                  <ProjectCard
                    project={featured ?? { id: p.slug, slug: p.slug, name: p.name }}
                    image={cover || heroResidence}
                    layout={isSavitri ? "3BHK" : sec.copy?.residences}
                    priceLabel={sec.copy?.priceLabel}
                    priceFallback={sec.copy?.priceFallback}
                    featuredPrice
                    animate={false}
                  />
                    {p.images.length > 1 && (
                      <div className="project-dots flex justify-center">
                        <div role="group" aria-label="Project photos" className="home-featured-pagination">
                          {p.images.map((_, ii) => (
                            <button
                              key={ii}
                              type="button"
                              aria-label={`View image ${ii + 1}`}
                              aria-current={ii === idx ? "true" : undefined}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveImg((prev) => ({ ...prev, [SAVITRI.name]: ii }));
                              }}
                              className={`h-1.5 rounded-full transition-all ${
                                ii === idx ? "w-7 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      <ProjectDetailModal
        project={openProject}
        onClose={() => setOpenProject(null)}
      />
    </section>
  );
}

function SpecPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}



/* -------------------- Project Detail Modal -------------------- */

function ProjectDetailModal({
  project,
  onClose,
}: {
  project: ProjectDetail | null;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (project) setIdx(0);
  }, [project]);

  if (!project) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const p = project;
  const gallery = [...new Set([...p.images, `${SAVITRI_ASSET}/typical-floor-plan.webp`, savitriLocationMap])];

  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-h-[92vh] w-[min(100vw-1rem,64rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-border/60 bg-surface p-0 shadow-[var(--shadow-float)] sm:w-[min(100vw-2rem,64rem)]"
      >
        {/* Custom close (Dialog already has one; hide via absolute cover for consistent style) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-foreground shadow-[var(--shadow-soft)] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <X size={16} />
        </button>

        <div className="max-h-[92vh] overflow-y-auto">
          {/* Hero image */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
            <img
              src={gallery[idx]}
              alt={`${p.name} — view ${idx + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary shadow-sm">
              {p.tag}
            </span>
            <div className="absolute inset-x-0 bottom-5 flex justify-center gap-1.5">
              {gallery.map((_, ii) => (
                <button
                  key={ii}
                  type="button"
                  aria-label={`View image ${ii + 1}`}
                  onClick={() => setIdx(ii)}
                  className={`h-1.5 rounded-full transition-all ${
                    ii === idx ? "w-7 bg-white" : "w-1.5 bg-white/60 hover:bg-white/85"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-10 pt-8 sm:px-10">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" /> {p.location}
              </span>
              <span aria-hidden className="h-1 w-1 rounded-full bg-border" />
              <span>{p.units}</span>
            </div>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {p.name}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {p.tagline}
            </p>
            <div className="mt-1.5 text-[13px] font-medium text-muted-foreground/80">
              By {p.developer}
            </div>

            {/* Quick facts */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FactCard icon={<Home size={15} />} label="Configuration" value="3 BHK" />
              <FactCard icon={<Ruler size={15} />} label="Sizes" value="1,763–2,016 sqft" />
              <FactCard icon={<Layers size={15} />} label="Floors" value="G + 4" />
              <FactCard icon={<Building2 size={15} />} label="Units / Floor" value="5" />
            </div>

            {/* USPs */}
            <SectionTitle eyebrow="Why Savitri Enclave" title="Signature advantages" />
            <div className="grid gap-4 sm:grid-cols-2">
              {p.usps.map((u) => (
                <div
                  key={u.title}
                  className="rounded-2xl border border-border/60 bg-background/40 p-5"
                >
                  <div className="text-[13px] font-bold text-foreground">{u.title}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {u.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Unit plans */}
            <SectionTitle eyebrow="Floor plans" title="Five 3 BHK residences" />
            <div className="overflow-hidden rounded-2xl border border-border/60">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Area</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Balconies</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Baths</th>
                    <th className="px-4 py-3">Flats</th>
                  </tr>
                </thead>
                <tbody>
                  {p.unitPlans.map((u) => (
                    <tr key={u.code} className="border-t border-border/60 text-foreground">
                      <td className="px-4 py-3 font-semibold">{u.code}</td>
                      <td className="px-4 py-3">{u.area}</td>
                      <td className="hidden px-4 py-3 sm:table-cell">{u.balconies}</td>
                      <td className="hidden px-4 py-3 sm:table-cell">{u.washrooms}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.flats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Specifications */}
            <SectionTitle eyebrow="Specifications" title="Built to a premium standard" />
            <div className="grid gap-3 sm:grid-cols-2">
              {p.specs.map((s) => (
                <div
                  key={s.label}
                  className="flex gap-3 rounded-2xl border border-border/60 bg-background/40 p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <s.icon size={16} />
                  </span>
                  <div>
                    <div className="text-[13px] font-bold text-foreground">{s.label}</div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Amenities */}
            <SectionTitle eyebrow="Community" title="Everyday amenities" />
            <div className="flex flex-wrap gap-2">
              {p.amenities.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[12px] font-medium text-foreground/85"
                >
                  <CheckCircle2 size={12} className="text-primary" /> {a}
                </span>
              ))}
            </div>

            {/* Developer + contact */}
            <SectionTitle eyebrow="About the developer" title={p.developer} />
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {p.developerNote}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailContactRow icon={<Phone size={14} />} label="Phone" value={p.contact.phone} />
              <DetailContactRow icon={<Mail size={14} />} label="Email" value={p.contact.email} />
              <DetailContactRow
                icon={<MapPinned size={14} />}
                label="Office"
                value={p.contact.office}
              />
              <DetailContactRow
                icon={<Landmark size={14} />}
                label="Website"
                value={p.contact.website}
              />
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 active:scale-95"
              >
                Enquire now <ArrowRight size={15} />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-6 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Close
              </button>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground/70">
              Disclaimer — Details reflect the developer's brochure and are indicative. Images
              are conceptual; specifications may be revised at the developer's discretion.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FactCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 text-[15px] font-bold text-foreground">{value}</div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4 mt-10">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </div>
      <h4 className="mt-1.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h4>
    </div>
  );
}

function DetailContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-[13px] font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}




/* ------------------------------ FAQ ------------------------------ */

function FAQ() {
  const sec = useSection("faq");
  return (
    <section id="faq" className="home-reference-section home-faq" aria-labelledby="home-faq-title">
      <div className="home-reference-inner">
        <header className="home-faq-intro">
          {sec.image && <img className="home-faq-art" src={sec.image} alt="" width={471} height={357} loading="lazy" decoding="async" />}
          <div className="home-faq-copy">
            <p className="home-reference-kicker">{sec.eyebrow}</p>
            <h2 id="home-faq-title">{sec.title}</h2>
          </div>
        </header>
        <Accordion.Root type="single" collapsible className="home-faq-list">
          {items(sec).map((item, index) => (
            <Accordion.Item key={index} value={String(index)}>
              <Accordion.Header>
                <Accordion.Trigger className="home-faq-question">
                  <span>{item.title}</span>
                  <Plus aria-hidden="true" strokeWidth={1.5} />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="home-faq-answer">{item.body}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}

function ResidencesBanner() {
  const section = useSection("residencesBanner");
  if (!section.image) return null;

  return (
    <section className="home-reference-section home-residences-banner" aria-labelledby="home-residences-title">
      <h2 className="sr-only" id="home-residences-title">{section.title}</h2>
      <Link to="/projects" aria-label={`${section.title} Browse projects.`}>
        <img src={section.image} alt="" width={1440} height={1262} loading="lazy" decoding="async" />
      </Link>
    </section>
  );
}

/* ------------------------------ CONTACT ------------------------------ */

function Contact() {
  const sec = useSection("contact");
  const details = items(sec);
  const detailIcons = [Phone, Mail, MapPinned];
  const [draftOpened, setDraftOpened] = useState(false);
  const email = sec.copy?.recipient?.trim() || details.find(detail => detail.title.trim().toLowerCase() === "email")?.body?.trim() || "";
  const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <section id="contact" className="home-reference-section home-contact" aria-labelledby="home-contact-title">
      <div className="home-reference-inner">
        <header className="home-contact-intro">
          <div>
            <p className="home-reference-kicker">{sec.eyebrow}</p>
            <h2 id="home-contact-title">{sec.title}{sec.accent && <em>{sec.accent}</em>}</h2>
            <p className="home-reference-description">{sec.subtitle}</p>
          </div>
          {sec.image && <img className="home-contact-art" src={sec.image} alt="" width={476} height={439} loading="lazy" decoding="async" />}
        </header>
        <ul className="home-contact-details">
          {details.map((detail, index) => (
            <ContactRow
              key={index}
              fallbackIcon={detailIcons[index % detailIcons.length]!}
              label={detail.title}
              value={detail.body ?? ""}
            />
          ))}
        </ul>
        <details className="home-contact-enquiry">
          <summary>Make an enquiry</summary>
            <form
              onSubmit={event => {
                event.preventDefault();
                if (!hasEmail) return;
                const fields = new FormData(event.currentTarget);
                const body = `Name: ${fields.get("name")}\nEmail: ${fields.get("email")}\nMobile: ${fields.get("mobile")}\n\n${fields.get("message")}`;
                window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(sec.copy?.subject ?? "")}&body=${encodeURIComponent(body)}`;
                setDraftOpened(true);
              }}
              className="mt-4 grid gap-4"
            >
              <Field name="name" label={sec.copy?.nameLabel ?? ""} placeholder="e.g. Ritu Malhotra" />
              <Field name="email" label={sec.copy?.emailLabel ?? ""} type="email" placeholder="you@example.com" />
              <Field name="mobile" label={sec.copy?.mobileLabel ?? ""} type="tel" placeholder="10-digit mobile" />
              <div>
                <label htmlFor="contact-message" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {sec.copy?.messageLabel}
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  maxLength={1500}
                  rows={4}
                  placeholder="Share your preferred area and budget, or tell us about the flat you want to sell."
                  className="mt-1.5 w-full resize-none rounded-2xl border border-input bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={!hasEmail}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:-translate-y-0.5"
              >
                {sec.copy?.action} <Send size={14} />
              </button>
              <p className="text-xs text-muted-foreground" role="status">
                {!hasEmail ? "Contact email is unavailable. Use the contact details above." : draftOpened ? "Review and send the draft from your email app." : "Review and send your enquiry in your email app."}
              </p>
            </form>
        </details>
      </div>
    </section>
  );
}

function ContactRow({ fallbackIcon, label, value }: {
  fallbackIcon: typeof Phone;
  label: string;
  value: string;
}) {
  const kind = label.trim().toLowerCase();
  const phone = value.replace(/[^+\d]/g, "");
  const href = kind === "phone" && phone ? `tel:${phone}`
    : kind === "email" && value ? `mailto:${value}`
    : undefined;
  const Icon = kind === "phone" ? Phone : kind === "email" ? Mail
    : kind === "office" ? MapPinned : fallbackIcon;
  return (
    <li className="home-contact-row">
      <div className="home-contact-icon"><Icon aria-hidden="true" strokeWidth={1.55} /></div>
      <div className="home-contact-value">
        <span>{label}</span>
        {href ? <a href={href}>{value}</a> : <strong>{value}</strong>}
      </div>
    </li>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={`contact-${name}`} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        id={`contact-${name}`}
        name={name}
        required
        maxLength={type === "tel" ? 20 : 120}
        type={type}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

/* ------------------------------ FOOTER ------------------------------ */

function Footer() {
  return <SiteFooter section={useSection("footer")} />;
}
