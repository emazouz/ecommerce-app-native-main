import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  Pressable,
  View,
  Switch,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Toast from "react-native-toast-message";
import { COLORS, CATEGORIES } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import api from "@/constants/api";

const INITIAL_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "Men",
  sizes: "",
  isFeatured: false,
};

export default function AddProduct() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const updateField = useCallback(
    (field: string, value: string | boolean) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const pickImages = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5),
      );
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.category || !form.sizes) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill in all required fields",
      });
      return;
    }
    setSubmitting(true);
    // Simulate submission

    try {
      const token = await getToken();
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Please log in again",
        });
        router.replace("/sign-in");
        return;
      }

      // Format data
      const formData = new FormData();

      const fields = {
        name: form.name,
        description: form.description,
        price: form.price,
        stock: form.stock || "0",
        category: form.category,
        sizes: form.sizes,
        isFeatured: String(form.isFeatured),
      };

      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // images
      for (const [index, uri] of images.entries()) {
        const filename = `image_${index}.jpg`;
        formData.append("images", {
          uri,
          name: filename,
          type: "image/jpeg",
        } as any);
      }

      // Use native fetch to bypass Axios FormData limitations in React Native
      const url = api.defaults.baseURL + "/products";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do not set Content-Type here; fetch will automatically set it to multipart/form-data with the correct boundary
        },
        body: formData,
      });

      const responseData = await res.json();

      if (!responseData.success) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: responseData.message || "Failed to add product",
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Product Added",
        text2: "Product added successfully",
      });
      router.replace("/admin/products");
    } catch (error) {
      console.error("Failed to add product:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add product",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectCategory = useCallback((name: string) => {
    setForm((prev) => ({ ...prev, category: name }));
    setCategoryModalVisible(false);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-surface"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white p-5 rounded-2xl shadow-sm">
          {/* Name */}
          <FieldLabel text="Product Name" required />
          <TextInput
            className="bg-surface p-4 rounded-xl text-primary mb-4"
            placeholder="e.g. Wireless Headphones"
            placeholderTextColor="#aaa"
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
          />

          {/* Price & Stock Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <FieldLabel text="Price ($)" required />
              <TextInput
                className="bg-surface p-4 rounded-xl text-primary"
                placeholder="0.00"
                placeholderTextColor="#aaa"
                keyboardType="decimal-pad"
                value={form.price}
                onChangeText={(v) => updateField("price", v)}
              />
            </View>
            <View className="flex-1">
              <FieldLabel text="Stock" />
              <TextInput
                className="bg-surface p-4 rounded-xl text-primary"
                placeholder="0"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
                value={form.stock}
                onChangeText={(v) => updateField("stock", v)}
              />
            </View>
          </View>

          {/* Category */}
          <FieldLabel text="Category" />
          <Pressable
            onPress={() => setCategoryModalVisible(true)}
            className="bg-surface p-4 rounded-xl mb-4 flex-row justify-between items-center"
          >
            <Text className="text-primary text-sm">{form.category}</Text>
            <Ionicons name="chevron-down" size={18} color="#888" />
          </Pressable>

          {/* Sizes */}
          <FieldLabel text="Sizes (comma separated)" required />
          <TextInput
            className="bg-surface p-4 rounded-xl text-primary mb-4"
            placeholder="e.g. S, M, L, XL"
            placeholderTextColor="#aaa"
            value={form.sizes}
            onChangeText={(v) => updateField("sizes", v)}
          />

          {/* Images */}
          <FieldLabel text="Product Images (max 5)" />
          <View className="mb-4">
            {images.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {images.map((uri, i) => (
                  <View key={i} className="relative">
                    <Image
                      source={{ uri }}
                      style={{ width: 100, height: 100, borderRadius: 12 }}
                      contentFit="cover"
                      transition={100}
                    />
                    <Pressable
                      onPress={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </Pressable>
                  </View>
                ))}
                {images.length < 5 && (
                  <Pressable
                    onPress={pickImages}
                    className="w-[100px] h-[100px] rounded-xl bg-surface border border-dashed border-gray-300 items-center justify-center"
                  >
                    <Ionicons name="add" size={24} color="#888" />
                  </Pressable>
                )}
              </ScrollView>
            ) : (
              <Pressable
                onPress={pickImages}
                className="w-full h-28 rounded-xl bg-surface justify-center items-center border-2 border-dashed border-gray-200"
              >
                <Ionicons name="cloud-upload-outline" size={28} color="#888" />
                <Text className="text-secondary text-xs mt-2">
                  Tap to upload images
                </Text>
              </Pressable>
            )}
          </View>

          {/* Description */}
          <FieldLabel text="Description" />
          <TextInput
            className="bg-surface p-4 rounded-xl text-primary mb-4"
            placeholder="Describe the product..."
            placeholderTextColor="#aaa"
            multiline
            style={{ minHeight: 96, textAlignVertical: "top" }}
            value={form.description}
            onChangeText={(v) => updateField("description", v)}
          />

          {/* Featured */}
          <View className="flex-row justify-between items-center mb-6 bg-surface p-4 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="star-outline" size={18} color={COLORS.primary} />
              <Text className="text-primary font-bold ml-2">
                Featured Product
              </Text>
            </View>
            <Switch
              value={form.isFeatured}
              onValueChange={(v) => updateField("isFeatured", v)}
              trackColor={{ false: "#ddd", true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 rounded-full items-center ${
              submitting ? "bg-gray-300" : "bg-primary active:opacity-90"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Create Product
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Category Modal ── */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setCategoryModalVisible(false)}
        />
        <View className="bg-white rounded-t-3xl px-6 pt-5 pb-8 max-h-[50%]">
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-4" />
          <Text className="text-lg font-bold text-primary text-center mb-4">
            Select Category
          </Text>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = form.category === item.name;
              return (
                <Pressable
                  onPress={() => selectCategory(item.name)}
                  className={`flex-row items-center justify-between p-4 rounded-xl mb-1 ${
                    active ? "bg-primary/5" : ""
                  }`}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={active ? COLORS.primary : "#888"}
                    />
                    <Text
                      className={`ml-3 text-sm ${
                        active ? "font-bold text-primary" : "text-secondary"
                      }`}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {active && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ── Helper ── */
function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text className="text-xs text-secondary font-bold mb-1.5 uppercase">
      {text}
      {required ? " *" : ""}
    </Text>
  );
}
