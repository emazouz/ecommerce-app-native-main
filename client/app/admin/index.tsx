import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getStatusColor } from "@/constants";
import Header from "../components/main-header";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/constants/api";
import { useAuth } from "@clerk/expo";
import Toast from "react-native-toast-message";

type StatItem = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

export default function AdminDashboard() {
  // const stats = useMemo(() => dummyAdminStats, []);
  const { getToken } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    ordersByStatus: [],
  } as any);

  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();

  // fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "No auth token found. Please log in again.",
        });
        return;
      }

      const response = await api.get("/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Responsive: 2 columns with gap
  const cardWidth = (width - 16 * 2 - 12) / 2;

  const statCards: StatItem[] = useMemo(
    () => [
      {
        label: "Revenue",
        value: `$${Number(stats.totalRevenue).toFixed(2) || "0.00"}`,
        icon: "wallet-outline",
        color: "#10B981",
        bg: "bg-emerald-50",
      },
      {
        label: "Orders",
        value: String(stats.totalOrders),
        icon: "receipt-outline",
        color: "#6366F1",
        bg: "bg-indigo-50",
      },
      {
        label: "Products",
        value: String(stats.totalProducts),
        icon: "cube-outline",
        color: "#F59E0B",
        bg: "bg-amber-50",
      },
      {
        label: "Users",
        value: String(stats.totalUsers),
        icon: "people-outline",
        color: "#3B82F6",
        bg: "bg-blue-50",
      },
    ],
    [stats],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const orders = (stats.recentOrders || []) as any[];

  const renderOrder = useCallback(({ item: order }: { item: any }) => {
    const totalQty = order.items.reduce(
      (acc: number, i: any) => acc + i.quantity,
      0,
    );
    const initials = (order.user?.name || "?").charAt(0).toUpperCase();

    return (
      <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="font-bold text-primary text-sm">
              {totalQty} item{totalQty !== 1 ? "s" : ""}
            </Text>
            <Text className="text-xs text-secondary mt-0.5">
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}
          >
            <Text className="text-[10px] font-bold uppercase">
              {order.orderStatus}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View className="mb-2">
          {order.items.map((item: any) => (
            <Text key={item._id} className="text-xs text-secondary mt-0.5">
              {item.name} × {item.quantity}
            </Text>
          ))}
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100 mb-2" />

        {/* Footer */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-surface items-center justify-center mr-2">
              <Text className="text-primary font-bold text-xs">{initials}</Text>
            </View>
            <Text className="text-sm text-secondary">
              {order.user?.name || "Unknown"}
            </Text>
          </View>
          <Text className="text-base font-bold text-primary">
            ${order.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  }, []);

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Section Title */}
        <Text className="text-xl font-bold text-primary mb-3">Overview</Text>

        {/* Stat Cards Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {statCards.map((card) => (
            <View
              key={card.label}
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              style={{ width: cardWidth }}
            >
              <View
                className={`w-9 h-9 rounded-xl ${card.bg} items-center justify-center mb-2`}
              >
                <Ionicons name={card.icon} size={18} color={card.color} />
              </View>
              <Text className="text-xl font-bold text-primary">
                {card.value}
              </Text>
              <Text className="text-xs text-secondary font-medium uppercase tracking-wide mt-0.5">
                {card.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Orders Header */}
        <Text className="text-xl font-bold text-primary mb-3">
          Recent Orders
        </Text>
      </View>
    ),
    [statCards, cardWidth],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Manage Dashboard" showBack />

      <FlatList
        data={orders}
        keyExtractor={(item: any) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-surface"
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View className="bg-white p-6 rounded-2xl items-center shadow-sm">
            <Ionicons name="receipt-outline" size={36} color="#ccc" />
            <Text className="text-secondary mt-2">No recent orders</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}
