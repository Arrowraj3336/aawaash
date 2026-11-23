import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Building2, Layers, TrendingUp, Users, CarFront, Columns2, Grid2X2, RotateCcw, RotateCw, Umbrella } from "lucide-react";
import type { BuildingArea, BuildingProject, mountBuilding } from "./building-scene.js";
import "./building-explorer.css";

const avenueOptions = [
  { id: "two", title: "2 BHK", detail: "Floor 02", label: "Floor 02 · 2 BHK", icon: Columns2 },
  { id: "three", title: "3 BHK", detail: "Floor 05", label: "Floor 05 · 3 BHK", icon: Grid2X2 },
  { id: "parking", title: "Parking", detail: "Outdoor bay", label: "Parking · Outdoor bay", icon: CarFront },
  { id: "roof", title: "Rooftop", detail: "Twin terraces", label: "Rooftop · Twin terraces", icon: Umbrella },
] as const;

const projects = [
  { id: "avenue", name: "27th Avenue" },
  { id: "savitri", name: "Savitri Enclave" },
  { id: "shree", name: "P Shree" },
] as const;

function projectOptions(project: BuildingProject) {
  if (project === "avenue") return avenueOptions;
  const topFloor = project === "savitri" ? "Floor 04" : "Floor 05";
  return [
    { ...avenueOptions[0], title: "Lower homes", label: "Floor 02 · Lower homes" },
    { ...avenueOptions[1], title: "Upper homes", detail: topFloor, label: `${topFloor} · Upper homes` },
    avenueOptions[2],
    { ...avenueOptions[3], detail: "Roof level", label: "Rooftop · Roof level" },
  ];
}

export function BuildingExplorer() {
  const [activeAction, setActiveAction] = useState(2);
  const [project, setProject] = useState<BuildingProject>("avenue");
  const selected = projects.find(({ id }) => id === project) ?? projects[0];
  return (
    <section id="building-explorer" className="building-explorer" aria-labelledby="building-explorer-title">
      <header className="building-explorer__intro">
        <div className="building-explorer__lead">
          <p className="building-explorer__eyebrow">Buying &amp; Selling</p>
          <h2 id="building-explorer-title">Your next move <em>starts here.</em></h2>
        </div>
        <img className="building-explorer__skyline" src="/images/building-explorer/next-move-skyline.svg" alt="" width="500" height="288" />
      </header>
      <div className="building-explorer__actions" role="group" aria-label="Buying and selling"
        style={{ "--action-index": activeAction } as CSSProperties}>
        {[
          { title: "Buy", Icon: Layers },
          { title: "Explore", Icon: Building2 },
          { title: "Sell", Icon: TrendingUp },
          { title: "Ask", Icon: Users },
        ].map(({ title, Icon }, index) => (
          <button key={title} type="button" aria-pressed={activeAction === index}
            onClick={() => setActiveAction(index)}>
            <Icon aria-hidden="true" strokeWidth={1.65} />
            <strong>{title}</strong>
          </button>
        ))}
      </div>
      <div className="building-explorer__projects" role="group" aria-label="Explore by project">
        {projects.map(({ id, name }) => (
          <button key={id} type="button" aria-pressed={id === project}
            aria-controls="building-explorer-view" onClick={() => setProject(id)}>
            <Building2 aria-hidden="true" /> <span>{name}</span>
          </button>
        ))}
      </div>
      <BuildingView key={project} project={project} name={selected.name} />
    </section>
  );
}

function BuildingView({ project, name }: { project: BuildingProject; name: string }) {
  const [area, select] = useState<BuildingArea>("two");
  const [unavailable, setUnavailable] = useState(false);
  const [ready, setReady] = useState(false);
  const selected = useRef<BuildingArea>("two");
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof mountBuilding> | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number; lastX: number; axis?: "x" | "y" } | null>(null);
  const options = projectOptions(project);
  const active = options.find((option) => option.id === area) ?? options[0];

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void import("./building-scene.js").then(({ mountBuilding }) => {
        if (disposed) return;
        scene.current = mountBuilding(element, project, selected.current, select);
        setReady(true);
      }).catch(() => {
        if (!disposed) setUnavailable(true);
      });
    }, { rootMargin: "240px" });
    observer.observe(element);
    return () => {
      disposed = true;
      observer.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, [project]);

  useEffect(() => {
    selected.current = area;
    scene.current?.select(area);
  }, [area]);

  function start(event: PointerEvent<HTMLDivElement>) {
    if (!scene.current || !event.isPrimary || event.button !== 0) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - drag.x);
    const dy = Math.abs(event.clientY - drag.y);
    if (!drag.axis && Math.max(dx, dy) >= 5) {
      drag.axis = dx >= dy ? "x" : "y";
      if (drag.axis === "x") scene.current?.setInteractive(true);
    }
    if (drag.axis !== "x") return;
    scene.current?.rotate((event.clientX - drag.lastX) * .011);
    drag.lastX = event.clientX;
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    const drag = gesture.current;
    if (!drag.axis) scene.current?.pick(event.clientX, event.clientY);
    else if (drag.axis === "x") scene.current?.rotate((event.clientX - drag.lastX) * .011);
    cancelGesture();
  }

  function cancelGesture() {
    if (gesture.current?.axis === "x") scene.current?.setInteractive(false);
    gesture.current = null;
  }

  return (
    <div id="building-explorer-view" className="building-explorer__frame" aria-label={name}>
        <div className="building-explorer__viewer">
          <div className="building-explorer__bar">
            <output aria-live="polite">{active.label}</output>
          </div>
          <div
            className="building-explorer__canvas"
            ref={host}
            tabIndex={0}
            role="group"
            aria-label={`${name} 3D building. Use the left and right arrow keys to rotate.`}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={cancelGesture}
            onLostPointerCapture={cancelGesture}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              scene.current?.rotate(event.key === "ArrowLeft" ? -.18 : .18);
            }}
          >
            {!ready && <span role="status">{unavailable ? "3D view is unavailable on this device." : "Loading building model…"}</span>}
          </div>
          <div className="building-explorer__toolbar">
            <span className="building-explorer__hint"><RotateCw aria-hidden="true" /> Drag to rotate</span>
            <button type="button" aria-label="Reset building view" title="Reset building view"
              disabled={!ready} onClick={() => scene.current?.reset()}>
              <RotateCcw aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="building-explorer__controls" role="group" aria-label="Building areas">
          {options.map(({ id, title, detail, icon: Icon }) => (
            <button key={id} type="button" aria-pressed={id === area} onClick={() => select(id)}>
              <span className="building-explorer__icon"><Icon aria-hidden="true" /></span>
              <span><strong>{title}</strong><small>{detail}</small></span>
            </button>
          ))}
        </div>
    </div>
  );
}
