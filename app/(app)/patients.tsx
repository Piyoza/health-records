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
  const { session } = useAuth();

  const [idNumber, setIdNumber] = useState('');

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [loading, setLoading] =
    useState(false);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const searchPatient = async () => {
    const cleanId = idNumber.replace(/\s/g, '');

    // Basic empty check
    if (!cleanId) {
      Alert.alert(
        'ID number required',
        'Enter the patient ID number.'
      );

      return;
    }

    // Proper South African ID validation
    if (!isValidSouthAfricanId(cleanId)) {
      Alert.alert(
        'Invalid ID number',
        'The ID number is not a valid South African ID number.'
      );

      setPatient(null);

      return;
    }

    try {
      setLoading(true);
      setPatient(null);

      console.log(
        'PATIENT SEARCH:',
        cleanId
      );

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

      if (error) {
        console.error(
          'PATIENT SEARCH ERROR:',
          error.message
        );

        Alert.alert(
          'Search error',
          error.message
        );

        return;
      }

      if (!data) {
        Alert.alert(
          'Patient not found',
          'This is a valid ID number, but no patient record exists in MediVault.'
        );

        return;
      }

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

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        MediVault
      </Text>

      <Text style={styles.title}>
        Find Patient
      </Text>

      <Text style={styles.description}>
        Enter the patient's 13-digit South African
        ID number to locate their record.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="13-digit ID number"
        value={idNumber}
        onChangeText={setIdNumber}
        keyboardType="number-pad"
        maxLength={13}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={searchPatient}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            Search Patient
          </Text>
        )}
      </TouchableOpacity>

      {patient && (
        <View style={styles.patientCard}>
          <Text style={styles.patientTitle}>
            Patient Found
          </Text>

          <Text style={styles.label}>
            Name
          </Text>

          <Text style={styles.value}>
            {patient.first_name}{' '}
            {patient.last_name}
          </Text>

          <Text style={styles.label}>
            ID Number
          </Text>

          <Text style={styles.value}>
            {patient.id_number}
          </Text>

          <Text style={styles.label}>
            Date of Birth
          </Text>

          <Text style={styles.value}>
            {patient.date_of_birth ??
              'Not recorded'}
          </Text>

          <Text style={styles.label}>
            Gender
          </Text>

          <Text style={styles.value}>
            {patient.gender ??
              'Not recorded'}
          </Text>

          <Text style={styles.label}>
            Phone
          </Text>

          <Text style={styles.value}>
            {patient.phone_number ??
              'Not recorded'}
          </Text>
        </View>
      )}
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
  },

  input: {
    height: 54,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 17,
    marginBottom: 14,
  },

  button: {
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  patientCard: {
    marginTop: 30,
    padding: 22,
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },

  patientTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 15,
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
});