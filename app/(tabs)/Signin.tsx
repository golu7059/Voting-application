import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { storeAuthToken, storeUserData } from "../../utils/authStorage";
import { API_BASE_URL } from "../../utils/apiConfig";

export default function SigninScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignin = async () => {
    // Reset error message
    setErrorMessage("");
    
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Make API request
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email,
        password,
      });

      console.log("Sign-in successful:", response.data);
      
      // Store authentication token securely
      if (response.data.token) {
        await storeAuthToken(response.data.token);
        
        // If user data is also returned, store it
        if (response.data.user) {
          await storeUserData(response.data.user);
        }
        
        // Navigate to main screen
        router.replace("/");
      } else {
        setErrorMessage("Invalid response from server. Missing authentication token.");
      }
    } catch (error: any) {
      console.error("Sign-in error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // router.push("/forgot-password");
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#1E1E1E", padding: 20, justifyContent: "center" }}>
      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Text style={{ fontSize: 32, fontWeight: "bold", color: "#fff" }}>Welcome Back</Text>
        <Text style={{ fontSize: 16, color: "#aaa", marginTop: 8 }}>Sign in to continue</Text>
      </View>

      {errorMessage ? (
        <View style={{ backgroundColor: "rgba(255,0,0,0.1)", padding: 12, borderRadius: 8, marginBottom: 15 }}>
          <Text style={{ color: "#ff6b6b" }}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Email Input */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 10, fontSize: 16, width: "100%" }}
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Password</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#333", borderRadius: 10 }}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}
            style={{ flex: 1, color: "#fff", padding: 12, fontSize: 16 }}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 12 }}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: "flex-end", marginBottom: 20 }}>
        <Text style={{ color: "#4da6ff", fontSize: 14 }}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Sign In Button */}
      <TouchableOpacity
        style={{ backgroundColor: "#28A745", padding: 12, borderRadius: 10, width: "100%", alignItems: "center", marginBottom: 20 }}
        onPress={handleSignin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Register Section */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
        <Text style={{ color: "#aaa", fontSize: 14 }}>Don't have an account? </Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={{ color: "#4da6ff", fontSize: 14, fontWeight: "bold" }}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
