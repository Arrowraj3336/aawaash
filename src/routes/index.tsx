import "@/homepage.css";
import { HomeSkyline } from "@/components/aawash/landing/HomeSkyline";
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicProject } from "@/lib/projects.functions";
import { startingPrice } from "@/lib/public-catalogue";
import { formatINR } from "@/components/aawash/dashboard-kit";
import { getHomepageContent } from "@/lib/homepage.functions";
import { DEFAULT_HOMEPAGE, type HomeItem, type HomepageDoc, type HomeSection } from "@/lib/homepage-content";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BedDouble,
  Coins,
  TrendingUp,
  Building2,
  ShieldCheck,
  Wallet,
  LineChart,
  Smartphone,
  Users,
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
  Heart,
  Waves,
  Dumbbell,
  Coffee,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Aawash — Premium Real Estate, Reimagined" },
      {
        name: "description",
        content:
          "Aawash is a luxury real estate ecosystem — curated residential projects, transparent commissions, and a mobile-first dashboard for your entire team.",
      },
      { property: "og:title", content: "Aawash — Premium Real Estate, Reimagined" },
      {
        property: "og:description",
        content:
          "Aawash is a luxury real estate ecosystem — curated residential projects, transparent commissions, and a mobile-first dashboard for your entire team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Aawash — Premium Real Estate, Reimagined" },
      {
        name: "twitter:description",
        content:
          "Aawash is a luxury real estate ecosystem — curated residential projects, transparent commissions, and a mobile-first dashboard for your entire team.",
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
  const content = contentData ?? DEFAULT_HOMEPAGE;
  const on = (id: string) => content[id]?.enabled !== false;
  useRealtimeInvalidate(
    "homepage-public-content",
    [{ table: "cms_global_content", filter: "key=eq.homepage" }],
    [["homepage-content"]],
    { pollMs: 5_000, contentScope: "homepage" },
  );

  return (
    <HomeContentCtx.Provider value={content}>
      <div style={brand.style} className="aawaash-home relative min-h-screen overflow-x-hidden">

        {on("header") && <LandingNav editorial copy={content.header?.copy} />}

        <div className="architectural-background" aria-hidden="true">
          <svg className="blueprint-tower" viewBox="0 0 600 1000" fill="none"><path d="M70 990V370L270 260V990M270 990V90L500 210V990M500 990V490L570 530V990M10 990H590M110 430L230 360M110 510L230 440M110 590L230 520M110 670L230 600M310 190L460 270M310 300L460 380M310 410L460 490M310 520L460 600M310 630L460 710M310 740L460 820" /></svg>
          <svg className="blueprint-plan" viewBox="0 0 600 700" fill="none"><path d="M30 30H570V670H30ZM60 60H330V310H60ZM360 60H540V310H360ZM60 340H250V640H60ZM280 340H540V480H280ZM280 510H540V640H280M30 310H570M250 340V670M330 30V310M280 480H570M60 460H250" /><path d="M100 30V15H500V30M570 95H585V590H570M90 670V685H510V670" strokeDasharray="3 6" /><path d="M330 170A80 80 0 0 1 410 250M250 520A75 75 0 0 1 325 595" /></svg>
          <svg className="blueprint-contours" viewBox="0 0 600 650" fill="none"><path d="M10 620V240Q10 25 225 25H590M45 650V250Q45 60 235 60H600M80 650V260Q80 95 245 95H600M115 650V270Q115 130 255 130H600" /></svg>
        </div>
        <main className="relative overflow-x-hidden">
          {on("hero") && <Hero />}

          {on("projects") && <Projects />}
          {on("commission") && <Commission />}
          {on("stats") && <Stats />}
          {on("lifestyle") && <Lifestyle />}
          {on("discover") && <ResidenceBanner />}
          {on("how") && <HowItWorks />}
          {on("faq") && <FAQ />}
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
  const { title, accent, subtitle, copy } = hero;
  return (
    <section id="home" className="editorial-hero reference-hero">
      <div className="hero-stage">
        <svg className="reference-hero-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          <defs><clipPath id="referenceHeroPhotoClip" clipPathUnits="objectBoundingBox"><path d="M1,0 C.72,.115 .67,.145 .61,.30 L.45,.75 C.395,.90 .27,.89 0,1 H1 Z" /></clipPath></defs>
          <path className="hero-sweep-line" d="M1000 0 C705 95 655 145 594 300 L434 750 C379 900 260 880 0 985" />
          <path className="hero-green-blade" d="M676 137 Q755 57 865 43 Q761 102 676 137Z" />
        </svg>
        <svg className="hero-skyline" viewBox="0 0 230 280" fill="none" aria-hidden="true"><defs><linearGradient id="heroSkylineFade" x2="0" y2="1"><stop stopColor="#a5a8a4" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient></defs><g stroke="url(#heroSkylineFade)" strokeWidth="2"><path d="M15 275V150L85 105V260M85 260V42L145 5L175 25V250M145 5V250M175 250V80L208 100V260M25 150V270M38 140V270M51 132V265M64 123V263M76 113V260M96 36V255M108 28V255M120 20V254M132 13V252M158 14V250M187 88V253M199 95V258" /></g></svg>
        <div className="hero-kicker">{(hero.eyebrow ?? "").split(" — ").map((part, i) => <span className="hero-kicker-item" key={i}>{i > 0 && <span aria-hidden="true" className="hero-kicker-dash" />}{part}</span>)}</div>
        <div className="hero-architecture" aria-hidden="true">
          <img src={hero.image || "/images/sky-residence-hero.webp"} alt="" fetchPriority="high" decoding="async" />
        </div>
        <div className="hero-copy">
          <span className="editorial-rule" aria-hidden="true" />
          <h1>{title === "More Than Just A" ? <><span className="hero-title-lead">More Than</span><span className="hero-title-join">Just A</span></> : title} <em>{accent}</em></h1>
          <p>{subtitle}</p>
          <a href="#projects" className="hero-explore">{copy?.action} <span><ArrowRight size={22} /></span></a>
        </div>

      </div>
      {services.enabled && Boolean(services.items?.length) && <div className="hero-crystal-strip">
        <svg aria-hidden="true" className="hero-crystals" viewBox="0 0 600 300" fill="none"><defs>
          <linearGradient id="crystalFront" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#adb8c7" stopOpacity=".8" /><stop offset=".4" stopColor="#ededee" stopOpacity=".5" /><stop offset=".8" stopColor="#a4ac92" stopOpacity=".6" /><stop offset="1" stopColor="white" stopOpacity=".1" /></linearGradient>
          <linearGradient id="crystalSide"><stop stopColor="#af8a60" stopOpacity=".55" /><stop offset="1" stopColor="white" stopOpacity=".1" /></linearGradient>
          <radialGradient id="crystalLight"><stop stopColor="#e5e7df" /><stop offset=".4" stopColor="#c1c7b6" stopOpacity=".55" /><stop offset="1" stopColor="white" stopOpacity="0" /></radialGradient>
        </defs>
        <path d="M40 290 390 95 560 190 380 300Z" fill="#e7e7e9" fillOpacity=".3" />
        {[[110,150,55],[180,110,60],[255,65,65],[335,10,70],[420,80,50]].map(([x,y,w],i)=><g key={i}><path d={`M${x} 290V${y}L${x+w} ${y-30}V290Z`} fill="url(#crystalFront)" stroke="white" strokeOpacity=".9" /><path d={`M${x+w} ${y-30}L${x+w+12} ${y-20}V290H${x+w}Z`} fill="url(#crystalSide)" stroke="white" strokeOpacity=".7" /><path d={`M${x} 220L${x+w} 190M${x} 255L${x+w} 225`} stroke="#d9ddd2" strokeOpacity=".65" /></g>)}
        <ellipse cx="360" cy="244" rx="200" ry="40" fill="url(#crystalLight)" /><path d="M125 255H520" stroke="#d1d5c7" strokeOpacity=".45" />
        </svg>
        <ul className="hero-benefits" aria-label="Aawaash services">
          {services.items?.map(({ title, body }, index) => {
            const Icon = [Layers, Building2, Leaf, ShieldCheck, Users][index] ?? Layers;
            return <li key={`${title}-${index}`} title={body || title}><Icon aria-hidden="true" /><span>{title}</span></li>;
          })}
        </ul>
      </div>}
      <svg className="hero-bottom-ribbon" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 Q250 195 1000 4" fill="none" stroke="#dad9da" /><path d="M570 100 Q820 24 1000 0" fill="none" stroke="#242626" strokeWidth="2" /><path d="M650 100 Q875 27 1000 29V100Z" fill="#242626" /></svg>
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

const AMENITY_ICONS = [Waves, Dumbbell, Coffee, Bike];

function Lifestyle() {
  const sec = useSection("lifestyle");
  return (
    <section aria-labelledby="lifestyle-title" className="lifestyle-section lifestyle-editorial refined-section">
      <div className="lifestyle-layout">
        <div className="lifestyle-intro">
          {sec.eyebrow && <div className="lifestyle-eyebrow"><Leaf size={15} aria-hidden="true" />{sec.eyebrow}</div>}
          <h2 id="lifestyle-title">{sec.title} <em>{sec.accent}</em></h2>
          <p>{sec.subtitle}</p>
        </div>
        <figure className="lifestyle-visual">
          <img src={sec.image || "/images/residence-lobby.webp"} alt="Lifestyle amenities and greenery" loading="lazy" decoding="async" width={1536} height={1024} />
          {(sec.copy?.photoTitle || sec.copy?.photoBody) && (
            <figcaption>
              <Sparkles size={17} aria-hidden="true" />
              <div>
                {sec.copy?.photoTitle && <span>{sec.copy?.photoTitle}</span>}
                {sec.copy?.photoBody && <p>{sec.copy?.photoBody}</p>}
              </div>
            </figcaption>
          )}
        </figure>
        <ul className="lifestyle-features">
          {items(sec).map((amenity, index) => {
            const Icon = AMENITY_ICONS[index % AMENITY_ICONS.length]!;
            return (
              <li key={`${amenity.title}-${index}`}>
                <span className="lifestyle-feature-icon"><Icon size={19} aria-hidden="true" /></span>
                <div>
                  <h3>{amenity.title}</h3>
                  {amenity.body && <p>{amenity.body}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------ BOOK VISIT ------------------------------ */

function ResidenceBanner() {
  const section = useSection("discover");
  return (
    <section className="residence-banner" aria-labelledby="residence-banner-title">
      <div className="residence-banner-copy">
        <p className="residence-banner-label">{section.eyebrow}</p>
        <h2 id="residence-banner-title">{section.title}</h2>
        <p className="residence-banner-description">{section.subtitle}</p>
        <Link to="/projects" className="residence-banner-link">{section.copy?.action} <ArrowRight size={16} /></Link>
      </div>
      <img src={section.image || "/images/architecture-balcony.webp"} alt="" loading="lazy" decoding="async" />
    </section>
  );
}

/* ------------------------------ STATS ------------------------------ */

const FOOTPRINT_ICONS = [Layers, Building2, TrendingUp, Users];

function Stats() {
  const sec = useSection("stats");
  const milestoneAccent = /^measured in milestones\.$/i.test(sec.accent ?? "");
  return (
    <section id="milestones" aria-labelledby="milestones-title" className="home-footprint">
      <HomeSkyline className="home-footprint-skyline" />
      <div className="home-footprint-intro">
        <p className="home-footprint-eyebrow">{sec.eyebrow}</p>
        <h2 id="milestones-title">
          <strong>{sec.title === "Built on trust." ? "Built on Trust." : sec.title}</strong>
          {sec.accent && <span>{milestoneAccent ? <>Measured in <em>Milestones.</em></> : <em>{sec.accent}</em>}</span>}
        </h2>
      </div>
      <ul className="home-footprint-metrics">
        {items(sec).map(({ title, body }, index) => {
          const Icon = FOOTPRINT_ICONS[index % FOOTPRINT_ICONS.length];
          const raw = body?.trim() ?? "";
          const number = /^([\d,.]+)(\+?)$/.exec(raw);
          const value = number ? Number(number[1].replaceAll(",", "")).toLocaleString("en-IN") + number[2] : raw;
          return (
            <li key={index} className={index === 2 ? "is-highlighted" : undefined}>
              <Icon aria-hidden="true" />
              <strong>{value}</strong>
              <span>{title}</span>
            </li>
          );
        })}
      </ul>
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

const WISHLIST_STORAGE_KEY = "aawaash-project-wishlist";

function Projects() {
  const sec = useSection("projects");
  const [wishlist, setWishlist] = useState<Set<string> | null>(null);
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
  const project = { ...SAVITRI, slug: featuredSlug, name: featured?.name ?? SAVITRI.name, tag: featured?.tag ?? (featured ? "" : SAVITRI.tag), images };
  const activeIndex = (value = 0) => images.length ? ((value % images.length) + images.length) % images.length : 0;
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "[]");
      setWishlist(new Set(Array.isArray(saved) ? saved.filter(value => typeof value === "string") : []));
    } catch {
      setWishlist(new Set());
    }
  }, []);
  useEffect(() => {
    if (!wishlist) return;
    try { window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify([...wishlist])); } catch { /* Storage can be disabled. */ }
  }, [wishlist]);
  const [activeImg, setActiveImg] = useState<Record<string, number>>({});
  const [openProject, setOpenProject] = useState<ProjectDetail | null>(null);
  const toggleWish = (name: string) =>
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <section id="projects" className="editorial-projects home-featured-projects relative px-5 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-10 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklab,var(--leaf)_8%,transparent),transparent_72%)]"
      />
      <div className="project-container relative mx-auto max-w-3xl">
        <div className="home-featured-heading luxury-commission">
          <div className="commission-intro">
            <div className="commission-copy">
              <div className="editorial-eyebrow"><span />{sec.eyebrow}<span /></div>
              <h2>{sec.title}<br /><em>{sec.accent}</em></h2>
            </div>
          </div>
        </div>
        {/* One project per row — spacious, editorial */}
        <div className="home-featured-list">
          {(featured || (isSavitri && featured === undefined) ? [project] : []).map((p, i) => {
            const wished = wishlist?.has(p.name) ?? false;
            const price = featured?.slug === p.slug ? startingPrice(featured) : null;
            // Admins can replace the card cover from /admin/homepage → Projects.
            const idx = activeIndex(activeImg[SAVITRI.name]);
            // Admins can replace the card cover from /admin/homepage → Projects.
            const cover = p.images[idx];
            return (
              <Reveal key={p.name} variant="up" delay={i * 100}>
                <div className="home-featured-frame">
                  <article className="home-featured-card">
                    <div className="home-featured-photo">
                      <Link to="/projects/$slug" params={{ slug: p.slug }} aria-label={`View ${p.name}`}>
                        <img src={cover || heroResidence} alt={`${p.name} exterior`} loading="lazy" decoding="async" />
                      </Link>
                      {p.tag && <span className="home-featured-badge"><Sparkles size={14} aria-hidden="true" />{p.tag}</span>}
                      <button className="home-featured-wish" type="button" aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                        aria-pressed={wished} onClick={() => toggleWish(p.name)}>
                        <Heart size={18} fill={wished ? "currentColor" : "none"} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="home-featured-info">
                      <div className="home-featured-name">
                        <h3><Link to="/projects/$slug" params={{ slug: p.slug }}>{p.name}</Link></h3>
                        {featured?.location && <p className="home-featured-location"><MapPin size={12} aria-hidden="true" />{featured.location}</p>}
                      </div>
                      <dl className="home-featured-facts">
                        {sec.copy?.residences && <div><BedDouble aria-hidden="true" /><dt>Configuration</dt><dd>{sec.copy.residences}</dd></div>}
                        {sec.copy?.area && <div><Ruler aria-hidden="true" /><dt>Area</dt><dd>{sec.copy.area}</dd></div>}
                        <div><Coins aria-hidden="true" /><dt>{sec.copy?.priceLabel || "Price"}</dt><dd>{price === null ? sec.copy?.priceFallback : formatINR(price, { compact: true })}</dd></div>
                      </dl>
                      <Link to="/projects/$slug" params={{ slug: p.slug }} aria-label={`Explore ${p.name}`} className="home-featured-action">
                        {sec.copy?.action} <ArrowRight size={17} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
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




/* ------------------------------ HOW IT WORKS ------------------------------ */

const STEPS = [
  { title: "Company", body: "Aawash curates and lists premium residential projects." },
  { title: "Team Leader", body: "Each leader owns a team and drives regional sales." },
  { title: "Members", body: "Members work with buyers and close sales on the ground." },
  { title: "Customer Purchase", body: "Buyers book their home with total transparency." },
  { title: "Commission Distribution", body: "Earnings flow automatically through the ladder." },
];

function HowItWorks() {
  const sec = useSection("how");
  const steps = items(sec);
  return (
    <section id="how-it-works" className="refined-section px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow={sec.eyebrow ?? ""} title={sec.title ?? ""} subtitle={sec.subtitle} />
        <div className="relative mt-10">
          <div className="pointer-events-none absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent md:block" />
          <ol className="grid gap-4 md:grid-cols-1">
            {steps.map((s, i) => (
              <div key={`${s.title}-${i}`}>
                <li className="glass-card relative flex items-start gap-4 rounded-3xl p-5 shadow-[var(--shadow-soft)]">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-foreground">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight
                      size={16}
                      className="absolute -bottom-3 left-8 hidden text-primary/60 md:block"
                    />
                  )}
                </li>
              </div>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ COMMISSION ------------------------------ */

const SLABS = [
  { range: "₹0 – 1 Cr", tone: "from-primary-soft to-primary-soft/30" },
  { range: "₹1 – 3 Cr", tone: "from-primary-soft to-primary-soft/30" },
  { range: "₹3 – 5 Cr", tone: "from-leaf/25 to-leaf/5" },
  { range: "₹5 – 7 Cr", tone: "from-leaf/30 to-leaf/5" },
  { range: "₹7 – 10 Cr", tone: "from-gold/20 to-primary-soft" },
  { range: "₹10 Cr+", tone: "from-gold/30 to-gold/5" },
];

function Commission() {
  const sec = useSection("commission");
  return (
    <section id="commission" className="editorial-commission luxury-commission">
      <div className="commission-intro">
        <div className="commission-copy">
          <div className="editorial-eyebrow"><span />{sec.eyebrow}<span /></div>
          <h2>{sec.title}<br /><em>{sec.accent}</em></h2>
          <p>{sec.subtitle}</p>
        </div>
      </div>
      <div className="commission-tower-scene">
        <img className="commission-tower-art" src={sec.image || DEFAULT_HOMEPAGE.commission?.image} alt="" aria-hidden="true" loading="lazy" />
        <ol className="commission-tower-values" aria-label="Commission tiers by deal value">
          {items(sec).map((slab, i) => (
            <li key={`${slab.title}-${i}`} className={`commission-plaque plaque-${i + 1}`}>
              <span>{sec.copy?.tierLabel} {i + 1}</span><strong>{slab.title}</strong><i aria-hidden="true" />{slab.body && <b>{slab.body}</b>}<small>{sec.copy?.valueLabel}</small>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}


/* ------------------------------ FAQ ------------------------------ */

const FAQS = [
  {
    q: "How do I get access to Aawash?",
    a: "Aawash is invite-only. Your Team Leader or Super Admin creates your account and shares your Login ID.",
  },
  {
    q: "What is my Login ID?",
    a: "Team Leaders and Super Admins sign in with their 10-digit mobile number. Members sign in with their Team number followed by their mobile — e.g. 19876543210 for Team 1.",
  },
  {
    q: "How is commission calculated?",
    a: "Every project defines commission slabs by deal value. Once a sale is recorded, Aawash automatically distributes commission across the team ladder.",
  },
  {
    q: "Is Aawash available on mobile?",
    a: "Yes. Aawash is built mobile-first — it feels like a native app on your phone, tablet, and desktop alike.",
  },
  {
    q: "How secure is my data?",
    a: "Aawash uses role-based access control, row-level security in the database, and full audit logging on sensitive actions.",
  },
];

function FAQ() {
  const sec = useSection("faq");
  const faqs = items(sec);
  return (
    <section id="faq" className="refined-section px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <SectionHeader eyebrow={sec.eyebrow ?? ""} title={sec.title ?? ""} />
        <Reveal variant="up" className="mt-8">
          <div className="glass-card rounded-3xl p-2 shadow-[var(--shadow-soft)] sm:p-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={`${f.title}-${i}`}
                  value={`item-${i}`}
                  className="border-b border-border last:border-b-0"
                >
                  <AccordionTrigger className="px-3 py-4 text-left text-sm font-semibold text-foreground hover:no-underline sm:text-base">
                    {f.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
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
    <section id="contact" className="refined-section px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow={sec.eyebrow ?? ""} title={sec.title ?? ""} subtitle={sec.subtitle} />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal variant="left">
            <div className="glass-card flex h-full flex-col gap-5 rounded-3xl p-6 shadow-[var(--shadow-soft)]">
              {details.map((d, i) => (
                <ContactRow
                  key={`${d.title}-${i}`}
                  icon={detailIcons[i % detailIcons.length]!}
                  label={d.title}
                  value={d.body ?? ""}
                />
              ))}
            </div>
          </Reveal>

          <Reveal variant="right">
            <form
              onSubmit={event => {
                event.preventDefault();
                if (!hasEmail) return;
                const fields = new FormData(event.currentTarget);
                const body = `Name: ${fields.get("name")}\nEmail: ${fields.get("email")}\nMobile: ${fields.get("mobile")}\n\n${fields.get("message")}`;
                window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(sec.copy?.subject ?? "")}&body=${encodeURIComponent(body)}`;
                setDraftOpened(true);
              }}
              className="glass-card flex h-full flex-col gap-4 rounded-3xl p-6 shadow-[var(--shadow-soft)]"
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
                  placeholder="Tell us a little about your team…"
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
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
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
  const { subtitle, copy } = useSection("footer");
  return (
    <footer className="border-t border-border/60 bg-surface-warm/50 px-5 py-9 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <BrandMark size="sm" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <FooterCol
            title={copy?.explore ?? ""}
            links={[
              { label: copy?.projects ?? "", href: "#projects" },
              { label: copy?.how ?? "", href: "#how-it-works" },
              { label: copy?.commission ?? "", href: "#commission" },
              { label: copy?.faq ?? "", href: "#faq" },
            ]}
          />
          <FooterCol
            title={copy?.company ?? ""}
            links={[
              { label: copy?.contact ?? "", href: "#contact" },
            ]}
          />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {copy?.teams}
            </div>
            <Link
              to="/auth"
              className="mt-3 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              {copy?.action}
            </Link>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} {copy?.copyright}</div>
          <div>{copy?.closing}</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {links.filter(l => l.label).map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ SHARED ------------------------------ */

function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </div>
        <h2 id={id} className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
