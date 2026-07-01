import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        title: "Met Roulette", // browser tab / document title (web)
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: { backgroundColor: "#181a20", borderTopColor: "#222" },
      }}
    >
      <Tabs.Screen
        name="met"
        options={{
          tabBarLabel: "The Met",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="city-variant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="moma"
        options={{
          tabBarLabel: "MoMA",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="palette-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="aic"
        options={{
          tabBarLabel: "AIC",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bank" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cma"
        options={{
          tabBarLabel: "CMA",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="image-frame" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
