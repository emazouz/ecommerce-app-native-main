import {
  View,
  FlatList,
  Pressable,
  Text,
  ScrollView,
  Dimensions,
  ViewToken,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import PaginationDots from "../components/pagination-dots";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { Product } from "@/constants/types";
import { COLORS } from "@/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 420;

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart, itemCount } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const router = useRouter();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${id}`);
        if (response.data?.success) {
          setProduct(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch product details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const isLiked = isInWishlist(id);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveImageIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (!selectedSize) {
      Toast.show({
        type: "info",
        text1: "No Size Selected!",
        text2: "Please select a size to add to cart",
      });
      return;
    }
    addToCart(product, selectedSize);
  }, [selectedSize, product, addToCart]);

  // ─── Loading / Not Found ─────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color="#999" />
        <Text className="text-lg font-semibold text-secondary mt-3">
          Product not found
        </Text>
        <Pressable className="mt-5 px-6 py-3 bg-primary rounded-full" onPress={() => router.back()}>
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ─── Image Carousel ─────────────────────────────────────── */}
        <View className="relative bg-surface" style={{ height: IMAGE_HEIGHT }}>
          <FlatList
            data={product.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(_, i) => String(i)}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                contentFit="cover"
                transition={200}
              />
            )}
          />

          {/* Header Actions */}
          <View className="absolute top-10 left-4 right-4 flex-row justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 justify-center items-center bg-white/80 rounded-full"
            >
              <Ionicons name="arrow-back" size={22} color="#111" />
            </Pressable>

            <Pressable
              onPress={() => toggleWishlist(product)}
              className="w-10 h-10 justify-center items-center bg-white/80 rounded-full"
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? "#FF4C3B" : "#111"}
              />
            </Pressable>
          </View>

          {/* Pagination Dots */}
          {product.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0">
              <PaginationDots
                total={product.images.length}
                activeIndex={activeImageIndex}
              />
            </View>
          )}
        </View>

        {/* ─── Product Info ───────────────────────────────────────── */}
        <View className="px-5 pt-5">
          {/* Name + Rating */}
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-2xl font-bold text-primary flex-1 mr-4">
              {product.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text className="text-sm font-bold ml-1 text-primary">
                {Number(product.ratings?.average || 0).toFixed(1)}
              </Text>
              <Text className="text-xs text-secondary ml-1">
                ({product.ratings?.count || 0})
              </Text>
            </View>
          </View>

          {/* Price */}
          <View className="flex-row items-center mb-6">
            <Text className="text-2xl font-bold text-primary">
              ${Number(product.price || 0).toFixed(2)}
            </Text>
            {hasDiscount && (
              <Text className="text-base text-secondary line-through ml-3">
                ${Number(product.comparePrice || 0).toFixed(2)}
              </Text>
            )}
          </View>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <View className="mb-5">
              <Text className="text-base font-bold text-primary mb-2">
                Size
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const active = selectedSize === size;
                  return (
                    <Pressable
                      key={size}
                      className={`w-12 h-12 justify-center items-center rounded-full border ${
                        active
                          ? "bg-primary border-primary"
                          : "bg-white border-gray-300"
                      }`}
                      onPress={() => setSelectedSize(size)}
                    >
                      <Text
                        className={`text-sm font-medium ${active ? "text-white" : "text-primary"}`}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description */}
          <Text className="text-base font-bold text-primary mb-2">
            Description
          </Text>
          <Text className="leading-6 text-secondary mb-6">
            {product.description}
          </Text>
        </View>
      </ScrollView>

      {/* ─── Sticky Footer ──────────────────────────────────────── */}
      <View className="absolute bottom-0 left-0 right-0 pb-8 pt-3 px-5 bg-white border-t border-gray-100 flex-row items-center">
        <Pressable
          className="flex-1 bg-primary py-3.5 rounded-full mr-3"
          onPress={handleAddToCart}
        >
          <Text className="text-base font-bold text-white text-center">
            Add to Cart
          </Text>
        </Pressable>

        <Pressable
          className="relative w-14 h-14 justify-center items-center"
          onPress={() => router.push("/(taps)/cart")}
        >
          <Ionicons name="cart-outline" size={24} color="#111" />
          {itemCount > 0 && (
            <View className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent justify-center items-center">
              <Text className="text-[10px] text-white font-bold">
                {itemCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
