import type { CSSProperties } from "react";
import logo from "@/assets/aawaash-logo.png.asset.json";
import styles from "./splash.css?raw";

const OPENING_DURATION_MS = 4000;
const SESSION_KEY = "aawaash-opening-v2";

// Runs in the document head before the homepage can paint or React hydrates.
const bootstrap = `(() => {
  if (location.pathname !== "/" || location.hash) return;
  const navigation = performance.getEntriesByType?.("navigation")[0];
  if (navigation?.type === "reload" || navigation?.type === "back_forward") return;
  if (document.referrer && new URL(document.referrer).origin === location.origin) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    if (sessionStorage.getItem(${JSON.stringify(SESSION_KEY)})) return;
    sessionStorage.setItem(${JSON.stringify(SESSION_KEY)}, "1");
  } catch {}

  const root = document.documentElement;
  root.setAttribute("data-home-opening", "playing");

  const finish = () => {
    clearTimeout(timer);
    document.removeEventListener("animationend", finishAfterConstruction);
    root.removeAttribute("data-home-opening");
  };
  const finishAfterConstruction = (event) => {
    if (event.animationName === "opening-landscape-finish" && event.target?.classList.contains("opening-landscape")) finish();
  };
  document.addEventListener("animationend", finishAfterConstruction);
  const timer = setTimeout(finish, ${OPENING_DURATION_MS + 500});
  addEventListener("pagehide", finish, { once: true });

})();`;

export function SplashHead() {
  return (
    <>
      <style>{`:root { --opening-duration: ${OPENING_DURATION_MS}ms; }
${styles}`}</style>
      <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
    </>
  );
}

const levels = [
  { y: 292, width: 1, shift: -6 },
  { y: 255, width: .98, shift: 0 },
  { y: 218, width: .95, shift: 7 },
  { y: 181, width: .90, shift: 13 },
  { y: 144, width: .86, shift: 17 },
  { y: 107, width: .80, shift: 20 },
];

function BuildingAssembly() {
  return (
    <svg className="opening-build" viewBox="0 0 416 402" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="opening-glass" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#cbe1da" />
          <stop offset=".5" stopColor="#476969" />
          <stop offset="1" stopColor="#20383d" />
        </linearGradient>
        <linearGradient id="opening-stone" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#fbfaf1" />
          <stop offset="1" stopColor="#a7afa3" />
        </linearGradient>
      </defs>
      <g className="opening-grid" stroke="#aebbab" strokeWidth=".75">
        <path d="M20 322 205 247 397 307M35 335l185-74 163 52M46 349l187-75 143 48M71 358l178-71 111 42M89 368l177-69 86 37M116 373l164-63 55 31M24 315l171 69M53 303l171 69M81 291l171 69M109 280l171 69M137 269l171 68M165 257l171 69" />
        <path d="M88 308V160l90-37 158 58v113M178 123V78l158 57v46M178 78l-90 38v44" strokeDasharray="4 5" />
      </g>
      <g className="opening-foundation">
        <path d="m37 324 146-60 199 74-146 56z" fill="#39493b" opacity=".10" />
        <path d="m44 317 141-57 179 66-142 57z" fill="#b4bc9c" />
        <path d="m44 317 178 66v7L44 324z" fill="#7e8d70" />
        <path d="m222 383 142-57v7l-142 57z" fill="#667659" />
        <path d="m60 319 123-51 164 61-124 49z" fill="#d4d2bf" />
        <path d="m170 356 74-30 38 13-75 30z" fill="#e9e3d4" />
      </g>
      {levels.map(({ y, width, shift }, index) => (
        <g key={y} transform={`translate(${210 * (1 - width) + shift} ${y}) scale(${width} 1)`} style={{ "--level-delay": `${.42 + index * .38}s` } as CSSProperties}>
          <g className="opening-storey">
            <path d="M102-32 171-60Q186-66 202-60L318-18Q337-10 317 0L253 27Q240 32 224 27L103-16Q88-23 102-32Z" fill="#e3e7da" />
            <path d="M95-24Q96-20 103-16L224 27Q240 32 253 27L317 0Q329-5 329-10V23Q329 30 317 35L253 62Q240 67 224 62L103 19Q95 16 95 11Z" fill="url(#opening-stone)" />
            <g className="opening-glazing">
              <path d="M103-13 224 30Q240 36 253 30L319 3V23L253 51Q240 57 224 51L103 8Z" fill="url(#opening-glass)" />
              <path d="M118-8V13m18-14v20m18-14v20m18-14v20m18-14v20m18-14v20m18-13v19m20-16v20m18-27v21m18-28v20m18-27v20m18-28v21" stroke="#b4cec0" strokeOpacity=".65" strokeWidth=".75" />
              <path d="m108-9 111 40 12 3v5l-20-4-103-38z" fill="#edf7e8" opacity=".27" />
              <path d="m177 20 8 3v8l-8-3zm91 8 10-4v7l-10 4zm33-13 9-4v8l-9 4z" fill="#e5e9b2" opacity=".8" />
            </g>
            <path d="M95 9Q95 14 103 17L224 60Q240 66 253 60L317 33Q329 28 329 21V27Q329 34 317 39L253 66Q240 71 224 66L103 23Q95 20 95 16Z" fill="#e5e8db" />
            <path d="m103 22 121 43q16 6 29 0l64-27" stroke="#edf9d8" strokeWidth="1.35" />
            {index % 2 === 0 && (
              <path d="m113 14 33 12 5 6-41-14zm156 36 24-10-1-5-24 10z" fill="#738852" />
            )}
          </g>
        </g>
      ))}
      <g className="opening-roof">
        <path d="M135 78 201 49Q211 45 224 49L322 85Q343 93 322 104L269 127Q255 133 241 128L135 90Q123 85 135 78Z" fill="#354c48" />
        <path d="M133 82 242 122Q255 128 269 122L326 98" stroke="#e6efcf" strokeWidth="2" strokeLinecap="round" />
        <path d="M176 73 212 57 292 86 255 103Z" fill="#9aab78" />
        <path d="M213 87V64l20-10 64 23v21m-84-34 65 24 19-11m-19 11v21" stroke="#d0d9bb" strokeWidth="1.5" />
        <ellipse cx="246" cy="70" rx="65" ry="20" transform="rotate(13 246 70)" fill="#9bc5ad" fillOpacity=".15" stroke="#edf9d8" strokeWidth="2.5" />
        <ellipse cx="246" cy="70" rx="65" ry="20" transform="rotate(13 246 70)" stroke="#9bbb97" strokeWidth=".8" />
        <path d="M253 63V45m-5 4 5-4 4 7" stroke="#758b76" strokeWidth="1.3" />
      </g>
      <g className="opening-landscape">
        <path d="m67 324 44-18 25 9-43 19zm213 35 45-18 17 6-45 18z" fill="#8c9d72" />
        <path d="M87 322v-30m239 55v-27" stroke="#71624c" strokeWidth="2.4" />
        <path d="M72 291c0-12 7-20 15-20s16 9 16 20c0 9-7 14-16 14s-15-5-15-14Zm242 26c0-10 6-17 12-17 8 0 13 8 13 17 0 7-6 12-13 12s-12-5-12-12Z" fill="#708862" />
      </g>
    </svg>
  );
}

export function Splash() {
  return (
    <div id="home-opening" role="status" aria-label="Opening Aawaash">
      <BuildingAssembly />
      <div className="opening-brand" aria-hidden="true">
        <img src={logo.url} alt="" width={50} height={50} />
        <span>Aawaash</span>
        <span className="opening-spinner" />
      </div>
    </div>
  );
}
