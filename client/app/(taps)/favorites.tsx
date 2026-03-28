import { View, Text, ScrollView, Pressable } from "react-native";
import React from "react";
import { useWishlist } from "@/context/wishlist-context";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/main-header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ProductCard from "../components/product-card";

export default function Favorites() {
  const { wishlist } = useWishlist();
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Whishlist" showMenu showCart />

      {wishlist.length > 0 ? (
        <ScrollView className="flex-1 px-4 mt-4">
          <View className="flex-row flex-wrap justify-between">
            {wishlist.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text className="text-xl font-bold text-primary mt-4">
            Your wishlist is empty
          </Text>
          <Text className="text-secondary text-center mt-2 mb-6">
            Looks like you haven&apos;t added anything yet.
          </Text>
          <Pressable
            onPress={() => router.push("/")}
            className="bg-primary px-8 py-3 rounded-full"
          >
            <Text className="text-white font-bold text-base">
              Start Shopping
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
