import { Redirect } from "expo-router";

const SITE = process.env.EXPO_PUBLIC_SITE;

export default function Index() {
  if (SITE === "moma") return <Redirect href="/(tabs)/moma" />;
  return <Redirect href="/(tabs)/met" />;
}
