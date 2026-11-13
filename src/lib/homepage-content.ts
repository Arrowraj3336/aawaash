/**
 * Public homepage content model.
 *
 * The marketing homepage (`src/routes/index.tsx`) renders from this document.
 * Admins edit it at /admin/homepage; it is persisted as a single JSON row in
 * `cms_global_content` under the key `homepage`, so reads are one cheap query
 * and every section falls back to the shipped defaults when a field is blank.
 */

export type HomeItem = { title: string; body?: string };

export type HomeSection = {
  enabled: boolean;
  eyebrow?: string;
  title?: string;
  accent?: string;
  subtitle?: string;
  image?: string;
  copy?: Record<string, string>;
  items?: HomeItem[];
};

export type HomepageDoc = Record<string, HomeSection>;

export type FieldKey = "eyebrow" | "title" | "accent" | "subtitle" | "image";

export type SectionSpec = {
  id: string;
  label: string;
  hint: string;
  fields: FieldKey[];
  copy?: Record<string, string>;
  items?: { label: string; titleLabel: string; bodyLabel: string | null; limit?: number };
};

/** Order here drives both the editor and the homepage section order. */
export const SECTION_SPECS: SectionSpec[] = [
  {
    id: "header",
    label: "Header and menu",
    hint: "Navigation labels and calls to action at the top of the homepage.",
    fields: [],
    copy: { home: "Home link", projects: "Projects link", how: "How it works link", contact: "Contact link", login: "Login button", explore: "Explore button", mobileExplore: "Menu explore button" },
  },
  {
    id: "hero",
    label: "Hero",
    hint: "The first screen — building image, badge, headline and supporting copy.",
    fields: ["eyebrow", "title", "accent", "subtitle", "image"],
    copy: { action: "Explore button", searchLabel: "Search heading", searchPlaceholder: "Search placeholder", searchAction: "Search button" },
    items: { label: "Search suggestions", titleLabel: "Search term", bodyLabel: null },
  },
  {
    id: "services",
    label: "Hero service icons",
    hint: "Edit or hide the row of services below the hero photo.",
    fields: [],
    items: { label: "Services", titleLabel: "Visible label", bodyLabel: "Full label", limit: 5 },
  },
  {
    id: "projects",
    label: "Projects",
    hint: "Featured residence heading and the cover photo shown on the project card.",
    fields: ["eyebrow", "title", "accent", "image"],
    copy: { featuredSlug: "Featured project slug (from Projects)", action: "Project button", developer: "Developer name", residences: "Residence type", area: "Built-up area", priceLabel: "Price label", priceFallback: "Price on request label" },
  },
  {
    id: "commission",
    label: "Commission slabs",
    hint: "Tiered commission ladder.",
    fields: ["eyebrow", "title", "accent", "subtitle", "image"],
    copy: { tierLabel: "Tier label", valueLabel: "Deal value label" },
    items: { label: "Slabs", titleLabel: "Range", bodyLabel: "Optional display note", limit: 6 },
  },
  {
    id: "stats",
    label: "Statistics",
    hint: "Animated counters strip.",
    fields: ["eyebrow", "title", "accent"],
    items: { label: "Counters", titleLabel: "Label", bodyLabel: "Value (number)" },
  },
  {
    id: "lifestyle",
    label: "Lifestyle amenities",
    hint: "Amenities list with a supporting photo.",
    fields: ["eyebrow", "title", "accent", "subtitle", "image"],
    copy: { photoTitle: "Photo caption heading", photoBody: "Photo caption text" },
    items: { label: "Amenities", titleLabel: "Amenity", bodyLabel: "Description" },
  },
  {
    id: "discover",
    label: "Explore residences banner",
    hint: "A photo banner that links to the project collection.",
    fields: ["eyebrow", "title", "subtitle", "image"],
    copy: { action: "Explore button" },
  },
  {
    id: "how",
    label: "How it works",
    hint: "Company → leader → member → payout ladder.",
    fields: ["eyebrow", "title", "subtitle"],
    items: { label: "Steps", titleLabel: "Step", bodyLabel: "Description" },
  },
  {
    id: "faq",
    label: "FAQ",
    hint: "Frequently asked questions.",
    fields: ["eyebrow", "title"],
    items: { label: "Questions", titleLabel: "Question", bodyLabel: "Answer" },
  },
  {
    id: "contact",
    label: "Contact",
    hint: "Contact details and enquiry form.",
    fields: ["eyebrow", "title", "subtitle"],
    copy: { nameLabel: "Name field", emailLabel: "Email field", mobileLabel: "Mobile field", messageLabel: "Message field", action: "Enquiry button", recipient: "Enquiry email (defaults to the Email detail)", subject: "Enquiry email subject" },
    items: { label: "Details", titleLabel: "Label", bodyLabel: "Value" },
  },
  {
    id: "footer",
    label: "Footer",
    hint: "Footer description, navigation labels and dashboard link.",
    fields: ["subtitle"],
    copy: { explore: "Explore column", projects: "Projects link", how: "How it works link", commission: "Commission link", faq: "FAQ link", company: "Company column", contact: "Contact link", teams: "Teams column", action: "Dashboard button", copyright: "Copyright text", closing: "Closing line" },
  },
];

