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
import { Link, router } from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
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

    // 1. Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error('LOGIN ERROR:', error.message);

      Alert.alert('Login failed', error.message);
      return;
    }

    // Make sure we actually received a user
    if (!data.user) {
      Alert.alert('Login failed', 'User information could not be loaded.');
      return;
    }

    console.log('LOGIN SUCCESS:', data.user.id);

    // 2. Get the user's role from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('PROFILE ERROR:', profileError.message);

      Alert.alert(
        'Login error',
        'Your account role could not be determined.'
      );

      return;
    }

    console.log('USER ROLE:', profile.role);

    // 3. Redirect according to role
    if (profile.role === 'admin') {
      router.replace('/admin');
    } 
    else if (profile.role === 'healthcare_worker') {
  router.replace('/dashboard');
}
    /*else if (profile.role === 'patient') {
      router.replace('/patient/dashboard');
    } */
    else {
      Alert.alert(
        'Account error',
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

      {/* LOGO */}
      <Text style={styles.logo}>
        CARELINK
      </Text>

      {/* TITLE */}
      <Text style={styles.title}>
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

      {/* REGISTER LINK */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>
          Don't have an account?{' '}
        </Text>

        <Link
          href="/(auth)/register"
          style={styles.registerLink}
        >
          Register
        </Link>
      </View>

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
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
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

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  registerText: {
    fontSize: 15,
    color: '#64748b',
  },

  registerLink: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
});