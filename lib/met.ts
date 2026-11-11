// Met random-artwork picker.
//
// The object ID list comes from our own public/met-ids.json (a delta-encoded
// snapshot made by scripts/build-met-ids.mjs, ~50 KB over the wire), not the
// Met's /objects endpoint (1.2 MB, ~3 s). If our copy can't be fetched we fall
// back to the Met's.
//
// About half of all objects are public domain with an image, so candidates are
// checked a few at a time in parallel instead of one after another.
import { Platform } from "react-native";
import { SITE } from "./site";

const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

// Same origin on web (also works in local dev, which serves public/), the
// production copy on native.
const IDS_URL =
  Platform.OS === "web" ? "/met-ids.json" : "https://metroulette.com/met-ids.json";

export type MetArtwork = {
  id: number;
  title: string;
  artist: string;
  date: string;
  img: string;
  url: string;
  department?: string;
  creditLine?: string;
};

async function fetchIds(): Promise<number[]> {
  try {
    const res = await fetch(IDS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const deltas = (await res.json()) as number[];
    let id = 0;
    return deltas.map((d) => (id += d));
  } catch {
    const res = await fetch(`${BASE}/objects`);
    const data = (await res.json()) as { objectIDs?: number[] };
    return data?.objectIDs ?? [];
  }
}

let idsPromise: Promise<number[]> | null = null;

// Fetched once per page load and shared. Started at import time so it runs
// alongside the rest of the app's startup (the HTML also preloads it).
export function loadMetIds(): Promise<number[]> {
  if (!idsPromise) {
    idsPromise = fetchIds().then((ids) => {
      if (!ids.length) throw new Error("No object IDs");
      return ids;
    });
    idsPromise.catch(() => {
      idsPromise = null; // let a later shuffle retry
    });
  }
  return idsPromise;
}
if (typeof window !== "undefined" && SITE !== "moma") loadMetIds().catch(() => {});

async function fetchArtwork(objectID: number): Promise<MetArtwork | null> {
  try {
    const r = await fetch(`${BASE}/objects/${objectID}`);
    if (!r.ok) return null;
    const o = await r.json();
    if (!o?.isPublicDomain || !(o.primaryImageSmall || o.primaryImage)) return null;
    return {
      id: objectID,
      title: o.title || "Untitled",
      artist: o.artistDisplayName || "Unknown",
      date: o.objectDate || "",
      img: o.primaryImageSmall || o.primaryImage,
      url: o.objectURL || "",
      department: o.department,
      creditLine: o.creditLine,
    };
  } catch {
    return null;
  }
}

const PARALLEL = 4; // ~94% chance one of these is usable
const MAX_ROUNDS = 12;

// Resolves with the first usable artwork among `ids`, or null if none are.
function firstUsable(ids: number[]): Promise<MetArtwork | null> {
  return new Promise((resolve) => {
    let pending = ids.length;
    for (const id of ids) {
      fetchArtwork(id).then((art) => {
        pending--;
        if (art) resolve(art);
        else if (!pending) resolve(null);
      });
    }
  });
}

export async function getRandomMetArtwork(
  isCancelled: () => boolean = () => false,
): Promise<MetArtwork | null> {
  const ids = await loadMetIds();
  for (let round = 0; round < MAX_ROUNDS && !isCancelled(); round++) {
    const batch = Array.from(
      { length: PARALLEL },
      () => ids[Math.floor(Math.random() * ids.length)],
    );
    const art = await firstUsable(batch);
    if (art) return art;
  }
  return null;
}
