import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowRight, Building2, ChevronRight, Info, Mic, Search, Users, Wallet } from "lucide-react";
import { HomeSkyline } from "@/components/aawash/landing/HomeSkyline";
import { timeGreeting } from "@/lib/greeting";
import { useEcoWelcome } from "./EcoKit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import "./architectural-dashboard.css";

export type DashboardMetric = {
  icon: ReactNode;
  label: string;
  value: string;
  to: string;
  loading?: boolean;
};

export type DashboardDestination = { label: string; to: string; keywords?: string };

type DashboardRank = {
  label: string;
  percent: number;
  rank: number | null;
  total: number;
  info: string;
  loading: boolean;
};

export function DashboardFocus({ name, rank, metrics, quick, highlights, projectsTo, destinations, placeholder }: {
  name: string;
  rank: DashboardRank;
  metrics: DashboardMetric[];
  quick: DashboardMetric[];
  highlights: DashboardMetric[];
  projectsTo: string;
  destinations: DashboardDestination[];
  placeholder: string;
}) {
  return (
    <>
      <DashboardGreeting name={name} />
      <DashboardRankCard {...rank} />
      <div className="arch-dashboard-metrics">{metrics.map(metric => <MetricCard key={metric.label} {...metric} />)}</div>
      <div className="arch-dashboard-highlights">{highlights.map(metric => <MetricCard key={metric.label} {...metric} />)}</div>
      <Link to={projectsTo} className="arch-explore">
        <Building2 aria-hidden="true" />
        <span><strong>Explore New Projects</strong><small>Discover the latest listings and opportunities.</small></span>
        <ArrowRight aria-hidden="true" />
      </Link>
      <DashboardSearch destinations={destinations} placeholder={placeholder} />
      <div className="arch-dashboard-quick">{quick.map(metric => <MetricCard key={metric.label} {...metric} />)}</div>
    </>
  );
}

function DashboardGreeting({ name }: { name: string }) {
  const welcome = useEcoWelcome();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const line = welcome?.style === "minimal" ? "" : welcome?.style === "name" ? "Welcome back" : now ? timeGreeting(now) : "";

  return (
    <section className="arch-dashboard-greeting" aria-label="Dashboard greeting">
      <HomeSkyline className="arch-greeting-building" />
      <div className="arch-greeting-copy">
        {line && <p className="arch-greeting-salutation">{line}</p>}
        <h1>{name || "Dashboard"}</h1>
        <p className="arch-greeting-description">Here’s your performance at a glance.</p>
      </div>
    </section>
  );
}

function DashboardRankCard({ label, percent, rank, total, info, loading }: DashboardRank) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <section className="arch-rank" aria-label={label} aria-busy={loading}>
      <div className="arch-rank-result">
        <div className="arch-rank-heading">
          <h2>{label}</h2>
          <Popover>
            <PopoverTrigger asChild><button type="button" aria-label={`How ${label.toLowerCase()} is calculated`}><Info size={15} /></button></PopoverTrigger>
            <PopoverContent align="end" className="max-w-[min(18rem,90vw)] text-sm">{info}</PopoverContent>
          </Popover>
        </div>
        <div className="arch-rank-position">
          <Laurel />
          <div><strong>{rank == null || loading ? "–" : `#${rank}`}</strong>{total > 0 && <small>of {total}</small>}</div>
          <Laurel />
        </div>
      </div>
      <div className="arch-rank-progress">
        <span>Progress</span>
        <strong>{loading ? "–" : `${value}%`}</strong>
        <progress aria-label={`${label} progress`} value={loading ? undefined : value} max={100} />
      </div>
    </section>
  );
}

function Laurel() {
  return (
    <svg viewBox="0 0 24 44" aria-hidden="true">
      <path d="M21 42C5 34 3 22 11 5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M13 9c-1-5 2-8 7-9-1 4-4 7-7 9Zm-4 6C5 12 5 8 7 4c3 3 3 7 2 11Zm-2 7C3 19 1 15 2 11c4 3 6 6 5 11Zm1 7C3 28 0 24 0 20c5 2 8 5 8 9Zm4 7C7 36 3 33 2 29c5 0 9 3 10 7Zm6 5C13 43 8 41 5 38c5-2 10-1 13 3ZM10 17c0-5 4-7 8-8-1 4-4 7-8 8Zm-2 7c2-5 5-7 9-7-1 4-4 6-9 7Zm2 7c1-4 4-6 8-7 0 4-4 7-8 7Zm5 6c1-4 3-7 7-8 0 4-3 7-7 8Z" fill="currentColor" />
    </svg>
  );
}

