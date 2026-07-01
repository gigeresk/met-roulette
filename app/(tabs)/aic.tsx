// app/(tabs)/aic.tsx
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

const BASE = "https://api.artic.edu/api/v1";

// Build a random search that only returns public-domain artworks with images.
// We pick a random "from" offset (kept under 9000 to stay well within the 10k window).
function aicRandomSearchUrl(size = 20) {
  const MAX_FROM = 9000; // stay below 10k search window
  const from = Math.floor(Math.random() * MAX_FROM);
  const params = {
    query: {
      bool: {
        must: [
          { term: { is_public_domain: true } },
          { exists: { field: "image_id" } }
        ]
      }
    },
    fields: [
      "id",
      "title",
      "artist_display",
      "date_display",
      "image_id",
      "department_title",
      "credit_line"
    ],
    size,
    from
  };
  return `${BASE}/artworks/search?params=${encodeURIComponent(JSON.stringify(params))}`;
}


export default function AICRoulette() {
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

  // Fetch a random AIC artwork (PD + has image)
    useEffect(() => {
        let cancelled = false;

        async function pickRandomAIC() {
            setLoading(true);
            setError("");
            setArt(null);

            const ATTEMPTS = 12;     // try up to 12 different random windows
            const BATCH_SIZE = 10;   // grab 10 at a time to improve odds

            try {
            for (let attempt = 0; attempt < ATTEMPTS && !cancelled; attempt++) {
                const res = await fetch(aicRandomSearchUrl(BATCH_SIZE));
                const json = await res.json();

                const items: any[] = Array.isArray(json?.data) ? json.data : [];
                // filter to only entries that actually have an image_id
                const candidates = items.filter(it => !!it?.image_id);

                if (candidates.length) {
                // pick one at random from this batch
                const item = candidates[Math.floor(Math.random() * candidates.length)];

                const iiifBase: string = json?.config?.iiif_url || "https://www.artic.edu/iiif/2";
                const img = `${iiifBase}/${item.image_id}/full/843,/0/default.jpg`;

                if (!cancelled) {
                    setArt({
                    id: item.id,
                    title: item.title || "Untitled",
                    artist: item.artist_display || "Unknown",
                    date: item.date_display || "",
                    img,
                    url: `https://www.artic.edu/artworks/${item.id}`,
                    department: item.department_title,
                    creditLine: item.credit_line,
                    });
                    setLoading(false);
                }
                return; // done
                }
                // otherwise loop and try another random window
            }

            // if we fell out of the loop without finding anything:
            if (!cancelled) {
                setError("Couldn’t find an AIC image right now. Pull to refresh.");
                setLoading(false);
            }
            } catch (e) {
            if (!cancelled) {
                setError("Couldn’t find an AIC image right now. Pull to refresh.");
                setLoading(false);
            }
            }
        }

        pickRandomAIC();
        return () => { cancelled = true; };
    }, [randomKey]);


  // Long-press to save current image
  async function saveCurrentImage() {
    if (!art?.img) return;
    try {
      const url = art.img.replace(/^http:/, "https:");
      const fileUri = `${FileSystem.cacheDirectory}aic-${art.id}.jpg`;
      const dl = await FileSystem.downloadAsync(url, fileUri);

      if (Platform.OS === "web") {
        const a = document.createElement("a");
        a.href = dl.uri;
        a.download = `aic-${art.id}.jpg`;
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
            <Image
            source={require("../../assets/images/aic-logo.png")}
            style={styles.brandLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel="AIC"
            />
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
              {art.department ? (
                <Text style={styles.muted}>{art.department}</Text>
              ) : null}
              {art.creditLine ? (
                <Text style={styles.muted}>{art.creditLine}</Text>
              ) : null}
              {!!art.url && (
                <Text style={styles.link} onPress={() => Linking.openURL(art.url)}>
                  View on AIC (CC0)
                </Text>
              )}
              <Text style={styles.caption}>Artwork ID: {art.id}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Images courtesy of the Art Institute of Chicago (Public Domain/CC0).
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
    gap: 8,  
  },
  brandText: { color: "#181a20", fontSize: 30, fontFamily: "PlayfairDisplay_400Regular" },

  brandLogo: {
    height: 34,                   // tweak to taste
    width: 40,                   // keep proportion of your PNG
  },
  
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
