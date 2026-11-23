import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck, Layers, Wallet } from "lucide-react";
import { LandingNav } from "@/components/aawash/landing/LandingNav";
import { useBrand } from "@/components/aawash/cms/BrandProvider";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { DEFAULT_HOMEPAGE, type HomeSection } from "@/lib/homepage-content";
import { getHomepageContent } from "@/lib/homepage.functions";
import "@/homepage.css";
import "@/homepage-future.css";
import "@/homepage-atelier.css";
import "@/homepage-reference-hero.css";
import "@/commission-earnings.css";

export const Route = createFileRoute("/commission-earnings")({
  component: CommissionEarnings,
  head: () => ({
    meta: [
      { title: "Commission Earnings | Aawaash" },
      { name: "description", content: "Explore the Aawaash commission slabs and learn how approved property sales become commission earnings." },
    ],
  }),
});

const steps = [
  { Icon: Layers, title: "Match the deal value", text: "The sale amount determines which commission slab applies. The ranges above show how the tiers are grouped." },
  { Icon: ClipboardCheck, title: "Review and approve", text: "A recorded sale goes through approval. On approval, the system selects the applicable slab and calculates the commission." },
  { Icon: Wallet, title: "Review your earnings", text: "Sign in to your dashboard to review your earnings and wallet activity." },
];

function CommissionEarnings() {
  const brand = useBrand();
  const loadContent = useServerFn(getHomepageContent);
  const { data = DEFAULT_HOMEPAGE } = useQuery({
    queryKey: ["homepage-content"],
    queryFn: () => loadContent(),
    placeholderData: DEFAULT_HOMEPAGE,
    refetchOnMount: "always",
  });
  useRealtimeInvalidate(
    "commission-page-content",
    [{ table: "cms_global_content", filter: "key=eq.homepage" }],
    [["homepage-content"]],
    { pollMs: 5_000, contentScope: "homepage" },
  );

  return (
    <div id="aawaash-home" style={brand.style} className="aawaash-home future-home commission-earnings-page">
      <LandingNav copy={data.header?.copy} />
      <main className="relative overflow-x-hidden">
        <h1>Commission Earnings</h1>
        {data.commission?.enabled !== false && <CommissionSlabs sec={data.commission ?? DEFAULT_HOMEPAGE.commission} />}
        <div className="commission-earnings-guide">
          <section aria-labelledby="commission-process-title">
            <h2 id="commission-process-title">How commission works</h2>
            <ol>
              {steps.map(({ Icon, title, text }) => (
                <li key={title}>
                  <Icon size={22} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="commission-roles-title">
            <h2 id="commission-roles-title">Your role in a sale</h2>
            <dl>
              <div><dt>Team Members</dt><dd>Work with buyers and help close sales. Use your dashboard to follow your own sales and commission records.</dd></div>
              <div><dt>Team Leaders</dt><dd>Support members through the sales process and use the leader dashboard to follow team performance and your earnings.</dd></div>
            </dl>
          </section>
        </div>
      </main>
    </div>
  );
}

function CommissionSlabs({ sec }: { sec: HomeSection }) {
  return (
    <section id="commission" className="editorial-commission luxury-commission">
      <div className="commission-intro">
        <div className="commission-copy">
          <div className="editorial-eyebrow"><span />{sec.eyebrow}<span /></div>
          <h2>{sec.title}<br /><em>{sec.accent}</em></h2>
          <p>{sec.subtitle}</p>
        </div>
      </div>
      <div className="commission-tower-scene">
        <img className="commission-tower-art" src={sec.image || DEFAULT_HOMEPAGE.commission?.image} alt="" aria-hidden="true" loading="lazy" />
        <ol className="commission-tower-values" aria-label="Commission tiers by deal value">
          {(sec.items ?? []).map((slab, i) => (
            <li key={`${slab.title}-${i}`} className={`commission-plaque plaque-${i + 1}`}>
              <span>{sec.copy?.tierLabel} {i + 1}</span><strong>{slab.title}</strong><i aria-hidden="true" />{slab.body && <b>{slab.body}</b>}<small>{sec.copy?.valueLabel}</small>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
