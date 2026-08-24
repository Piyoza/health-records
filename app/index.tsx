import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { session } = useAuth();

  // Logged in → Dashboard
  if (session) {
    return <Redirect href="/(app)/dashboard" />;
  }

  // Not logged in → Login
  return <Redirect href="/(auth)/login" />;
}