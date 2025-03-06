import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from "../../utils/apiConfig";

export default function RegisterScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1));
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const formatDateForDisplay = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleRegister = async () => {
    // Reset error message
    setErrorMessage("");

    // Validate inputs
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword || !address.trim() || !phoneNumber) {
      setErrorMessage("All fields are required");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!validatePhone(phoneNumber)) {
      setErrorMessage("Please enter a valid 10-digit phone number");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("Password must be at least 4 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Format date in YYYY-MM-DD format for API
      const formattedDateOfBirth = formatDateForDisplay(dateOfBirth);
      
      const response = await axios.post(`${API_BASE_URL}/auth/signup/`, {
        email,
        password,
        firstName,
        lastName,
        address,
        phoneNumber,
        gender,
        dateOfBirth: formattedDateOfBirth
      });

      console.log("Registration successful:", response.data);

      // Navigate to sign-in page after successful registration
      router.replace("/Signin");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push("/Signin");
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#1E1E1E", padding: 20 }}>
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <Text style={{ fontSize: 32, fontWeight: "bold", color: "#fff" }}>Create Account</Text>
        <Text style={{ fontSize: 16, color: "#aaa", marginTop: 8 }}>Sign up to get started</Text>
      </View>

      {errorMessage ? (
        <View style={{ backgroundColor: "rgba(255,0,0,0.1)", padding: 12, borderRadius: 8, marginBottom: 15 }}>
          <Text style={{ color: "#ff6b6b" }}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* First Name Input */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>First Name</Text>
        <TextInput
          placeholder="Enter your first name"
          placeholderTextColor="#aaa"
          style={{ backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 10, fontSize: 16, width: "100%" }}
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      {/* Last Name Input */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Last Name</Text>
        <TextInput
          placeholder="Enter your last name"
          placeholderTextColor="#aaa"
          style={{ backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 10, fontSize: 16, width: "100%" }}
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

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

      {/* Phone Number Input */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Phone Number</Text>
        <TextInput
          placeholder="Enter your phone number"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          style={{ backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 10, fontSize: 16, width: "100%" }}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          maxLength={10}
        />
      </View>

      {/* Address Input */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Address</Text>
        <TextInput
          placeholder="Enter your address"
          placeholderTextColor="#aaa"
          multiline
          style={{ backgroundColor: "#333", color: "#fff", padding: 12, borderRadius: 10, fontSize: 16, width: "100%", minHeight: 80 }}
          value={address}
          onChangeText={setAddress}
        />
      </View>

      {/* Gender Picker */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Gender</Text>
        <View style={{ backgroundColor: "#333", borderRadius: 10, overflow: 'hidden', height: 30 }}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
            style={{ color: "#fff", backgroundColor: "#333", width: "100%", padding: 8, borderRadius: 10 }}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      </View>

      {/* Date of Birth */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Date of Birth</Text>
        <TouchableOpacity 
          style={{ backgroundColor: "#333", padding: 12, borderRadius: 10 }}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: "#fff" }}>{formatDateForDisplay(dateOfBirth)}</Text>
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

      {/* Password Input */}
      <View style={{ marginBottom: 15 }}>
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

      {/* Confirm Password Input */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Confirm Password</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#333", borderRadius: 10 }}>
          <TextInput
            placeholder="Confirm your password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showConfirmPassword}
            style={{ flex: 1, color: "#fff", padding: 12, fontSize: 16 }}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 12 }}>
            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Register Button */}
      <TouchableOpacity
        style={{ backgroundColor: "#28A745", padding: 12, borderRadius: 10, width: "100%", alignItems: "center", marginBottom: 20 }}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Create Account</Text>
        )}
      </TouchableOpacity>

      {/* Sign In Section */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
        <Text style={{ color: "#aaa", fontSize: 14 }}>Already have an account? </Text>
        <TouchableOpacity onPress={handleSignIn}>
          <Text style={{ color: "#4da6ff", fontSize: 14, fontWeight: "bold" }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
