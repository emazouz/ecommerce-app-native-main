import { View, Text, Pressable, FlatList } from "react-native";
import React, { useCallback } from "react";
import { useCart } from "@/context/cart-context";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/main-header";
import CartItem from "../components/cart-item";

export default function Cart() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  const shipping = 2.0;
  const total = cartTotal + shipping;

  const renderItem = useCallback(
    ({ item }: { item: (typeof cartItems)[number] }) => (
      <CartItem
        item={item}
        onRemove={() => removeFromCart(item.id, item.size || "")}
        onUpdateQuantity={(q) => updateQuantity(item.id, q, item.size || "")}
      />
    ),
    [removeFromCart, updateQuantity],
  );

  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <Header title="My Cart" showBack />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text className="text-xl font-bold text-primary mt-4">
            Your cart is empty
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="My Cart" showBack />

      <FlatList
        data={cartItems}
        keyExtractor={(item, i) => `${item.id}-${item.size}-${i}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />

      {/* Checkout Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pb-6 pt-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-secondary">SubTotal</Text>
          <Text className="text-md font-bold text-primary">
            ${cartTotal.toFixed(2)}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-secondary">Shipping</Text>
          <Text className="text-md text-accent font-bold">
            ${shipping.toFixed(2)}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-secondary">Total</Text>
          <Text className="text-xl font-bold text-primary">
            ${total.toFixed(2)}
          </Text>
        </View>
        <Pressable
          className="bg-primary py-3.5 rounded-full"
          onPress={() => router.push("/checkout" as any)}
        >
          <Text className="text-white font-bold text-base text-center">
            Checkout
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
