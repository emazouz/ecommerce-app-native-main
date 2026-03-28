import { Tabs, useRouter } from "expo-router";
import { useEffect, useCallback } from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { dummyUser } from "@/assets/assets";

const TAB_SCREENS = [
  { name: "index", title: "Dashboard", icon: "grid-outline" as const },
  { name: "products", title: "Products", icon: "cube-outline" as const },
  { name: "orders", title: "Orders", icon: "receipt-outline" as const },
] as const;

export default function AdminLayout() {
  const user = dummyUser;
  const router = useRouter();

  useEffect(() => {
    if (!user || user.publicMetadata?.role !== "admin") {
      router.replace("/(taps)" as any);
    }
  }, [user, router]);

  const handleExit = useCallback(() => {
    router.replace("/(taps)" as any);
  }, [router]);

  if (!user || user.publicMetadata?.role !== "admin") return null;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111",
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
        tabBarActiveTintColor: "#111",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
        headerRight: () => (
          <Pressable
            onPress={handleExit}
            className="mr-4 flex-row items-center active:opacity-70"
            hitSlop={8}
          >
            <Ionicons name="log-out-outline" size={22} color="#111" />
            <Text className="ml-1.5 text-primary font-bold text-sm">
              Exit
            </Text>
          </Pressable>
        ),
      }}
    >
      {TAB_SCREENS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
