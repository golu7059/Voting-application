import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert, Share } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getAuthToken } from "../../utils/authStorage";
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';

interface Option {
  name: string;
  imageUrl: string;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [options, setOptions] = useState<Option[]>([
    { name: "", imageUrl: "" },
    { name: "", imageUrl: "" }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [showSuccessView, setShowSuccessView] = useState(false);

  // Add a new option
  const addOption = () => {
    setOptions([...options, { name: "", imageUrl: "" }]);
  };

  // Update option name
  const updateOptionName = (index: number, name: string) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    setOptions(newOptions);
  };

  // Update option image URL
  const updateOptionImageUrl = (index: number, url: string) => {
    const newOptions = [...options];
    newOptions[index].imageUrl = url;
    setOptions(newOptions);
  };

  // Remove an option
  const removeOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert("Error", "You need at least two options for voting");
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  // Validate form
  const validateForm = () => {
    if (!title.trim()) {
      setErrorMessage("Event title is required");
      return false;
    }

    if (!description.trim()) {
      setErrorMessage("Event description is required");
      return false;
    }
    
    if (options.length < 2) {
      setErrorMessage("At least two options are required");
      return false;
    }
    
    // Check if all options have names
    for (let i = 0; i < options.length; i++) {
      if (!options[i].name.trim()) {
        setErrorMessage(`Option ${i + 1} name is required`);
        return false;
      }
    }
    
    return true;
  };

  // Submit data to API
  const handleCreateEvent = async () => {
    // Reset error message
    setErrorMessage("");
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Get auth token
      const token = await getAuthToken();
      
      if (!token) {
        setErrorMessage("Authentication required. Please sign in.");
        router.replace("/Signin");
        return;
      }
      
      // Prepare request data
      const eventData = {
        title,
        description,
        imageUrl,
        options
      };
      
      // Make API request
      const response = await axios.post(
        "http://127.0.0.1:3001/api/event/create/",
        eventData,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );
      
      console.log("Event created successfully:", response.data);
      
      if (response.data && response.data.eventId ) {
        setCreatedEventId(response.data.eventId);
        setShowSuccessView(true);
      } else {
        setErrorMessage("Failed to get event ID from the server");
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Failed to create event. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async () => {
    if (createdEventId) {
      await Clipboard.setStringAsync(createdEventId);
      Alert.alert("Copied", "Event ID copied to clipboard");
    }
  };

  const shareEventId = async () => {
    if (createdEventId) {
      try {
        await Share.share({
          message: `Join my voting event! Use this code: ${createdEventId}`,
          url: `http://localhost:8081/vote?session=${createdEventId}`,
        });
      } catch (error) {
        console.error("Error sharing event ID:", error);
      }
    }
  };

  const goToEventPage = () => {
    if (createdEventId) {
      router.replace({
        pathname: "/vote",
        params: { session: createdEventId }
      });
    }
  };

  const startNewEvent = () => {
    setCreatedEventId(null);
    setShowSuccessView(false);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setOptions([
      { name: "", imageUrl: "" },
      { name: "", imageUrl: "" }
    ]);
  };

  // Show success screen with QR code and event ID
  if (showSuccessView && createdEventId) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successTitle}>Event Created Successfully!</Text>
        
        {/* Main content centered */}
        <View style={styles.successContent}>
          {/* QR Code centered */}
          <View style={styles.qrContainer}>
            <View style={styles.qrBackground}>
              <QRCode
                value={`http://localhost:8081/vote?session=${createdEventId}`}
                size={250}
                backgroundColor="white"
                color="black"
              />
            </View>
          </View>
          
          {/* Event ID directly below QR code */}
          <View style={styles.eventIdBox}>
            <Text style={styles.eventIdTitle}>Event ID</Text>
            <Text style={styles.eventId}>{createdEventId}</Text>
          </View>
          
          {/* Copy button */}
          <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
            <Ionicons name="copy-outline" size={20} color="#fff" />
            <Text style={styles.copyButtonText}>Copy Event ID</Text>
          </TouchableOpacity>
        </View>
        
        {/* Action buttons at bottom */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={shareEventId}>
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.goToEventButton} onPress={goToEventPage}>
            <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Go to Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.newEventButton} onPress={startNewEvent}>
            <Ionicons name="add-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>New Event</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.helpText}>
          Share this code or QR with participants to allow them to join your voting event
        </Text>
      </View>
    );
  }

  // Regular form view
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Voting Event</Text>

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Title Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Event Title</Text>
        <TextInput
          placeholder="Enter event title"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Description Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Event Description</Text>
        <TextInput
          placeholder="Enter event description"
          placeholderTextColor="#aaa"
          multiline
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Image URL Input (Optional) */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Image URL (Optional)</Text>
        <TextInput
          placeholder="Enter image URL"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
        />
      </View>

      {/* Options Section */}
      <Text style={styles.sectionTitle}>Options / Candidates</Text>
      
      {options.map((option, index) => (
        <View key={index} style={styles.optionContainer}>
          <Text style={styles.optionHeader}>Option {index + 1}</Text>
          
          {/* Option Name Input */}
          <TextInput
            placeholder={`Enter option ${index + 1} name`}
            placeholderTextColor="#aaa"
            style={styles.input}
            value={option.name}
            onChangeText={(value) => updateOptionName(index, value)}
          />
          
          {/* Option Image URL Input */}
          <TextInput
            placeholder="Enter image URL (optional)"
            placeholderTextColor="#aaa"
            style={[styles.input, { marginTop: 10 }]}
            value={option.imageUrl}
            onChangeText={(value) => updateOptionImageUrl(index, value)}
          />
          
          {options.length > 2 && (
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeOption(index)}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.removeButtonText}>Remove Option</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Add Option Button */}
      <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.addOptionText}>Add Another Option</Text>
      </TouchableOpacity>

      {/* Create Event Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateEvent}
        disabled={isCreating}
      >
        {isCreating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.createButtonText}>Create Event</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#1E1E1E",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "rgba(255,0,0,0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: "#ff6b6b",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    marginTop: 10,
  },
  optionContainer: {
    backgroundColor: "#292929",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  optionHeader: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  removeButtonText: {
    color: "#ff6b6b",
    marginLeft: 5,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#333",
    borderRadius: 10,
    marginBottom: 20,
  },
  addOptionText: {
    color: "#fff",
    marginLeft: 5,
  },
  createButton: {
    backgroundColor: "#28A745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between", // Distributes content
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 30,
    marginBottom: 20,
    textAlign: "center",
  },
  successContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  qrBackground: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    // Shadow for the QR code container
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  eventIdBox: {
    alignItems: "center",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#292929",
    borderRadius: 10,
    width: "100%",
  },
  eventIdTitle: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 8,
  },
  eventId: {
    color: "#28A745",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4da6ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 40,
  },
  copyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: "#4da6ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  goToEventButton: {
    backgroundColor: "#28A745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  newEventButton: {
    backgroundColor: "#6c757d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
  },
  helpText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
});
