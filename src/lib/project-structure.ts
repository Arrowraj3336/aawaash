import { z } from "zod";

export const projectMediaUrl = z.string().trim().max(2000).refine(
  (value) => /^\/(?![\/\\])[^\\\r\n]*$/.test(value) ||
    /^https?:\/\//i.test(value) && URL.canParse(value),
  "Use a website path or an HTTP(S) URL",
);
export const optionalProjectMedia = z.preprocess(
  value => typeof value === "string" && !value.trim() ? null : value,
  projectMediaUrl.nullish(),
);
export const inventoryIdentifier = z.string().trim().min(1, "Enter a code").max(40);
export const floorNumber = z.preprocess(
  value => typeof value === "number" || typeof value === "string" && value.trim() ? value : undefined,
  z.coerce.number().int().min(-5).max(200),
);
export const optionalInventoryNumber = z.preprocess(
  value => typeof value === "string" && !value.trim() ? null : value,
  z.coerce.number().nonnegative().nullish(),
);

export function suggestTowerCode(name: string, existing: readonly string[]): string {
  const tokens = name.trim().toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  const label = tokens.filter(word => !["TOWER", "BUILDING", "BLOCK", "WING"].includes(word));
  const preferred = label.join("-").slice(0, 16).replace(/-$/, "") || "T";
  const used = new Set(existing.map(code => code.trim().toUpperCase()));
  if (!used.has(preferred)) return preferred;
  let suffix = 2;
  while (used.has(`${preferred}-${suffix}`)) suffix++;
  return `${preferred}-${suffix}`;
}

export function suggestFloorNumber(numbers: readonly number[]) {
  const used = new Set(numbers);
  for (let number = 1; number <= 200; number++) {
    if (!used.has(number)) return number;
  }
  return undefined;
}
