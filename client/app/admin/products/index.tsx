import { useRouter } from "expo-router";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Text,
  Pressable,
  View,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Product } from "@/constants/types";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/main-header";
import { useAuth } from "@clerk/expo";
import Toast from "react-native-toast-message";
import api from "@/constants/api";

const THUMB_SIZE = 64;
const limit = 999;

export default function AdminProducts() {
  const { getToken } = useAuth();
  const router = useRouter();
  // const initialProducts = useMemo(() => dummyProducts as Product[], []);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please log in again",
        });
        router.replace("/sign-in");
        return;
      }

      const response = await api.get("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit,
        },
      });

      if (!response.data.success) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message,
        });
        return;
      }

      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch products",
      });
    }
  }, [getToken, router]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const deleteProduct = useCallback(
    (id: string) => {
      Alert.alert(
        "Delete Product",
        "Are you sure you want to delete this product?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const token = await getToken();
                const response = await api.delete(`/products/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data?.success) {
                  setProducts((prev) => prev.filter((p) => p._id !== id));
                  Toast.show({
                    type: "success",
                    text1: "Deleted",
                    text2: "Product removed successfully",
                  });
                } else {
                  Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: response.data?.message || "Failed to delete product",
                  });
                }
              } catch (error) {
                console.error("Failed to delete product:", error);
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Failed to delete product",
                });
              }
            },
          },
        ],
      );
    },
    [getToken],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const categoryName =
        typeof item.category === "string"
          ? item.category
          : (item.category?.name ?? "Other");

      return (
        <View className="bg-white p-3 rounded-2xl mb-3 flex-row items-center shadow-sm">
          <Image
            source={{
              uri: item.images?.[0] ?? "https://via.placeholder.com/150",
            }}
            style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12 }}
            contentFit="cover"
            transition={100}
            cachePolicy="memory-disk"
          />

          <View className="flex-1 ml-3">
            <Text className="font-bold text-primary text-sm" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-xs text-secondary mt-0.5" numberOfLines={1}>
              {categoryName} · Stock: {item.stock}
            </Text>
            {item.sizes && item.sizes.length > 0 && (
              <Text className="text-xs text-secondary mt-0.5" numberOfLines={1}>
                Sizes: {item.sizes.join(", ")}
              </Text>
            )}
            <Text className="text-sm font-bold text-primary mt-1">
              ${item.price.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 mr-2">
            <Pressable
              onPress={() =>
                router.push(`/admin/products/edit/${item._id}` as any)
              }
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-surface items-center justify-center"
            >
              <Ionicons name="create-outline" size={16} color="#555" />
            </Pressable>
            <Pressable
              onPress={() => deleteProduct(item._id)}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-red-50 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={16} color="#FF4C3B" />
            </Pressable>
          </View>
        </View>
      );
    },
    [router, deleteProduct],
  );

  const ListHeader = useMemo(
    () => (
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-bold text-primary">
          Total Products ({products.length})
        </Text>
        <Pressable
          onPress={() => router.push("/admin/products/add")}
          className="bg-primary px-4 py-2 rounded-full flex-row items-center active:opacity-90"
        >
          <Ionicons name="add" size={18} color="white" />
          <Text className="text-white font-bold text-sm ml-1">Add Product</Text>
        </Pressable>
      </View>
    ),
    [products.length, router],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Manage Products" showBack />

      <FlatList
        data={products}
        keyExtractor={(item, index) => item._id + index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons name="cube-outline" size={48} color="#ccc" />
            <Text className="text-secondary mt-3 text-base">
              No products found
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}