export const DEFAULT_HOMEPAGE: HomepageDoc = {
  header: {
    enabled: true,
    copy: { home: "Home", projects: "Projects", how: "How It Works", contact: "Contact", login: "Login", explore: "Explore", mobileExplore: "Explore Projects" },
  },
  hero: {
    enabled: true,
    eyebrow: "REAL ESTATE — CONSTRUCTION — DEVELOPMENT",
    title: "More Than Just A",
    accent: "Home.",
    subtitle: "Premium homes, trusted construction and landmark developments for modern living.",
    image: "/images/sky-residence-hero.webp",
    copy: { action: "Explore Projects", searchLabel: "Search projects", searchPlaceholder: "Search by city or project…", searchAction: "Search" },
    items: ["Savitri Enclave", "27th Avenue", "Darbhanga"].map(title => ({ title })),
  },
  services: {
    enabled: true,
    items: [
      { title: "Residences", body: "Premium residences" },
      { title: "Construction", body: "End-to-end construction" },
      { title: "Delivery", body: "Trusted delivery" },
      { title: "Transparency", body: "Transparent process" },
      { title: "Guidance", body: "Expert guidance" },
    ],
  },
  projects: {
    enabled: true,
    eyebrow: "Featured Projects",
    title: "Landmark",
    accent: "Residences",
    copy: { featuredSlug: "savitri-enclave", action: "Explore Project", developer: "S.B.P. Buildcon Pvt. Ltd.", residences: "3 BHK", area: "1,763 – 2,016 sqft", priceLabel: "Starting from", priceFallback: "On Request" },
  },
  commission: {
    enabled: true,
    eyebrow: "Commission Slabs",
    title: "Simple, tiered,",
    accent: "transparent.",
    image: "/images/commission-glass-tower.webp",
    copy: { tierLabel: "Tier", valueLabel: "Deal value" },
    subtitle: "Ladders scale with deal value — clearly defined, always visible in your dashboard.",
    items: [
      { title: "₹0 – 1 Cr" },
      { title: "₹1 – 3 Cr" },
      { title: "₹3 – 5 Cr" },
      { title: "₹5 – 7 Cr" },
      { title: "₹7 – 10 Cr" },
      { title: "₹10 Cr+" },
    ],
  },
  stats: {
    enabled: true,
    eyebrow: "OUR FOOTPRINT",
    title: "Built on trust.",
    accent: "Measured in milestones.",
    items: [
      { title: "Projects", body: "24" },
      { title: "Buildings", body: "78" },
      { title: "Flats Sold", body: "1240" },
      { title: "Happy Customers", body: "950" },
    ],
  },
  lifestyle: {
    enabled: true,
    image: "/images/residence-lobby.webp",
    copy: { photoTitle: "Wellness-first Living", photoBody: "Rooftop gardens, spa, and family-first design." },
    eyebrow: "Lifestyle Amenities",
    title: "A home that lives",
    accent: "beyond four walls.",
    subtitle:
      "Curated amenities, biophilic design, and community spaces — every Aawash residence is built for calm, everyday luxury.",
    items: [
      { title: "Infinity Pool", body: "Rooftop pools with skyline views" },
      { title: "Fitness Club", body: "24×7 wellness & recovery" },
      { title: "Sky Lounge", body: "Cafés and co-working" },
      { title: "Green Trails", body: "Cycling & jogging tracks" },
    ],
  },
  discover: {
    enabled: true,
    eyebrow: "Aawaash Residences",
    title: "Find your next home.",
    subtitle: "Explore residences, compare floor plans, and check available flats.",
    image: "/images/architecture-balcony.webp",
    copy: { action: "Explore projects" },
  },
  how: {
    enabled: true,
    eyebrow: "Team System",
    title: "A clear ladder, from listing to payout.",
    subtitle:
      "Aawash's simple structure keeps everyone aligned — company, leaders, members, and customers.",
    items: [
      { title: "Company", body: "Aawash curates and lists premium residential projects." },
      { title: "Team Leader", body: "Each leader owns a team and drives regional sales." },
      { title: "Members", body: "Members work with buyers and close sales on the ground." },
      { title: "Customer Purchase", body: "Buyers book their home with total transparency." },
      { title: "Commission Distribution", body: "Earnings flow automatically through the ladder." },
    ],
  },
  faq: {
    enabled: true,
    eyebrow: "Frequently Asked",
    title: "Answers, in plain words.",
    items: [
      {
        title: "How do I get access to Aawash?",
        body: "Aawash is invite-only. Your Team Leader or Super Admin creates your account and shares your Login ID.",
      },
      {
        title: "What is my Login ID?",
        body: "Team Leaders and Super Admins sign in with their 10-digit mobile number. Members sign in with their Team number followed by their mobile — e.g. 19876543210 for Team 1.",
      },
      {
        title: "How is commission calculated?",
        body: "Every project defines commission slabs by deal value. Once a sale is recorded, Aawash automatically distributes commission across the team ladder.",
      },
      {
        title: "Is Aawash available on mobile?",
        body: "Yes. Aawash is built mobile-first — it feels like a native app on your phone, tablet, and desktop alike.",
      },
      {
        title: "How secure is my data?",
        body: "Aawash uses role-based access control, row-level security in the database, and full audit logging on sensitive actions.",
      },
    ],
  },
  contact: {
    enabled: true,
    copy: { nameLabel: "Your Name", emailLabel: "Email", mobileLabel: "Mobile", messageLabel: "Message", action: "Open email draft", recipient: "", subject: "Aawaash enquiry" },
    eyebrow: "Contact",
    title: "Let's build your team on Aawash.",
    subtitle: "Reach out — we'll help you onboard leaders, members, and your first project.",
    items: [
      { title: "Phone", body: "+91 90000 00000" },
      { title: "Email", body: "hello@aawash.app" },
      { title: "Office", body: "Darbhanga, Bihar — 846004" },
    ],
  },
  footer: {
    enabled: true,
    subtitle: "A premium real estate ecosystem — curated projects, transparent commissions, and a beautiful mobile-first dashboard.",
    copy: { explore: "Explore", projects: "Projects", how: "How It Works", commission: "Commission", faq: "FAQ", company: "Company", contact: "Contact", teams: "For Teams", action: "Login to Dashboard", copyright: "Aawaash. All rights reserved.", closing: "Made with care for premium real estate teams." },
  },
};

