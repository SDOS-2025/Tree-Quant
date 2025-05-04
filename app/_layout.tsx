import React, { useState, useEffect } from 'react';
import { Stack, useRouter, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold
} from '@expo-google-fonts/roboto';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// --- Mock Auth Hook (Replace with real logic) ---
// In a real app, this would check AsyncStorage, SecureStore, or an API
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Start unauthenticated
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth Hook] Starting auth check...');
    // Simulate checking auth status
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async check delay
      console.log('[Auth Hook] Simulated check complete. Setting isAuthenticated=false, isLoading=false');
      setIsAuthenticated(false);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  console.log('[Auth Hook] Returning state:', { isAuthenticated, isLoading });
  return { isAuthenticated, isLoading };
}
// --- End Mock Auth Hook ---

// Simple Root Layout to load fonts and show login screen first
export default function RootLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
  });

  console.log('[RootLayout] Render. isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'fontsLoaded:', fontsLoaded);

  useEffect(() => {
    console.log('[RootLayout Effect] Running effect. Dependencies:', { fontsLoaded, fontError, isLoading, isAuthenticated });
    // Wait for fonts and auth check to complete
    if ((fontsLoaded || fontError) && !isLoading) {
      console.log('[RootLayout Effect] Fonts loaded and auth check complete. isAuthenticated:', isAuthenticated);
      if (isAuthenticated) {
        console.log('[RootLayout Effect] Redirecting to /tabs');
        router.replace('/(tabs)');
      } else {
        console.log('[RootLayout Effect] Redirecting to /login');
        router.replace('/login');
      }
      console.log('[RootLayout Effect] Hiding SplashScreen');
      SplashScreen.hideAsync(); // Hide splash screen once navigation is decided
    } else {
      console.log('[RootLayout Effect] Conditions not met. Fonts loaded/error:', fontsLoaded || fontError, 'Auth loading:', isLoading);
    }

    // Only call window.frameworkReady on web platform after setup
    if ((fontsLoaded || fontError) && !isLoading && Platform.OS === 'web' && typeof window !== 'undefined') {
        window.frameworkReady?.();
    }
  }, [fontsLoaded, fontError, isLoading, isAuthenticated, router]);

  // Hide splash screen and call frameworkReady when fonts are loaded/error
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.frameworkReady?.();
      }
    }
  }, [fontsLoaded, fontError]);

  // Show nothing until fonts are loaded (keeps splash visible)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Render the main stack navigator, starting at 'login'
  return (
    <>
      <Stack 
        initialRouteName="login" // Start at the login screen
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}