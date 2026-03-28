import { ProductCardProps } from "@/assets/constants/types";
import { useWishlist } from "@/context/wishlist-context";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isLiked = isInWishlist(product._id);
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;

  return (
    <Link href={`/product/${product._id}`} asChild>
      <Pressable className="mb-4 w-[48%] bg-white rounded-lg overflow-hidden shadow-sm">
        <View className="relative w-full h-52 bg-gray-200">
          <Image
            source={{ uri: product.images[0] }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />

          <Pressable
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full"
            onPress={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? "#FF4C3B" : "#111"}
            />
          </Pressable>

          {product.isFeatured && (
            <View className="absolute top-2 left-2 bg-primary px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">Featured</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="p-2">
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text className="text-xs text-gray-500 ml-1">
              {product.ratings.average.toFixed(1)} ({product.ratings.count})
            </Text>
          </View>
          <Text className="text-sm font-semibold mt-0.5" numberOfLines={1}>
            {product.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-sm font-bold text-primary">
              ${product.price.toFixed(2)}
            </Text>
            {hasDiscount && (
              <Text className="text-xs text-secondary line-through ml-2">
                ${product.comparePrice!.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default React.memo(ProductCard);
