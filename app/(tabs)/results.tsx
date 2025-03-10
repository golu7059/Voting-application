import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Share,
  Platform,
  Modal
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getAuthToken } from "../../utils/authStorage";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL } from "@/utils/apiConfig";
import QRCode from 'react-native-qrcode-svg';

interface Voter {
  _id: string;
  fullName: string;
}

interface Option {
  name: string;
  imageUrl: string;
  voteCount: number;
  _id: string;
}

interface EventStats {
  _id: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl: string;
  options: Option[];
  voters: Voter[];
  createdAt: string;
  updatedAt: string;
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionParam = params.session as string;
  
  // Reset all state values when the component mounts or session changes
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputEventId, setInputEventId] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);
  
  // New state for QR code modal
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);

  // Reset and update eventId when session param changes
  useEffect(() => {
    console.log("Session parameter changed to:", sessionParam);
    
    // Reset state
    setEventStats(null);
    setError(null);
    setTotalVotes(0);
    
    // Update eventId with the new session
    setEventId(sessionParam || null);
  }, [sessionParam]);

  // Fetch event stats when eventId changes
  useEffect(() => {
    if (eventId) {
      console.log("Fetching stats for event ID:", eventId);
      fetchEventStats();
    }
  }, [eventId]);

  const fetchEventStats = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);
    
    try {
      // Log to help debug
      console.log("Fetching stats from API for event:", eventId);
      
      const token = await getAuthToken();
      
      if (!token) {
        setError("Authentication required. Please sign in.");
        router.replace("/Signin");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/event/${eventId}/stats/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Event stats response:", response.data);

      if (response.data && response.data.event) {
        setEventStats(response.data.event);
        
        // Calculate total votes
        const total = response.data.event.options.reduce(
          (sum: number, option: Option) => sum + (option.voteCount || 0), 
          0
        );
        setTotalVotes(total);
      } else {
        setError("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error fetching event stats:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to load event statistics");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!inputEventId.trim()) {
      Alert.alert("Error", "Please enter an event ID");
      return;
    }
    setEventId(inputEventId.trim());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Calculate percentage for vote visualization
  const calculatePercentage = (voteCount: number) => {
    if (totalVotes === 0) return 0;
    return (voteCount / totalVotes) * 100;
  };

  // Generate a text report of the results
  const generateTextReport = () => {
    if (!eventStats) return "";

    let report = `VOTING RESULTS - ${eventStats.title}\n\n`;
    report += `Description: ${eventStats.description}\n`;
    report += `Event ID: ${eventStats.eventId}\n`;
    report += `Created: ${formatDate(eventStats.createdAt)}\n\n`;
    
    report += `RESULTS SUMMARY\n`;
    report += `Total Votes: ${totalVotes}\n\n`;
    
    // Add voting results
    report += `VOTE BREAKDOWN:\n`;
    eventStats.options.forEach((option) => {
      const percentage = totalVotes > 0 ? (option.voteCount / totalVotes * 100).toFixed(1) : "0.0";
      report += `${option.name}: ${option.voteCount} votes (${percentage}%)\n`;
    });
    
    report += `\nPARTICIPANTS (${eventStats.voters.length}):\n`;
    if (eventStats.voters.length === 0) {
      report += "No votes have been cast yet\n";
    } else {
      eventStats.voters.forEach((voter) => {
        report += `- ${voter.fullName}\n`;
      });
    }
    
    return report;
  };

  // Generate CSV report of the results
  const generateCsvReport = () => {
    if (!eventStats) return "";

    let csv = `"Title","${eventStats.title}"\n`;
    csv += `"Description","${eventStats.description}"\n`;
    csv += `"Event ID","${eventStats.eventId}"\n`;
    csv += `"Created","${eventStats.createdAt}"\n`;
    csv += `"Total Votes","${totalVotes}"\n\n`;
    
    csv += `"Option","Votes","Percentage"\n`;
    eventStats.options.forEach((option) => {
      const percentage = totalVotes > 0 ? (option.voteCount / totalVotes * 100).toFixed(1) : "0.0";
      csv += `"${option.name}","${option.voteCount}","${percentage}%"\n`;
    });
    
    csv += `\n"Participants"\n`;
    if (eventStats.voters.length === 0) {
      csv += `"No votes have been cast yet"\n`;
    } else {
      eventStats.voters.forEach((voter) => {
        csv += `"${voter.fullName}"\n`;
      });
    }
    
    return csv;
  };

  // Handle export report action
  const handleExportReport = async () => {
    if (!eventStats) return;
    
    try {
      // Create export options menu
      Alert.alert(
        "Export Results",
        "Choose export format",
        [
          {
            text: "Share Text Summary",
            onPress: () => shareTextReport()
          },
          {
            text: "Export CSV",
            onPress: () => exportCsvFile()
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error("Error in export function:", error);
      Alert.alert("Export Error", "Failed to export results.");
    }
  };

  // Share text report via native share dialog
  const shareTextReport = async () => {
    const report = generateTextReport();
    
    try {
      await Share.share({
        message: report,
        title: `Voting Results - ${eventStats?.title}`
      });
    } catch (error) {
      console.error("Error sharing report:", error);
      Alert.alert("Sharing Error", "Failed to share results.");
    }
  };

  // Export as CSV file
  const exportCsvFile = async () => {
    // Check if platform supports file sharing
    if (Platform.OS === 'web') {
      Alert.alert("Not Supported", "File export is not supported on web.");
      return;
    }
    
    const csv = generateCsvReport();
    const fileName = `voting_results_${eventStats?.eventId}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    try {
      // Write csv content to file
      await FileSystem.writeAsStringAsync(fileUri, csv);
      
      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Sharing Unavailable", "File sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      Alert.alert("Export Error", "Failed to export CSV file.");
    }
  };

  // Copy event ID to clipboard
  const handleCopyEventId = async () => {
    if (eventId) {
      await Clipboard.setStringAsync(eventId);
      Alert.alert("Copied", "Event ID copied to clipboard");
    }
  };

  // Toggle QR code modal
  const toggleQRModal = () => {
    setIsQRModalVisible(!isQRModalVisible);
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Loading event statistics...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEventStats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render event search if no eventId or no event found
  if (!eventId || !eventStats) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.headerTitle}>View Voting Results</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Enter Event ID"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
            value={inputEventId}
            onChangeText={setInputEventId}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render results
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
      </View>

      {/* Event Info */}
      <View style={styles.eventInfoContainer}>
        <Text style={styles.eventTitle}>{eventStats.title}</Text>
        <Text style={styles.eventDescription}>{eventStats.description}</Text>
        <View style={styles.eventMetadata}>
          <View style={styles.metadataItem}>
            <Ionicons name="people-outline" size={16} color="#aaa" />
            <Text style={styles.metadataText}>{eventStats.voters.length} participants</Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="calendar-outline" size={16} color="#aaa" />
            <Text style={styles.metadataText}>Created: {formatDate(eventStats.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Results Summary</Text>
        <Text style={styles.totalVotes}>{totalVotes} total votes</Text>

        {/* Results Chart */}
        <View style={styles.resultsChart}>
          {eventStats.options.map((option) => (
            <View key={option._id} style={styles.resultItem}>
              <View style={styles.resultNameContainer}>
                <Text style={styles.resultName}>{option.name}</Text>
                <Text style={styles.voteCount}>{option.voteCount} votes</Text>
              </View>
              
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    {
                      width: `${calculatePercentage(option.voteCount)}%`,
                      backgroundColor: option.voteCount > 0 ? '#28A745' : '#444'
                    }
                  ]} 
                />
                <Text style={styles.percentage}>
                  {calculatePercentage(option.voteCount).toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Voter List */}
      <View style={styles.votersContainer}>
        <Text style={styles.sectionTitle}>Participants ({eventStats.voters.length})</Text>
        {eventStats.voters.length === 0 ? (
          <Text style={styles.noVotersText}>No votes have been cast yet</Text>
        ) : (
          eventStats.voters.map((voter) => (
            <View key={voter._id} style={styles.voterItem}>
              <Ionicons name="person-circle-outline" size={24} color="#aaa" />
              <Text style={styles.voterName}>{voter.fullName}</Text>
            </View>
          ))
        )}
      </View>

      {/* Event ID and Actions */}
      <View style={styles.eventIdContainer}>
        <Text style={styles.eventIdLabel}>Event ID: </Text>
        <Text style={styles.eventId}>{eventStats.eventId}</Text>
        <View style={styles.eventIdActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleCopyEventId}>
            <Ionicons name="copy-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleQRModal}>
            <Ionicons name="qr-code-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* QR Code Modal - Updated to match create-event style */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isQRModalVisible}
        onRequestClose={toggleQRModal}
      >
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Event QR Code</Text>
          
          {/* Main content centered */}
          <View style={styles.successContent}>
            {/* QR Code centered */}
            <View style={styles.qrContainer}>
              <View style={styles.qrBackground}>
                <QRCode
                  value={`http://localhost:8081/vote?session=${eventStats?.eventId || eventId}`}
                  size={250}
                  backgroundColor="white"
                  color="black"
                />
              </View>
            </View>
            
            {/* Event ID directly below QR code */}
            <View style={styles.eventIdBox}>
              <Text style={styles.eventIdTitle}>Event ID</Text>
              <Text style={styles.eventId}>{eventStats?.eventId || eventId}</Text>
            </View>
            
            {/* Copy button */}
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyEventId}>
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.copyButtonText}>Copy Event ID</Text>
            </TouchableOpacity>
          </View>
          
          {/* Action buttons at bottom */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.shareButton} onPress={() => {
              Share.share({
                message: `Join my voting event! Use this code: ${eventStats?.eventId || eventId}`,
              });
            }}>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={toggleQRModal}>
              <Ionicons name="close-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.helpText}>
            Share this code or QR with participants to allow them to join your voting event
          </Text>
        </View>
      </Modal>

      {/* Export Button */}
      <TouchableOpacity 
        style={styles.exportButton}
        onPress={handleExportReport}
      >
        <Ionicons name="download-outline" size={20} color="#fff" />
        <Text style={styles.exportButtonText}>Export Results</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#292929",
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 16,
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
  searchContainer: {
    width: "100%",
    marginTop: 20,
  },
  searchInput: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: "#28A745",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  eventInfoContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 15,
  },
  eventMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metadataText: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 5,
  },
  summaryContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  totalVotes: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 15,
  },
  resultsChart: {
    marginTop: 10,
  },
  resultItem: {
    marginBottom: 15,
  },
  resultNameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  voteCount: {
    fontSize: 14,
    color: "#aaa",
  },
  barContainer: {
    height: 25,
    backgroundColor: "#333",
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
  },
  bar: {
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
  },
  percentage: {
    position: "absolute",
    right: 8,
    top: 4,
    color: "#fff",
    fontSize: 14,
  },
  votersContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  noVotersText: {
    color: "#aaa",
    fontStyle: "italic",
  },
  voterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  voterName: {
    marginLeft: 10,
    color: "#fff",
    fontSize: 16,
  },
  eventIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#333",
    margin: 15,
    borderRadius: 10,
  },
  eventIdLabel: {
    color: "#aaa",
    fontSize: 16,
  },
  eventId: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  eventIdActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#555",
    borderRadius: 5,
    marginRight: 8,
  },
  shareButton: {
    padding: 8,
    backgroundColor: "#4da6ff",
    borderRadius: 5,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6c757d",
    padding: 12,
    margin: 15,
    borderRadius: 10,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#292929",
    borderRadius: 15,
    padding: 20,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  eventIdText: {
    color: "#28A745",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Updated and new styles for the QR modal to match create-event
  successContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
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
  closeButton: {
    backgroundColor: "#6c757d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
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
