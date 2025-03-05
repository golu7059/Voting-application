import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getAuthToken } from "../../utils/authStorage";
import { API_BASE_URL } from "../../utils/apiConfig";
import AuthProtectedScreen from "../../components/AuthProtectedScreen";

interface Option {
  name: string;
  imageUrl: string;
  voteCount: number;
  _id: string;
}

interface Event {
  _id: string;
  eventId: string;
  title: string;
  description: string;
  createdAt: string;
  options: Option[];
  votedFor?: string; // ID of the option the user voted for
}

export default function ParticipatedEventsScreen() {
  return (
    <AuthProtectedScreen>
      <ParticipatedEventsContent />
    </AuthProtectedScreen>
  );
}

function ParticipatedEventsContent() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      
      if (!token) {
        setError("Please sign in to view events");
        router.replace("/Signin");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/event/events/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && Array.isArray(response.data.events)) {
        setEvents(response.data.events);
      } else {
        setError("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error fetching participated events:", err);
      setError(err.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleViewStats = (eventId: string) => {
    router.push({
      pathname: "/results",
      params: { session: eventId }
    });
  };

  const handleViewCertificate = (eventId: string) => {
    console.log("Navigating to certificate page with eventId:", eventId);
    router.push({
      pathname: "/certificate",
      params: { eventId }
    });
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    // Calculate total votes
    const totalVotes = item.options.reduce((sum, option) => sum + (option.voteCount || 0), 0);
    
    // Find the option the user voted for (if available)
    const votedOption = item.votedFor ? 
      item.options.find(option => option._id === item.votedFor) : null;
    
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.eventMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#aaa" />
              <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color="#aaa" />
              <Text style={styles.metaText}>{totalVotes} votes</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="list-outline" size={14} color="#aaa" />
              <Text style={styles.metaText}>{item.options.length} options</Text>
            </View>
          </View>
          
          {votedOption && (
            <View style={styles.votedForContainer}>
              <Text style={styles.votedForLabel}>Your vote: </Text>
              <Text style={styles.votedForOption}>{votedOption.name}</Text>
            </View>
          )}
          
          <Text style={styles.eventId}>ID: {item.eventId}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewStats(item.eventId)}
          >
            <Ionicons name="bar-chart-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Results</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.certificateButton]}
            onPress={() => handleViewCertificate(item.eventId)}
          >
            <Ionicons name="ribbon-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Certificate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events You Participated In</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up" size={64} color="#aaa" />
          <Text style={styles.emptyText}>You haven't participated in any events yet.</Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.exploreButtonText}>Find Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#28A745"]} // Android
              tintColor="#28A745" // iOS
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#292929",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  listContainer: {
    padding: 15,
  },
  centeredContainer: {
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
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 15,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 18,
    marginTop: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  exploreButton: {
    backgroundColor: "#4da6ff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventCard: {
    backgroundColor: "#292929",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
  eventInfo: {
    padding: 15,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: "#ddd",
    marginBottom: 10,
  },
  eventMeta: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    marginBottom: 5,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
  },
  metaText: {
    color: "#aaa",
    fontSize: 12,
    marginLeft: 4,
  },
  votedForContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 8,
    backgroundColor: "rgba(40, 167, 69, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  votedForLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  votedForOption: {
    color: "#28A745",
    fontSize: 14,
    fontWeight: "bold",
  },
  eventId: {
    fontSize: 12,
    color: "#777",
  },
  actionButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  viewButton: {
    backgroundColor: "#4da6ff",
  },
  certificateButton: {
    backgroundColor: "#FF9800", // Orange color for certificate button
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
});
