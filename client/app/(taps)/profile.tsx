import { View, Text, Pressable } from "react-native";
import React from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/main-header";
import { PROFILE_MENU } from "@/assets/constants";
import { useUser, useClerk } from "@clerk/expo";

const AVATAR_SIZE = 100;

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in" as any);
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <Header title="Profile" />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text className="text-xl font-bold text-primary mt-4">
            Welcome to our store
          </Text>
          <Text className="text-secondary text-center mt-2 mb-6">
            Sign in to view your profile and orders.
          </Text>
          <Pressable
            onPress={() => router.push("/sign-in" as any)}
            className="bg-primary px-8 py-3 rounded-full"
          >
            <Text className="text-white font-bold text-base">Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Profile" />

      {/* Avatar & Info */}
      <View className="items-center mt-6 mb-4">
        <Image
          source={{ uri: user.imageUrl }}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
          }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
        <Text className="text-xl font-bold text-primary mt-3">{user.firstName} {user.lastName}</Text>
        <Text className="text-sm text-secondary mt-1">
          {user.emailAddresses[0].emailAddress}
        </Text>

        {user.publicMetadata.role === "admin" && (
          <Pressable
            onPress={() => router.push("/admin" as any)}
            className="bg-primary px-8 py-3 rounded-full mt-4"
          >
            <Text className="text-white font-bold text-base">Admin Panel</Text>
          </Pressable>
        )}
      </View>

      {/* Menu Items */}
      <View className="mx-4 bg-white rounded-2xl overflow-hidden mt-2">
        {PROFILE_MENU.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => router.push(item.route as any)}
            className={`flex-row items-center px-4 py-3.5 ${
              index < PROFILE_MENU.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <Ionicons name={item.icon} size={20} color="#555" />
            <Text className="flex-1 text-sm text-primary ml-3">
              {item.title}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </Pressable>
        ))}
      </View>

      {/* Log Out */}
      <View className="mx-4 mt-4">
        <Pressable
          onPress={handleLogout}
          className="bg-white rounded-2xl flex-row items-center justify-center py-3.5"
        >
          <Ionicons name="log-out-outline" size={18} color="#FF4C3B" />
          <Text className="text-sm font-bold text-red-500 ml-2">Log Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
