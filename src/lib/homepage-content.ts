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
    hint: "Tiered commission ladder on the Commission Earnings page.",
    fields: ["eyebrow", "title", "accent", "subtitle", "image"],
    copy: { tierLabel: "Tier label", valueLabel: "Deal value label" },
    items: { label: "Slabs", titleLabel: "Range", bodyLabel: "Optional display note", limit: 6 },
  },
  {
    id: "lifestyle",
    label: "Lifestyle amenities",
    hint: "Garden artwork and the amenities shown on the homepage.",
    fields: ["eyebrow", "title", "accent", "subtitle", "image"],
    items: { label: "Amenities", titleLabel: "Amenity", bodyLabel: "Description" },
  },
  {
    id: "faq",
    label: "FAQ",
    hint: "Frequently asked questions and architectural artwork.",
    fields: ["eyebrow", "title", "image"],
    items: { label: "Questions", titleLabel: "Question", bodyLabel: "Answer" },
  },
  {
    id: "residencesBanner",
    label: "Find Your Next Home banner",
    hint: "Artwork displayed above Contact. The banner links to the projects page.",
    fields: ["title", "image"],
  },
  {
    id: "contact",
    label: "Contact",
    hint: "Contact details, architectural artwork, and enquiry form.",
    fields: ["eyebrow", "title", "accent", "subtitle", "image"],
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
    copy: { home: "Home", projects: "Flats for Sale", how: "Buying & Selling", contact: "Enquire", login: "Login", explore: "Browse Flats", mobileExplore: "Browse Flats" },
  },
  hero: {
    enabled: true,
    eyebrow: "We Don’t Just Sell Walls and Roofs.",
    title: "We Build Where",
    accent: "Your Story Begins.",
    subtitle: "Since 2017, Aawaash has been driven by one simple belief: buying a property shouldn’t feel like a gamble—it should feel like coming home.",
    image: "/images/sky-residence-hero.webp",
    copy: { action: "Explore Properties", searchLabel: "Find a Flat", searchPlaceholder: "Search by city or project…", searchAction: "Search" },
    items: ["Savitri Enclave", "27th Avenue", "Darbhanga"].map(title => ({ title })),
  },
  services: {
    enabled: true,
    items: [
      { title: "Buy a property", body: "Find a place for your next chapter" },
      { title: "Sell your flat", body: "Discuss a direct purchase with Aawaash" },
      { title: "Invest with clarity", body: "Explore property opportunities" },
    ],
  },
  projects: {
    enabled: true,
    eyebrow: "SELECTED RESIDENCES",
    title: "A home of",
    accent: "your own",
    copy: { featuredSlug: "savitri-enclave", action: "View Project", developer: "S.B.P. Buildcon Pvt. Ltd.", residences: "3 BHK", area: "1,763 – 2,016 sqft", priceLabel: "Starting from", priceFallback: "On Request" },
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
  lifestyle: {
    enabled: true,
    image: "/images/home/lifestyle-garden-reference.webp",
    eyebrow: "Lifestyle Amenities",
    title: "Spaces for Everyday Living",
    subtitle: "Curated amenities, biophilic design, and community spaces for calm, everyday luxury.",
    items: [
      { title: "Infinity Pool" },
      { title: "Fitness Club" },
      { title: "Sky Lounge" },
      { title: "Green Trails" },
    ],
  },
  faq: {
    enabled: true,
    eyebrow: "Frequently Asked",
    title: "Buying and selling questions",
    image: "/images/home/faq-architecture.webp",
    items: [
      {
        title: "How do I buy a flat from Aawaash?",
        body: "Yes. Browse our projects and contact us about the flat you’re interested in.",
      },
      {
        title: "Does Aawaash buy flats directly from owners?",
        body: "Yes. Send us your flat details for review. If the flat is a fit, we can discuss a direct purchase.",
      },
      {
        title: "What should I include in a selling enquiry?",
        body: "Share the property location, number of bedrooms, approximate area, and expected price.",
      },
      {
        title: "Can I arrange a viewing before buying?",
        body: "Yes. Contact Aawaash with the project or flat you’d like to visit to arrange a viewing.",
      },
      {
        title: "How do I confirm the latest price and availability?",
        body: "Contact Aawaash with the project and flat you’re considering to confirm the current price and availability.",
      },
    ],
  },
  residencesBanner: {
    enabled: true,
    title: "Find Your Next Home.",
    image: "/images/home/find-your-next-home.webp",
  },
  contact: {
    enabled: true,
    copy: { nameLabel: "Your Name", emailLabel: "Email", mobileLabel: "Mobile", messageLabel: "Tell us if you’re buying or selling", action: "Open Enquiry Email", recipient: "", subject: "Aawaash flat enquiry" },
    eyebrow: "Contact",
    title: "Let’s build",
    accent: "your team.",
    subtitle: "We’ll help you onboard leaders, members, and your first project.",
    image: "/images/home/contact-architecture.webp",
    items: [
      { title: "Phone", body: "+91 90000 00000" },
      { title: "Email", body: "hello@aawash.app" },
      { title: "Office", body: "Darbhanga, Bihar — 846004" },
    ],
  },
  footer: {
    enabled: true,
    subtitle: "We build where your story begins. Property, with clarity, honesty, and genuine care since 2017.",
    copy: { explore: "Explore", projects: "Flats for Sale", how: "Buying & Selling", commission: "Commission", faq: "FAQ", company: "Company", contact: "Contact", teams: "For Teams", action: "Login to Dashboard", copyright: "Aawaash. All rights reserved.", closing: "Buy or sell a flat with Aawaash." },
  },
};

