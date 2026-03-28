import { useAuth, useSignUp } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { type Href, Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  TextInput,
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const isLoading = fetchStatus === "fetching";
  const canSubmit =
    firstName.length > 0 &&
    email.length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !isLoading;

  if (signUp.status === "complete" || isSignedIn) return null;

  const needsVerification =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    const { error } = await signUp.password({
      emailAddress: email,
      password,
      firstName,
      lastName: lastName || undefined,
    } as any);

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    if (!code || isLoading) return;

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          const url = decorateUrl("/");
          router.push(url as Href);
        },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!needsVerification ? (
            <View>
              {/* Back Button */}
              <Pressable
                onPress={() => router.push("/")}
                hitSlop={12}
                className="absolute top-0 left-0 w-10 h-10 rounded-full bg-surface items-center justify-center z-10"
              >
                <Ionicons name="arrow-back" size={20} color="#111" />
              </Pressable>
              {/* Header */}
              <View className="items-center mb-6">
                <View className="w-14 h-14 rounded-2xl bg-primary/5 items-center justify-center mb-3">
                  <Ionicons name="person-add-outline" size={36} color="#111" />
                </View>
                <Text className="text-2xl font-bold text-primary mb-1">
                  Create Account
                </Text>
                <Text className="text-secondary text-sm">
                  Sign up to get started
                </Text>
              </View>

              {/* Errors */}
              {(localError || errors?.fields?.emailAddress) && (
                <View className="flex-row items-center bg-red-50 p-3 rounded-xl mb-3">
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-2 flex-1">
                    {localError || errors?.fields?.emailAddress?.message}
                  </Text>
                </View>
              )}

              {/* Name Row */}
              <View className="mb-2">
                <View className="w-full">
                  <FieldLabel text="First Name" />
                  <InputField
                    icon="person-outline"
                    placeholder="Younes"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoComplete="given-name"
                  />
                </View>
                <View className="w-full">
                  <FieldLabel text="Last Name" />
                  <InputField
                    icon="person-outline"
                    placeholder="Mazouz"
                    value={lastName}
                    onChangeText={setLastName}
                    autoComplete="family-name"
                  />
                </View>
              </View>

              {/* Email */}
              <FieldLabel text="Email" />
              <InputField
                icon="mail-outline"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoComplete="email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Password */}
              <FieldLabel text="Password" />
              <View className="flex-row items-center bg-surface rounded-xl mb-3">
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#888"
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  className="flex-1 p-3.5 text-primary text-sm"
                  placeholder="Min 8 characters"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  className="pr-4"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#888"
                    className="mr-3"
                  />
                </Pressable>
              </View>

              {errors?.fields?.password && (
                <Text className="text-red-500 text-xs mb-2 ml-1">
                  {errors.fields.password.message}
                </Text>
              )}

              {/* Confirm Password */}
              <FieldLabel text="Confirm Password" />
              <View className="flex-row items-center bg-surface rounded-xl mb-1">
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#888"
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  className="flex-1 p-3.5 text-primary text-sm"
                  placeholder="Re-enter password"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {confirmPassword.length > 0 && (
                  <View className="pr-4">
                    <Ionicons
                      name={
                        password === confirmPassword
                          ? "checkmark-circle"
                          : "close-circle"
                      }
                      size={20}
                      color={
                        password === confirmPassword ? "#10B981" : "#EF4444"
                      }
                      className="mr-3"
                    />
                  </View>
                )}
              </View>

              {/* Sign Up Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-4 rounded-full items-center mt-6 mb-4 ${
                  canSubmit ? "bg-primary active:opacity-90" : "bg-gray-200"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Sign Up
                  </Text>
                )}
              </Pressable>

              {/* Footer */}
              <View className="flex-row justify-center">
                <Text className="text-secondary text-sm">
                  Already have an account?{" "}
                </Text>
                <Link href="/sign-in">
                  <Text className="text-primary font-bold text-sm">
                    Sign in
                  </Text>
                </Link>
              </View>

              <View nativeID="clerk-captcha" />
            </View>
          ) : (
            <View>
              {/* Verification Header */}
              <View className="items-center mb-8">
                <View className="w-16 h-16 rounded-2xl bg-primary/5 items-center justify-center mb-4">
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={28}
                    color="#111"
                  />
                </View>
                <Text className="text-3xl font-bold text-primary mb-1">
                  Verify Email
                </Text>
                <Text className="text-secondary text-sm text-center">
                  Enter the code sent to your email
                </Text>
              </View>

              {errors?.fields?.code && (
                <View className="flex-row items-center bg-red-50 p-3 rounded-xl mb-4">
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-2 flex-1">
                    {errors.fields.code.message}
                  </Text>
                </View>
              )}

              <TextInput
                className="w-full bg-surface p-4 rounded-xl text-primary text-center text-xl tracking-[12px] mb-6"
                placeholder="000000"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />

              <Pressable
                onPress={handleVerify}
                disabled={isLoading || !code}
                className={`w-full py-4 rounded-full items-center ${
                  !isLoading && code
                    ? "bg-primary active:opacity-90"
                    : "bg-gray-200"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Verify</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => signUp.verifications.sendEmailCode()}
                className="mt-4 items-center"
              >
                <Text className="text-primary font-bold text-sm">
                  Resend Code
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Helpers ── */
function FieldLabel({ text }: { text: string }) {
  return (
    <Text className="text-sm text-secondary font-medium mb-1.5">{text}</Text>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  autoComplete,
  keyboardType,
  autoCapitalize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  autoComplete?: string;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  return (
    <View className="flex-row items-center bg-surface rounded-xl mb-3">
      <Ionicons name={icon} size={18} color="#888" style={{ marginLeft: 16 }} />
      <TextInput
        className="flex-1 p-3.5 text-primary text-sm"
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoComplete={autoComplete as any}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
