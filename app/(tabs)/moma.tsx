// app/(tabs)/moma.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRandomMomaArtwork, type MomaArtwork } from "../../lib/moma";

export default function MoMARoulette() {
  const [loading, setLoading] = useState(true);
  const [art, setArt] = useState<MomaArtwork | null>(null);
  const [error, setError] = useState<string>("");

  // pull-to-refresh + random
  const [refreshing, setRefreshing] = useState(false);
  const [randomKey, setRandomKey] = useState(0);
  const shuffle = () => setRandomKey((k) => k + 1);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRandomKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  // Fetch a random MoMA artwork (has an image)
  useEffect(() => {
    let cancelled = false;

    async function pickRandomMoMA() {
      setLoading(true);
      setError("");
      setArt(null);

      try {
        const picked = await getRandomMomaArtwork();
        if (cancelled) return;

        if (picked) {
          setArt(picked);
        } else {
          setError("Couldn’t find a MoMA image right now. Pull to refresh.");
        }
      } catch {
        if (!cancelled) {
          setError("Couldn’t find a MoMA image right now. Pull to refresh.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    pickRandomMoMA();
    return () => {
      cancelled = true;
    };
  }, [randomKey]);

  // Long-press to save current image
  async function saveCurrentImage() {
    if (!art?.img) return;
    try {
      const url = art.img.replace(/^http:/, "https:");
      const fileUri = `${FileSystem.cacheDirectory}moma-${art.id}.jpg`;
      const dl = await FileSystem.downloadAsync(url, fileUri);

      if (Platform.OS === "web") {
        const a = document.createElement("a");
        a.href = dl.uri;
        a.download = `moma-${art.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow photo access to save images.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(dl.uri);
      Alert.alert("Saved", "Image saved to your Photos.");
    } catch {
      Alert.alert("Save failed", "Couldn’t save this image. Try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.brandBar}>
          <Text style={styles.brandMark}>MoMA</Text>
          <Text style={styles.brandText}>Roulette</Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={shuffle}
            style={styles.btn}
            accessibilityLabel="Shuffle artwork"
          >
            <MaterialCommunityIcons
              name="shuffle"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnText}>Random</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        )}

        {!!error && !loading && (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        {art && !loading && (
          <View style={styles.card}>
            <Pressable onLongPress={saveCurrentImage} delayLongPress={300}>
              <Image
                source={{ uri: art.img }}
                style={styles.image}
                resizeMode="contain"
                accessible
                accessibilityLabel={`${art.title} by ${art.artist}`}
              />
            </Pressable>
            <View style={styles.meta}>
              <Text style={styles.title}>{art.title}</Text>
              <Text style={styles.byline}>
                {art.artist}
                {art.date ? ` — ${art.date}` : ""}
              </Text>
              {art.medium ? <Text style={styles.muted}>{art.medium}</Text> : null}
              {!!art.url && (
                <Text style={styles.link} onPress={() => Linking.openURL(art.url)}>
                  View on MoMA
                </Text>
              )}
              {!!art.id && <Text style={styles.caption}>Object ID: {art.id}</Text>}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Images and data courtesy of The Museum of Modern Art (MoMA).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#101014" },
  container: { padding: 16, gap: 16, minHeight: "100%", backgroundColor: "#101014" },
  brandBar: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  brandMark: {
    color: "#000",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },
  brandText: { color: "#181a20", fontSize: 30, fontFamily: "PlayfairDisplay_400Regular" },

  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  center: { alignItems: "center", padding: 24 },
  muted: { color: "#9aa0a6", marginTop: 8, textAlign: "center" },
  error: { color: "#ff6b6b", textAlign: "center" },
  card: { backgroundColor: "#181a20", borderRadius: 16, padding: 12 },
  image: { width: "100%", height: 360, borderRadius: 12, backgroundColor: "#0f1115" },
  meta: { marginTop: 12, gap: 4 },
  title: { fontSize: 18, color: "white", fontFamily: "PlayfairDisplay_700Bold", textAlign: "center" },
  byline: {
    color: "white",
    textAlign: "center",
    fontFamily: "PlayfairDisplay_400Regular",
  },
  link: { color: "#8ab4f8", marginTop: 6 },
  caption: { color: "#9aa0a6", marginTop: 4, fontSize: 12 },
  footer: { color: "#9aa0a6", textAlign: "center", marginVertical: 24 },
  btn: {
    backgroundColor: "#2a2f3a",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignSelf: "center",
  },
  btnText: {
    color: "white",
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_400Regular",
  },
});
