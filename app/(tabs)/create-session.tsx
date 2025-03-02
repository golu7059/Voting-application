import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function CreateSessionScreen() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [candidates, setCandidates] = useState([{ name: "" }]);
  const [sessionCode, setSessionCode] = useState("");

  // Generate a unique session code
  const generateSessionCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSessionCode(code);
  };

  // Add a new candidate
  const addCandidate = () => {
    setCandidates([...candidates, { name: "" }]);
  };

  // Update candidate name
  const updateCandidate = (index:any, value:any) => {
    const newCandidates = [...candidates];
    newCandidates[index].name = value;
    setCandidates(newCandidates);
  };

  // Remove a candidate
  const removeCandidate = (index:any) => {
    const newCandidates = candidates.filter((_, i) => i !== index);
    setCandidates(newCandidates);
  };

  // Submit data to API
  const handleCreateSession = async () => {
    if (!sessionName.trim() || !sessionDescription.trim() || candidates.some((c) => !c.name.trim())) {
      alert("Please fill all fields before generating.");
      return;
    }

    generateSessionCode(); // Generate session code before sending

    const sessionData = {
      sessionName,
      sessionDescription,
      sessionCode,
      candidates,
    };

    try {
      // Replace with your actual API URL
      const response = await axios.post("https://your-api.com/create-session", sessionData);
      console.log("Session Created:", response.data);

      // Navigate to QR Code Page
      router.push({
        pathname: "/session-share",
        params: { sessionCode },
      });
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#1E1E1E", padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 20 }}>📝 Create Voting Session</Text>

      {/* Session Name */}
      <TextInput
        placeholder="Enter Session Name"
        placeholderTextColor="#aaa"
        style={{ backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 10, fontSize: 16, width: "100%", marginBottom: 15 }}
        value={sessionName}
        onChangeText={setSessionName}
      />

      {/* Session Description */}
      <TextInput
        placeholder="Enter Session Description"
        placeholderTextColor="#aaa"
        multiline
        style={{ backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 10, fontSize: 16, width: "100%", marginBottom: 15 }}
        value={sessionDescription}
        onChangeText={setSessionDescription}
      />

      {/* Candidates Section */}
      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 10 }}>Candidates</Text>
      {candidates.map((candidate, index) => (
        <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <TextInput
            placeholder={`Candidate ${index + 1}`}
            placeholderTextColor="#aaa"
            style={{ backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 10, fontSize: 16, flex: 1 }}
            value={candidate.name}
            onChangeText={(value) => updateCandidate(index, value)}
          />
          {index > 0 && (
            <TouchableOpacity onPress={() => removeCandidate(index)} style={{ marginLeft: 10 }}>
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Add Candidate Button */}
      <TouchableOpacity onPress={addCandidate} style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <Ionicons name="add-circle-outline" size={24} color="#00ff00" style={{ marginRight: 5 }} />
        <Text style={{ color: "#00ff00", fontSize: 18 }}>Add Candidate</Text>
      </TouchableOpacity>

      {/* Generate & Create Session Button */}
      <TouchableOpacity
        style={{ backgroundColor: "#28A745", padding: 12, borderRadius: 10, width: "100%", alignItems: "center" }}
        onPress={handleCreateSession}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Generate & Create Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
