import { useSignIn } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { type Href, Link, useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
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

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = fetchStatus === "fetching";
  const canSubmit = email.length > 0 && password.length > 0 && !isLoading;
  const needsVerification = signIn.status === "needs_client_trust";

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    const { error } = await signIn.password({
      emailAddress: email,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          const url = decorateUrl("/");
          router.push(url as Href);
        },
      });
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code",
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
  }, [canSubmit, signIn, email, password, router]);

  const handleVerify = useCallback(async () => {
    if (!code || isLoading) return;

    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await signIn.finalize({
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
  }, [code, isLoading, signIn, router]);

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
                className="absolute top-4 left-0 w-10 h-10 rounded-full bg-surface items-center justify-center"
              >
                <Ionicons name="arrow-back" size={20} color="#111" />
              </Pressable>

              {/* Header */}
              <View className="items-center mb-8">
                <View className="w-16 h-16 rounded-2xl bg-primary/5 items-center justify-center mb-4">
                  <Ionicons name="lock-closed-outline" size={36} color="#111" />
                </View>
                <Text className="text-3xl font-bold text-primary mb-1">
                  Welcome Back
                </Text>
                <Text className="text-secondary text-sm">
                  Sign in to continue shopping
                </Text>
              </View>

              {/* Field Errors */}
              {errors?.fields?.identifier && (
                <View className="flex-row items-center bg-red-50 p-3 rounded-xl mb-4">
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-2 flex-1">
                    {errors.fields.identifier.message}
                  </Text>
                </View>
              )}

              {/* Email */}
              <Text className="text-sm text-secondary font-medium mb-1.5">
                Email
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl mb-4">
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#888"
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  className="flex-1 p-4 text-primary text-sm"
                  placeholder="you@example.com"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <Text className="text-sm text-secondary font-medium mb-1.5">
                Password
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl mb-2">
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#888"
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  className="flex-1 p-4 text-primary text-sm"
                  placeholder="••••••••"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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
                <Text className="text-red-500 text-xs mb-4 ml-1">
                  {errors.fields.password.message}
                </Text>
              )}

              {/* Sign In Button */}
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
                    Sign In
                  </Text>
                )}
              </Pressable>

              {/* Footer */}
              <View className="flex-row justify-center mt-4">
                <Text className="text-secondary text-sm">
                  Don&apos;t have an account?{" "}
                </Text>
                <Link href="/sign-up">
                  <Text className="text-primary font-bold text-sm">
                    Sign up
                  </Text>
                </Link>
              </View>
            </View>
          ) : (
            <View>
              {/* Verification Header */}
              <View className="items-center mb-8">
                <View className="w-16 h-16 rounded-2xl bg-primary/5 items-center justify-center mb-4">
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={36}
                    color="#111"
                  />
                </View>
                <Text className="text-3xl font-bold text-primary mb-1">
                  Verify Account
                </Text>
                <Text className="text-secondary text-sm text-center">
                  Enter the code sent to your email
                </Text>
              </View>

              {/* Code Error */}
              {errors?.fields?.code && (
                <View className="flex-row items-center bg-red-50 p-3 rounded-xl mb-4">
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-2 flex-1">
                    {errors.fields.code.message}
                  </Text>
                </View>
              )}

              {/* Code Input */}
              <TextInput
                className="w-full bg-surface p-4 rounded-xl text-primary text-center text-xl tracking-[12px] mb-6"
                placeholder="000000"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />

              {/* Verify Button */}
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

              {/* Resend Code */}
              <Pressable
                onPress={() => signIn.mfa.sendEmailCode()}
                className="mt-4 items-center"
              >
                <Text className="text-primary font-bold text-sm">
                  Resend Code
                </Text>
              </Pressable>

              {/* Start Over */}
              <Pressable
                onPress={() => {
                  signIn.reset();
                  setCode("");
                }}
                className="mt-3 items-center"
              >
                <Text className="text-secondary text-sm">← Start over</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
