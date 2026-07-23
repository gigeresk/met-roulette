// app/+html.tsx
// Root HTML document for the static web export. Sets the browser tab title and
// social/link-preview metadata. Applied to every statically rendered route.
import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

// Same app ships as single-museum sites (metroulette.com / momaroulette.com)
// via EXPO_PUBLIC_SITE at build time. Unset (local dev) shows every museum.
const SITE = process.env.EXPO_PUBLIC_SITE;

const COPY: Record<string, { title: string; description: string; url: string; image: string }> = {
  met: {
    title: "Met Roulette",
    description:
      "Random public-domain artwork from The Metropolitan Museum of Art.",
    url: "https://metroulette.com",
    image: "https://metroulette.com/icon-met.png",
  },
  moma: {
    title: "MoMA Roulette",
    description:
      "Random public-domain artwork from The Museum of Modern Art.",
    url: "https://momaroulette.com",
    image: "https://momaroulette.com/icon-moma.png",
  },
};

const {
  title: TITLE,
  description: DESCRIPTION,
  url: URL,
  image: IMAGE,
} = COPY[SITE ?? ""] ?? {
  title: "Met Roulette",
  description:
    "Random public-domain artwork from The Met, MoMA, the Art Institute of Chicago, and the Cleveland Museum of Art.",
  url: "https://metroulette.com",
  image: "https://metroulette.com/icon-met.png",
};

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />

        {/* Higher-res icon for link previews and "add to home screen" — the
            favicon.ico Expo generates from web.favicon tops out at 48x48,
            which looks blurry as a share-preview image. */}
        <link rel="apple-touch-icon" href={IMAGE} />

        {/* Link previews (Open Graph + Twitter) */}
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={URL} />
        <meta property="og:image" content={IMAGE} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={IMAGE} />

        {/* Disable body scrolling on web so ScrollView works as expected. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
