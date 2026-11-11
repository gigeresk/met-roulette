import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";
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
import { Icon } from "@/components/Icon";
import { SiteGate } from "@/components/SiteGate";
import { getRandomMetArtwork, type MetArtwork } from "@/lib/met";

export default function TabHome() {
  return (
    <SiteGate site="met">
      <MetScreen />
    </SiteGate>
  );
}

function MetScreen() {
  const [loading, setLoading] = useState(true);
  const [art, setArt] = useState<MetArtwork | null>(null);
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
  } catch {
    Alert.alert("Save failed", "Couldn’t save this image. Try again.");
  }
}



  // Earlier versions cached the Met's full 3.4 MB ID list here; free that space.
  useEffect(() => {
    AsyncStorage.removeItem("metObjectIDs").catch(() => {});
  }, []);

  // pick a random artwork (on load, shuffle, and pull-to-refresh)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setArt(null);
      setError("");
      try {
        const picked = await getRandomMetArtwork(() => cancelled);
        if (cancelled) return;
        if (picked) setArt(picked);
        else setError("Couldn’t find a CC0 image right now. Pull to refresh.");
      } catch {
        if (!cancelled) setError("Failed to load object IDs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [randomKey, refreshKey]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        contentContainerStyle={styles.container}
          refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.brandBar}>
          <View style={styles.brandSpacer} />
          <Image
            source={require("../../assets/images/met-logo.png")}
            style={styles.brandLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel="The Met"
          />
          <Pressable
            onPress={shuffle}
            style={styles.rouletteBtn}
            accessibilityLabel="Shuffle artwork"
          >
            <Text style={styles.brandText}>Roulette</Text>
            <Icon name="shuffle" size={22} color="#fff" style={{ marginLeft: 8, marginTop: 0 }} />
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
          Images courtesy of The Metropolitan Museum of Art (Public Domain/CC0).{"\n"}
          A project by{" "}
          <Text style={styles.link} onPress={() => Linking.openURL("https://wormcrust.com")}>
            Megan Bierman-Brophy
          </Text>
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
  rouletteBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandSpacer: {
    width: 30,
  },

});