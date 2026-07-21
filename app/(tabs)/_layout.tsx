import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

// Same app ships as single-museum sites (metroulette.com / momaroulette.com)
// via EXPO_PUBLIC_SITE at build time. Unset (local dev) shows every museum.
const SITE = process.env.EXPO_PUBLIC_SITE;

const SITE_TITLES: Record<string, string> = {
  met: "Met Roulette",
  moma: "MoMA Roulette",
};

const ALL_TABS = [
  {
    name: "met",
    label: "The Met",
    icon: "city-variant-outline" as const,
  },
  { name: "moma", label: "MoMA", icon: "palette-outline" as const },
  { name: "aic", label: "AIC", icon: "bank" as const },
  { name: "cma", label: "CMA", icon: "image-frame" as const },
];

const tabs = SITE ? ALL_TABS.filter((t) => t.name === SITE) : ALL_TABS;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        title: SITE_TITLES[SITE ?? ""] ?? "Met Roulette", // browser tab / document title (web)
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          backgroundColor: "#181a20",
          borderTopColor: "#222",
          display: tabs.length > 1 ? "flex" : "none",
        },
      }}
    >
      {tabs.map(({ name, label, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarLabel: label,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
