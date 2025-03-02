import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Welcome to Voting App</Text>
      <Button title="Vote Now" onPress={() => router.push("/vote")} />
      <Button title="View Results" onPress={() => router.push("/results")} />
    </View>
  );
}
