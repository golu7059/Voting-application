import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Platform,
  Share
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';
import { getAuthToken, getUserData } from '../../utils/authStorage';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

// Determine if running on web
const isWeb = Platform.OS === 'web';

interface EventData {
  _id: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  voters?: Array<{ _id: string, fullName: string }>;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  _id: string;
}

export default function CertificatePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Support both eventId and session parameters (for compatibility)
  const eventIdParam = params.eventId as string;
  const sessionParam = params.session as string;
  const eventId = eventIdParam || sessionParam;
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [sharingCertificate, setSharingCertificate] = useState(false);
  
  const certificateRef = useRef<ViewShot>(null);
  
  // Get the current date for the certificate
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          setError('Authentication required');
          router.replace('/Signin');
          return;
        }
        
        // Get user data
        const userData = await getUserData();
        if (!userData) {
          setError('User data not found');
          return;
        }
        setUser(userData as UserData);
        
        // Get event details
        if (!eventId) {
          setError('Event ID is required');
          return;
        }
        
        console.log("Fetching event data for:", eventId);
        
        // Get detailed event data including voters
        const eventResponse = await axios.get(`${API_BASE_URL}/event/${eventId}/stats/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!eventResponse.data || !eventResponse.data.event) {
          console.error("Invalid response data:", eventResponse.data);
          setError('Failed to load event details');
          return;
        }
        
        const eventData = eventResponse.data.event;
        setEvent(eventData);
        
        // Check if user has voted by looking for user ID in the voters array
        if (eventData.voters && Array.isArray(eventData.voters) && userData._id) {
          const userVoted = eventData.voters.some((voter: { _id: string, fullName: string }) => voter._id === userData._id);
          setHasVoted(userVoted);
          
          if (!userVoted) {
            // Fallback check using the participated events endpoint
            const participatedResponse = await axios.get(`${API_BASE_URL}/event/events/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (participatedResponse.data && Array.isArray(participatedResponse.data.events)) {
              const votedEvent = participatedResponse.data.events.find(
                (e: any) => e.eventId === eventId
              );
              
              if (votedEvent) {
                setHasVoted(true);
              } else {
                setError('You have not participated in this event');
              }
            }
          }
        } else {
          setError('Unable to verify your participation in this event');
        }
      } catch (err: any) {
        console.error("Error loading certificate data:", err);
        // More detailed error logging
        if (err.response) {
          console.log("Error status:", err.response.status);
          console.log("Error data:", err.response.data);
        }
        setError(err.response?.data?.message || 'Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [eventId]);

  const downloadCertificate = async () => {
    try {
      if (!certificateRef.current || typeof certificateRef.current.capture !== 'function') return;
      
      setSharingCertificate(true);
      
      if (isWeb) {
        // Web platform: Show notification about limitations
        Alert.alert(
          "Web Platform Limitation",
          "Downloading certificates directly is not available on web. Please use the Share option to save a screenshot instead.",
          [{ text: "OK" }]
        );
        setSharingCertificate(false);
        return;
      }
      
      // Request storage permission for Android
      if (Platform.OS === 'android') {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Storage permission is needed to save the certificate');
          setSharingCertificate(false);
          return;
        }
      }
      
      // Capture the certificate view
      const uri = await certificateRef.current.capture();
      
      if (Platform.OS === 'ios') {
        // On iOS, use the share menu
        await Sharing.shareAsync(uri);
      } else {
        // On Android, save to media library
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'Certificate saved to your photo gallery');
      }
    } catch (error) {
      console.error('Error saving certificate:', error);
      Alert.alert('Error', 'Failed to save certificate. Please try again or take a screenshot manually.');
    } finally {
      setSharingCertificate(false);
    }
  };

  const shareCertificate = async () => {
    try {
      setSharingCertificate(true);
      
      if (isWeb) {
        // For web, just show sharing instructions
        Alert.alert(
          "Sharing on Web",
          "To share this certificate on web, please take a screenshot manually and share it from your device.",
          [{ text: "OK" }]
        );
        setSharingCertificate(false);
        return;
      }
      
      if (!certificateRef.current || typeof certificateRef.current.capture !== 'function') return;
      
      // Capture the certificate view
      const uri = await certificateRef.current.capture();
      
      // Share the certificate image
      await Share.share({
        url: uri,
        title: `Voting Certificate for ${event?.title}`
      });
    } catch (error) {
      console.error('Error sharing certificate:', error);
      Alert.alert('Error', 'Failed to share certificate. Please try taking a screenshot instead.');
    } finally {
      setSharingCertificate(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Loading your certificate...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
        
        {/* Debug information */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>Event ID: {eventId || 'Not provided'}</Text>
          <Text style={styles.debugText}>User: {user ? `${user.firstName} ${user.lastName}` : 'Not loaded'}</Text>
          <Text style={styles.debugText}>Has voted: {hasVoted ? 'Yes' : 'No'}</Text>
        </View>
      </View>
    );
  }

  // Add an additional check for required data
  if (!event || !user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={64} color="#FFC107" />
        <Text style={styles.errorText}>Missing required data to generate certificate</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Certificate component - the actual certificate that gets rendered
  const CertificateComponent = () => (
    <View style={styles.certificate}>
      {/* Certificate Header */}
      <View style={styles.certificateHeader}>
        <Text style={styles.certificateTitle}>Certificate of Participation</Text>
      </View>
      
      {/* Certificate Content */}
      <View style={styles.certificateContent}>
        <Text style={styles.certifiedText}>This is to certify that</Text>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.participatedText}>has participated in the voting event</Text>
        <Text style={styles.eventName}>{event?.title}</Text>
        
        {/* Optional Event Image */}
        {event?.imageUrl && (
          <Image source={{ uri: event.imageUrl }} style={styles.eventImage} resizeMode="contain" />
        )}
        
        <Text style={styles.certIdText}>Certificate ID: {eventId}</Text>
        <Text style={styles.dateText}>Date: {currentDate}</Text>
      </View>
      
      {/* Certificate Footer */}
      <View style={styles.certificateFooter}>
        <Text style={styles.copyrightText}>© {new Date().getFullYear()} Voting App. All rights reserved.</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Participation Certificate</Text>
      </View>
      
      {/* Web Platform Notice */}
      {isWeb && (
        <View style={styles.webNotice}>
          <Ionicons name="information-circle-outline" size={18} color="#FFC107" />
          <Text style={styles.webNoticeText}>
            Note: On web browsers, please take a screenshot manually to save this certificate.
          </Text>
        </View>
      )}
      
      <View style={styles.certificateContainer}>
        {/* Use ViewShot only on native platforms */}
        {!isWeb ? (
          <ViewShot ref={certificateRef} options={{ quality: 1, format: 'png' }}>
            <CertificateComponent />
          </ViewShot>
        ) : (
          /* For web, just render the certificate directly */
          <CertificateComponent />
        )}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.downloadButton,
            isWeb && styles.webDisabledButton
          ]} 
          onPress={downloadCertificate}
          disabled={sharingCertificate}
        >
          {sharingCertificate ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {isWeb ? "Not Available on Web" : "Save Certificate"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.shareButton,
            isWeb && styles.webDisabledButton
          ]} 
          onPress={shareCertificate}
          disabled={sharingCertificate}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>
            {isWeb ? "Not Available on Web" : "Share Certificate"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.infoText}>
        This certificate verifies your participation in the voting event. 
        You can save it or share it as proof of your contribution.
      </Text>
      
      {isWeb && (
        <Text style={styles.webHelpText}>
          On web browsers, please use your browser's screenshot functionality or 
          print this page to save your certificate.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E1E1E',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
  },
  backButton: {
    backgroundColor: '#4da6ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#292929',
  },
  backButtonHeader: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  webNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 12,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  webNoticeText: {
    color: '#FFC107',
    marginLeft: 8,
    fontSize: 14,
  },
  certificateContainer: {
    padding: 15,
    alignItems: 'center',
  },
  certificate: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  certificateHeader: {
    backgroundColor: '#28A745',
    padding: 20,
    alignItems: 'center',
  },
  certificateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  certificateContent: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  certifiedText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 10,
    textAlign: 'center',
  },
  participatedText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4da6ff',
    marginBottom: 15,
    textAlign: 'center',
  },
  eventImage: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
  certificateFooter: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  certIdText: {
    fontSize: 10,
    color: '#999',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },
  downloadButton: {
    backgroundColor: '#28A745',
    marginRight: 10,
  },
  shareButton: {
    backgroundColor: '#4da6ff',
    marginLeft: 10,
  },
  webDisabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  infoText: {
    padding: 15,
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 5,
  },
  webHelpText: {
    padding: 15,
    paddingTop: 0,
    fontSize: 14,
    color: '#FFC107',
    textAlign: 'center',
    marginBottom: 20,
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 10,
    width: '100%',
  },
  debugTitle: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
});
