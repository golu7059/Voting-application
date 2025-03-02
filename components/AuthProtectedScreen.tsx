import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthToken } from '../utils/authStorage';

interface AuthProtectedScreenProps {
  children: React.ReactNode;
}

/**
 * Component that wraps screens that require authentication
 * Will redirect to sign in if not authenticated
 */
export default function AuthProtectedScreen({ children }: AuthProtectedScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          console.log("No auth token found, redirecting to sign in");
          router.replace("/Signin");
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error checking authentication:", error);
        router.replace("/Signin");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' }}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={{ marginTop: 20, color: '#fff' }}>Please wait...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    // This case shouldn't generally render as the useEffect should redirect
    return null;
  }

  return <>{children}</>;
}
