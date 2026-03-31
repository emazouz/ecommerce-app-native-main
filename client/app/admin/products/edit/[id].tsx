import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  Pressable,
  View,
  Switch,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import Toast from "react-native-toast-message";
import { COLORS, CATEGORIES } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { Product } from "@/constants/types";
import { useAuth } from "@clerk/expo";
import api from "@/constants/api";

export default function EditProduct() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    sizes: "",
    isFeatured: false,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data?.success) {
          const p = response.data.data;
          setProduct(p);
          
          const cat = typeof p.category === "object" ? p.category.name : p.category;
          const szs = Array.isArray(p.sizes) ? p.sizes.join(", ") : (p.sizes ?? "");
          
          setForm({
            name: p.name,
            description: p.description ?? "",
            price: String(p.price),
            stock: String(p.stock),
            category: cat,
            sizes: szs,
            isFeatured: p.isFeatured,
          });
          setExistingImages(p.images ?? []);
        } else {
          Toast.show({ type: "error", text1: "Error", text2: "Product not found" });
          router.back();
        }
      } catch (err) {
        console.error("Failed to fetch product", err);
        Toast.show({ type: "error", text1: "Error", text2: "Network error" });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, router]);

  const totalImages = existingImages.length + newImages.length;

  const updateField = useCallback(
    (field: string, value: string | boolean) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const pickImages = useCallback(async () => {
    const remaining = 5 - totalImages;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  }, [totalImages]);

  const removeExisting = useCallback((i: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const removeNew = useCallback((i: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const selectCategory = useCallback((name: string) => {
    setForm((prev) => ({ ...prev, category: name }));
    setCategoryModalVisible(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.name || !form.price || !form.sizes) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill in all required fields",
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) {
        Toast.show({ type: "error", text1: "Authentication Error", text2: "Please log in again" });
        router.replace("/sign-in");
        return;
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("stock", form.stock || "0");
      formData.append("category", form.category);
      formData.append("isFeatured", String(form.isFeatured));
      formData.append("sizes", form.sizes);

      existingImages.forEach((img) => formData.append("existingImages", img));

      for (const [i, uri] of newImages.entries()) {
        const filename = `new-image-${i}.jpg`;
        if (Platform.OS === "web") {
          const blob = await (await fetch(uri)).blob();
          formData.append(
            "images",
            // @ts-ignore: File is web API
            new File([blob], filename, { type: "image/jpeg" }),
          );
        } else {
          formData.append("images", {
            uri,
            name: filename,
            type: "image/jpeg",
          } as any);
        }
      }

      // Use native fetch to bypass Axios FormData limitations in React Native
      const url = `${api.defaults.baseURL}/products/${id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // automatically sets Content-Type for FormData boundary
        },
        body: formData,
      });

      const responseData = await res.json();

      if (!responseData.success) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: responseData.message || "Failed to update product",
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Updated",
        text2: "Product updated successfully",
      });
      router.back();
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Failed to Update",
        text2: error?.message ?? "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }, [form, existingImages, newImages, router, id, getToken]);

  // Loading Product state
  if (loading) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Product not found
  if (!product) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text className="text-secondary mt-3">Product not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-2.5 rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

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
            <Text className="text-sm text-primary">
              {form.category || "Select Category"}
            </Text>
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
          <FieldLabel text={`Images (${totalImages}/5)`} />
          <View className="mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {existingImages.map((uri, i) => (
                <View key={`e-${i}`} className="relative">
                  <Image
                    source={{ uri }}
                    style={{ width: 100, height: 100, borderRadius: 12 }}
                    contentFit="cover"
                    transition={100}
                    cachePolicy="memory-disk"
                  />
                  <Pressable
                    onPress={() => removeExisting(i)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </View>
              ))}
              {newImages.map((uri, i) => (
                <View key={`n-${i}`} className="relative">
                  <Image
                    source={{ uri }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: COLORS.primary,
                    }}
                    contentFit="cover"
                    transition={100}
                  />
                  <Pressable
                    onPress={() => removeNew(i)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </View>
              ))}
              {totalImages < 5 && (
                <Pressable
                  onPress={pickImages}
                  className="w-[100px] h-[100px] rounded-xl bg-surface border-2 border-dashed border-gray-200 items-center justify-center active:bg-gray-100"
                >
                  <Ionicons name="add" size={24} color="#888" />
                  <Text className="text-xs text-secondary mt-1">Add</Text>
                </Pressable>
              )}
            </ScrollView>
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
                Update Product
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
