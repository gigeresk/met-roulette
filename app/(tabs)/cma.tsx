// app/(tabs)/cma.tsx
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
import { SiteGate } from "@/components/SiteGate";

const BASE = "https://openaccess-api.clevelandart.org/api";

// Build a random artworks query (CC0 + has image), using skip/limit pagination.
// We grab a small batch and pick a random candidate from it.
function cmaRandomUrl(limit = 12) {
  // CMA API supports skip/limit; pick a random skip in a safe range.
  // Using 0..5000 as a conservative window (API reports larger totals,
  // but this keeps requests fast and within comfortable bounds).
  const MAX_SKIP = 5000;
  const skip = Math.floor(Math.random() * MAX_SKIP);

  // Request only CC0 + has image. Ask for useful fields.
  const params = new URLSearchParams({
    cc0: "1",
    has_image: "1",
    limit: String(limit),
    skip: String(skip),
    // Select common fields; API ignores unknown fields gracefully.
    // (title, creators, creation_date, department, creditline, url, images)
    fields: [
      "id",
      "title",
      "creators",
      "creation_date",
      "department",
      "creditline",
      "url",
      "images",
      "share_license_status",
    ].join(","),
  });

  return `${BASE}/artworks?${params.toString()}`;
}

export default function CMARoulette() {
  return (
    <SiteGate>
      <CMAScreen />
    </SiteGate>
  );
}

function CMAScreen() {
  const [loading, setLoading] = useState(true);
  const [art, setArt] = useState<null | {
    id: number;
    title: string;
    artist: string;
    date: string;
    img: string;
    url: string;
    department?: string;
    creditLine?: string;
  }>(null);
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

  // Fetch a random CMA artwork (CC0 + has image)
  useEffect(() => {
    let cancelled = false;

    async function pickRandomCMA() {
      setLoading(true);
      setError("");
      setArt(null);

      const ATTEMPTS = 12;     // number of random windows to try
      const BATCH_SIZE = 12;   // items per window

      try {
        for (let i = 0; i < ATTEMPTS && !cancelled; i++) {
          const res = await fetch(cmaRandomUrl(BATCH_SIZE));
          const json = await res.json();

          const items: any[] = Array.isArray(json?.data) ? json.data : [];

          // Keep only items that really look usable (cc0 + has a web image)
          const candidates = items.filter((it) => {
            const webUrl =
              it?.images?.web?.url ||
              it?.images?.web?.large ||
              it?.images?.web?.filename ||
              it?.images?.print?.url;
            const licenseOk =
              it?.share_license_status?.toLowerCase?.() === "cc0" || true; // cc0=1 already filters
            return !!webUrl && licenseOk;
          });

          if (candidates.length) {
            const pick =
              candidates[Math.floor(Math.random() * candidates.length)];

            const imgUrl =
              pick?.images?.web?.url ||
              pick?.images?.web?.large ||
              pick?.images?.print?.url;

            if (!imgUrl) continue;

            const title = pick?.title || "Untitled";
            // CMA creators is usually an array with name and role
            const artist =
              Array.isArray(pick?.creators) && pick.creators.length
                ? pick.creators.map((c: any) => c?.description || c?.role || c?.name).filter(Boolean).join(", ")
                : "Unknown";

            if (!cancelled) {
              setArt({
                id: pick.id,
                title,
                artist,
                date: pick?.creation_date || "",
                img: imgUrl,
                url: pick?.url || `https://www.clevelandart.org/art/${pick?.id}`,
                department: pick?.department,
                creditLine: pick?.creditline,
              });
              setLoading(false);
            }
            return;
          }
        }

        if (!cancelled) {
          setError("Couldn’t find a CMA image right now. Pull to refresh.");
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Couldn’t find a CMA image right now. Pull to refresh.");
          setLoading(false);
        }
      }
    }

    pickRandomCMA();
    return () => {
      cancelled = true;
    };
  }, [randomKey]);

  // Long-press to save current image
  async function saveCurrentImage() {
    if (!art?.img) return;
    try {
      const url = art.img.replace(/^http:/, "https:");
      const fileUri = `${FileSystem.cacheDirectory}cma-${art.id}.jpg`;
      const dl = await FileSystem.downloadAsync(url, fileUri);

      if (Platform.OS === "web") {
        const a = document.createElement("a");
        a.href = dl.uri;
        a.download = `cma-${art.id}.jpg`;
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.brandBar}>
            <Image
            source={require("../../assets/images/cma-logo.png")}
            style={styles.brandLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel="CMA"
            />
            <Pressable onPress={shuffle} style={styles.rouletteBtn} accessibilityLabel="Shuffle artwork">
              <Text style={styles.brandText}>Roulette</Text>
              <MaterialCommunityIcons name="shuffle" size={22} color="#181a20" style={{ marginLeft: 8, marginTop: 10 }} />
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
                {art.artist}{art.date ? ` — ${art.date}` : ""}
              </Text>
              {art.department ? <Text style={styles.muted}>{art.department}</Text> : null}
              {art.creditLine ? <Text style={styles.muted}>{art.creditLine}</Text> : null}
              {!!art.url && (
                <Text style={styles.link} onPress={() => Linking.openURL(art.url)}>
                  View on CMA (CC0)
                </Text>
              )}
              <Text style={styles.caption}>Artwork ID: {art.id}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Images courtesy of the Cleveland Museum of Art (Public Domain/CC0).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#101014" },
  container: { padding: 16, gap: 16, minHeight: "100%", backgroundColor: "#101014" },
  brandBar: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,  
  },
  brandLogo: {
    height: 34,                   // tweak to taste
    width: 40,                   // keep proportion of your PNG
  },
  brandText: { color: "#181a20", fontSize: 30, fontFamily: "PlayfairDisplay_400Regular" },
  rouletteBtn: { flexDirection: "row", alignItems: "center" },
  center: { alignItems: "center", padding: 24 },
  muted: { color: "#9aa0a6", marginTop: 8, textAlign: "center" },
  error: { color: "#ff6b6b", textAlign: "center" },
  card: { backgroundColor: "#181a20", borderRadius: 16, padding: 12 },
  image: { width: "100%", height: 360, borderRadius: 12, backgroundColor: "#0f1115" },
  meta: { marginTop: 12, gap: 4 },
  title: { fontSize: 18, color: "white", fontFamily: "PlayfairDisplay_700Bold", textAlign: "center" },
  byline: { color: "white", textAlign: "center", fontFamily: "PlayfairDisplay_400Regular", },
  link: { color: "#8ab4f8", marginTop: 6 },
  caption: { color: "#9aa0a6", marginTop: 4, fontSize: 12 },
  footer: { color: "#9aa0a6", textAlign: "center", marginVertical: 24 },
});