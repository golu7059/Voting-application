import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Alert, 
  Modal, 
  BackHandler,
  StatusBar,
  AppState,
  AppStateStatus,
  Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { getAuthToken } from "../../utils/authStorage";
import * as ScreenOrientation from 'expo-screen-orientation';

interface Option {
  name: string;
  imageUrl: string;
  voteCount: number;
  _id: string;
}

interface EventData {
  _id: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl: string;
  options: Option[];
}

export default function VoteScreen() {
  const router = useRouter();
  const { session } = useLocalSearchParams();
  const eventId = session as string;
  console.log("Session ID:", eventId);
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [voting, setVoting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);
  const [secureVotingMode, setSecureVotingMode] = useState(false);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!eventId) {
      setError("No session ID provided. Please go back and try again.");
      setLoading(false);
      return;
    }
    
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      // Get token from secure storage
      const token = await getAuthToken();
      
      if (!token) {
        setError("Please sign in to access this feature.");
        router.replace("/Signin");
        return;
      }
      
      // Make API request with stored token
      const response = await axios.get(`http://127.0.0.1:3001/api/event/${eventId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Check the structure of the response
      console.log("API Response:", response.data);
      
      // Store the event data (which is nested under the 'event' key)
      if (response.data && response.data.event) {
        setEventData(response.data.event);
        
        // Check if the API indicates user has already voted
        if (response.data.hasVoted) {
          setHasAlreadyVoted(true);
        }
      } else {
        setError("Invalid response format from the server");
      }
    } catch (err: any) {
      console.error("Error fetching event data:", err);
      
      // Check if error indicates user has already voted
      if (err.response && err.response.status === 400 && 
          err.response.data && err.response.data.message === "User has already voted") {
        setHasAlreadyVoted(true);
      } else {
        setError(`Failed to load event data for session: ${eventId}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle back button presses in secure voting mode
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (secureVotingMode) {
        // Show confirmation dialog when trying to exit secure mode
        Alert.alert(
          "Exit Secure Voting?",
          "Are you sure you want to exit the secure voting environment? Your vote will not be submitted.",
          [
            { text: "Continue Voting", style: "cancel", onPress: () => {} },
            { 
              text: "Exit", 
              style: "destructive", 
              onPress: () => {
                setSecureVotingMode(false);
                setShowCandidates(false);
              }
            }
          ]
        );
        return true; // Prevent default back button behavior
      }
      return false; // Let default back button behavior happen
    });

    return () => backHandler.remove();
  }, [secureVotingMode]);

  // Monitor app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [secureVotingMode]);

  // Lock orientation in secure voting mode
  useEffect(() => {
    async function lockOrientation() {
      if (secureVotingMode && !isWeb) {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch (error) {
          console.log("Screen orientation locking not supported on this device");
        }
      } else if (!isWeb) {
        try {
          await ScreenOrientation.unlockAsync();
        } catch (error) {
          console.log("Screen orientation unlocking not supported on this device");
        }
      }
    }
    
    lockOrientation();
    return () => {
      if (!isWeb) {
        try {
          ScreenOrientation.unlockAsync();
        } catch (error) {
          console.log("Screen orientation unlocking not supported on this device");
        }
      }
    };
  }, [secureVotingMode]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (secureVotingMode && appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      // App is going to background while in secure mode
      Alert.alert(
        "Voting Session Interrupted",
        "Your secure voting session was interrupted. Please restart the voting process.",
        [
          { 
            text: "OK", 
            onPress: () => {
              setSecureVotingMode(false);
              setShowCandidates(false);
            }
          }
        ]
      );
    }
    
    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };

  // Enter secure voting mode
  const enterSecureVotingMode = () => {
    const message = isWeb 
      ? "You are about to enter the voting screen. Note that secure voting features are limited on web browsers."
      : "You are about to enter a secure voting environment. While voting, your device will be locked to this screen and notifications will be suppressed.";
      
    Alert.alert(
      "Enter Voting Mode",
      message,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: isWeb ? "Continue" : "Enter Secure Mode", 
          onPress: () => {
            setSecureVotingMode(true);
            setShowCandidates(true);
          }
        }
      ]
    );
  };

  // Exit secure voting mode
  const exitSecureVotingMode = () => {
    setSecureVotingMode(false);
    handleExitEvent();
  };

  const handleEnterEvent = () => {
    // Directly enter candidates view on web to avoid secure mode issues
    if (isWeb) {
      setShowCandidates(true);
    } else {
      enterSecureVotingMode();
    }
  };

  const handleExitEvent = () => {
    if (secureVotingMode) {
      Alert.alert(
        "Exit Secure Voting?",
        "Are you sure you want to exit without voting?",
        [
          { text: "Continue Voting", style: "cancel" },
          { 
            text: "Exit", 
            style: "destructive", 
            onPress: () => {
              setSecureVotingMode(false);
              router.replace("/");
            }
          }
        ]
      );
    } else {
      router.replace("/");
    }
  };

  const handleSelectOption = (optionName: string) => {
    setSelectedOption(optionName);
  };

  const handleVote = async () => {
    if (!selectedOption || !eventId) return;
    
    setVoting(true);
    try {
      // Get token from secure storage
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert("Authentication Required", "Please sign in to vote.");
        setSecureVotingMode(false); // Exit secure mode
        router.replace("/Signin");
        return;
      }
      
      await axios.post(
        `http://127.0.0.1:3001/api/event/${eventId}/vote/`,
        { optionName: selectedOption },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      setShowConfirmation(true);
      
      // Refresh event data to get updated vote counts
      fetchEventData();
    } catch (err: any) {
      console.error("Error voting:", err);
      
      // Check if error indicates user has already voted
      if (err.response && err.response.status === 400 && 
          err.response.data && err.response.data.message === "User has already voted") {
        setHasAlreadyVoted(true);
      } else {
        Alert.alert("Voting Error", "Failed to submit your vote. Please try again.");
      }
    } finally {
      setVoting(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setSelectedOption(null);
    setShowCandidates(false);
    setSecureVotingMode(false); // Exit secure mode after successful vote
  };

  // Fix for the text node error - ensure all text is wrapped in Text components
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEventData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Add null checks for eventData and its properties
  if (!eventData || !eventData.options) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No event data available or invalid format</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEventData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Add user has already voted page
  if (hasAlreadyVoted) {
    return (
      <View style={styles.container}>
        <View style={styles.alreadyVotedContainer}>
          <Ionicons name="alert-circle" size={80} color="#4da6ff" />
          <Text style={styles.alreadyVotedTitle}>Already Voted</Text>
          <Text style={styles.alreadyVotedText}>
            You have already cast your vote in this election.
          </Text>
          <Text style={styles.alreadyVotedSubtext}>
            Each user is allowed to vote only once per election.
          </Text>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleExitEvent}
          >
            <Text style={styles.buttonText}>Return to Home</Text>
          </TouchableOpacity>
          
          {eventData && (
            <View style={styles.eventInfoBox}>
              <Text style={styles.eventInfoTitle}>Election Information</Text>
              <Text style={styles.eventInfoText}>
                <Text style={styles.eventInfoLabel}>Title: </Text>
                <Text>{eventData.title}</Text>
              </Text>
              <Text style={styles.eventInfoText}>
                <Text style={styles.eventInfoLabel}>Description: </Text>
                <Text>{eventData.description || "No description provided."}</Text>
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Confirmation Modal - Fixed to avoid text node errors
  const ConfirmationModal = () => (
    <Modal
      visible={showConfirmation}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#28A745" style={styles.confirmIcon} />
          <Text style={styles.confirmTitle}>Vote Submitted!</Text>
          <Text style={styles.confirmText}>
            You have successfully voted for {selectedOption} in the {eventData?.title} event.
          </Text>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmationClose}>
            <Text style={styles.confirmButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Secure Voting Banner
  const SecureVotingBanner = () => (
    <View style={styles.secureModeBanner}>
      <Ionicons name="shield-checkmark" size={18} color="#fff" />
      <Text style={styles.secureModeText}>SECURE VOTING MODE ACTIVE</Text>
    </View>
  );

  // Candidates List View with secure mode
  if (showCandidates) {
    return (
      <View style={styles.container}>
        {secureVotingMode && <StatusBar hidden />}
        
        {secureVotingMode && <SecureVotingBanner />}
        
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (secureVotingMode) {
                Alert.alert(
                  "Exit Secure Voting?",
                  "Are you sure you want to go back without voting?",
                  [
                    { text: "Continue Voting", style: "cancel" },
                    { 
                      text: "Go Back", 
                      onPress: () => {
                        setSecureVotingMode(false);
                        setShowCandidates(false);
                      }
                    }
                  ]
                );
              } else {
                setShowCandidates(false);
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{eventData.title} - Candidates</Text>
          
          {secureVotingMode && (
            <Ionicons name="lock-closed" size={20} color="#28A745" style={{marginLeft: 10}} />
          )}
        </View>
        
        {secureVotingMode && (
          <View style={styles.secureInstructions}>
            <Text style={styles.secureInstructionsText}>
              You are in secure voting mode. Please make your selection and submit your vote.
            </Text>
          </View>
        )}
        
        <ScrollView style={styles.candidatesList}>
          {eventData.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.candidateItem,
                selectedOption === option.name && styles.selectedCandidate
              ]}
              onPress={() => handleSelectOption(option.name)}
            >
              {option.imageUrl ? (
                <Image source={{ uri: option.imageUrl }} style={styles.candidateImage} />
              ) : (
                <View style={styles.candidateImagePlaceholder}>
                  <Ionicons name="person" size={40} color="#aaa" />
                </View>
              )}
              
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{option.name}</Text>
              </View>
              
              {selectedOption === option.name && (
                <Ionicons name="checkmark-circle" size={24} color="#28A745" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {selectedOption && (
          <TouchableOpacity
            style={styles.voteButton}
            onPress={handleVote}
            disabled={voting}
          >
            {voting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.voteButtonText}>
                Vote for {selectedOption}
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        <ConfirmationModal />
      </View>
    );
  }

  // Event Details View - Fixed to avoid text node errors
  return (
    <View style={styles.container}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{eventData.title}</Text>
        {eventData.imageUrl && (
          <Image source={{ uri: eventData.imageUrl }} style={styles.eventImage} />
        )}
      </View>
      
      {/* Secure Voting Notification Banner */}
      {!isWeb && (
        <View style={styles.secureVotingNotification}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" style={styles.notificationIcon} />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>Secure Voting Enabled</Text>
            <Text style={styles.notificationText}>
              This election uses our secure voting system to ensure privacy and prevent interference.
            </Text>
          </View>
        </View>
      )}
      
      <ScrollView style={styles.eventContent}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{eventData.description || "No description provided."}</Text>
        
        <Text style={styles.sectionTitle}>About this Vote</Text>
        <Text style={styles.infoText}>This voting event has {eventData.options.length} candidates.</Text>
        
        {!isWeb && (
          <View style={styles.securityInfoBox}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#28A745" style={{marginRight: 10}} />
            <View>
              <Text style={styles.securityTitle}>Secure Voting Environment</Text>
              <Text style={styles.securityText}>
                When you enter, your device will switch to a secure voting mode that prevents 
                interruptions and keeps your vote private.
              </Text>
            </View>
          </View>
        )}
        
        {/* Additional Security Features Information */}
        {!isWeb && (
          <View style={styles.securityFeatures}>
            <Text style={styles.securityFeaturesTitle}>Security Features:</Text>
            <View style={styles.securityFeatureItem}>
              <Ionicons name="phone-portrait-outline" size={18} color="#28A745" style={styles.featureIcon} />
              <Text style={styles.featureText}>Screen locked to voting interface</Text>
            </View>
            <View style={styles.securityFeatureItem}>
              <Ionicons name="notifications-off-outline" size={18} color="#28A745" style={styles.featureIcon} />
              <Text style={styles.featureText}>Notifications suppressed</Text>
            </View>
            <View style={styles.securityFeatureItem}>
              <Ionicons name="lock-closed-outline" size={18} color="#28A745" style={styles.featureIcon} />
              <Text style={styles.featureText}>Orientation locked for stability</Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        {/* Simplified button that works on both platforms */}
        <TouchableOpacity 
          style={styles.enterButton} 
          onPress={handleEnterEvent}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {!isWeb && <Ionicons name="shield-checkmark" size={20} color="#fff" style={{marginRight: 5}} />}
            <Text style={styles.buttonText}>
              {isWeb ? "Enter Voting" : "Enter Secure Voting"}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.exitButton} 
          onPress={handleExitEvent}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Exit</Text>
        </TouchableOpacity>
      </View>
      
      <ConfirmationModal />
    </View>
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
    marginTop: 10,
    color: "#fff",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 20,
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
  eventHeader: {
    padding: 20,
    alignItems: "center",
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
  },
  eventImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  eventContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    marginTop: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: "#ddd",
    lineHeight: 24,
  },
  infoText: {
    fontSize: 16,
    color: "#aaa",
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
  },
  exitButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#292929",
  },
  backButton: {
    paddingRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  candidatesList: {
    flex: 1,
    padding: 15,
  },
  candidateItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#333",
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedCandidate: {
    backgroundColor: "rgba(40, 167, 69, 0.2)",
    borderWidth: 2,
    borderColor: "#28A745",
  },
  candidateImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  candidateImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  candidateInfo: {
    flex: 1,
    marginLeft: 15,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  voteButton: {
    backgroundColor: "#28A745",
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  voteButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#292929",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  confirmIcon: {
    marginBottom: 15,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  alreadyVotedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  alreadyVotedTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 15,
  },
  alreadyVotedText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  alreadyVotedSubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 30,
  },
  homeButton: {
    backgroundColor: "#4da6ff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  eventInfoBox: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    marginTop: 20,
  },
  eventInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  eventInfoText: {
    fontSize: 14,
    color: "#ddd",
    marginBottom: 5,
  },
  eventInfoLabel: {
    fontWeight: "bold",
    color: "#aaa",
  },
  secureModeBanner: {
    backgroundColor: '#28A745',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureModeText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secureInstructions: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.3)',
  },
  secureInstructionsText: {
    color: '#28A745',
    textAlign: 'center',
  },
  securityInfoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  securityTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  securityText: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
  },
  enterButton: {
    flex: 3,
    backgroundColor: "#28A745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  secureVotingNotification: {
    backgroundColor: "#28A745",
    flexDirection: "row",
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: -10, // Pull up slightly to overlap with the header section
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 5,
  },
  notificationText: {
    color: "#fff",
    fontSize: 14,
  },
  securityFeatures: {
    backgroundColor: "rgba(40, 167, 69, 0.05)",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(40, 167, 69, 0.2)",
  },
  securityFeaturesTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  securityFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 5,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    color: "#ddd",
    fontSize: 14,
  },
});
