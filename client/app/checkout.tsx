import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCart } from "@/context/cart-context";
import { useRouter } from "expo-router";
import { Address } from "@/constants/types";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./components/main-header";
import Toast from "react-native-toast-message";
import { COLORS } from "@/constants";
import { useAuth } from "@clerk/expo";
import api from "@/constants/api";

const TAX_RATE = 0.05;

type PaymentMethod = "cod" | "card";

const PAYMENT_OPTIONS: {
  key: PaymentMethod;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}[] = [
  {
    key: "cod",
    icon: "cash-outline",
    title: "Cash on Delivery",
    subtitle: "Pay when you receive",
  },
  {
    key: "card",
    icon: "card-outline",
    title: "Credit / Debit Card",
    subtitle: "Pay securely online",
  },
];

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { getToken } = useAuth();
  const router = useRouter();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [loading, setLoading] = useState(false);

  // Derived totals
  const tax = useMemo(() => cartTotal * TAX_RATE, [cartTotal]);
  const shippingCost = useMemo(() => (cartTotal >= 100 ? 0 : 10), [cartTotal]);
  const total = useMemo(
    () => cartTotal + shippingCost + tax,
    [cartTotal, shippingCost, tax],
  );

  // fetch addresses
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await api.get("/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const addresses = response.data?.data || [];

      if (addresses.length > 0) {
        const defaultAddress =
          addresses.find((a: any) => a.isDefault) || addresses[0];
        // Fallback handlers if backend wraps data differently
        setSelectedAddress(defaultAddress);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No addresses found",
        });
        router.push("/addresses" as any);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedAddress) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a shipping address",
      });
      return;
    }

    if (paymentMethod === "card") {
      Toast.show({
        type: "error",
        text1: "Info",
        text2: "Card payment is not implemented yet",
      });
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const payload = {
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod === "cod" ? "cash" : "card",
        note: "Order placed from mobile app",
      };

      const response = await api.post("/orders", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.success) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message,
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Order Placed",
        text2: "Your order was placed successfully!",
      });

      clearCart();
      router.replace("/orders" as any);
    } catch (error: any) {
      
      Toast.show({
        type: "error",
        text1: "Checkout Failed",
        text2: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAddress, paymentMethod, getToken, clearCart, router]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Checkout" showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Shipping Address ── */}
        <SectionTitle text="Shipping Address" />
        {selectedAddress ? (
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text className="text-sm font-bold text-primary ml-2">
                {selectedAddress.type}
              </Text>
            </View>
            <Text className="text-sm text-secondary">
              {selectedAddress.street}
            </Text>
            <Text className="text-sm text-secondary">
              {selectedAddress.city}, {selectedAddress.state}{" "}
              {selectedAddress.zipCode}
            </Text>
            <Text className="text-sm text-secondary">
              {selectedAddress.country}
            </Text>
            <Pressable
              onPress={() => router.push("/addresses" as any)}
              className="mt-3 self-start"
            >
              <Text className="text-xs text-accent font-bold">
                Change Address
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push("/addresses" as any)}
            className="bg-white rounded-xl p-4 mb-4 items-center"
          >
            <Ionicons name="add-circle-outline" size={24} color="#555" />
            <Text className="text-sm text-secondary mt-1">
              Add a shipping address
            </Text>
          </Pressable>
        )}

        {/* ── Order Items ── */}
        <SectionTitle text={`Order Items (${cartItems.length})`} />
        <View className="bg-white rounded-xl p-4 mb-4">
          {cartItems.map((item, index) => (
            <View
              key={`${item.id}-${item.size}-${index}`}
              className={`flex-row items-center ${
                index < cartItems.length - 1
                  ? "mb-3 pb-3 border-b border-gray-100"
                  : ""
              }`}
            >
              <Image
                source={{ uri: item.product.images?.[0] }}
                style={{ width: 52, height: 52, borderRadius: 8 }}
                contentFit="cover"
                transition={100}
              />
              <View className="flex-1 ml-3">
                <Text className="text-sm text-primary" numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text className="text-xs text-secondary mt-0.5">
                  Qty: {item.quantity}
                  {item.size ? ` · Size: ${item.size}` : ""}
                </Text>
              </View>
              <Text className="text-sm font-bold text-primary">
                ${(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Payment Method ── */}
        <SectionTitle text="Payment Method" />
        <View className="mb-4">
          {PAYMENT_OPTIONS.map((opt) => {
            const active = paymentMethod === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setPaymentMethod(opt.key)}
                className={`bg-white p-4 rounded-xl mb-2 flex-row items-center border-2 ${
                  active ? "border-primary" : "border-transparent"
                }`}
              >
                <Ionicons
                  name={opt.icon}
                  size={24}
                  color={active ? COLORS.primary : "#555"}
                />
                <View className="flex-1 ml-3">
                  <Text className="text-sm text-primary">{opt.title}</Text>
                  <Text className="text-xs text-secondary">{opt.subtitle}</Text>
                </View>
                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Order Summary ── */}
        <SectionTitle text="Order Summary" />
        <View className="bg-white rounded-xl p-4">
          <Row label="Subtotal" value={`$${cartTotal.toFixed(2)}`} />
          <Row label="Shipping" value={`$${shippingCost.toFixed(2)}`} />
          <Row label="Tax" value={`$${tax.toFixed(2)}`} />
          <View className="border-t border-gray-100 mt-2 pt-2 flex-row justify-between">
            <Text className="text-base font-bold text-primary">Total</Text>
            <Text className="text-base font-bold text-primary">
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pb-8 pt-4 shadow-md">
        <View className="flex-row justify-between mb-3">
          <Text className="text-base text-secondary">Total</Text>
          <Text className="text-xl font-bold text-primary">
            ${total.toFixed(2)}
          </Text>
        </View>
        <Pressable
          onPress={handlePlaceOrder}
          disabled={loading || !selectedAddress}
          className={`py-3.5 rounded-full ${
            loading || !selectedAddress ? "bg-gray-300" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base text-center">
              Place Order
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ── Helpers ── */
function SectionTitle({ text }: { text: string }) {
  return <Text className="text-base font-bold text-primary mb-2">{text}</Text>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between mb-1.5">
      <Text className="text-sm text-secondary">{label}</Text>
      <Text className="text-sm text-primary">{value}</Text>
    </View>
  );
}
