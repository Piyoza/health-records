import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { useState } from 'react';
import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Get the current screen size
  const { width } = useWindowDimensions();

  // Responsive layout
  const isDesktop = width >= 900;
  const isTablet = width >= 600 && width < 900;

  const handleLogin = async () => {
    // Check that the user entered both fields
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      console.log('LOGIN: attempting...');

      // 1. Sign in using Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      // Login failed
      if (error) {
        console.error('LOGIN ERROR:', error.message);

        Alert.alert('Login failed', error.message);
        return;
      }

      // Make sure we have a user
      if (!data.user) {
        Alert.alert(
          'Login failed',
          'User account could not be found.'
        );
        return;
      }

      console.log('LOGIN SUCCESS:', data.user.id);

      // 2. Get this user's profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Profile/role could not be found
      if (profileError) {
        console.error('PROFILE ERROR:', profileError.message);

        Alert.alert(
          'Login error',
          'Your user profile or role could not be found.'
        );

        return;
      }

      console.log('USER ROLE:', profile.role);

      // 3. Send the user to the correct dashboard
      if (profile.role === 'admin') {
        router.replace('/(app)/admin');
      } else if (profile.role === 'healthcare_worker') {
        router.replace('/(app)/dashboard');
      } else {
        Alert.alert(
          'Invalid role',
          'Your account does not have a valid role assigned.'
        );
      }

    } catch (error) {
      console.error('LOGIN EXCEPTION:', error);

      Alert.alert(
        'Error',
        'Something went wrong while logging in.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* RESPONSIVE LOGIN CARD */}
      <View
        style={[
          styles.loginCard,
          isDesktop && styles.loginCardDesktop,
          isTablet && styles.loginCardTablet,
        ]}
      >

        {/* LOGO */}
        <Text
          style={[
            styles.logo,
            isDesktop && styles.logoDesktop,
          ]}
        >
          CARELINK
        </Text>

        {/* TITLE */}
        <Text
          style={[
            styles.title,
            isDesktop && styles.titleDesktop,
          ]}
        >
          Welcome Back
        </Text>

        <Text style={styles.subtitle}>
          Sign in to access patient records
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

        {/* PASSWORD */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {/* FORGOT PASSWORD */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          disabled={loading}
          style={styles.forgotContainer}
        >
          <Text style={styles.forgotPassword}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* SIGN IN BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  // MAIN SCREEN
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },

  // LOGIN CONTAINER
  loginCard: {
    width: '100%',
    maxWidth: 500,
  },

  // DESKTOP
  loginCardDesktop: {
    maxWidth: 460,
  },

  // TABLET
  loginCardTablet: {
    maxWidth: 500,
  },

  // LOGO
  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 35,
    letterSpacing: 1,
  },

  logoDesktop: {
    fontSize: 38,
    marginBottom: 40,
  },

  // TITLE
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },

  titleDesktop: {
    fontSize: 30,
  },

  // SUBTITLE
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 28,
  },

  // INPUTS
  input: {
    width: '100%',
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

  // FORGOT PASSWORD
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },

  forgotPassword: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },

  // SIGN IN BUTTON
  button: {
    width: '100%',
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
});