// Snapshot the Met's object ID list into public/met-ids.json.
//
// The Met's /objects endpoint returns all ~500k IDs as a 3.4 MB JSON blob
// (1.2 MB gzipped, ~3 s to download). Sorted and delta-encoded, the same list
// is ~1 MB of mostly "1,1,1,…", which compresses to ~50 KB, and it is served
// from our own domain with the page. lib/met.ts decodes it.
//
// The collection changes slowly and a stale snapshot is harmless: removed IDs
// 404 and get skipped, new ones just aren't picked until the next refresh.
//
//   node scripts/build-met-ids.mjs
import { writeFile } from "node:fs/promises";

const res = await fetch("https://collectionapi.metmuseum.org/public/collection/v1/objects");
if (!res.ok) throw new Error(`Met /objects: HTTP ${res.status}`);
const { objectIDs } = await res.json();
if (!Array.isArray(objectIDs) || objectIDs.length < 100000) {
  throw new Error(`Met /objects: unexpected response (${objectIDs?.length} IDs)`);
}

const ids = [...new Set(objectIDs)].sort((a, b) => a - b);
const deltas = ids.map((id, i) => id - (i ? ids[i - 1] : 0));

const out = new URL("../public/met-ids.json", import.meta.url);
await writeFile(out, JSON.stringify(deltas));
console.log(`Wrote ${ids.length} IDs to ${out.pathname}`);
