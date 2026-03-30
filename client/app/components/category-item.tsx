import { Pressable, Text, View } from "react-native";
import React from "react";
import { CategoryItemProps } from "@/constants/types";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";

export default function CategoryItem({
  item,
  isSelected,
  onPress,
}: CategoryItemProps) {
  return (
    <Pressable onPress={onPress} className="items-center mr-5">
      <View
        className={`w-14 h-14 rounded-2xl items-center justify-center mb-2 ${
          isSelected
            ? "bg-primary border border-primary"
            : "bg-gray-50 border border-gray-200"
        }`}
      >
        <Ionicons
          name={item.icon as keyof typeof Ionicons.glyphMap}
          size={24}
          color={isSelected ? "#FFFFFF" : COLORS.primary}
        />
      </View>
      <Text
        className={`text-xs font-medium ${
          isSelected ? "text-primary" : "text-gray-500"
        }`}
      >
        {item.name}
      </Text>
    </Pressable>
  );
}
