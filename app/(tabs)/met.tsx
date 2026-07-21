import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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


const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
const STORAGE_KEYS = { IDS: "metObjectIDs" };

function yyyymmdd(d = new Date()) {
  return d.toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20250910
}

export default function TabHome() {
  return (
    <SiteGate site="met">
      <MetScreen />
    </SiteGate>
  );
}

function MetScreen() {
  const [ids, setIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [art, setArt] = useState<null | {
    id: number; title: string; artist: string; date: string; img: string; url: string;
    department?: string; creditLine?: string;
  }>(null);
  const [error, setError] = useState<string>("");

  // pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // bump to force re-pick

  const [randomKey, setRandomKey] = useState(0);
  function shuffle() {
    // bump a key to retrigger the picker
    setRandomKey(k => k + 1);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

async function saveCurrentImage() {
  if (!art?.img) return;

  try {
    // iOS sometimes returns http — force https
    const url = art.img.replace(/^http:/, "https:");
    const fileUri = `${FileSystem.cacheDirectory}met-${art.id}.jpg`;

    // Download to cache
    const dl = await FileSystem.downloadAsync(url, fileUri);

    if (Platform.OS === "web") {
      // Web download fallback
      const a = document.createElement("a");
      a.href = dl.uri;
      a.download = `met-${art.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    // Ask for photo permissions and save
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to save images.");
      return;
    }
    await MediaLibrary.saveToLibraryAsync(dl.uri);
    Alert.alert("Saved", "Image saved to your Photos.");
  } catch (e) {
    Alert.alert("Save failed", "Couldn’t save this image. Try again.");
  }
}



  // load or fetch the global ID list (cached)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.IDS);
        if (cached) {
          const arr = JSON.parse(cached) as number[];
          if (!cancelled) setIds(arr);
        } else {
          const res = await fetch(`${BASE}/objects`);
          const data = (await res.json()) as { objectIDs?: number[] };
          const arr = data?.objectIDs ?? [];
          await AsyncStorage.setItem(STORAGE_KEYS.IDS, JSON.stringify(arr));
          if (!cancelled) setIds(arr);
        }
      } catch {
        if (!cancelled) setError("Failed to load object IDs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Might be wrong
  useEffect(() => {
    if (ids.length) setRandomKey(k => k + 1);
  }, [ids]);

  // pick the day’s artwork
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ids.length) return;

      setLoading(true);
      setArt(null);
      setError("");

      const startIndex = Math.floor(Math.random() * ids.length);
      const TRY_LIMIT = 200;
      const STRIDE = 9973;

      for (let i = 0; i < TRY_LIMIT && !cancelled; i++) {
        const idx = (startIndex + i * STRIDE) % ids.length;
        const objectID = ids[idx];
        try {
          const r = await fetch(`${BASE}/objects/${objectID}`);
          const o = await r.json();
          if (o?.isPublicDomain && (o.primaryImageSmall || o.primaryImage)) {
            if (!cancelled) {
              setArt({
                id: objectID,
                title: o.title || "Untitled",
                artist: o.artistDisplayName || "Unknown",
                date: o.objectDate || "",
                img: o.primaryImageSmall || o.primaryImage,
                url: o.objectURL || "",
                department: o.department,
                creditLine: o.creditLine,
              });
              setLoading(false);
            }
            return;
          }
        } catch {
          // continue
        }
      }

      if (!cancelled) {
        setLoading(false);
        setError("Couldn’t find a CC0 image right now. Pull to refresh.");
      }
    })();
    return () => { cancelled = true; };
  }, [ids, randomKey, refreshKey]); // include refreshKey

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
            source={require("../../assets/images/met-logo.png")}
            style={styles.brandLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel="The Met"
          />
          <Text style={styles.brandText}>Roulette</Text>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={shuffle} style={styles.btn} accessibilityLabel="Shuffle artwork">
            <MaterialCommunityIcons name="shuffle" size={18} color="#fff" style={{ marginRight: 8 }} />
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
                {art.artist}{art.date ? ` — ${art.date}` : ""}
              </Text>
              {art.department ? <Text style={styles.muted}>{art.department}</Text> : null}
              {art.creditLine ? <Text style={styles.muted}>{art.creditLine}</Text> : null}
              {!!art.url && (
                <Text style={styles.link} onPress={() => Linking.openURL(art.url)}>
                  View on The Met (CC0)
                </Text>
              )}
              <Text style={styles.caption}>Object ID: {art.id}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Images courtesy of The Metropolitan Museum of Art (Public Domain/CC0).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, backgroundColor: "#101014", minHeight: "100%" },
  h1: { 
    fontSize: 28, 
    color: "white", 
    textAlign: "center",
    fontFamily: "PlayfairDisplay_700Bold",
    backgroundColor: "#e4002b",   // 🔴 Met red
    paddingVertical: 6,
    paddingHorizontal: 12,
    overflow: "hidden",   
  },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  control: { color: "#8ab4f8", fontSize: 16 },
  center: { alignItems: "center", padding: 24 },
  muted: { color: "#9aa0a6", marginTop: 8, textAlign: "center" },
  error: { color: "#ff6b6b", textAlign: "center" },
  card: { backgroundColor: "#181a20", borderRadius: 16, padding: 12 },
  image: { width: "100%", height: 360, borderRadius: 12, backgroundColor: "#0f1115" },
  meta: { marginTop: 12, gap: 4 },
  title: { 
    fontSize: 18, 
    color: "white",
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
  },
  byline: {
    color: "white",
    fontFamily: "PlayfairDisplay_400Regular",
    textAlign: "center",
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
  safe: { flex: 1, backgroundColor: "#101014" },
  brandBar: {
    backgroundColor: "#e4002b",  
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,                       
  },
  brandLogo: {
    height: 34,                   
    width: 40,                  
  },
  brandText: {
    color: "#fff",
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 30,
  },
  
});