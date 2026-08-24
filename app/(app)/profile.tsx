import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Redirect } from 'expo-router';

import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';

import { useAuth } from '../../context/AuthContext';

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

export default function ProfileScreen() {
  const { session } = useAuth();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }
    const userId = session.user.id;
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const {
          data,
          error,
        } = await supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, role'
          )
          .eq('id', userId)
          .single();

        if (error) {
          console.error(
            'PROFILE ERROR:',
            error.message
          );

          setError(error.message);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error(
          'PROFILE EXCEPTION:',
          error
        );

        setError(
          'Unable to load your profile.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [session]);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Profile Error
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>
          Profile not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        MediVault
      </Text>

      <Text style={styles.title}>
        My Profile
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          First Name
        </Text>

        <Text style={styles.value}>
          {profile.first_name}
        </Text>

        <Text style={styles.label}>
          Last Name
        </Text>

        <Text style={styles.value}>
          {profile.last_name}
        </Text>

        <Text style={styles.label}>
          Email
        </Text>

        <Text style={styles.value}>
          {session.user.email}
        </Text>

        <Text style={styles.label}>
          Role
        </Text>

        <Text style={styles.value}>
          {profile.role}
        </Text>
      </View>
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

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 8,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 22,
  },

  label: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },

  value: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 10,
  },

  errorText: {
    color: '#64748b',
    textAlign: 'center',
  },
});