import { useState } from "react";
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function VoteScreen() {
  const [votes, setVotes] = useState({ A: 0, B: 0 });
  const router = useRouter();

  const handleVote = (option: "A" | "B") => {
    setVotes((prev) => ({ ...prev, [option]: prev[option] + 1 }));
    router.push({ pathname: "/results", params: votes });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Select an option to vote:</Text>
      <Button title="Option A" onPress={() => handleVote("A")} />
      <Button title="Option B" onPress={() => handleVote("B")} />
    </View>
  );
}
