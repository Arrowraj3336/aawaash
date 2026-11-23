import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/aawash/BrandMark";
import { DEFAULT_HOMEPAGE, type HomeSection } from "@/lib/homepage-content";
import "./site-footer.css";

export function SiteFooter({ section = DEFAULT_HOMEPAGE.footer }: { section?: HomeSection }) {
  const { subtitle, copy } = section;
  return (
    <footer className="aawaash-site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link to="/" aria-label="Aawaash home"><BrandMark size="sm" /></Link>
            <p className="site-footer-description">
              {subtitle}
            </p>
          </div>
          <FooterCol
            title={copy?.explore ?? ""}
            links={[
              { label: copy?.projects ?? "", href: "/#projects" },
              { label: copy?.how ?? "", href: "/#building-explorer" },
              { label: copy?.commission ?? "", href: "/commission-earnings#commission" },
              { label: copy?.faq ?? "", href: "/#faq" },
            ]}
          />
          <FooterCol
            title={copy?.company ?? ""}
            links={[
              { label: "About Aawaash", href: "/about" },
              { label: copy?.contact ?? "", href: "/#contact" },
            ]}
          />
          <div className="site-footer-team">
            <p className="site-footer-label">{copy?.teams}</p>
            {copy?.action && (
              <Link to="/auth" className="site-footer-dashboard">
                {copy.action}<ArrowUpRight aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        <div className="site-footer-bottom">
          <div className="site-footer-bottom-inner">
            <span>© {new Date().getFullYear()} {copy?.copyright}</span>
            {copy?.closing && <span>{copy.closing}</span>}
            <span>Design &amp; Developed By <a className="site-footer-credit" href="https://www.rynovel.com" target="_blank" rel="noopener noreferrer">RYNOVEL</a></span>
          </div>
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
    <nav aria-label={title || undefined}>
      {title && <p className="site-footer-label">{title}</p>}
      <ul className="site-footer-links">
        {links.filter(l => l.label).map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
