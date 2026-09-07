
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';
import { isValidSouthAfricanId } from '../../utils/saIdValidator';

declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
  };
};

export default function CreatePatientScreen() {
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] =
    useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] =
    useState('');

  const [loading, setLoading] = useState(false);

  const clearForm = () => {
    setIdNumber('');
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setGender('');
    setPhoneNumber('');
    setAddress('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
  };

  const handleCreatePatient = async () => {
    const cleanId = idNumber.replace(/\s/g, '');

    if (!cleanId) {
      Alert.alert(
        'Missing information',
        'South African ID number is required.'
      );
      return;
    }

    if (!isValidSouthAfricanId(cleanId)) {
      Alert.alert(
        'Invalid ID number',
        'Please enter a valid 13-digit South African ID number.'
      );
      return;
    }

    if (!firstName.trim()) {
      Alert.alert(
        'Missing information',
        'First name is required.'
      );
      return;
    }

    if (!lastName.trim()) {
      Alert.alert(
        'Missing information',
        'Last name is required.'
      );
      return;
    }

    try {
      setLoading(true);

      console.log('CREATE PATIENT: starting');

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          'CREATE PATIENT SESSION ERROR:',
          sessionError.message
        );

        Alert.alert(
          'Authentication error',
          'Unable to verify your login.'
        );

        return;
      }

      if (!session) {
        Alert.alert(
          'Session expired',
          'Please log in again.'
        );

        router.replace('/(auth)/login');

        return;
      }

      const supabaseUrl =
        process.env.EXPO_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        Alert.alert(
          'Configuration error',
          'Supabase URL is not configured.'
        );

        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-patient`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            id_number: cleanId,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            date_of_birth:
              dateOfBirth.trim() || null,
            gender:
              gender.trim() || null,
            phone_number:
              phoneNumber.trim() || null,
            address:
              address.trim() || null,
            emergency_contact_name:
              emergencyContactName.trim() || null,
            emergency_contact_phone:
              emergencyContactPhone.trim() || null,
          }),
        }
      );

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      console.log(
        'CREATE PATIENT STATUS:',
        response.status
      );

      console.log(
        'CREATE PATIENT RESULT:',
        result
      );

      if (!response.ok) {
        Alert.alert(
          'Patient creation failed',
          result?.error ||
            result?.message ||
            `Request failed with status ${response.status}.`
        );

        return;
      }

      Alert.alert(
        'Patient Created',
        'The patient has been successfully registered.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearForm();

              router.replace('/(app)/patients');
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'CREATE PATIENT EXCEPTION:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to create the patient. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Register Patient
        </Text>

        <Text style={styles.subtitle}>
          Create a new patient record
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Patient Information
        </Text>

        <TextInput
          style={styles.input}
          placeholder="South African ID Number *"
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="number-pad"
          maxLength={13}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="First Name *"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name *"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD)"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Gender"
          value={gender}
          onChangeText={setGender}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
          ]}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
          multiline
          textAlignVertical="top"
          editable={!loading}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Emergency Contact
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Emergency Contact Name"
          value={emergencyContactName}
          onChangeText={setEmergencyContactName}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Emergency Contact Phone"
          value={emergencyContactPhone}
          onChangeText={setEmergencyContactPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleCreatePatient}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator
              color="#FFFFFF"
              style={styles.spinner}
            />

            <Text style={styles.buttonText}>
              Creating Patient...
            </Text>
          </>
        ) : (
          <Text style={styles.buttonText}>
            Create Patient
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() =>
          router.back()
        }
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>
          Cancel
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#64748B',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 14,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },

  multilineInput: {
    height: 90,
    paddingTop: 14,
  },

  button: {
    minHeight: 54,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  spinner: {
    marginRight: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  cancelButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
});

