import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bath, BedDouble, Building2, Compass, ChevronDown, ChevronRight, Info, Layers, Ruler, X } from "lucide-react";
import { getProjectInventory, type FlatStatus, type PublicFlat } from "@/lib/inventory.functions";
import { formatINR } from "@/components/aawash/dashboard-kit";

const STATUS_META: Record<FlatStatus, { label: string; dot: string; chip: string }> = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  },
  reserved: {
    label: "Reserved",
    dot: "bg-amber-500",
    chip: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  },
  sold: {
    label: "Sold",
    dot: "bg-rose-500",
    chip: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  },
  not_released: {
    label: "Not Released",
    dot: "bg-muted-foreground/40",
    chip: "bg-muted text-muted-foreground border-border",
  },
  blocked: {
    label: "Blocked",
    dot: "bg-slate-500",
    chip: "bg-slate-500/15 text-slate-700 border-slate-500/30",
  },
};

export function FlatInventoryBoard({ slug, projectName }: { slug: string; projectName: string }) {
  const fetchInv = useServerFn(getProjectInventory);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", slug],
    queryFn: () => fetchInv({ data: { slug } }),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"available" | "reserved" | "sold" | "closed" | "all">("all");

  const buildings = data?.buildings ?? [];
  const floors = data?.floors ?? [];
  const flats = useMemo(() => data?.flats ?? [], [data?.flats]);

  const selected = flats.find(flat => flat.id === selectedId) ?? null;

  const visibleFlats = flats.filter(flat =>
    filter === "all" || (filter === "closed" ? flat.status === "blocked" || flat.status === "not_released" : flat.status === filter),
  );
  const groupsByBuilding = new Map(buildings.map(building => [
    building.id,
    { id: building.id, name: building.name, floors: new Map<string, { name: string; units: PublicFlat[] }>(), unassigned: [] as PublicFlat[] },
  ]));
  const floorsById = new Map(floors.map(floor => [floor.id, floor]));
  const unassigned: PublicFlat[] = [];

  for (const flat of visibleFlats) {
    const floor = flat.floor_id ? floorsById.get(flat.floor_id) : undefined;
    const group = groupsByBuilding.get(floor?.building_id ?? flat.building_id);
    if (!group) {
      unassigned.push(flat);
    } else if (!floor) {
      group.unassigned.push(flat);
    } else {
      const floorGroup = group.floors.get(floor.id) ?? {
        name: floor.name || `Floor ${floor.number}`,
        units: [],
      };
      floorGroup.units.push(flat);
      group.floors.set(floor.id, floorGroup);
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card animate-pulse rounded-3xl p-6 shadow-[var(--shadow-soft)]">
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-10">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="property-inventory property-inventory-empty">
        <p>Flat availability could not be loaded.</p>
        <button type="button" onClick={() => refetch()}>Try again</button>
      </div>
    );
  }

  if (!data || (flats.length === 0 && floors.length === 0)) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center shadow-[var(--shadow-soft)]">
        <Building2 className="mx-auto text-muted-foreground" />
        <div className="mt-3 text-sm font-semibold text-foreground">Inventory coming soon</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Flat availability for {projectName} will appear here once released.
        </div>
      </div>
    );
  }

  const statuses = [
    { id: "available", label: "Available" },
    { id: "reserved", label: "Reserved" },
    { id: "sold", label: "Sold" },
    { id: "closed", label: "Unavailable" },
  ] as const;
  return (
    <div className="property-inventory">
      <div className="property-status-legend" aria-label="Filter flats by status" role="group">
        {statuses.map(status => (
          <button key={status.id} type="button" aria-pressed={filter === status.id} onClick={() => setFilter(filter === status.id ? "all" : status.id)}>
            <span data-status={status.id} className="property-status-swatch" aria-hidden="true" />
            <strong>{status.label}</strong>
          </button>
        ))}
      </div>

      {filter !== "all" && visibleFlats.length === 0 && (
        <p className="property-inventory-note" role="status">No flats match this status.</p>
      )}
      <p className="property-inventory-note">Select a tower or floor to view its flats.</p>
      {[...groupsByBuilding.values()].map(group => {
        const listedFloors = floors.filter(floor => floor.building_id === group.id && (filter === "all" || group.floors.has(floor.id)));
        const total = group.unassigned.length + listedFloors.reduce((sum, floor) => sum + (group.floors.get(floor.id)?.units.length ?? 0), 0);
        if (total === 0 && listedFloors.length === 0) return null;
        return (
          <details className="property-inventory-building" key={group.id}>
            <summary className="property-tower-heading"><Building2 size={22} aria-hidden="true" /><strong>{group.name}</strong><small>{total} {total === 1 ? "Flat" : "Flats"}</small><ChevronDown size={17} aria-hidden="true" /></summary>
            <p className="property-inventory-hint"><Info size={16} aria-hidden="true" /> Tap a flat to view details.</p>
            {listedFloors.map(floor => {
              const entry = group.floors.get(floor.id);
              return <InventoryFloor key={`${filter}-${floor.id}`} name={entry?.name ?? (floor.name || `Floor ${floor.number}`)} units={entry?.units ?? []} onSelect={setSelectedId} />;
            })}
            {group.unassigned.length > 0 && (
              <InventoryFloor key={filter} name="Floor to be confirmed" units={group.unassigned} onSelect={setSelectedId} />
            )}
          </details>
        );
      })}
      {unassigned.length > 0 && (
        <InventoryFloor name="Other flats" units={unassigned} onSelect={setSelectedId} />
      )}
      {data.source_note && <p className="property-inventory-note">{data.source_note}</p>}
      <FlatModal flat={selected} projectName={projectName} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function InventoryFloor({
  name,
  units,
  onSelect,
}: {
  name: string;
  units: PublicFlat[];
  onSelect: (id: string) => void;
}) {
  return (
    <details className="property-inventory-floor">
      <summary>
        <Layers size={15} aria-hidden="true" />
        <span>{name}</span>
        <small>{units.length} {units.length === 1 ? "Flat" : "Flats"}</small>
        <ChevronRight size={15} className="property-floor-chevron" aria-hidden="true" />
      </summary>
      {units.length === 0 && <p className="property-inventory-note">No flats have been listed on this floor yet.</p>}
      <div className="property-unit-grid">
        {units.map(flat => <FlatTile key={flat.id} flat={flat} onClick={() => onSelect(flat.id)} />)}
      </div>
    </details>
  );
}

function FlatTile({ flat, onClick }: { flat: PublicFlat; onClick: () => void }) {
  const status = STATUS_META[flat.status];
  const disabled = flat.status === "not_released";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="property-unit"
      data-status={flat.status}
      aria-label={`Flat ${flat.unit_code}${flat.floor_number ? `, floor ${flat.floor_number}` : ""} — ${status.label}`}
    >
      <strong>{flat.unit_code}</strong>
    </button>
  );
}

