import { View, Text, Pressable } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { CartItem as CartItemType } from "@/context/cart-context";

type CartItemProps = {
  item: CartItemType;
  onRemove: () => void;
  onUpdateQuantity: (newQty: number) => void;
};

function CartItem({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  const { product, quantity, size } = item;
  const lineTotal = product.price * quantity;
  const decrementDisabled = quantity <= 1;

  return (
    <View className="flex-row bg-white p-2 rounded-xl shadow-sm mb-3 overflow-hidden">
      {/* Thumbnail */}
      <Image
        source={{ uri: product.images?.[0] }}
        style={{
          width: 80,
          height: 80,
          borderRadius: 12,
          marginRight: 12,
        }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />

      {/* Details */}
      <View className="flex-1 justify-between">
        {/* Top: name, size, delete */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-2">
            <Text className="text-sm font-bold text-primary" numberOfLines={1}>
              {product.name}
            </Text>
            {size ? (
              <Text className="text-xs text-secondary mt-0.5">
                Size: {size}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={onRemove} hitSlop={8} className="p-1">
            <Ionicons name="close-circle-outline" size={16} color="#FF4C3B" />
          </Pressable>
        </View>

        {/* Bottom: price, quantity */}
        <View className="flex-row justify-between items-center mt-2">
          {/* Price info */}
          <View>
            <Text className="text-xs text-secondary">
              ${product.price.toFixed(2)} each
            </Text>
            <Text className="text-sm font-bold text-primary">
              ${lineTotal.toFixed(2)}
            </Text>
          </View>

          {/* Quantity stepper */}
          <View className="flex-row items-center bg-surface rounded-full px-1">
            <Pressable
              onPress={() =>
                !decrementDisabled && onUpdateQuantity(quantity - 1)
              }
              disabled={decrementDisabled}
              className="w-8 h-8 justify-center items-center"
              hitSlop={4}
            >
              <Ionicons
                name="remove"
                size={16}
                color={decrementDisabled ? "#ccc" : "#111"}
              />
            </Pressable>
            <Text className="text-sm font-bold w-6 text-center">
              {quantity}
            </Text>
            <Pressable
              onPress={() => onUpdateQuantity(quantity + 1)}
              className="w-8 h-8 justify-center items-center"
              hitSlop={4}
            >
              <Ionicons name="add" size={16} color="#111" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default React.memo(CartItem);
