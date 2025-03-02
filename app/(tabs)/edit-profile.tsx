import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getAuthToken, getUserData, storeUserData } from "../../utils/authStorage";
import { API_BASE_URL } from "../../utils/apiConfig";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  role: string;
  gender: string;
  dateOfBirth: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [email, setEmail] = useState(""); // Will be displayed but not editable
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get cached user data first
      const userData = await getUserData();
      if (userData) {
        populateFormWithUserData(userData);
      }
      
      // Get fresh data from API
      const token = await getAuthToken();
      if (!token) {
        setError("Authentication required");
        router.replace("/Signin");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.user) {
        populateFormWithUserData(response.data.user);
        // Update cached user data
        await storeUserData(response.data.user);
      }
    } catch (err: any) {
      console.error("Error fetching profile for editing:", err);
      setError(err.response?.data?.message || "Failed to load profile");
      
      if (err.response?.status === 401) {
        router.replace("/Signin");
      }
    } finally {
      setLoading(false);
    }
  };

  const populateFormWithUserData = (userData: any) => {
    setFirstName(userData.firstName || "");
    setLastName(userData.lastName || "");
    setPhoneNumber(userData.phoneNumber || "");
    setAddress(userData.address || "");
    setGender(userData.gender || "Male");
    setEmail(userData.email || "");
    setUserId(userData._id || null);
    
    // Convert dateOfBirth string to Date object
    if (userData.dateOfBirth) {
      setDateOfBirth(new Date(userData.dateOfBirth));
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatDateForAPI = (date: Date) => {
    return formatDateForDisplay(date);
  };

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const validateInputs = () => {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    
    // Validate phone number (basic 10 digit check)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return "Please enter a valid 10-digit phone number";
    }
    
    return null; // No errors
  };

  const handleSaveProfile = async () => {
    const validationError = validateInputs();
    if (validationError) {
      Alert.alert("Validation Error", validationError);
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

      const profileData = {
        firstName,
        lastName,
        phoneNumber,
        gender,
        dateOfBirth: formatDateForAPI(dateOfBirth),
        address
      };

      // Make API call to update profile
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile/update`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Profile update response:", response.data);
      
      // Update cached user data (combine with existing data)
      const existingUserData = await getUserData() || {};
      const updatedUserData = { ...existingUserData, ...profileData };
      await storeUserData(updatedUserData);
      
      Alert.alert(
        "Success",
        "Profile updated successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error("Error updating profile:", err);
      
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Loading profile information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Email - Read only */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: "#2a2a2a" }]}
              value={email}
              editable={false}
            />
            <Text style={styles.fieldHelp}>Email cannot be changed</Text>
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              placeholder="Enter your first name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              placeholder="Enter your last name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              placeholder="Enter your phone number"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address (Optional)</Text>
            <TextInput
              placeholder="Enter your address"
              placeholderTextColor="#aaa"
              multiline
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                onValueChange={setGender}
                style={styles.picker}
                dropdownIconColor="#fff"
              >
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDateForDisplay(dateOfBirth)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#aaa" />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </>
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
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: "rgba(255,0,0,0.1)",
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4da6ff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
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
  fieldHelp: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#333",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    color: "#fff",
    backgroundColor: "#333",
  },
  dateButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#28A745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
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
