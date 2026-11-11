// app/_layout.tsx
import {
  Archivo_400Regular,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from "@expo-google-fonts/archivo";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
// expo-font's useFonts, not the copy @expo-google-fonts re-exports: that one
// always reports "not loaded" during the static web export, so every page was
// exported blank. This one renders the page into the HTML and adds @font-face
// rules and <link rel="preload"> tags for the fonts to its <head>.
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SITE, SITE_TITLE } from "@/lib/site";

const PLAYFAIR = { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold };
const ARCHIVO = { Archivo_400Regular, Archivo_700Bold, Archivo_800ExtraBold, Archivo_900Black };

// Only the fonts the site's museum screen uses: The Met (and AIC/CMA in local
// dev) set type in Playfair Display, MoMA in Archivo.
const FONTS =
  SITE === "met" ? PLAYFAIR : SITE === "moma" ? ARCHIVO : { ...PLAYFAIR, ...ARCHIVO };

// keep splash up while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null; // or a minimal placeholder

  return (
    <Stack screenOptions={{ headerShown: false, title: SITE_TITLE }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
