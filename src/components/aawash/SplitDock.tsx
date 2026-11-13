import { useEffect, useState, type ReactNode } from "react";

export function SplitDock({ items, keyboardToolbar }: { items: ReactNode[]; keyboardToolbar?: boolean }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let frame = 0;
    let last = Math.max(0, window.scrollY);
    let distance = 0;

    function update() {
      frame = 0;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const top = Math.max(0, Math.min(window.scrollY, max));
      const delta = top - last;
      last = top;
      if (top <= 24) {
        distance = 0;
        setHidden(false);
        return;
      }
      if (!delta) return;
      distance = Math.sign(delta) === Math.sign(distance) ? distance + delta : delta;
      if (distance >= 24 || distance <= -14) {
        setHidden(distance > 0);
        distance = 0;
      }
    }

    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="aawaash-dock-bar"
      data-scroll-hidden={hidden ? "true" : undefined}
      role={keyboardToolbar ? "toolbar" : undefined}
      aria-orientation={keyboardToolbar ? "horizontal" : undefined}
      aria-label={keyboardToolbar ? "Dock destinations" : undefined}
    >
      <ul className="aawaash-dock-strip">{items}</ul>
    </div>
  );
}
