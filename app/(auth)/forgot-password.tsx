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
import { Link } from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your email address.'
      );
      return;
    }

    try {
      setLoading(true);

      console.log('PASSWORD RESET: attempting...');

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
         redirectTo: 'http://localhost:8081/reset-password',
        }
      );

      if (error) {
        console.error(
          'PASSWORD RESET ERROR:',
          error.message
        );

        Alert.alert(
          'Reset failed',
          error.message
        );

        return;
      }

      console.log('PASSWORD RESET EMAIL SENT');

      setSent(true);

    } catch (error) {
      console.error(
        'PASSWORD RESET EXCEPTION:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong. Please try again.'
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

      {!sent ? (
        <>
          {/* TITLE */}
          <Text style={styles.title}>
            Forgot Password?
          </Text>

          <Text style={styles.subtitle}>
            Enter your email address and we'll send you
            a link to reset your password.
          </Text>

          {/* EMAIL */}
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* SEND BUTTON */}
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.disabledButton,
            ]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>

          {/* BACK TO LOGIN */}
          <Link
            href="/(auth)/login"
            style={styles.backLink}
          >
            ← Back to Login
          </Link>
        </>
      ) : (
        <>
          {/* SUCCESS */}
          <Text style={styles.title}>
            Check Your Email
          </Text>

          <Text style={styles.subtitle}>
            If an account exists for this email address,
            we've sent you a password reset link.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setSent(false)}
          >
            <Text style={styles.buttonText}>
              Try Another Email
            </Text>
          </TouchableOpacity>

          <Link
            href="/(auth)/login"
            style={styles.backLink}
          >
            ← Back to Login
          </Link>
        </>
      )}

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