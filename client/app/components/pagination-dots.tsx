import React from "react";
import { View } from "react-native";

type PaginationDotsProps = {
  total: number;
  activeIndex: number;
  className?: string;
};

const PaginationDots = React.memo(
  ({ total, activeIndex, className = "" }: PaginationDotsProps) => (
    <View className={`flex-row justify-center items-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-2 rounded-full ${
            i === activeIndex ? "w-6 bg-primary" : "w-2 bg-gray-300"
          }`}
        />
      ))}
    </View>
  ),
);
PaginationDots.displayName = "PaginationDots";

export default PaginationDots;
