import { createContext, useContext, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cmsGetBrand, cmsGetGlobal } from "@/lib/cms.functions";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

const BrandContext = createContext<{ style?: CSSProperties; logo?: string }>({});

export function BrandProvider({ children }: { children: ReactNode }) {
  const brandFn = useServerFn(cmsGetBrand);
  const { data } = useQuery({ queryKey: ["cms-brand"], queryFn: () => brandFn() });
  useRealtimeInvalidate("public-brand", ["cms_brand_settings"], [["cms-brand"]], { contentScope: "brand" });

  const brand = useMemo(() => {
    if (!data?.updated_by) return {};
    const colors = Object.fromEntries(Object.entries(data.colors ?? {}).filter(
      ([key, value]) => /^[a-z-]+$/.test(key) && typeof value === "string" && value.length > 0,
    ).map(([key, value]) => [`--${key}`, value]));
    const fonts = (data.fonts ?? {}) as { display?: string; body?: string };
    return {
      logo: data.logo_url ?? undefined,
      style: {
        ...colors,
        ...(fonts.display ? { "--font-display": fonts.display } : {}),
        ...(fonts.body ? { "--font-sans": fonts.body } : {}),
      } as CSSProperties,
    };
  }, [data]);

  useEffect(() => {
    const style = document.documentElement.style;
    const tokens = Object.entries(brand.style ?? {});
    for (const [key, value] of tokens) style.setProperty(key, String(value));
    return () => { for (const [key] of tokens) style.removeProperty(key); };
  }, [brand]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() { return useContext(BrandContext); }

export function useGlobalContent() {
  const fn = useServerFn(cmsGetGlobal);
  return useQuery({ queryKey: ["cms-global"], queryFn: () => fn(), staleTime: 5 * 60_000 });
}
