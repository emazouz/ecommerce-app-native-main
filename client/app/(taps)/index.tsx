import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/main-header";
import CategoryItem from "../components/category-item";
import PaginationDots from "../components/pagination-dots";
import {
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { BANNERS, dummyProducts } from "@/assets/assets";
import { CATEGORIES } from "@/assets/constants";
import { Product } from "@/assets/constants/types";
import { useRouter } from "expo-router";
import ProductCard from "../components/product-card";

const BANNER_HEIGHT = 192;
const PADDING = 32;

// ─── Banner Slide ───────────────────────────────────────────────────
type BannerItem = (typeof BANNERS)[number];

const BannerSlide = React.memo(
  ({ item, width }: { item: BannerItem; width: number }) => (
    <View
      className="relative h-48 bg-gray-200 rounded-lg overflow-hidden"
      style={{ width }}
    >
      <Image
        source={item.image}
        style={{ width, height: BANNER_HEIGHT }}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <View className="absolute inset-0 bg-black/30" />
      <View className="absolute bottom-4 left-4">
        <Text className="text-white text-2xl font-bold">{item.title}</Text>
        <Text className="text-white text-lg">{item.subtitle}</Text>
        <Pressable className="mt-4 px-4 py-2 bg-white rounded-full self-start active:opacity-80">
          <Text className="text-primary font-bold">Shop Now</Text>
        </Pressable>
      </View>
    </View>
  ),
);
BannerSlide.displayName = "BannerSlide";

// ─── Main Screen ────────────────────────────────────────────────────
export default function Index() {
  const { width } = useWindowDimensions();
  const bannerWidth = width - PADDING;
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setProducts(dummyProducts);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Header title="Emazouz" showMenu showLogo showCart />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="mt-4">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate={0.99}
            disableIntervalMomentum
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={{ width: bannerWidth }}
          >
            {BANNERS.map((banner) => (
              <BannerSlide key={banner.id} item={banner} width={bannerWidth} />
            ))}
          </ScrollView>
          <PaginationDots total={BANNERS.length} activeIndex={activeIndex} className="mt-3" />
        </View>

        {/* Categories */}
        <View className="mt-6">
          <Text className="text-lg font-bold mb-3">Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
          >
            {CATEGORIES.map((category) => (
              <CategoryItem
                key={category.id}
                item={category}
                isSelected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Products Popular */}

        <View className="mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold mb-3">Popular Products</Text>
            <TouchableOpacity
              onPress={() => router.push("/shop")}
              className="text-secondary text-sm"
            >
              <Text>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {products.slice(2, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
          )}
        </View>

        {/* Newsletter CTA */}
        <View className="mt-6 p-4 bg-gray-100 rounded-lg items-center">
          <Text className="text-2xl font-bold mb-2 text-center">
            Subscribe to our newsletter
          </Text>
          <Text className="text-secondary mb-4 text-center">
            Get the latest updates and exclusive offers straight to your inbox.
          </Text>
          <TouchableOpacity className="bg-primary py-3 w-4/5 rounded-full items-center">
            <Text className="text-white font-bold">Subscribe Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
