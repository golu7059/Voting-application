import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E", padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 20 }}>🔵 Voting App</Text>

      {/* QR Code / Session Entry */}
      <View style={{ width: "100%", marginBottom: 15 }}>
        <TextInput
          placeholder="Enter Session Code"
          placeholderTextColor="#aaa"
          style={{
            backgroundColor: "#333",
            color: "#fff",
            padding: 12,
            borderRadius: 10,
            fontSize: 16,
            width: "100%",
          }}
          value={sessionCode}
          onChangeText={setSessionCode}
        />
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: "#007AFF",
          padding: 12,
          borderRadius: 10,
          width: "100%",
          alignItems: "center",
          marginBottom: 15,
          flexDirection: "row",
          justifyContent: "center",
        }}
        onPress={() => router.push(`/vote?session=${sessionCode}`)}
      >
        <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Enter Voting Session</Text>
      </TouchableOpacity>

      {/* Create Session */}
      <TouchableOpacity
        style={{
          backgroundColor: "#28A745",
          padding: 12,
          borderRadius: 10,
          width: "100%",
          alignItems: "center",
          marginBottom: 15,
          flexDirection: "row",
          justifyContent: "center",
        }}
        onPress={() => router.push("/create-session")}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Create Voting Session</Text>
      </TouchableOpacity>

      {/* View Results */}
      <TouchableOpacity
        style={{
          backgroundColor: "#FFC107",
          padding: 12,
          borderRadius: 10,
          width: "100%",
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
        onPress={() => router.push("/results")}
      >
        <Ionicons name="bar-chart-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>View Results</Text>
      </TouchableOpacity>
    </View>
  );
}
