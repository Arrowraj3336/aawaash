import { ChevronLeft, ChevronRight } from "lucide-react";

export function PlanNavigation({ labels, index, onChange }: {
  labels: string[];
  index: number;
  onChange: (index: number) => void;
}) {
  if (labels.length < 2) return null;

  return (
    <div className="property-plan-pagination" role="group" aria-label="Browse floor plans">
      <button type="button" className="property-plan-arrow" aria-label="Previous plan"
        onClick={() => onChange((index + labels.length - 1) % labels.length)}>
        <ChevronLeft size={17} aria-hidden="true" />
      </button>
      <div className="property-plan-dots">
        {labels.map((label, position) => (
          <button key={position} type="button" aria-label={label} aria-current={position === index ? "true" : undefined}
            onClick={() => onChange(position)} />
        ))}
      </div>
      <button type="button" className="property-plan-arrow" aria-label="Next plan"
        onClick={() => onChange((index + 1) % labels.length)}>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
