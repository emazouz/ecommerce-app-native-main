import React, { useMemo, useState, useCallback } from "react";
import {
  Text,
  Pressable,
  View,
  FlatList,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { dummyOrders, dummyUser } from "@/assets/assets";
import { COLORS, getStatusColor } from "@/assets/constants";
import Header from "../components/main-header";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  placed: "time-outline",
  processing: "cog-outline",
  shipped: "airplane-outline",
  delivered: "checkmark-circle-outline",
  cancelled: "close-circle-outline",
};

export default function AdminOrders() {
  const initialOrders = useMemo(
    () =>
      dummyOrders.map((order: any) => ({ ...order, user: dummyUser })),
    [],
  );

  const [orders, setOrders] = useState(initialOrders);
  const [refreshing, setRefreshing] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const openStatusModal = useCallback((order: any) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  }, []);

  const updateStatus = useCallback(
    (newStatus: string) => {
      if (!selectedOrder) return;
      setOrders((prev) =>
        prev.map((o: any) =>
          o._id === selectedOrder._id
            ? { ...o, orderStatus: newStatus }
            : o,
        ),
      );
      setStatusModalVisible(false);
    },
    [selectedOrder],
  );

  const renderOrder = useCallback(
    ({ item: order }: { item: any }) => {
      const addr = order.shippingAddress;
      return (
        <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm">
          {/* Order ID & Date */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xs text-secondary" numberOfLines={1}>
              #{order.orderNumber ?? order._id.slice(-8)}
            </Text>
            <Text className="text-xs text-secondary">
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Customer */}
          <View className="bg-surface p-3 rounded-xl mb-3">
            <SectionLabel text="Customer" />
            <View className="flex-row items-center mt-1">
              <View className="w-7 h-7 rounded-full bg-white items-center justify-center mr-2">
                <Text className="text-primary font-bold text-xs">
                  {(order.user?.name ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="text-sm font-medium text-primary">
                  {order.user?.name ?? "Unknown"}
                </Text>
                <Text className="text-xs text-secondary">
                  {order.user?.email ?? "No email"}
                </Text>
              </View>
            </View>
          </View>

          {/* Shipping */}
          {addr && (
            <View className="bg-surface p-3 rounded-xl mb-3">
              <SectionLabel text="Shipping" />
              <Text className="text-xs text-primary mt-1">
                {addr.street}, {addr.city}
              </Text>
              <Text className="text-xs text-primary">
                {addr.state}, {addr.zipCode}, {addr.country}
              </Text>
            </View>
          )}

          {/* Items */}
          <View className="mb-3">
            <SectionLabel text="Items" />
            {order.items.map((item: any) => (
              <View
                key={item._id}
                className="flex-row justify-between mt-1.5"
              >
                <Text className="text-xs text-secondary flex-1 mr-2">
                  {item.quantity}× {item.product?.name ?? item.name}
                  {item.size ? ` (${item.size})` : ""}
                </Text>
                <Text className="text-xs font-bold text-primary">
                  ${item.price.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer: Total + Status */}
          <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
            <Text className="text-base font-bold text-primary">
              ${order.totalAmount.toFixed(2)}
            </Text>
            <Pressable
              onPress={() => openStatusModal(order)}
              className={`flex-row items-center px-3 py-1.5 rounded-full ${getStatusColor(order.orderStatus)}`}
            >
              <Text className="text-[10px] font-bold uppercase tracking-wide mr-1.5">
                {order.orderStatus}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#666" />
            </Pressable>
          </View>
        </View>
      );
    },
    [openStatusModal],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
              <Header title="Manage Orders" showBack />

      <FlatList
        data={orders}
        keyExtractor={(item: any) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text className="text-secondary mt-3 text-base">
              No orders found
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* ── Status Modal ── */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setStatusModalVisible(false)}
        />
        <View className="bg-white rounded-t-3xl px-6 pt-5 pb-8">
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-4" />

          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-primary">
              Update Status
            </Text>
            <Pressable
              onPress={() => setStatusModalVisible(false)}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-surface items-center justify-center"
            >
              <Ionicons name="close" size={20} color={COLORS.primary} />
            </Pressable>
          </View>

          {STATUSES.map((status) => {
            const active = selectedOrder?.orderStatus === status;
            return (
              <Pressable
                key={status}
                onPress={() => updateStatus(status)}
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  active ? "bg-primary/5 border border-primary/20" : "bg-surface"
                }`}
              >
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                    active ? "bg-primary/10" : "bg-white"
                  }`}
                >
                  <Ionicons
                    name={STATUS_ICONS[status] ?? "ellipse-outline"}
                    size={16}
                    color={active ? COLORS.primary : "#888"}
                  />
                </View>
                <Text
                  className={`flex-1 text-sm capitalize ${
                    active ? "font-bold text-primary" : "text-secondary"
                  }`}
                >
                  {status}
                </Text>
                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Helper ── */
function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="text-[10px] text-secondary font-bold uppercase tracking-wide">
      {text}
    </Text>
  );
}
