import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Order, Product } from "@/constants/types";
import { COLORS } from "@/constants";
import Header from "../components/main-header";
import { useAuth } from "@clerk/expo";
import Toast from "react-native-toast-message";
import api from "@/constants/api";

const THUMB = 56;

const STATUS_FLOW = ["placed", "processing", "shipped", "delivered"] as const;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function paymentColor(status: string) {
  if (status === "paid") return "text-green-600";
  if (status === "failed") return "text-red-500";
  return "text-orange-500";
}

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await api.get(`/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.data?.success) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Order not found",
          });
          return;
        }
        setOrder(response.data.data);
      } catch (error: any) {
        console.error("Failed to fetch order details:", error?.response?.data || error.message);
        Toast.show({ type: "error", text1: "Error", text2: error?.response?.data?.message || "Failed to load order details" });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id, getToken]);

  const cancelled = order?.orderStatus === "cancelled";
  const addr = order?.shippingAddress;

  const steps = useMemo(
    () =>
      STATUS_FLOW.map((s) => ({
        label: s.charAt(0).toUpperCase() + s.slice(1),
        done:
          !!order &&
          !cancelled &&
          STATUS_FLOW.indexOf(order.orderStatus as any) >=
            STATUS_FLOW.indexOf(s),
        date: s === "placed" && order ? fmtDate(order.createdAt) : "",
      })),
    [order, cancelled],
  );

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-surface justify-center items-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        className="flex-1 bg-surface justify-center items-center"
        edges={["top"]}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text className="text-secondary mt-3 text-base">Order not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-2.5 rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title={`Order #${order.orderNumber}`} showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Order Timeline ── */}
        <Card>
          <CardTitle text="Order Status" />
          {cancelled ? (
            <View className="flex-row items-center bg-red-50 p-3 rounded-xl">
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text className="text-sm font-bold text-red-500 ml-2">
                Order Cancelled
              </Text>
            </View>
          ) : (
            <View>
              {steps.map((step, i) => (
                <View key={step.label} className="flex-row">
                  {/* Dot + Line */}
                  <View className="items-center w-5 mr-3">
                    <View
                      className={`w-3 h-3 rounded-full ${
                        step.done ? "bg-primary" : "bg-gray-200"
                      }`}
                    />
                    {i < steps.length - 1 && (
                      <View
                        className={`w-0.5 flex-1 ${
                          step.done ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </View>
                  {/* Label */}
                  <View className="pb-5">
                    <Text
                      className={`text-sm ${
                        step.done ? "font-bold text-primary" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </Text>
                    {step.date !== "" && (
                      <Text className="text-xs text-secondary mt-0.5">
                        {step.date}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ── Products ── */}
        <Card>
          <CardTitle text="Products" />
          {order.items.map((item: any, i: number) => {
            const prod = item.product as Product | undefined;
            const uri = prod?.images?.[0];
            return (
              <View
                key={i}
                className={`flex-row items-center ${
                  i < order.items.length - 1
                    ? "mb-3 pb-3 border-b border-gray-100"
                    : ""
                }`}
              >
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: THUMB, height: THUMB, borderRadius: 10 }}
                    contentFit="cover"
                    transition={100}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View
                    className="bg-surface rounded-xl items-center justify-center"
                    style={{ width: THUMB, height: THUMB }}
                  >
                    <Ionicons name="image-outline" size={20} color="#ccc" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-primary"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs text-secondary mt-0.5">
                    {item.size ? `Size: ${item.size} · ` : ""}Qty:{" "}
                    {item.quantity}
                  </Text>
                </View>
                <Text className="text-sm font-bold text-primary">
                  ${Number(item.price || 0).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* ── Shipping ── */}
        {addr && (
          <Card>
            <CardTitle text="Shipping Address" />
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-full bg-surface items-center justify-center mr-3 mt-0.5">
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-primary">{addr.street}</Text>
                <Text className="text-sm text-secondary">
                  {addr.city}, {addr.state} {addr.zipCode}
                </Text>
                <Text className="text-sm text-secondary">{addr.country}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* ── Payment Summary ── */}
        <Card>
          <CardTitle text="Payment Summary" />
          <Row
            label="Method"
            value={order.paymentMethod}
            valueClass="capitalize"
          />
          <Row
            label="Status"
            value={order.paymentStatus}
            valueClass={`capitalize ${paymentColor(order.paymentStatus)}`}
          />
          <View className="h-px bg-gray-100 my-2" />
          <Row
            label="Subtotal"
            value={`$${Number(order.subtotal || 0).toFixed(2)}`}
          />
          <Row
            label="Shipping"
            value={`$${Number(order.shippingCost || 0).toFixed(2)}`}
          />
          <Row label="Tax" value={`$${Number(order.tax || 0).toFixed(2)}`} />
          <View className="h-px bg-gray-100 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-primary">Total</Text>
            <Text className="text-base font-bold text-primary">
              ${Number(order.totalAmount || 0).toFixed(2)}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Helpers ── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm">{children}</View>
  );
}

function CardTitle({ text }: { text: string }) {
  return <Text className="text-base font-bold text-primary mb-3">{text}</Text>;
}

function Row({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <View className="flex-row justify-between mb-1.5">
      <Text className="text-sm text-secondary">{label}</Text>
      <Text className={`text-sm font-medium text-primary ${valueClass}`}>
        {value}
      </Text>
    </View>
  );
}