function FlatModal({
  flat,
  projectName,
  onClose,
}: {
  flat: PublicFlat | null;
  projectName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!flat) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [flat, onClose]);

  if (!flat) return null;
  const m = STATUS_META[flat.status];
  const canEnquire = flat.status === "available" || flat.status === "reserved";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Flat ${flat.unit_code} details`} className="property-flat-dialog fixed inset-0 z-[110] flex items-end justify-center bg-background/60 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto animate-fade-up rounded-t-[2rem] bg-surface p-6 shadow-[var(--shadow-float)] sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
        >
          <X size={16} />
        </button>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {projectName}{flat.floor_number ? ` · Residential floor ${flat.floor_number}` : ""}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <h3 className="text-2xl font-extrabold text-foreground">Flat {flat.unit_code}</h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${m.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} /> {m.label}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {flat.configuration ?? "Configuration"} · {flat.facing ?? "Facing TBA"}
        </div>

        {flat.plan_note && <p className="brochure-plan-note">{flat.plan_note}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniSpec
            icon={<Ruler size={14} />}
            label={flat.area_basis || "Area"}
            value={flat.area_sqft ? `${Math.round(flat.area_sqft)} ft²` : "—"}
          />
          <MiniSpec icon={<BedDouble size={14} />} label="Bedrooms" value={String(flat.bedrooms)} />
          <MiniSpec icon={<Bath size={14} />} label="Bathrooms" value={String(flat.bathrooms)} />
          <MiniSpec icon={<Compass size={14} />} label="Facing" value={flat.facing ?? "—"} />
        </div>

        {(flat.gallery?.length || flat.floor_plan_url) && (
          <div className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Media & Plans
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {flat.floor_plan_url && (
                <a
                  href={flat.floor_plan_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  title="Floor plan"
                >
                  <img
                    src={flat.floor_plan_url}
                    alt={`Floor plan ${flat.unit_code}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-background/80 px-2 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider">
                    Floor Plan
                  </span>
                </a>
              )}
              {(flat.gallery ?? []).slice(0, 6).map((url, i) => (
                <a
                  key={`${url}-${i}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img
                    src={url}
                    alt={`${flat.unit_code} photo ${i + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-primary-soft p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Price
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">
            {flat.price ? formatINR(flat.price, { compact: true }) : "On Request"}
          </div>
          {flat.construction_stage && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              Construction: {flat.construction_stage}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={!canEnquire}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {canEnquire ? "Enquire About This Flat" : "Not Available"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-input px-5 text-sm font-bold text-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MiniSpec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-3">
      <div className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}
