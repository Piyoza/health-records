
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function AdminDashboardScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [patientCount, setPatientCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? '');

      const { count, error } = await supabase
        .from('patients')
        .select('*', {
          count: 'exact',
          head: true,
        });

      if (error) {
        console.error(
          'PATIENT COUNT ERROR:',
          error.message
        );
      } else {
        setPatientCount(count ?? 0);
      }
    } catch (error) {
      console.error(
        'ADMIN DASHBOARD ERROR:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();

    router.replace('/(auth)/login');
  };

  const getName = () => {
    if (!userEmail) {
      return 'Receptionist';
    }

    return userEmail
      .split('@')[0]
      .split(/[._-]/)[0]
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            MediVault
          </Text>

          <Text style={styles.role}>
            Reception / Admin
          </Text>
        </View>

        <Pressable
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>
            Sign Out
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.welcome}>
          Welcome, {getName()} 👋
        </Text>

        <Text style={styles.subtitle}>
          Manage patients and access the MediVault
          reception workspace.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {patientCount}
            </Text>

            <Text style={styles.statLabel}>
              Total Patients
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              Admin
            </Text>

            <Text style={styles.statLabel}>
              Current Role
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Patient Management
        </Text>

        <Text style={styles.sectionSubtitle}>
          Common reception tasks
        </Text>

        <Pressable
          style={styles.actionCard}
          onPress={() =>
            router.push('/patients/create')
          }
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>
              +
            </Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Register Patient
            </Text>

            <Text style={styles.actionDescription}>
              Create a new patient record.
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() =>
            router.push('/(app)/patients/create')
          }
        >
          <View style={styles.searchIcon}>
            <Text style={styles.actionIconText}>
              ⌕
            </Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Find Patient
            </Text>

            <Text style={styles.actionDescription}>
              Search for an existing patient by ID.
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>

        <Pressable
          style={styles.refreshButton}
          onPress={loadDashboard}
        >
          <Text style={styles.refreshText}>
            Refresh Dashboard
          </Text>
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            MVP Reception Workspace
          </Text>

          <Text style={styles.infoText}>
            This dashboard is currently being used
            for receptionist/admin functionality.
            Healthcare-worker functionality remains
            on the existing healthcare dashboard.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },

  header: {
    height: 78,
    backgroundColor: '#0F2A43',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  role: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 3,
  },

  signOutButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#1E3A5F',
  },

  signOutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  content: {
    padding: 24,
    paddingBottom: 50,
  },

  welcome: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 25,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 20,
  },

  statNumber: {
    color: '#2563EB',
    fontSize: 26,
    fontWeight: '800',
  },

  statLabel: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },

  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
    marginBottom: 15,
  },

  actionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchIcon: {
    width: 46,
    height: 46,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionIconText: {
    color: '#2563EB',
    fontSize: 25,
    fontWeight: '700',
  },

  actionContent: {
    flex: 1,
    marginLeft: 13,
  },

  actionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },

  actionDescription: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },

  arrow: {
    color: '#2563EB',
    fontSize: 20,
    marginLeft: 10,
  },

  refreshButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  refreshText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },

  infoCard: {
    marginTop: 25,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  infoTitle: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '700',
  },

  infoText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
});

