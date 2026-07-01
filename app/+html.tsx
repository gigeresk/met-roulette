// app/+html.tsx
// Root HTML document for the static web export. Sets the browser tab title and
// social/link-preview metadata. Applied to every statically rendered route.
import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

const TITLE = "Met Roulette";
const DESCRIPTION =
  "Random public-domain artwork from The Met, MoMA, the Art Institute of Chicago, and the Cleveland Museum of Art.";

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

        {/* Link previews (Open Graph + Twitter) */}
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />

        {/* Disable body scrolling on web so ScrollView works as expected. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
