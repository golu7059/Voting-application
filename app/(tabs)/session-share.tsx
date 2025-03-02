import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";

export default function SessionShareScreen() {
  const router = useRouter();
  const { sessionCode } = useLocalSearchParams();
  const sessionLink = `https://your-app.com/vote?session=${sessionCode}`;

  // Copy to clipboard function
  const copyToClipboard = () => {
    Clipboard.setStringAsync(sessionLink);
    alert("Link copied to clipboard!");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20 }}>📢 Share Voting Session</Text>

      {/* QR Code */}
      <QRCode value={sessionLink} size={200} />

      {/* Shareable Link */}
      <Text style={{ color: "#fff", fontSize: 16, marginTop: 20 }}>{sessionLink}</Text>

      {/* Copy Link Button */}
      <TouchableOpacity
        style={{ backgroundColor: "#007AFF", padding: 12, borderRadius: 10, marginTop: 20 }}
        onPress={copyToClipboard}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Copy Link</Text>
      </TouchableOpacity>

      {/* Go Back Button */}
      <TouchableOpacity
        style={{ backgroundColor: "#FF5733", padding: 12, borderRadius: 10, marginTop: 10 }}
        onPress={() => router.replace("/")}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}