function MetricCard({ icon, label, value, to, loading }: DashboardMetric) {
  return (
    <Link to={to} className="arch-metric" aria-busy={loading}>
      <span className="arch-metric-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
      <strong>{loading ? "–" : value}</strong>
    </Link>
  );
}

export function DashboardPageHeading({ title, description, action, as: Heading = "h2" }: { title: string; description?: string; action?: ReactNode; as?: "h1" | "h2" }) {
  return <header className="arch-page-heading">
    <HomeSkyline className="arch-page-skyline" />
    <div><Heading>{title}</Heading>{description && <p>{description}</p>}</div>{action}
  </header>;
}

type WalletStat = { label: string; value: string; icon: ReactNode };

export function DashboardWallet({ balance, stats, withdrawTo, withdrawHash, walletTo }: {
  balance: string;
  stats: WalletStat[];
  withdrawTo?: string;
  withdrawHash?: string;
  walletTo?: string;
}) {
  return <div className="arch-wallet">
    <div className="arch-wallet-balance"><Wallet aria-hidden="true" /><div><span>Available Balance</span><strong>{balance}</strong></div></div>
    <div className="arch-wallet-grid">{stats.map(stat => <div key={stat.label}><span className="arch-wallet-icon">{stat.icon}</span><span>{stat.label}<strong>{stat.value}</strong></span></div>)}</div>
    {withdrawTo && <Link to={withdrawTo} hash={withdrawHash} className="arch-wallet-action"><ArrowDownToLine aria-hidden="true" />Request Withdrawal</Link>}
    {walletTo && <Link to={walletTo} className="arch-wallet-link"><Wallet aria-hidden="true" /><span>Open Wallet</span><ArrowRight aria-hidden="true" /></Link>}
  </div>;
}

export function DashboardOverview({ title, active, activityLabel = "Team Active", stats }: {
  title: string;
  active: number;
  activityLabel?: string;
  stats: { label: string; value: string; amount: number; hint: string }[];
}) {
  const countMax = Math.max(1, ...stats.slice(0, 2).map(stat => stat.amount));
  return <section className="arch-overview">
    <DashboardPageHeading title={title} description="Performance at a glance" />
    <div className="arch-overview-chart">
      <div className="arch-overview-ring" style={{ background: `conic-gradient(#4e5440 ${active}%, #e7e8e4 0)` }} aria-label={`${active}% ${activityLabel}`}>
        <span><Users aria-hidden="true" /><strong>{active}%</strong><small>{activityLabel}</small></span>
      </div>
      <div className="arch-overview-bars" aria-hidden="true">
        {stats.map((stat, index) => <div key={stat.label}><strong>{stat.value}</strong><i style={{ height: `${index === 2 ? (stat.amount > 0 ? 70 : 3) : Math.max(3, stat.amount / countMax * 70)}%` }} /><span>{stat.label}</span></div>)}
      </div>
    </div>
    <div className="arch-overview-stats">{stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span><small>{stat.hint}</small></div>)}</div>
  </section>;
}

