// Keep the retained listings and allow projects created after this cleanup.
export const CATALOGUE_RESET_AT = "2026-11-12T20:00:15Z";
export const CURRENT_PROJECTS_FILTER =
  `slug.in.(27th,savitri-enclave,p-shree),and(created_at.gt.${CATALOGUE_RESET_AT},slug.not.in.(mirzapur-tower,chandanpatti,the-serai-residences,aawash-skyline,verdant-heights))`;
