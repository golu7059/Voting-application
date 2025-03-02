/**
 * API configuration for the Voting application
 */

// Base URL for API - change this when switching environments
export const API_BASE_URL = "https://decentralizedsecurevoting.onrender.com/api";

// Helper function to get full URL for an endpoint
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${API_BASE_URL}/${path}`;
};
