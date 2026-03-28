import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  Text,
  Pressable,
  View,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/main-header";
import { COLORS } from "@/assets/constants";
import type { Address } from "@/assets/constants/types";
import { dummyAddress } from "@/assets/assets";

const ADDRESS_TYPES = ["Home", "Work", "Other"] as const;

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  Work: "briefcase-outline",
  Other: "location-outline",
};

const INITIAL_FORM = {
  type: "Home" as string,
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  isDefault: false,
};

export default function Addresses() {
  const addresses = useMemo(() => dummyAddress as Address[], []);
  const { height: screenHeight } = useWindowDimensions();

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateField = useCallback(
    (field: string, value: string | boolean) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setIsEditing(false);
    setEditingId(null);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const handleEdit = useCallback((item: Address) => {
    setIsEditing(true);
    setEditingId(item._id);
    setForm({
      type: item.type,
      street: item.street,
      city: item.city,
      state: item.state,
      zipCode: item.zipCode,
      country: item.country,
      isDefault: item.isDefault,
    });
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  const handleDelete = useCallback((id: string) => {
    // Implement delete logic
  }, []);

  /* ── Address Card ── */
  const renderItem = useCallback(
    ({ item }: { item: Address }) => (
      <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-surface items-center justify-center">
              <Ionicons
                name={ICON_MAP[item.type] ?? "location-outline"}
                size={18}
                color={COLORS.primary}
              />
            </View>
            <Text className="text-base font-bold text-primary ml-2.5">
              {item.type}
            </Text>
            {item.isDefault && (
              <View className="bg-primary/10 px-2.5 py-1 rounded-full ml-2">
                <Text className="text-primary text-xs font-bold">Default</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => handleEdit(item)}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-surface items-center justify-center"
            >
              <Ionicons name="pencil-outline" size={16} color="#888" />
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item._id)}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-red-50 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={16} color="#FF4C3B" />
            </Pressable>
          </View>
        </View>

        <Text className="text-sm text-secondary leading-5 ml-11">
          {item.street}
        </Text>
        <Text className="text-sm text-secondary leading-5 ml-11">
          {item.city}, {item.state} {item.zipCode}, {item.country}
        </Text>
      </View>
    ),
    [handleEdit, handleDelete],
  );

  /* ── Add Button Footer ── */
  const ListFooter = useMemo(
    () => (
      <Pressable
        onPress={openAddModal}
        className="flex-row items-center justify-center py-4 border-2 border-dashed border-gray-200 rounded-2xl mt-1 mb-8 active:bg-gray-50"
      >
        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2">
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </View>
        <Text className="text-primary font-bold text-sm">Add New Address</Text>
      </Pressable>
    ),
    [openAddModal],
  );

  // Responsive modal height — leaves room for status bar
  const modalHeight = Math.min(screenHeight * 0.85, 700);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Shipping Addresses" showBack />

      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text className="text-center text-secondary mt-3 text-base">
              No addresses found
            </Text>
            <Text className="text-center text-secondary mt-1 text-sm">
              Add a shipping address to get started
            </Text>
          </View>
        }
        ListFooterComponent={ListFooter}
      />

      {/* ── Add / Edit Modal ── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setModalVisible(false)}
          />
          <View
            className="bg-white rounded-t-3xl px-6 pt-6 pb-4"
            style={{ maxHeight: modalHeight }}
          >
            {/* Drag Handle */}
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-4" />

            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-primary">
                {isEditing ? "Edit Address" : "Add New Address"}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={10}
                className="w-9 h-9 rounded-full bg-surface items-center justify-center"
              >
                <Ionicons name="close" size={20} color={COLORS.primary} />
              </Pressable>
            </View>

            {/* Modal Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type Selector */}
              <FormLabel text="Label" />
              <View className="flex-row gap-3 mb-5">
                {ADDRESS_TYPES.map((t) => {
                  const active = form.type === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => updateField("type", t)}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        active
                          ? "bg-primary border-primary"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Ionicons
                        name={ICON_MAP[t] ?? "location-outline"}
                        size={16}
                        color={active ? "#fff" : "#888"}
                        style={{ marginBottom: 2 }}
                      />
                      <Text
                        className={`text-sm font-medium ${
                          active ? "text-white" : "text-primary"
                        }`}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Street */}
              <FormLabel text="Street Address" />
              <TextInput
                className="bg-surface p-4 rounded-xl text-primary mb-4"
                placeholder="123 Main St"
                placeholderTextColor="#aaa"
                value={form.street}
                onChangeText={(v) => updateField("street", v)}
              />

              {/* City / State */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <FormLabel text="City" />
                  <TextInput
                    className="bg-surface p-4 rounded-xl text-primary"
                    placeholder="New York"
                    placeholderTextColor="#aaa"
                    value={form.city}
                    onChangeText={(v) => updateField("city", v)}
                  />
                </View>
                <View className="flex-1">
                  <FormLabel text="State" />
                  <TextInput
                    className="bg-surface p-4 rounded-xl text-primary"
                    placeholder="NY"
                    placeholderTextColor="#aaa"
                    value={form.state}
                    onChangeText={(v) => updateField("state", v)}
                  />
                </View>
              </View>

              {/* Zip / Country */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <FormLabel text="Zip Code" />
                  <TextInput
                    className="bg-surface p-4 rounded-xl text-primary"
                    placeholder="10001"
                    placeholderTextColor="#aaa"
                    value={form.zipCode}
                    onChangeText={(v) => updateField("zipCode", v)}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <FormLabel text="Country" />
                  <TextInput
                    className="bg-surface p-4 rounded-xl text-primary"
                    placeholder="USA"
                    placeholderTextColor="#aaa"
                    value={form.country}
                    onChangeText={(v) => updateField("country", v)}
                  />
                </View>
              </View>

              {/* Default Checkbox */}
              <Pressable
                className="flex-row items-center mb-6"
                onPress={() => updateField("isDefault", !form.isDefault)}
              >
                <View
                  className={`w-6 h-6 border-2 rounded-md mr-3 items-center justify-center ${
                    form.isDefault
                      ? "bg-primary border-primary"
                      : "border-gray-300"
                  }`}
                >
                  {form.isDefault && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text className="text-sm text-primary">
                  Set as default address
                </Text>
              </Pressable>

              {/* Save Button */}
              <Pressable
                className={`w-full py-4 rounded-full items-center mb-6 ${
                  submitting ? "bg-gray-300" : "bg-primary active:opacity-90"
                }`}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    {isEditing ? "Update Address" : "Save Address"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Helper ── */
function FormLabel({ text }: { text: string }) {
  return (
    <Text className="text-sm text-secondary font-medium mb-1.5">{text}</Text>
  );
}
