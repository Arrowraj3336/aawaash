import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BlockRenderer, type Block } from "@/components/aawash/cms/BlockRenderer";
import { LandingNav } from "@/components/aawash/landing/LandingNav";
import { cmsGetPublishedPage } from "@/lib/cms.functions";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const Route = createFileRoute("/pages/$")({
  loader: async ({ params }) => {
    if (!params._splat) throw notFound();
    const page = await cmsGetPublishedPage({ data: { slug: params._splat } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => loaderData ? {
    meta: [
      { title: loaderData.seoTitle || loaderData.title },
      ...(loaderData.seoDescription ? [{ name: "description", content: loaderData.seoDescription }] : []),
    ],
  } : {},
  component: PublishedPage,
});

function PublishedPage() {
  const slug = Route.useParams()._splat ?? "";
  const initial = Route.useLoaderData();
  const load = useServerFn(cmsGetPublishedPage);
  const { data } = useQuery({
    queryKey: ["published-page", slug],
    queryFn: () => load({ data: { slug } }),
    initialData: initial,
  });
  useRealtimeInvalidate("published-page-" + slug, ["cms_pages"], [["published-page", slug]], { pollMs: 5_000, contentScope: "pages" });
  const blocks = Array.isArray(data?.blocks) ? data.blocks.filter((block): block is Block =>
    !!block && typeof block === "object" && !Array.isArray(block) &&
    typeof block.id === "string" && typeof block.type === "string") : [];
  return (
    <>
      <LandingNav />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-32">
        {!data ? <h1 className="text-2xl font-bold">Page unavailable</h1>
          : <><h1 className="mb-6 text-3xl font-bold">{data.title}</h1><BlockRenderer blocks={blocks} /></>}
      </main>
    </>
  );
}
