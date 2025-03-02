import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Check if platform is web
const isWeb = Platform.OS === 'web';

// Warning for web platform
if (isWeb) {
  console.warn(
    'Running on web platform. Token storage is not secure and will use localStorage instead of SecureStore.'
  );
}

/**
 * Stores authentication token (uses localStorage fallback on web)
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    if (isWeb) {
      // Use localStorage on web
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      // Use SecureStore on native platforms
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
};

/**
 * Retrieves authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      // Use localStorage on web
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } else {
      // Use SecureStore on native platforms
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Stores user data
 */
export const storeUserData = async (userData: any): Promise<void> => {
  try {
    const userDataString = JSON.stringify(userData);
    
    if (isWeb) {
      // Use localStorage on web
      localStorage.setItem(USER_DATA_KEY, userDataString);
    } else {
      // Use SecureStore on native platforms
      await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
    }
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

/**
 * Retrieves user data
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    let data;
    
    if (isWeb) {
      // Use localStorage on web
      data = localStorage.getItem(USER_DATA_KEY);
    } else {
      // Use SecureStore on native platforms
      data = await SecureStore.getItemAsync(USER_DATA_KEY);
    }
    
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Removes authentication token and user data (logout)
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    if (isWeb) {
      // Use localStorage on web
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    } else {
      // Use SecureStore on native platforms
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    }
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

/**
 * Checks if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return token !== null;
};
