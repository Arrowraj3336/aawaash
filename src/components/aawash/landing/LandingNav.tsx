import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Building2, Search } from "lucide-react";
import { BrandMark } from "@/components/aawash/BrandMark";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import "./site-header.css";

const NAV_ITEMS = [
  { id: "home", label: "Home", href: "/", route: true },
  { id: "projects", label: "Projects", href: "/projects", route: true },
  { id: "commission", label: "Commission Slabs", href: "/commission-earnings#commission" },
  { id: "about", label: "About", href: "/about", route: true },
  { id: "how", label: "Buying & Selling", href: "/#building-explorer" },
  { id: "contact", label: "Contact", href: "/#contact" },
];

export function LandingNav({ copy, project = false }: { copy?: Record<string, string>; project?: boolean }) {
  const links = NAV_ITEMS.map(item => ({ ...item, label: copy?.[item.id] ?? item.label })).filter(item => item.label);
  const login = copy?.login ?? "Login";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let anchorY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      setScrolled(y > 24);
      if (project || open || y < 80) {
        setHidden(false);
        anchorY = y;
      } else if (Math.abs(y - anchorY) >= 12) {
        setHidden(y > anchorY);
        anchorY = y;
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [open, project]);

  return (
    <header data-hidden={hidden && !open} data-scrolled={scrolled} inert={hidden && !open} className="site-header">
      <nav className="site-header-bar" aria-label="Main navigation">
        {project ? (
          <Link to="/projects" aria-label="Back to projects" className="site-header-control">
            <ArrowLeft aria-hidden="true" />
          </Link>
        ) : (
          <a href="/#homepage-search" aria-label="Search projects" className="site-header-control" onClick={() => document.getElementById("homepage-search")?.setAttribute("open", "")}>
            <Search aria-hidden="true" />
          </a>
        )}
        <Link to="/" aria-label="Aawaash home" className="site-header-brand">
          <BrandMark size="sm" />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" aria-label="Open menu" className="site-header-control site-header-menu">
              <Building2 aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="site-menu-panel" aria-describedby={undefined}>
            <SheetTitle className="sr-only">Main menu</SheetTitle>
            <div className="site-menu-inner">
              <BrandMark size="sm" />
              <ul className="site-menu-links">
                {links.map((item) => (
                  <li key={item.href}>
                    {item.route ? (
                      <Link to={item.href} onClick={() => setOpen(false)}>
                        {item.label}<ArrowUpRight aria-hidden="true" />
                      </Link>
                    ) : (
                      <a href={item.href} onClick={() => setOpen(false)}>
                        {item.label}<ArrowUpRight aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <div className="site-menu-actions">
                {login && <Link to="/auth" onClick={() => setOpen(false)}>{login}</Link>}
                <Link to="/projects" onClick={() => setOpen(false)}>
                  {copy?.mobileExplore ?? copy?.explore ?? "Explore Projects"}
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
