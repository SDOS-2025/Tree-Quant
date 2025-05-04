import { Platform } from 'react-native';

// Use environment variable if available, otherwise fallback to local IP for development
// Ensure you have a .env file with EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:PORT for production/other builds
// Or set it in your EAS build environment variables.

const developmentApiUrl = 'http://192.168.45.197:5001'; // Your specific development IP

// Check if the app is running in development environment (e.g., using Expo Go or dev client)
// '__DEV__' is a global variable set by React Native.
// We also check if an environment variable is explicitly set.
const resolvedApiUrl = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? developmentApiUrl : '');

if (!resolvedApiUrl) {
  // This should ideally not happen in a real build if env vars are set up.
  console.warn('API Base URL is not set. Falling back to default development IP. Ensure EXPO_PUBLIC_API_URL is configured for non-development builds.');
}


export const API_BASE_URL = resolvedApiUrl || developmentApiUrl; // Final fallback just in case

console.log(`API Base URL set to: ${API_BASE_URL}`); 