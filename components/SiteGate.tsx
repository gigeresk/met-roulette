// Blocks a museum screen on the "wrong" single-museum production build.
//
// expo-router resolves routes by file path regardless of what's declared in
// the Tabs navigator, so hiding a tab from app/(tabs)/_layout.tsx does NOT
// stop someone from loading e.g. /met directly on the MoMA build. This gate
// redirects that case to the site's actual screen instead of rendering it.
import { Redirect } from "expo-router";
import { type PropsWithChildren } from "react";
import { type Site, SITE } from "@/lib/site";

export function SiteGate({
  site,
  children,
}: PropsWithChildren<{ site?: Site }>) {
  if (SITE && SITE !== site) {
    return <Redirect href={SITE === "moma" ? "/(tabs)/moma" : "/(tabs)/met"} />;
  }
  return <>{children}</>;
}
