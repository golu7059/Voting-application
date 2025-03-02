import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getAuthToken } from './authStorage';

/**
 * Authentication protection hook
 * Checks if a user is authenticated and redirects to sign-in if not
 * 
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 * @param {string} redirectTo - Where to redirect if not authenticated (default: "/Signin")
 * @returns {boolean} - Whether the authentication check is loading
 */
export function useAuthProtection(
  requireAuth: boolean = true,
  redirectTo: string = "/Signin"
): boolean {
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // These routes don't require authentication
  const publicRoutes = [
    "Signin",
    "register",
    "(tabs)"  // The tabs layout itself is public but individual tabs can be protected
  ];

  useEffect(() => {
    // Check authentication status
    const checkAuthStatus = async () => {
      try {
        const token = await getAuthToken();
        const isAuthenticated = !!token;
        
        // Get current route
        const currentRoute = segments[segments.length - 1];
        const isPublicRoute = publicRoutes.includes(currentRoute);
        
        // Determine if redirection is needed
        const needsAuth = requireAuth && !isAuthenticated && !isPublicRoute;
        
        if (needsAuth) {
          console.log("Authentication required. Redirecting to sign-in.");
          router.replace(redirectTo as any);
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [segments, requireAuth, redirectTo]);

  return isLoading;
}

/**
 * Check if user is authenticated
 * For one-time checks, not for route protection
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    return !!token;
  } catch (error) {
    console.error("Error checking if authenticated:", error);
    return false;
  }
}
