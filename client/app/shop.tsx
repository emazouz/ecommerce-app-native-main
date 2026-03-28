import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Product } from "@/assets/constants/types";
import { dummyProducts } from "@/assets/assets";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./components/main-header";
import { Ionicons } from "@expo/vector-icons";
import ProductCard from "./components/product-card";
import { COLORS } from "@/assets/constants";

const PAGE_SIZE = 10;

export default function Shop() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      search.trim()
        ? dummyProducts.filter((p) =>
            p.name.toLowerCase().includes(search.trim().toLowerCase()),
          )
        : dummyProducts,
    [search],
  );

  const products = useMemo(
    () => filtered.slice(0, page * PAGE_SIZE),
    [filtered, page],
  );

  const hasMore = products.length < filtered.length;

  const loadMore = useCallback(() => {
    if (hasMore) setPage((p) => p + 1);
  }, [hasMore]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Shop" showBack showCart />

      {/* Search Bar */}
      <View className="flex-row items-center px-4 py-2 gap-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-100 rounded-lg overflow-hidden"
        >
          <Ionicons
            name="search"
            size={20}
            color={COLORS.secondary}
            style={{ marginLeft: 8 }}
          />
          <TextInput
            className="flex-1 px-2 py-3 text-primary"
            placeholder="Search products..."
            placeholderTextColor="#999"
            returnKeyType="search"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} className="pr-3">
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.secondary}
              />
            </Pressable>
          )}
        </View>

        <Pressable className="w-10 h-10  bg-primary rounded-lg justify-center items-center">
          <Ionicons name="options-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="search-outline" size={48} color="#999" />
            <Text className="text-secondary mt-3">No products found</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <View className="py-4 items-center">
              <Text className="text-secondary text-sm">Loading more…</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
