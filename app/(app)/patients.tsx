import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useState } from 'react';

import { Redirect } from 'expo-router';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { isValidSouthAfricanId } from '../../utils/saIdValidator';

type Patient = {
  id: string;
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  address: string | null;
};

export default function PatientsScreen() {
  const { session, loading: authLoading } = useAuth();

  const [idNumber, setIdNumber] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  // =========================================
  // AUTH LOADING
  // =========================================

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  // =========================================
  // NOT LOGGED IN
  // =========================================

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // =========================================
  // SEARCH PATIENT
  // =========================================

  const searchPatient = async () => {
    const cleanId = idNumber.replace(/\s/g, '');

    // Clear previous patient
    setPatient(null);

    // -----------------------------------------
    // EMPTY CHECK
    // -----------------------------------------

    if (!cleanId) {
      Alert.alert(
        'ID number required',
        'Please enter the patient’s 13-digit South African ID number.'
      );

      return;
    }

    // -----------------------------------------
    // LENGTH CHECK
    // -----------------------------------------

    if (cleanId.length !== 13) {
      Alert.alert(
        'Invalid ID number',
        'A South African ID number must contain exactly 13 digits.'
      );

      return;
    }

    // -----------------------------------------
    // SOUTH AFRICAN ID VALIDATION
    // -----------------------------------------

    if (!isValidSouthAfricanId(cleanId)) {
      Alert.alert(
        'Invalid ID number',
        'The ID number entered is not a valid South African ID number.'
      );

      return;
    }

    try {
      setLoading(true);

      console.log(
        'PATIENT SEARCH:',
        cleanId
      );

      // -----------------------------------------
      // SEARCH SUPABASE
      // -----------------------------------------

      const {
        data,
        error,
      } = await supabase
        .from('patients')
        .select(
          `
          id,
          id_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone_number,
          address
          `
        )
        .eq('id_number', cleanId)
        .maybeSingle();

      // -----------------------------------------
      // DATABASE ERROR
      // -----------------------------------------

      if (error) {
        console.error(
          'PATIENT SEARCH ERROR:',
          error.message
        );

        Alert.alert(
          'Search error',
          'Unable to search patient records right now.'
        );

        return;
      }

      // -----------------------------------------
      // PATIENT NOT FOUND
      // -----------------------------------------

      if (!data) {
        Alert.alert(
          'Patient not found',
          'This ID number is valid, but no patient record was found in CARELINK.'
        );

        return;
      }

      // -----------------------------------------
      // PATIENT FOUND
      // -----------------------------------------

      console.log(
        'PATIENT FOUND:',
        data.id
      );

      setPatient(data);

    } catch (error) {
      console.error(
        'PATIENT SEARCH EXCEPTION:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to search for the patient.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // CLEAR SEARCH
  // =========================================

  const clearSearch = () => {
    setIdNumber('');
    setPatient(null);
  };

  // =========================================
  // PAGE
  // =========================================

  return (
    <View style={styles.container}>

      {/* =====================================
          HEADER
      ====================================== */}

      <View style={styles.header}>
        <Text style={styles.logo}>
          CARELINK
        </Text>

        <Text style={styles.systemText}>
          Electronic Health Records
        </Text>
      </View>

      {/* =====================================
          TITLE
      ====================================== */}

      <Text style={styles.title}>
        Find Patient
      </Text>

      <Text style={styles.description}>
        Enter the patient's 13-digit South African
        ID number to locate their record.
      </Text>

      {/* =====================================
          SEARCH LABEL
      ====================================== */}

      <Text style={styles.inputLabel}>
        South African ID Number
      </Text>

      {/* =====================================
          ID INPUT
      ====================================== */}

      <TextInput
        style={[
          styles.input,
          loading && styles.inputDisabled,
        ]}
        placeholder="Enter 13-digit ID number"
        placeholderTextColor="#94a3b8"
        value={idNumber}
        onChangeText={(text) => {
          // Only allow numbers
          const numbersOnly =
            text.replace(/[^0-9]/g, '');

          // Maximum 13 digits
          setIdNumber(
            numbersOnly.slice(0, 13)
          );
        }}
        keyboardType="number-pad"
        maxLength={13}
        editable={!loading}
      />

      {/* =====================================
          CHARACTER COUNT
      ====================================== */}

      <View style={styles.inputFooter}>
        <Text style={styles.helperText}>
          Enter exactly 13 digits
        </Text>

        <Text style={styles.characterCount}>
          {idNumber.length}/13
        </Text>
      </View>

      {/* =====================================
          SEARCH BUTTON
      ====================================== */}

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={searchPatient}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <>
            <ActivityIndicator
              color="#ffffff"
            />

            <Text style={styles.loadingButtonText}>
              Searching...
            </Text>
          </>
        ) : (
          <Text style={styles.buttonText}>
            Search Patient
          </Text>
        )}
      </TouchableOpacity>

      {/* =====================================
          CLEAR BUTTON
      ====================================== */}

      {(idNumber || patient) && !loading && (
        <Pressable
          style={styles.clearButton}
          onPress={clearSearch}
        >
          <Text style={styles.clearButtonText}>
            Clear Search
          </Text>
        </Pressable>
      )}

      {/* =====================================
          PATIENT RESULT
      ====================================== */}

      {patient && (
        <View style={styles.patientCard}>

          {/* Result Header */}
          <View style={styles.patientHeader}>
            <View>
              <Text style={styles.patientTitle}>
                Patient Found
              </Text>

              <Text style={styles.patientSubtitle}>
                CARELINK patient record
              </Text>
            </View>

            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>
                ✓
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Name */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Full Name
            </Text>

            <Text style={styles.value}>
              {patient.first_name}{' '}
              {patient.last_name}
            </Text>
          </View>

          {/* ID Number */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>
              ID Number
            </Text>

            <Text style={styles.value}>
              {patient.id_number}
            </Text>
          </View>

          {/* Date of Birth */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Date of Birth
            </Text>

            <Text style={styles.value}>
              {patient.date_of_birth ||
                'Not recorded'}
            </Text>
          </View>

          {/* Gender */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Gender
            </Text>

            <Text style={styles.value}>
              {patient.gender ||
                'Not recorded'}
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Phone Number
            </Text>

            <Text style={styles.value}>
              {patient.phone_number ||
                'Not recorded'}
            </Text>
          </View>

          {/* Address */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Address
            </Text>

            <Text style={styles.value}>
              {patient.address ||
                'Not recorded'}
            </Text>
          </View>

        </View>
      )}

      {/* =====================================
          SECURITY MESSAGE
      ====================================== */}

      <View style={styles.securityMessage}>
        <Text style={styles.securityIcon}>
          🔒
        </Text>

        <View style={styles.securityContent}>
          <Text style={styles.securityTitle}>
            Patient information is protected
          </Text>

          <Text style={styles.securityText}>
            Only authorized healthcare workers
            should access patient records.
          </Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  // =========================================
  // LOADING
  // =========================================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },

  // =========================================
  // CONTAINER
  // =========================================

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: '#f8fafc',
  },

  // =========================================
  // HEADER
  // =========================================

  header: {
    marginBottom: 28,
  },

  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 1,
  },

  systemText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
  },

  // =========================================
  // TITLE
  // =========================================

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    marginBottom: 25,
    maxWidth: 600,
  },

  // =========================================
  // INPUT
  // =========================================

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },

  input: {
    height: 54,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#0f172a',
  },

  inputDisabled: {
    opacity: 0.6,
  },

  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },

  helperText: {
    fontSize: 12,
    color: '#94a3b8',
  },

  characterCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },

  // =========================================
  // SEARCH BUTTON
  // =========================================

  button: {
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  loadingButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },

  // =========================================
  // CLEAR BUTTON
  // =========================================

  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  clearButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },

  // =========================================
  // PATIENT CARD
  // =========================================

  patientCard: {
    marginTop: 22,
    padding: 22,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // =========================================
  // PATIENT HEADER
  // =========================================

  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  patientTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#16a34a',
  },

  patientSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
  },

  successBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  successBadgeText: {
    color: '#16a34a',
    fontSize: 20,
    fontWeight: '800',
  },

  // =========================================
  // DIVIDER
  // =========================================

  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },

  // =========================================
  // PATIENT DETAILS
  // =========================================

  detailRow: {
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },

  // =========================================
  // SECURITY MESSAGE
  // =========================================

  securityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    padding: 14,
    marginTop: 22,
  },

  securityIcon: {
    fontSize: 20,
    marginRight: 10,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
  },

  securityText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
    lineHeight: 16,
  },
});