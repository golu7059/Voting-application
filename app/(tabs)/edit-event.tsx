import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getAuthToken } from "../../utils/authStorage";

interface Option {
  name: string;
  imageUrl: string;
  _id?: string;
}

interface EventData {
  _id: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl: string;
  options: Option[];
}

export default function EditEventScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError("No event ID provided");
      setLoading(false);
      return;
    }
    
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      
      if (!token) {
        setError("Authentication required");
        router.replace("/Signin");
        return;
      }

      const response = await axios.get(`http://127.0.0.1:3001/api/event/${eventId}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.event) {
        const eventData = response.data.event;
        setTitle(eventData.title);
        setDescription(eventData.description);
        setImageUrl(eventData.imageUrl || "");
        setOptions(eventData.options.map((option: any) => ({
          name: option.name,
          imageUrl: option.imageUrl || "",
          _id: option._id
        })));
      } else {
        setError("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error fetching event details:", err);
      setError(err.response?.data?.message || "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const updateOptionName = (index: number, name: string) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    setOptions(newOptions);
  };

  const updateOptionImageUrl = (index: number, url: string) => {
    const newOptions = [...options];
    newOptions[index].imageUrl = url;
    setOptions(newOptions);
  };

  const handleSaveEvent = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Validation Error", "Title and description are required");
      return;
    }

    if (options.some(option => !option.name.trim())) {
      Alert.alert("Validation Error", "All options must have a name");
      return;
    }

    setSaving(true);
    
    try {
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert("Authentication Required", "Please sign in to continue");
        router.replace("/Signin");
        return;
      }

      const eventData = {
        title,
        description,
        imageUrl,
        options: options.map(option => ({
          name: option.name,
          imageUrl: option.imageUrl,
          _id: option._id
        }))
      };

      // The API call returns the success message we've seen
      const response = await axios.put(
        `http://127.0.0.1:3001/api/event/${eventId}/edit/`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Event update response:", response.data);
      
      // The alert is shown and we're correctly handling the navigation
      Alert.alert(
        "Success",
        "Event updated successfully",
        [
          {
            text: "OK",
            onPress: () => {
              setTimeout(() => {
                router.replace("/my-events");
              }, 500);
            }
          }
        ]
      );
    } catch (err: any) {
      console.error("Error updating event:", err);
      
      // Check for specific API error responses
      if (err.response) {
        console.log("Error response:", err.response.data);
        Alert.alert(
          "Error",
          err.response?.data?.message || "Failed to update event. The server returned an error."
        );
      } else if (err.request) {
        // Request was made but no response received
        Alert.alert(
          "Network Error",
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        // Something happened in setting up the request
        Alert.alert(
          "Error",
          "Failed to update event. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEventData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Event</Text>
      </View>

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

      {/* Image URL Input */}
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
        </View>
      ))}

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveEvent}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={saving}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
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
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: "#4da6ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  saveButton: {
    backgroundColor: "#28A745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
