import { Redirect } from "expo-router";
import { SITE } from "@/lib/site";
import Met from "./(tabs)/met";
import MoMA from "./(tabs)/moma";

// On the single-museum sites, "/" shows the museum screen itself, so its
// static HTML has the page in it (gigeresk.com frames "/"). Redirecting to
// /met would leave "/" blank until the JavaScript loads and navigates.
// Local dev (no SITE) goes to the tabbed app with every museum.
export default function Index() {
  if (SITE === "met") return <Met />;
  if (SITE === "moma") return <MoMA />;
  return <Redirect href="/(tabs)/met" />;
}
