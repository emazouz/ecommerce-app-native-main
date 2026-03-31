import { useRouter } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
  Text,
  Pressable,
  View,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, getStatusColor } from "@/constants";
import type { Order } from "@/constants/types";
import { formatDate } from "@/assets/assets";
import Header from "../components/main-header";
import { useAuth } from "@clerk/expo";
import Toast from "react-native-toast-message";
import api from "@/constants/api";

const THUMB = 48;

export default function Orders() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/sign-in");
        return;
      }
      
      const response = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data?.success) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load orders",
        });
        return;
      }
      setOrders(response.data.data || []);
    } catch (error: any) {
      console.error("Failed to fetch user orders:", error?.response?.data || error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Failed to load orders",
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const renderItem = useCallback(
    ({ item }: { item: Order }) => {
      const totalQty = item.items.reduce((s, i) => s + i.quantity, 0);

      return (
        <Pressable
          onPress={() => router.push(`/orders/${item._id}` as any)}
          className="bg-white p-4 rounded-2xl mb-3 shadow-sm active:opacity-95"
        >
          {/* Order ID & Date */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-bold text-primary">
              #{item.orderNumber}
            </Text>
            <Text className="text-xs text-secondary">
              {formatDate(item.createdAt)}
            </Text>
          </View>

          {/* Badges Row */}
          <View className="flex-row gap-2 mb-3">
            <View
              className={`px-2.5 py-1 rounded-full ${getStatusColor(item.orderStatus)}`}
            >
              <Text className="text-[10px] font-bold uppercase">
                {item.orderStatus}
              </Text>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full ${
                item.paymentStatus === "paid"
                  ? "bg-green-50 text-green-800"
                  : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-[10px] font-bold uppercase ${
                  item.paymentStatus === "paid"
                    ? "text-green-800"
                    : "text-gray-600"
                }`}
              >
                {item.paymentStatus}
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-full bg-surface">
              <Text className="text-[10px] font-bold uppercase text-secondary">
                {item.paymentMethod}
              </Text>
            </View>
          </View>

          {/* Product Thumbnails */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            className="mb-3"
          >
            {item.items.map((prod: any, idx: number) => {
              const uri = prod.product?.images?.[0];
              return uri ? (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={{
                    width: THUMB,
                    height: THUMB,
                    borderRadius: 10,
                  }}
                  contentFit="cover"
                  transition={100}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View
                  key={idx}
                  className="bg-surface rounded-xl items-center justify-center"
                  style={{ width: THUMB, height: THUMB }}
                >
                  <Ionicons name="image-outline" size={18} color="#ccc" />
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
            <Text className="text-xs text-secondary">
              {totalQty} item{totalQty !== 1 ? "s" : ""}
            </Text>
            <Text className="text-base font-bold text-primary">
              ${Number(item.totalAmount || 0).toFixed(2)}
            </Text>
          </View>
        </Pressable>
      );
    },
    [router],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="My Orders" showBack />

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View className="flex-1 justify-center items-center mt-20">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text className="text-secondary mt-3 text-base">
                No orders yet
              </Text>
              <Text className="text-secondary text-sm mt-1">
                Your orders will appear here
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}
