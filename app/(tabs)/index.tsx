import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { isAuthenticated } from "@/utils/useAuthProtection";
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const translateY = useState(new Animated.Value(50))[0];
  const opacity = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    checkAuth();
    animateIn();
  }, []);
  
  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    setIsLoggedIn(authenticated);
  };
  
  const animateIn = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handleEnterSession = () => {
    if (sessionCode.trim()) {
      router.push(`/vote?session=${sessionCode}`);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image 
            source={require('../../assets/images/vote.png')} 
            style={styles.heroImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Digital Voting</Text>
          <Text style={styles.heroSubtitle}>Simple, secure, and transparent</Text>
        </View>

        {/* Session Entry Card */}
        <Animated.View 
          style={[
            styles.sessionCard,
            { 
              transform: [{ translateY }],
              opacity 
            }
          ]}
        >
          <LinearGradient
            colors={['#363636', '#222222']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardTitle}>Join a Voting Session</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="keypad" size={20} color="#aaa" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter event code"
                placeholderTextColor="#888"
                style={styles.input}
                value={sessionCode}
                onChangeText={setSessionCode}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              style={styles.enterButton}
              onPress={handleEnterSession}
            >
              <LinearGradient
                colors={['#4a9eff', '#2d7edf']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>Enter</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.cardFooter}>
              <Ionicons name="scan-outline" size={14} color="#888" /> Or use the Scan tab to scan a QR code
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.createCard]} 
            onPress={() => router.push("/create-event")}
          >
            <BlurView intensity={15} tint="dark" style={styles.blurView}>
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#28A745', '#218838']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="add" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.actionTitle}>Create Event</Text>
              <Text style={styles.actionSubtitle}>Start a new voting event</Text>
            </BlurView>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.myEventsCard]} 
            onPress={() => router.push("/my-events")}
          >
            <BlurView intensity={15} tint="dark" style={styles.blurView}>
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#9C27B0', '#7B1FA2']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="calendar" size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.actionTitle}>My Events</Text>
              <Text style={styles.actionSubtitle}>Manage your events</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.resultsCard]} 
            onPress={() => router.push("/results")}
          >
            <BlurView intensity={15} tint="dark" style={styles.blurView}>
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#FFC107', '#FFA000']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="bar-chart" size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.actionTitle}>Results</Text>
              <Text style={styles.actionSubtitle}>View voting results</Text>
            </BlurView>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.participatedCard]} 
            onPress={() => router.push("/participated-events")}
          >
            <BlurView intensity={15} tint="dark" style={styles.blurView}>
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#FF9800', '#F57C00']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="checkbox" size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.actionTitle}>Participated</Text>
              <Text style={styles.actionSubtitle}>Your voting history</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
        
        {/* Scan QR CTA */}
        <TouchableOpacity 
          style={styles.scanQRButton} 
          onPress={() => router.push("/scan-qr")}
        >
          <LinearGradient
            colors={['rgba(40, 167, 69, 0.8)', 'rgba(33, 136, 56, 0.9)']}
            style={styles.scanButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.scanIconContainer}>
              <Ionicons name="qr-code" size={28} color="#fff" />
            </View>
            <View style={styles.scanTextContainer}>
              <Text style={styles.scanTitle}>Scan QR Code</Text>
              <Text style={styles.scanSubtitle}>Quickly join an event by scanning</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" style={styles.scanArrow} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  heroImage: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },
  sessionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 12,
  },
  enterButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  cardFooter: {
    textAlign: "center",
    color: "#888",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: "row",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  actionCard: {
    width: (width - 50) / 2,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  blurView: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  actionIconContainer: {
    marginBottom: 10,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#aaa",
  },
  createCard: {
    backgroundColor: "rgba(40, 167, 69, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(40, 167, 69, 0.3)",
  },
  myEventsCard: {
    backgroundColor: "rgba(156, 39, 176, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(156, 39, 176, 0.3)",
  },
  resultsCard: {
    backgroundColor: "rgba(255, 193, 7, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.3)",
  },
  participatedCard: {
    backgroundColor: "rgba(255, 152, 0, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.3)",
  },
  scanQRButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  scanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  scanSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  scanArrow: {
    marginLeft: 8,
  },
});
