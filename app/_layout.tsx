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
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// keep splash up while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Archivo_400Regular,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null; // or a minimal placeholder

  return (
    <Stack screenOptions={{ headerShown: false, title: "Met Roulette" }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
