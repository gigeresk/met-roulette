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
// Chrome/Edge/Safari draw the skin natively via ::-webkit-scrollbar. Firefox
// can only recolor its own (often thin, overlay) scrollbar, so there the script
// hides the native scrollbar and draws a working 17px XP scrollbar itself,
// kept in sync with whichever element is scrolling (the React Native Web
// ScrollView), with arrow buttons, track paging and a draggable thumb.
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
`;

// Firefox: styles for the script-drawn scrollbar (#xp-sb), same look as above.
const XP_FALLBACK_CSS = `
* { scrollbar-width: none; }
#xp-sb {
  position: fixed;
  z-index: 2147483647;
  width: 17px;
  display: none;
  flex-direction: column;
  background: linear-gradient(to right, #eeede5, #fdfdfa 35%, #f3f1ec);
  user-select: none;
  touch-action: none;
}
#xp-sb.on { display: flex; }
#xp-sb .xp-btn, #xp-sb .xp-thumb {
  box-sizing: border-box;
  border: 1px solid #fff;
  border-radius: 3px;
}
#xp-sb .xp-btn { flex: none; height: 17px; }
#xp-sb .xp-up { background: ${XP_CHEVRON("M3.5 9.5l4-4 4 4")}, ${XP_BUTTON_FACE}; }
#xp-sb .xp-down { background: ${XP_CHEVRON("M3.5 5.5l4 4 4-4")}, ${XP_BUTTON_FACE}; }
#xp-sb .xp-up:hover { background: ${XP_CHEVRON("M3.5 9.5l4-4 4 4")}, ${XP_BUTTON_HOVER}; }
#xp-sb .xp-down:hover { background: ${XP_CHEVRON("M3.5 5.5l4 4 4-4")}, ${XP_BUTTON_HOVER}; }
#xp-sb .xp-track { flex: 1 1 auto; position: relative; }
#xp-sb .xp-thumb {
  position: absolute;
  left: 0;
  right: 0;
  background: ${XP_GRIP_V}, linear-gradient(to right, #d2defd, #c3d4fb 50%, #b2c6f5);
}
#xp-sb .xp-thumb:hover { background: ${XP_GRIP_V}, linear-gradient(to right, #e3ecff, #d4e2ff 50%, #c4d6fc); }
`;

const XP_SCROLLBAR_SCRIPT = `(function () {
  var framed;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (!framed) return;
  var native = !!(window.CSS && CSS.supports && CSS.supports("selector(::-webkit-scrollbar)"));
  var style = document.createElement("style");
  style.id = "xp-scrollbars";
  style.textContent = native ? ${JSON.stringify(XP_SCROLLBAR_CSS)} : ${JSON.stringify(XP_FALLBACK_CSS)};
  document.head.appendChild(style);
  if (native) return;

  // Script-drawn scrollbar (Firefox). Built after load so React has hydrated.
  function build() {
    var bar = document.createElement("div");
    bar.id = "xp-sb";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = '<div class="xp-btn xp-up"></div><div class="xp-track"><div class="xp-thumb"></div></div><div class="xp-btn xp-down"></div>';
    document.body.appendChild(bar);
    var up = bar.children[0], track = bar.children[1], thumb = track.firstChild, down = bar.children[2];
    var el = null, frame = 0;

    function scrollable(n) {
      if (!n || n === bar || !n.isConnected) return false;
      var o = getComputedStyle(n).overflowY;
      return (o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight + 1;
    }
    // The tallest scrolling element is the page's ScrollView.
    function find() {
      if (scrollable(el)) return el;
      var best = null, all = document.body.getElementsByTagName("*");
      for (var i = 0; i < all.length; i++) {
        if (scrollable(all[i]) && (!best || all[i].clientHeight > best.clientHeight)) best = all[i];
      }
      return best;
    }
    function update() {
      frame = 0;
      el = find();
      if (!el) { bar.className = ""; return; }
      var r = el.getBoundingClientRect();
      bar.className = "on";
      bar.style.left = (r.right - 17) + "px";
      bar.style.top = r.top + "px";
      bar.style.height = r.height + "px";
      var room = track.clientHeight;
      var h = Math.min(room, Math.max(20, Math.round(room * el.clientHeight / el.scrollHeight)));
      var max = el.scrollHeight - el.clientHeight;
      thumb.style.height = h + "px";
      thumb.style.top = Math.round((room - h) * (max > 0 ? el.scrollTop / max : 0)) + "px";
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }

    // Arrow buttons: one step, then repeat while held.
    function hold(btn, dy) {
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        if (!el) return;
        el.scrollTop += dy;
        var t = setTimeout(function again() { if (el) el.scrollTop += dy; t = setTimeout(again, 50); }, 350);
        function stop() {
          clearTimeout(t);
          window.removeEventListener("pointerup", stop);
          window.removeEventListener("pointercancel", stop);
        }
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
      });
    }
    hold(up, -40);
    hold(down, 40);

    // Clicking the track pages up or down.
    track.addEventListener("pointerdown", function (e) {
      if (e.target !== track || !el) return;
      var below = e.clientY > thumb.getBoundingClientRect().top;
      el.scrollTop += (below ? 1 : -1) * el.clientHeight * 0.9;
    });

    // Dragging the thumb.
    thumb.addEventListener("pointerdown", function (e) {
      if (!el) return;
      e.preventDefault();
      thumb.setPointerCapture(e.pointerId);
      var y0 = e.clientY, s0 = el.scrollTop;
      var ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, track.clientHeight - thumb.offsetHeight);
      function move(ev) { el.scrollTop = s0 + (ev.clientY - y0) * ratio; }
      function end() {
        thumb.removeEventListener("pointermove", move);
        thumb.removeEventListener("pointerup", end);
        thumb.removeEventListener("pointercancel", end);
      }
      thumb.addEventListener("pointermove", move);
      thumb.addEventListener("pointerup", end);
      thumb.addEventListener("pointercancel", end);
    });

    document.addEventListener("scroll", schedule, true);
    document.addEventListener("load", schedule, true); // images changing the height
    window.addEventListener("resize", schedule);
    setInterval(schedule, 500); // new artwork, route changes
    update();
  }
  if (document.readyState === "complete") build();
  else window.addEventListener("load", build);
})();`;

// Hosts each site talks to once its JavaScript runs. Connecting to them up
// front saves a DNS + TLS round trip each before the first artwork. Data hosts
// are fetch()ed with CORS, image hosts load plain <img>s; the preconnect's
// crossorigin has to match or the browser opens a second connection.
const ORIGINS: Record<string, { data: string; images: string }> = {
  met: { data: "https://collectionapi.metmuseum.org", images: "https://images.metmuseum.org" },
  moma: { data: "https://media.githubusercontent.com", images: "https://www.moma.org" },
};
const { data: DATA_ORIGIN, images: IMAGE_ORIGIN } = ORIGINS[SITE ?? ""] ?? ORIGINS.met;

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

        <link rel="preconnect" href={DATA_ORIGIN} crossOrigin="anonymous" />
        <link rel="preconnect" href={IMAGE_ORIGIN} />
        {/* The Met's object ID list (lib/met.ts), fetched in parallel with the JS. */}
        {SITE !== "moma" && (
          <link rel="preload" href="/met-ids.json" as="fetch" crossOrigin="anonymous" />
        )}

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
