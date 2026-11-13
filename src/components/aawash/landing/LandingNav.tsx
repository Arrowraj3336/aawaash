import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, X, Search } from "lucide-react";
import { BrandMark } from "@/components/aawash/BrandMark";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { id: "home", label: "Home", href: "/", route: true },
  { id: "projects", label: "Projects", href: "/projects", route: true },
  { id: "how", label: "How It Works", href: "/#how-it-works" },
  { id: "contact", label: "Contact", href: "/#contact" },
];

export function LandingNav({ editorial = false, copy, project = false }: { editorial?: boolean; copy?: Record<string, string>; project?: boolean }) {
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
    <div data-hidden={hidden && !open} inert={hidden && !open} onFocusCapture={() => setHidden(false)} className="landing-header fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        data-nav-surface="true"
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-3xl border border-border bg-white px-4 py-2.5 transition-shadow duration-300 sm:px-6 sm:py-3 ${
          scrolled ? "shadow-[var(--shadow-float)]" : "shadow-[var(--shadow-soft)]"
        }`}
      >
        {project && <Link to="/projects" aria-label="Back to projects" className="property-header-back"><ArrowLeft size={22} aria-hidden="true" /></Link>}
        <Link to="/" className={project ? "property-header-brand shrink-0" : "shrink-0"}>
          <BrandMark size="sm" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-actions flex items-center gap-2">
          <a href="/#homepage-search" aria-label="Search projects" className="nav-search hidden" onClick={() => { document.getElementById("homepage-search")?.setAttribute("open", ""); }}><Search size={25} strokeWidth={1.6} /></a>
          <Link
            to="/auth"
            className="hidden h-10 items-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 sm:inline-flex"
          >
            {login}
          </Link>
          <a
            href="/projects"
            className="hidden h-10 items-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:-translate-y-0.5 sm:inline-flex"
          >
            {copy?.explore ?? "Explore"}
          </a>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface text-foreground shadow-[var(--shadow-soft)] lg:hidden"
              >
                <Menu size={editorial ? 27 : 18} strokeWidth={editorial ? 1.8 : 2} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85vw] max-w-sm rounded-l-3xl border-l border-border bg-background/95 p-0 backdrop-blur-xl"
            >
              <div className="flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <BrandMark size="sm" />
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-surface text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <ul className="mt-8 flex flex-col gap-1">
                  {links.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center rounded-2xl px-4 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-col gap-3 pt-8">
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground shadow-[var(--shadow-soft)]"
                  >
                    {login}
                  </Link>
                  <a
                    href="/projects"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                  >
                    {copy?.mobileExplore ?? "Explore Projects"}
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
