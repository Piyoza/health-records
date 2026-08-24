import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Redirect } from 'expo-router';

import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen() {
  const { session, signOut } = useAuth();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleLogout = async () => {
    try {
      await signOut();

      Alert.alert(
        'Signed out',
        'You have been signed out of MediVault.'
      );
    } catch (error) {
      console.error('LOGOUT ERROR:', error);

      Alert.alert(
        'Error',
        'Unable to sign out. Please try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        MediVault
      </Text>

      <Text style={styles.title}>
        Healthcare Dashboard
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Signed in as
        </Text>

        <Text style={styles.email}>
          {session.user.email}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: '#f8fafc',
  },

  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },

  email: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },

  button: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});