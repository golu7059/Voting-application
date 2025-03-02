import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ResultsScreen() {
  const { A = 0, B = 0 } = useLocalSearchParams<{ A?: string; B?: string }>();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Voting Results:</Text>
      <Text style={{ fontSize: 16 }}>Option A: {A} votes</Text>
      <Text style={{ fontSize: 16 }}>Option B: {B} votes</Text>
    </View>
  );
}