export function DashboardTrend({ months, loading }: { months: { label: string; revenue: number }[]; loading: boolean }) {
  const [period, setPeriod] = useState(6);
  const series = months.slice(-period);
  const high = Math.max(1, ...series.map(month => month.revenue));
  const low = Math.min(0, ...series.map(month => month.revenue));
  const points = series.map((month, index) => ({ ...month, x: 20 + (series.length === 1 ? 180 : index * 360 / Math.max(1, series.length - 1)), y: 120 - (month.revenue - low) / (high - low) * 93 }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  return <section className="arch-trend">
    <DashboardPageHeading title="Performance Trend" description="Your sales performance over time." action={
      <select aria-label="Performance period" value={period} onChange={event => setPeriod(Number(event.target.value))}><option value={6}>6 Months</option><option value={3}>3 Months</option></select>
    } />
    {loading ? <p role="status">Loading performance…</p> : points.length === 0 ? <p>No sales history yet.</p> : (
      <svg viewBox="0 0 400 156" role="img" aria-label={series.map(month => `${month.label}: ₹${month.revenue.toLocaleString("en-IN")}`).join(", ")}>
        <defs><linearGradient id="arch-trend-fill" x2="0" y2="1"><stop stopColor="#7c8271" stopOpacity=".45" /><stop offset="1" stopColor="#fff" stopOpacity=".1" /></linearGradient></defs>
        <polygon points={`${points[0].x},120 ${line} ${points.at(-1)?.x},120`} fill="url(#arch-trend-fill)" />
        <path d="M12 120H388" stroke="#dddee1" />
        <polyline points={line} fill="none" stroke="#4c523e" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map(point => <g key={point.x}>
          <path d={`M${point.x} ${point.y}V120`} stroke="#9698a1" strokeDasharray="2 3" />
          <circle cx={point.x} cy={point.y} r="4.5" fill="#4c523e" stroke="#fff" strokeWidth="1.5"><title>{point.label}: ₹{point.revenue.toLocaleString("en-IN")}</title></circle>
          <text x={point.x} y="144" textAnchor="middle" fontSize="10" fill="#51554a">{point.label}</text>
        </g>)}
      </svg>
    )}
  </section>;
}


type Recognition = {
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  abort: () => void;
};

function DashboardSearch({ destinations, placeholder }: { destinations: DashboardDestination[]; placeholder: string }) {
  const [query, setQuery] = useState("");
  const [voiceState, setVoiceState] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const recording = useRef<Recognition | null>(null);
  useEffect(() => () => recording.current?.abort(), []);
  const term = query.trim().toLowerCase();
  const matches = term ? destinations.filter(entry => `${entry.label} ${entry.keywords ?? ""}`.toLowerCase().includes(term)).slice(0, 8) : [];

  function voiceSearch() {
    if (recording.current) {
      recording.current.abort();
      return;
    }
    const speech = window as Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Recognizer = speech.SpeechRecognition ?? speech.webkitSpeechRecognition;
    if (!Recognizer) {
      setVoiceState("Voice search is unavailable in this browser. Type to search.");
      input.current?.focus();
      return;
    }
    const recognition = new Recognizer();
    recording.current = recognition;
    recognition.lang = "en-IN";
    recognition.onresult = event => setQuery(event.results[0]?.[0]?.transcript ?? "");
    recognition.onerror = () => setVoiceState("Voice search couldn’t start. Type to search.");
    recognition.onend = () => {
      recording.current = null;
      setVoiceState(state => state === "Listening…" ? "" : state);
    };
    try {
      recognition.start();
      setVoiceState("Listening…");
    } catch {
      recording.current = null;
      setVoiceState("Voice search couldn’t start. Type to search.");
      input.current?.focus();
    }
  }

  return (
    <div className="arch-search">
      <div className="arch-search-bar" role="search">
        <Search size={21} aria-hidden="true" />
        <input ref={input} type="search" aria-label="Search dashboard" placeholder={placeholder} value={query}
          onChange={event => { setQuery(event.target.value); setVoiceState(""); }}
          onKeyDown={event => { if (event.key === "Escape") setQuery(""); }} />
        <button type="button" onClick={voiceSearch} aria-label={voiceState === "Listening…" ? "Stop voice search" : "Search by voice"}>
          <Mic size={19} aria-hidden="true" />
        </button>
      </div>
      {voiceState && <p className="arch-search-message" role="status">{voiceState}</p>}
      {term && (
        <div className="arch-search-results">
          {matches.length ? <ul aria-label="Search results">{matches.map((entry, index) => (
            <li key={`${entry.to}-${index}`}><Link to={entry.to} onClick={() => setQuery("")}>{entry.label}<ChevronRight size={15} aria-hidden="true" /></Link></li>
          ))}</ul> : <p role="status">No matches for “{query.trim()}”.</p>}
        </div>
      )}
    </div>
  );
}
