import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useState } from 'react';
import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const checkRecoverySession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      console.log(
        'RESET PASSWORD: recovery session active'
      );
    } else {
      console.log(
        'RESET PASSWORD: no recovery session'
      );
    }
  };

  checkRecoverySession();
}, []);

  const handleUpdatePassword = async () => {
  // Check password
  if (!password || !confirmPassword) {
    Alert.alert(
      'Missing information',
      'Please enter your new password and confirm it.'
    );
    return;
  }

  // Check password length
  if (password.length < 6) {
    Alert.alert(
      'Password too short',
      'Your password must be at least 6 characters long.'
    );
    return;
  }

  // Check passwords match
  if (password !== confirmPassword) {
    Alert.alert(
      'Passwords do not match',
      'Please make sure both passwords are the same.'
    );
    return;
  }

  try {
    setLoading(true);

    console.log('PASSWORD RESET: checking session...');

    // Make sure the recovery session exists
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('PASSWORD RESET: no recovery session');

      Alert.alert(
        'Reset link expired',
        'Your password reset link is invalid or has expired. Please request a new reset link.'
      );

      return;
    }

    console.log('PASSWORD RESET: recovery session found');
    console.log('PASSWORD RESET: updating password...');

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error(
        'PASSWORD UPDATE ERROR:',
        error.message
      );

      Alert.alert(
        'Password update failed',
        error.message
      );

      return;
    }

    console.log('PASSWORD UPDATE SUCCESS');

    // Password was successfully changed.
    // Send the user back to Login.
    router.replace('/login');

  } catch (error) {
    console.error(
      'PASSWORD UPDATE EXCEPTION:',
      error
    );

    Alert.alert(
      'Error',
      'Something went wrong while updating your password.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>

      {/* LOGO */}
      <Text style={styles.logo}>
        CARELINK
      </Text>

      {/* TITLE */}
      <Text style={styles.title}>
        Reset Password
      </Text>

      <Text style={styles.subtitle}>
        Create a new password for your CARELINK account.
      </Text>

      {/* NEW PASSWORD */}
      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      {/* CONFIRM PASSWORD */}
      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        placeholderTextColor="#94a3b8"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      {/* PASSWORD REQUIREMENT */}
      <Text style={styles.requirement}>
        Password must be at least 6 characters.
      </Text>

      {/* UPDATE BUTTON */}
      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={handleUpdatePassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            Update Password
          </Text>
        )}
      </TouchableOpacity>

      {/* BACK TO LOGIN */}
      <TouchableOpacity
        onPress={() => router.replace('/(auth)/login')}
        disabled={loading}
      >
        <Text style={styles.backLink}>
          ← Back to Login
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },

  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 35,
    letterSpacing: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    marginBottom: 28,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },

  requirement: {
    fontSize: 13,
    color: '#64748b',
    marginTop: -4,
    marginBottom: 14,
  },

  button: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  backLink: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 22,
  },
});