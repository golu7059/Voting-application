import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getAuthToken } from "../../utils/authStorage";
import { API_BASE_URL } from "../../utils/apiConfig";

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
}

export default function MyEventsScreen() {
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
        setError("Please sign in to view your events");
        router.replace("/Signin");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/event/`, {
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
      console.error("Error fetching events:", err);
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
    console.log("Navigating to stats for event ID:", eventId);
    
    // Use the object form of navigation to ensure parameters are passed correctly
    router.push({
      pathname: "/results",
      params: { session: eventId }
    });
  };

  const handleEditEvent = (eventId: string) => {
    // Similarly update this to use object notation for consistency
    router.push({
      pathname: "/edit-event",
      params: { eventId }
    });
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Proceeding with deletion of event:", eventId);
              const token = await getAuthToken();
              
              if (!token) {
                Alert.alert("Error", "Authentication required");
                return;
              }

              // Fixed API endpoint URL - removed the /delete suffix
              const response = await axios.delete(`${API_BASE_URL}/event/${eventId}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              

              // Remove event from the list
              setEvents(events.filter(event => event.eventId !== eventId));
              Alert.alert("Success", "Event deleted successfully");
            } catch (error: any) {
              console.error("Error deleting event:", error);
              
              // More detailed error logging
              if (error.response) {
                console.log("Error response data:", error.response.data);
                console.log("Error response status:", error.response.status);
              } else if (error.request) {
                console.log("Error request:", error.request);
              } else {
                console.log("Error message:", error.message);
              }
              
              Alert.alert("Error", error.response?.data?.message || "Failed to delete event");
            }
          }
        }
      ]
    );
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    // Calculate total votes
    const totalVotes = item.options.reduce((sum, option) => sum + (option.voteCount || 0), 0);
    
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
          <Text style={styles.eventId}>ID: {item.eventId}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewStats(item.eventId)}
          >
            <Ionicons name="bar-chart-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditEvent(item.eventId)}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteEvent(item.eventId, item.title)}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Loading your events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/create-event')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
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
          <Ionicons name="calendar-outline" size={64} color="#aaa" />
          <Text style={styles.emptyText}>You haven't created any events yet.</Text>
          <TouchableOpacity 
            style={styles.createFirstEventButton}
            onPress={() => router.push('/create-event')}
          >
            <Text style={styles.createFirstEventText}>Create Your First Event</Text>
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
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#292929",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#28A745",
    justifyContent: "center",
    alignItems: "center",
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
  createFirstEventButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  createFirstEventText: {
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
  editButton: {
    backgroundColor: "#ffc107",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
});
