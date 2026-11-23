import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Building2, FileCheck2, House, KeyRound, Map, MapPin } from "lucide-react";
import { LandingNav } from "@/components/aawash/landing/LandingNav";
import { SiteFooter } from "@/components/aawash/landing/SiteFooter";
import "@/about.css";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Aawaash" },
      { name: "description", content: "Get to know Aawaash, our approach to property, and how we help you from your first site visit to the keys." },
    ],
  }),
});

const commitments = [
  { title: "Local knowledge", text: "Since 2017, our local experience has helped buyers compare neighbourhoods, understand how they connect to everyday destinations, and decide where they want to put down roots.", Icon: MapPin },
  { title: "Verified titles", text: "We offer properties with verified titles and walk buyers through the relevant documents so they know what to review before making a decision.", Icon: FileCheck2 },
  { title: "Personal guidance", text: "From your first site visit to handover, we explain the next step and make room for your questions.", Icon: KeyRound },
];

const portfolio = [
  { title: "Apartments", text: "Compare floor plans, the way rooms connect, natural light, and shared spaces to find a home that fits your daily routine.", Icon: House },
  { title: "Plots", text: "Consider access, surrounding development, and how a plot could serve your plans today and in the years ahead.", Icon: Map },
  { title: "Commercial spaces", text: "Look at visibility, access, and layout as you decide how a space will work for your business and its customers.", Icon: Building2 },
];

const journey = [
  { title: "Share what matters", text: "Start with your budget, preferred area, and how you want to use the property. That gives us a starting point for your shortlist." },
  { title: "Visit the property", text: "See the space in person and ask questions about the layout, location, and fit." },
  { title: "Review the documents", text: "Go through the title and paperwork with our team before making a decision." },
  { title: "Collect the keys", text: "We stay in touch through the handover so you know what to bring, what to review, and when you’ll receive the keys." },
];

function AboutPage() {
  return (
    <div className="portfolio-page about-page">
      <LandingNav />
      <main>
        <section className="about-hero" aria-labelledby="about-heading">
          <div className="about-hero-copy">
            <p className="about-kicker">About Aawaash</p>
            <h1 id="about-heading">We build where your story begins.</h1>
            <p>Since 2017, Aawaash has been driven by one simple belief: buying a property shouldn’t feel like a gamble—it should feel like coming home.</p>
          </div>
          <figure className="about-hero-image">
            <img src="/projects/savitri-enclave/exterior-angle.webp" alt="Exterior of Savitri Enclave" fetchPriority="high" />
            <figcaption>Savitri Enclave</figcaption>
          </figure>
        </section>

        <section className="about-story about-section" aria-labelledby="about-story-heading">
          <img className="about-story-image" src="/images/home/garden-lounge.webp" alt="A landscaped residential lounge" loading="lazy" />
          <div>
            <h2 id="about-story-heading">Our story</h2>
            <p>Over the past nine years, we have helped hundreds of families turn lifelong savings into secure addresses and smart investments.</p>
            <p>In a market often clouded by confusing paperwork and empty promises, Aawaash stands for clarity, honesty, and genuine care.</p>
            <p>That starts with showing buyers what they’re considering, from the layout and neighbourhood to the paperwork behind the purchase. A site visit is a chance to see how a property fits everyday life and ask the questions that matter to you.</p>
          </div>
        </section>

        <section className="about-section" aria-labelledby="about-commitments-heading">
          <h2 id="about-commitments-heading">What you can expect</h2>
          <ul className="about-icon-grid">
            {commitments.map(({ title, text, Icon }) => (
              <li key={title}>
                <Icon aria-hidden="true" strokeWidth={1.5} />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-section about-portfolio" aria-labelledby="about-portfolio-heading">
          <h2 id="about-portfolio-heading">What we offer</h2>
          <p className="about-section-copy">From modern apartments designed for everyday comfort to high-growth plots and commercial spaces, every property we offer is handpicked, legally verified, and built for the future.</p>
          <ul className="about-icon-grid">
            {portfolio.map(({ title, text, Icon }) => (
              <li key={title}>
                <Icon aria-hidden="true" strokeWidth={1.5} />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-section about-review" aria-labelledby="about-review-heading">
          <img src="/images/residence-facade.svg" alt="" loading="lazy" />
          <div>
            <h2 id="about-review-heading">Before you decide</h2>
            <p>Look beyond the first impression. At a visit, picture your everyday route to work or school, see how the rooms feel in person, and ask which layouts are available.</p>
            <p>We’ll help you review the property details and documents at your pace so you can compare your options with confidence.</p>
          </div>
        </section>

        <section className="about-section" aria-labelledby="about-journey-heading">
          <h2 id="about-journey-heading">From visit to keys</h2>
          <ol className="about-journey">
            {journey.map(({ title, text }) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-section about-contact" aria-labelledby="about-contact-heading">
          <div>
            <h2 id="about-contact-heading">Talk to our team</h2>
            <p>Tell us what you’re looking for, or explore the available projects at your own pace.</p>
          </div>
          <div className="about-contact-links">
            <Link to="/projects">View projects <ArrowUpRight size={16} aria-hidden="true" /></Link>
            <Link to="/" hash="contact">Contact us <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
