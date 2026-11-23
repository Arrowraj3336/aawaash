import { useEffect } from "react";

/** Decorative architecture, deliberately separate from property plans. */
export function ArchitecturalDrawing({ variant }: { variant: "tower" | "plan" | "contours" }) {
  return <svg className={`atelier-drawing atelier-${variant}`} viewBox="0 0 600 600" fill="none" aria-hidden="true">
    {variant === "tower" ? <>
      <path d="M80 520 290 590 540 470M130 535V190L310 70 480 135V490M310 70V580M130 190 310 260 480 135M130 235 310 305 480 180M130 280 310 350 480 225M130 325 310 395 480 270M130 370 310 440 480 315M130 415 310 485 480 360M130 460 310 530 480 405M180 210V550M235 230V565M365 220V550M420 180V520" />
      <path d="M80 170V520M65 170H95M65 520H95M130 135 310 15 480 80M130 120V150M480 65V95" strokeDasharray="4 5" />
      <circle cx="310" cy="70" r="7" /><circle cx="480" cy="490" r="7" />
    </> : variant === "plan" ? <>
      <path d="M60 60H540V540H60ZM80 80H320V285H80ZM340 80H520V285H340ZM80 305H230V520H80ZM250 305H520V420H250ZM250 440H520V520H250M320 185H390M230 410H300" />
      <path d="M320 185a70 70 0 0 1 70 70M230 410a70 70 0 0 1 70 70M20 60H40M20 540H40M30 60V540M60 20V40M540 20V40M60 30H540" />
      <circle cx="400" cy="360" r="33" /><path d="M110 130H260V230H110ZM370 120H490V230H370" />
    </> : Array.from({length:9},(_,i)=><path key={i} d={`M${20+i*22} 600V${260+i*14}Q${20+i*22} ${40+i*22} ${250+i*14} ${40+i*22}H600`} />)}
  </svg>;
}

export function HomepageMotion() {
  useEffect(() => {
    const root = document.getElementById("aawaash-home");
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const start = () => {
      cleanup();
      if (preference.matches) return;
      const elements = Array.from(root.querySelectorAll<HTMLElement>(".future-section-intro,.future-promises li,.future-spaces-layout li,.future-journey li,.future-story-copy,.future-banner-copy"));
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("atelier-visible"); observer.unobserve(entry.target); }
      }), { threshold: 0.08 });
      elements.forEach((el,i) => { el.classList.add("atelier-reveal"); el.style.setProperty("--reveal-delay", `${i % 3 * 65}ms`); observer.observe(el); });
      cleanup = () => {
        observer.disconnect();
        elements.forEach(el => el.classList.remove("atelier-reveal", "atelier-visible"));
      };
    };
    start(); preference.addEventListener("change", start);
    return () => { cleanup(); preference.removeEventListener("change", start); };
  }, []);
  return null;
}
