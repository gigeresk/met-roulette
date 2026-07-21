// Same app ships as single-museum sites (metroulette.com / momaroulette.com)
// via EXPO_PUBLIC_SITE at build time. Unset (local dev) shows every museum.
export type Site = "met" | "moma";

export const SITE = process.env.EXPO_PUBLIC_SITE as Site | undefined;
