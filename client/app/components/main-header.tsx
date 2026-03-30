import React from "react";
import { COLORS } from "@/constants";
import { HeaderProps } from "@/constants/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useCart } from "@/context/cart-context";

const LOGO_STYLE = { width: 100, height: 40 } as const;

function Header({
  title,
  showBack,
  showLogo,
  showCart,
  showMenu,
  showSearch,
}: HeaderProps) {
  const router = useRouter();
  const { itemCount } = useCart();
  return (
    <View className="flex-row justify-between items-center px-4 py-3">
      {/* Left side */}
      <View className="flex-row flex-1 items-center">
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            className="mr-3 p-1 active:opacity-70"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </Pressable>
        )}

        {showMenu && (
          <Pressable className="mr-3 p-1 active:opacity-70" hitSlop={8}>
            <Ionicons name="menu-outline" size={28} color={COLORS.primary} />
          </Pressable>
        )}

        {showLogo ? (
          <View className="flex-1 items-center justify-center">
            <Image
              source={require("@/assets/logo.png")}
              style={LOGO_STYLE}
              contentFit="contain"
              cachePolicy="memory"
            />
          </View>
        ) : (
          title && (
            <Text className="flex-1 text-xl text-primary text-center font-bold mr-8">
              {title}
            </Text>
          )
        )}
      </View>

      {!title && !showSearch && <View className="flex-1" />}

      {/* Right side */}
      <View className="flex-row items-center">
        {showCart && (
          <Pressable
            onPress={() => router.push("/(taps)/cart")}
            className="mr-3 p-1 active:opacity-70"
            hitSlop={8}
          >
            <Ionicons name="bag-outline" size={24} color={COLORS.primary} />
            <View className="absolute -top-0.5 -right-0.5 rounded-full w-4 h-4 items-center justify-center bg-accent">
              <Text className="text-white text-xs font-bold">{itemCount}</Text>
            </View>
          </Pressable>
        )}

        {showSearch && (
          <Pressable className="mr-3 p-1 active:opacity-70" hitSlop={8}>
            <Ionicons name="search-outline" size={24} color={COLORS.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default Header;
