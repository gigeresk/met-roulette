// app/+html.tsx
// Root HTML document for the static web export. Sets the browser tab title and
// social/link-preview metadata. Applied to every statically rendered route.
import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
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

// Windows XP (Luna blue) scrollbars, switched on only when the page is shown
// inside an iframe — gigeresk.com frames these sites in a Netscape 8 / XP
// browser window. Visiting the sites directly keeps the normal scrollbars.
//
// A cross-origin parent page can't style an iframe's scrollbars, so the skin
// has to live here. The script injects a <style> instead of setting a class on
// <html>, so nothing React renders is changed before hydration.
//
// Chrome/Edge/Safari draw the full skin via ::-webkit-scrollbar. Firefox only
// supports scrollbar colors, so it gets XP colors on its own scrollbar shape.
// (Chrome ignores ::-webkit-scrollbar once scrollbar-color is set, hence the
// @supports guard.)
const XP_CHEVRON = (d: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15'%3E%3Cpath d='${d}' fill='none' stroke='%234d6185' stroke-width='2'/%3E%3C/svg%3E") center / 15px 15px no-repeat`;
const XP_BUTTON_FACE = "linear-gradient(135deg, #e1eafe 0%, #c7d7fc 45%, #b4c8f6 100%)";
const XP_BUTTON_HOVER = "linear-gradient(135deg, #f0f5ff 0%, #d9e5ff 45%, #c6d7fd 100%)";
const XP_GRIP_V = "repeating-linear-gradient(#eef4fe 0 1px, #8cb0f8 1px 2px) center / 8px 8px no-repeat";
const XP_GRIP_H = "repeating-linear-gradient(to right, #eef4fe 0 1px, #8cb0f8 1px 2px) center / 8px 8px no-repeat";

const XP_SCROLLBAR_CSS = `
::-webkit-scrollbar { width: 17px; height: 17px; }
::-webkit-scrollbar-track:vertical { background: linear-gradient(to right, #eeede5, #fdfdfa 35%, #f3f1ec); }
::-webkit-scrollbar-track:horizontal { background: linear-gradient(#eeede5, #fdfdfa 35%, #f3f1ec); }
::-webkit-scrollbar-corner { background: #f3f1ec; }
::-webkit-scrollbar-thumb {
  border: 1px solid #fff;
  border-radius: 3px;
  min-height: 20px;
  outline: 1px solid #b8cbf3;
  outline-offset: -1px;
}
::-webkit-scrollbar-thumb:vertical { background: ${XP_GRIP_V}, linear-gradient(to right, #d2defd, #c3d4fb 50%, #b2c6f5); }
::-webkit-scrollbar-thumb:horizontal { background: ${XP_GRIP_H}, linear-gradient(#d2defd, #c3d4fb 50%, #b2c6f5); }
::-webkit-scrollbar-thumb:vertical:hover { background: ${XP_GRIP_V}, linear-gradient(to right, #e3ecff, #d4e2ff 50%, #c4d6fc); }
::-webkit-scrollbar-thumb:horizontal:hover { background: ${XP_GRIP_H}, linear-gradient(#e3ecff, #d4e2ff 50%, #c4d6fc); }
::-webkit-scrollbar-button:single-button {
  display: block;
  width: 17px;
  height: 17px;
  border: 1px solid #fff;
  border-radius: 3px;
}
::-webkit-scrollbar-button:single-button:vertical:decrement { background: ${XP_CHEVRON("M3.5 9.5l4-4 4 4")}, ${XP_BUTTON_FACE}; }
::-webkit-scrollbar-button:single-button:vertical:increment { background: ${XP_CHEVRON("M3.5 5.5l4 4 4-4")}, ${XP_BUTTON_FACE}; }
::-webkit-scrollbar-button:single-button:horizontal:decrement { background: ${XP_CHEVRON("M9.5 3.5l-4 4 4 4")}, ${XP_BUTTON_FACE}; }
::-webkit-scrollbar-button:single-button:horizontal:increment { background: ${XP_CHEVRON("M5.5 3.5l4 4-4 4")}, ${XP_BUTTON_FACE}; }
::-webkit-scrollbar-button:single-button:vertical:decrement:hover { background: ${XP_CHEVRON("M3.5 9.5l4-4 4 4")}, ${XP_BUTTON_HOVER}; }
::-webkit-scrollbar-button:single-button:vertical:increment:hover { background: ${XP_CHEVRON("M3.5 5.5l4 4 4-4")}, ${XP_BUTTON_HOVER}; }
::-webkit-scrollbar-button:single-button:horizontal:decrement:hover { background: ${XP_CHEVRON("M9.5 3.5l-4 4 4 4")}, ${XP_BUTTON_HOVER}; }
::-webkit-scrollbar-button:single-button:horizontal:increment:hover { background: ${XP_CHEVRON("M5.5 3.5l4 4-4 4")}, ${XP_BUTTON_HOVER}; }
@supports not selector(::-webkit-scrollbar) {
  * { scrollbar-color: #b4c8f6 #f3f1ec; }
}
`;

const XP_SCROLLBAR_SCRIPT = `(function () {
  var framed;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (!framed) return;
  var style = document.createElement("style");
  style.id = "xp-scrollbars";
  style.textContent = ${JSON.stringify(XP_SCROLLBAR_CSS)};
  document.head.appendChild(style);
})();`;

export default function Root({ children }: PropsWithChildren) {
  // Expo SDK 58 passes the page's scripts, styles and favicon through this hook.
  // Without headNodes and bodyNodes the page ships with no JavaScript and renders blank.
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } =
    useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
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

        {/* XP scrollbars when framed (see XP_SCROLLBAR_CSS above). */}
        <script dangerouslySetInnerHTML={{ __html: XP_SCROLLBAR_SCRIPT }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
