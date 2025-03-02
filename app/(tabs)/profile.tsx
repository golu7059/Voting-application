import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getAuthToken, clearAuthData, getUserData, storeUserData } from "../../utils/authStorage";
import { API_BASE_URL } from "../../utils/apiConfig";
import AuthProtectedScreen from "../../components/AuthProtectedScreen";

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  gender: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the AuthProtectedScreen component to ensure authentication
  return (
    <AuthProtectedScreen>
      <ProfileContent 
        profile={profile}
        setProfile={setProfile}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />
    </AuthProtectedScreen>
  );
}

// Separate component for the profile content
interface ProfileContentProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

function ProfileContent({ profile, setProfile, loading, setLoading, error, setError }: ProfileContentProps) {
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get cached profile data first
      const cachedUser = await getUserData();
      if (cachedUser) {
        setProfile(cachedUser as UserProfile);
      }
      
      // Get token for API call
      const token = await getAuthToken();
      
      if (!token) {
        setError("Authentication required");
        router.replace("/Signin");
        return;
      }

      // Fetch latest profile data from API
      const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.user) {
        setProfile(response.data.user);
        // Update cached user data
        await storeUserData(response.data.user);
      } else {
        setError("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.response?.data?.message || "Failed to load profile");
      
      if (err.response?.status === 401) {
        // Token expired or invalid
        await clearAuthData();
        router.replace("/Signin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await clearAuthData();
            router.replace("/Signin");
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitials}>
              {profile?.firstName?.charAt(0) || ""}
              {profile?.lastName?.charAt(0) || ""}
            </Text>
          </View>
        </View>
        
        <Text style={styles.name}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.role}>{profile?.role}</Text>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color="#aaa" />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={20} color="#aaa" />
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{profile?.phoneNumber}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={20} color="#aaa" />
          <Text style={styles.infoLabel}>Gender</Text>
          <Text style={styles.infoValue}>{profile?.gender}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color="#aaa" />
          <Text style={styles.infoLabel}>Date of Birth</Text>
          <Text style={styles.infoValue}>
            {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not provided"}
          </Text>
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={20} color="#aaa" />
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {profile?.createdAt ? formatDate(profile.createdAt) : "Unknown"}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#1E1E1E",
  },
  errorText: {
    color: "#ff6b6b",
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: "#4da6ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#292929",
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#28A745",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: "#aaa",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  infoLabel: {
    fontSize: 16,
    color: "#aaa",
    width: 100,
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
    textAlign: "right",
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: "#4da6ff",
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  versionInfo: {
    padding: 20,
    alignItems: "center",
  },
  versionText: {
    color: "#777",
    fontSize: 14,
  },
});