const PREVIOUS_SECTION_DEFAULTS: Record<string, Partial<HomeSection>>[] = [{
  lifestyle: {
    image: "/images/home/garden-lounge.webp",
    eyebrow: "SPACES FOR WHAT’S NEXT",
    title: "Everyday comfort.",
    accent: "Future possibilities.",
    subtitle: "A home, an investment, or a space to build your business. Discover a property that belongs in your future.",
    items: [
      { title: "Modern Apartments", body: "Designed for everyday comfort and the moments that matter." },
      { title: "High-growth Plots", body: "Room to build your plans and invest in tomorrow." },
      { title: "Commercial Spaces", body: "A place for your next business chapter." },
    ],
  },
  faq: {
    eyebrow: "GOOD QUESTIONS. CLEAR ANSWERS.",
    title: "Let’s make it simple.",
    items: [
      {
        title: "Can I buy a flat from Aawaash?",
        body: "Yes. Browse our projects and contact us about the flat you’re interested in.",
      },
      {
        title: "Does Aawaash buy flats directly from owners?",
        body: "Yes. Send us your flat details for review. If the flat is a fit, we can discuss a direct purchase.",
      },
      {
        title: "What should I include in a selling enquiry?",
        body: "Share the property location, number of bedrooms, approximate area, and expected price.",
      },
      {
        title: "Where can I see floor plans and availability?",
        body: "Open a project page to see its floor plans and availability.",
      },
    ],
  },
  contact: {
    eyebrow: "BUYER & SELLER ENQUIRIES",
    title: "Tell us your next move.",
    subtitle: "Buying? Share your preferred area and budget. Selling? Tell us where your flat is, its size, and your expected price.",
  },
}, {
  lifestyle: {
    image: "/images/residence-lobby.webp",
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
  faq: {
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
    eyebrow: "Contact",
    title: "Let's build your team on Aawash.",
    subtitle: "Reach out — we'll help you onboard leaders, members, and your first project.",
  },
}];

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
    const previousSections = PREVIOUS_SECTION_DEFAULTS.map(doc => doc[spec.id]).filter(Boolean);
    const pick = (k: FieldKey) => {
      const v = raw[k];
      if (typeof v === "string" && (
        v === (legacy as Partial<Record<FieldKey, string>>)[k]
        || previousSections.some(section => section?.[k] === v)
      )) return base[k];
      return typeof v === "string" ? v : base[k];
    };
    const savedItems = cleanItems(raw.items)?.slice(0, spec.items?.limit);
    const hasStockItems = savedItems !== undefined && previousSections.some(({ items }) =>
      items?.length === savedItems.length && items.every((item, index) =>
        item.title === savedItems[index]?.title && item.body === savedItems[index]?.body));
    out[spec.id] = {
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : (base.enabled ?? true),
      eyebrow: pick("eyebrow"),
      title: pick("title"),
      accent: spec.id === "contact" && typeof raw.title === "string"
        && pick("title") !== base.title && typeof raw.accent !== "string"
        ? undefined
        : pick("accent"),
      subtitle: pick("subtitle"),
      image: pick("image"),
      items: hasStockItems ? base.items : savedItems ?? base.items,
      copy: Object.fromEntries(Object.entries(base.copy ?? {}).map(([key, fallback]) => {
        const value = (raw.copy as Record<string, unknown> | undefined)?.[key];
        return [key, typeof value === "string" ? value : fallback];
      })),
    };
  }
  return out;
}
