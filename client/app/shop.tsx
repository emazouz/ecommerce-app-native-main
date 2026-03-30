import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Product } from "@/constants/types";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./components/main-header";
import { Ionicons } from "@expo/vector-icons";
import ProductCard from "./components/product-card";
import { COLORS } from "@/constants";
import api from "@/constants/api";
import Toast from "react-native-toast-message";

const PAGE_SIZE = 10;

export default function Shop() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (pageNum = 1, searchQuery = search) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const queryParams = {
        page: pageNum,
        limit: PAGE_SIZE,
        search: searchQuery.trim(),
      };

      const { data } = await api.get("/products", { params: queryParams });

      if (pageNum === 1) {
        setProducts(data.data);
      } else {
        setProducts((prev) => [...prev, ...data.data]);
      }

      const currentPage = data.pagination?.page || 1;
      const totalPages = data.pagination?.pages || 1;
      setHasMore(currentPage < totalPages);
      
      setPage(pageNum);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch products",
      })
      console.error("Error fetching products: ", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load + Server-Side Search (Debounced)
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchProducts(1, search);
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchProducts(page + 1, search);
    }
  }, [hasMore, loadingMore, loading, page, search]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Shop" showBack showCart />

      {/* Search Bar */}
      <View className="flex-row items-center px-4 py-2 gap-2">
        <View className="flex-1 flex-row items-center bg-white border border-gray-100 rounded-lg overflow-hidden">
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
        contentContainerStyle={{ padding: 16, paddingBottom: 100, flexGrow: 1 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
             <View className="flex-1 justify-center items-center py-20">
               <ActivityIndicator size="large" color={COLORS.primary} />
             </View>
          ) : (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="search-outline" size={48} color="#999" />
              <Text className="text-secondary mt-3">No products found</Text>
            </View>
          )
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
