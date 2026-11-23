import { useState } from "react";
import { ArrowUpRight, Check, FileText, Maximize2 } from "lucide-react";
import { getPShreeContent } from "@/lib/p-shree";
import { PlanNavigation } from "./PlanNavigation";

export function PShreePlans({ extra }: { extra: unknown }) {
  const [active, setActive] = useState(0);
  const { towers, highlights, areaSchedule } = getPShreeContent(extra);
  const index = Math.min(active, towers.length - 1);
  const tower = towers[index];
  if (!tower) return null;

  return (
    <section id="flats" className="property-plans p-shree-plans" aria-labelledby="p-shree-plan-heading">
      <header className="property-section-intro">
        <h2 id="p-shree-plan-heading" className="property-section-heading">Tower <em>Plans</em></h2>
      </header>
      <article className="property-plan-card" aria-label={tower.name}>
        <div className="property-plan-visual">
          {tower.image ? (
            <a className="property-plan-image" href={tower.image} target="_blank" rel="noreferrer" aria-label={`Open full image for ${tower.name}`}>
              <img src={tower.image} loading="lazy" decoding="async" alt={`${tower.name} floor plan`} />
              <span className="property-gallery-expand"><Maximize2 size={17} aria-hidden="true" /></span>
            </a>
          ) : <div className="property-plan-image property-plan-placeholder">Plan image unavailable</div>}
          <PlanNavigation labels={towers.map(item => item.name)} index={index} onChange={setActive} />
        </div>
        <div className="property-plan-copy" aria-live="polite">
          <p className="property-plan-kicker">Floor plan</p>
          <h3>{tower.name}</h3>
          {highlights.length > 0 && (
            <ul className="property-plan-features" aria-label="Project highlights">
              {highlights.map((point, i) => <li key={i}><Check size={13} aria-hidden="true" />{point}</li>)}
            </ul>
          )}
          <div className="property-plan-links">
            {tower.plan && <a href={tower.plan} target="_blank" rel="noreferrer">Open full plan <ArrowUpRight size={14} aria-hidden="true" /></a>}
            {areaSchedule && <a href={areaSchedule} target="_blank" rel="noreferrer"><FileText size={14} aria-hidden="true" /> Area schedule PDF</a>}
          </div>
        </div>
      </article>
    </section>
  );
}
