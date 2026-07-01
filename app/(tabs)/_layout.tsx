import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: { backgroundColor: "#181a20", borderTopColor: "#222" },
      }}
    >
      <Tabs.Screen
        name="met"
        options={{
          title: "The Met",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="city-variant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="moma"
        options={{
          title: "MoMA",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="palette-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="aic"
        options={{
          title: "AIC",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bank" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cma"
        options={{
          title: "CMA",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="image-frame" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
