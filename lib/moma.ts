// MoMA random-artwork picker.
//
// Parsing logic copied/adapted from https://github.com/gigeresk/moma-parser
// (random_collection.ts). That standalone Node script reads `collection/Artworks.csv`
// from disk with `fs` and scans it line-by-line. React Native has no `fs`, and the CSV
// is a ~73 MB Git-LFS file, so instead of shipping the file we stream a random slice of
// it over an HTTP Range request from the same MoMA dataset that the `collection`
// submodule points at (github.com/MuseumofModernArt/collection).
//
// The retry-until-we-find-a-row-with-an-ImageURL behaviour mirrors the original
// `get_random_image_url()`.

const CSV_URL =
  "https://media.githubusercontent.com/media/MuseumofModernArt/collection/main/Artworks.csv";

export type MomaArtwork = {
  id: string;
  title: string;
  artist: string;
  date: string;
  img: string;
  url: string;
  medium?: string;
};

// --- copied verbatim from moma-parser/random_collection.ts ---
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((c) => c.trim());
}

function findColumnIndex(headerRow: string, column_name: string): number {
  // Split by commas (simple version; won't handle quoted commas)
  const columns = headerRow.split(",");
  // Find the index of the column, trimming whitespace
  return columns.findIndex((col) => col.trim() === column_name);
}
// --- end copied section ---

type Meta = {
  size: number;
  headerEnd: number;
  cols: {
    title: number;
    artist: number;
    date: number;
    url: number;
    image: number;
    objectId: number;
    medium: number;
  };
};

let metaCache: Meta | null = null;

// Fetch just the header row (and total file size) once, then remember the column
// layout so subsequent random picks only need a single small Range request each.
async function loadMeta(): Promise<Meta> {
  if (metaCache) return metaCache;

  const res = await fetch(CSV_URL, { headers: { Range: "bytes=0-4095" } });
  const text = await res.text();

  // "Content-Range: bytes 0-4095/72969795" → total size after the slash.
  const contentRange = res.headers.get("content-range");
  const size = contentRange
    ? parseInt(contentRange.split("/")[1], 10)
    : parseInt(res.headers.get("content-length") || "0", 10);

  const firstNl = text.indexOf("\n");
  const header = text
    .slice(0, firstNl)
    .replace(/^﻿/, "") // strip UTF-8 BOM
    .replace(/\r$/, "");

  metaCache = {
    size,
    headerEnd: firstNl + 1,
    cols: {
      title: findColumnIndex(header, "Title"),
      artist: findColumnIndex(header, "Artist"),
      date: findColumnIndex(header, "Date"),
      url: findColumnIndex(header, "URL"),
      image: findColumnIndex(header, "ImageURL"),
      objectId: findColumnIndex(header, "ObjectID"),
      medium: findColumnIndex(header, "Medium"),
    },
  };
  return metaCache;
}

// Grab a random 32 KB window of the CSV, take a clean row out of the middle, and keep
// retrying (like the original parser) until we land on a work that actually has an image.
export async function getRandomMomaArtwork(): Promise<MomaArtwork | null> {
  const meta = await loadMeta();
  if (!meta.size || meta.cols.image < 0) return null;

  const CHUNK = 32 * 1024; // comfortably larger than a single CSV record
  const maxRetries = 12;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const start =
      meta.headerEnd +
      Math.floor(Math.random() * (meta.size - meta.headerEnd - CHUNK));
    const end = start + CHUNK - 1;

    const res = await fetch(CSV_URL, {
      headers: { Range: `bytes=${start}-${end}` },
    });
    const text = await res.text();

    // The window starts mid-row, so drop that partial first line and use the next
    // complete line as our candidate record.
    const firstNl = text.indexOf("\n");
    if (firstNl < 0) continue;
    const rest = text.slice(firstNl + 1);
    const secondNl = rest.indexOf("\n");
    if (secondNl < 0) continue;

    const line = rest.slice(0, secondNl).replace(/\r$/, "");
    const cols = parseCSVRow(line);

    const img = cols[meta.cols.image] || "";
    if (!img) continue; // no image on this row — retry, same as the original loop

    return {
      id: cols[meta.cols.objectId] || "",
      title: cols[meta.cols.title] || "Untitled",
      artist: cols[meta.cols.artist] || "Unknown",
      date: cols[meta.cols.date] || "",
      img,
      url: cols[meta.cols.url] || "",
      medium: cols[meta.cols.medium] || "",
    };
  }

  return null;
}