function cleanItems(v: unknown): HomeItem[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const items = v
    .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
    .map((i) => ({
      title: typeof i.title === "string" ? i.title : "",
      body: typeof i.body === "string" ? i.body : undefined,
    }))
    .filter((i) => i.title.trim() !== "" || (i.body ?? "").trim() !== "");
  return items;
}

/** Merge a stored (possibly partial / user-authored) doc over the shipped defaults. */
export function mergeHomepage(stored: unknown): HomepageDoc {
  const out: HomepageDoc = {};
  const src = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  for (const spec of SECTION_SPECS) {
    const base = DEFAULT_HOMEPAGE[spec.id] ?? { enabled: true };
    const raw = (src[spec.id] ?? {}) as Record<string, unknown>;
    const legacy = spec.id === "hero"
      ? { eyebrow: "Curated Luxury Residences · India", title: "Home isn't a place.", accent: "It's a feeling.", subtitle: "Aawash brings together premium residential projects, a professional team system, and transparent commission tracking — all in one elegant, mobile-first experience." }
      : spec.id === "projects" ? { eyebrow: "Featured Residence", title: "A home to", accent: "come home to." } : {};
    const pick = (k: FieldKey) => {
      const v = raw[k];
      if (Object.hasOwn(legacy, k) && v === (legacy as Partial<Record<FieldKey, string>>)[k]) return base[k];
      return typeof v === "string" ? v : base[k];
    };
    out[spec.id] = {
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : (base.enabled ?? true),
      eyebrow: pick("eyebrow"),
      title: pick("title"),
      accent: pick("accent"),
      subtitle: pick("subtitle"),
      image: pick("image"),
      items: cleanItems(raw.items)?.slice(0, spec.items?.limit) ?? base.items,
      copy: Object.fromEntries(Object.entries(base.copy ?? {}).map(([key, fallback]) => {
        const value = (raw.copy as Record<string, unknown> | undefined)?.[key];
        return [key, typeof value === "string" ? value : fallback];
      })),
    };
  }
  return out;
}
