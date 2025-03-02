import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: "#999",
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {
            backgroundColor: "#292929",
            borderTopColor: "#333",
          },
        }),
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: "#292929",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}>
      {/* Main visible tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="scan-qr"
        options={{
          title: 'Scan QR',
          tabBarIcon: ({ color }) => <Ionicons name="qr-code" size={28} color={color} />,
          // Make the middle tab button stand out
          tabBarIconStyle: {
            width: 45,
            height: 45,
            backgroundColor: '#28A745',
            borderRadius: 23,
            marginBottom: 5,
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
        // We'll need to create this file
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      
      {/* Hidden screens - these don't show in the bottom nav */}
      <Tabs.Screen
        name="create-event"
        options={{ href: null }}
      />
      
      <Tabs.Screen
        name="my-events"
        options={{ href: null }}
      />
      
      <Tabs.Screen
        name="results" 
        options={{ href: null }}
      />
      
      <Tabs.Screen
        name="vote"
        options={{ href: null }}
      />
      
      <Tabs.Screen
        name="register"
        options={{ href: null }}
      />
      
      <Tabs.Screen
        name="Signin"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="edit-profile"
        options={{ href: null }}
      />
    </Tabs>
  );
}
