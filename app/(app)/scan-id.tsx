import {
  ActivityIndicator,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  View,
} from 'react-native';

import { useState } from 'react';

import { Redirect, router } from 'expo-router';

import { isValidSouthAfricanId } from '../../utils/saIdValidator';

import { supabase } from '../../lib/supabase';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import { useAuth } from '../../context/AuthContext';

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

export default function ScanIdScreen() {
  const { session } = useAuth();

  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanned, setScanned] = useState(false);

  const [barcodeData, setBarcodeData] =
    useState<string | null>(null);

  const [barcodeType, setBarcodeType] =
    useState<string | null>(null);

  const [patient, setPatient] =
  useState<Patient | null>(null);

  const [searching, setSearching] =
  useState(false);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  /*
   * Camera permission is still being checked.
   */
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text style={styles.loadingText}>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  /*
   * Camera permission hasn't been granted.
   */
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          Camera Access Required
        </Text>

        <Text style={styles.description}>
          MediVault needs camera access to scan
          the patient's identification document.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>
            Allow Camera
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /*
   * Barcode detected.
   */
const handleBarcodeScanned = async ({
  data,
  type,
}: {
  data: string;
  type: string;
}) => {
  if (scanned || searching) {
    return;
  }

  console.log('BARCODE TYPE:', type);
  console.log('BARCODE DATA:', data);

  const possibleIds =
    data.match(/\d{13}/g) ?? [];

  console.log(
    'POSSIBLE ID NUMBERS:',
    possibleIds
  );

  const validId = possibleIds.find(
    (candidate) =>
      isValidSouthAfricanId(candidate)
  );

  if (!validId) {
    Alert.alert(
      'ID not recognised',
      'The barcode was scanned, but we could not find a valid South African ID number.'
    );

    return;
  }

  console.log(
    'VALID PATIENT ID:',
    validId
  );

  setScanned(true);
  setBarcodeData(validId);
  setBarcodeType(type);

  try {
    setSearching(true);

    console.log(
      'SEARCHING SUPABASE FOR:',
      validId
    );

    const {
      data: patientData,
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
      .eq('id_number', validId)
      .maybeSingle();

    if (error) {
      console.error(
        'PATIENT SEARCH ERROR:',
        error.message
      );

      Alert.alert(
        'Database error',
        error.message
      );

      return;
    }

    if (!patientData) {
      Alert.alert(
        'Patient not found',
        'The ID is valid, but there is no patient record associated with it.'
      );

      return;
    }

    console.log(
      'PATIENT FOUND:',
      patientData.id
    );

    setPatient(patientData);
  } catch (error) {
    console.error(
      'PATIENT SEARCH EXCEPTION:',
      error
    );

    Alert.alert(
      'Error',
      'Unable to retrieve the patient record.'
    );
  } finally {
    setSearching(false);
  }
};

const scanAgain = () => {
  setScanned(false);
  setBarcodeData(null);
  setBarcodeType(null);
};

  /*
   * Scanner screen
   */
  if (!scanned) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>
            MediVault
          </Text>

          <Text style={styles.headerTitle}>
            Scan Patient ID
          </Text>

          <Text style={styles.headerDescription}>
            Position the barcode on the patient's
            ID inside the scanning frame.
          </Text>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={
              handleBarcodeScanned
            }
            barcodeScannerSettings={{
              barcodeTypes: [
                'pdf417',
                'code128',
                'qr',
                'datamatrix',
              ],
            }}
          />

          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
          </View>

          <View style={styles.scanInstruction}>
            <Text style={styles.instructionText}>
              Align the ID barcode inside the box
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /*
   * Barcode result screen
   */
  return (
    <View style={styles.resultContainer}>
    {searching ? (
      <>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text style={styles.searchingTitle}>
          Finding Patient...
        </Text>

        <Text style={styles.note}>
          Searching the MediVault database using
          the validated ID number.
        </Text>
      </>
    ) : patient ? (
      <>
        <Text style={styles.successTitle}>
          Patient Found
        </Text>

        <View style={styles.patientCard}>
          <Text style={styles.patientName}>
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

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            // Patient medical-record screen
            // will be added next.
            Alert.alert(
              'Patient selected',
              'The patient record has been successfully retrieved.'
            );
          }}
        >
          <Text style={styles.buttonText}>
            Open Patient Record
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={scanAgain}
        >
          <Text style={styles.backButtonText}>
            Scan Another Patient
          </Text>
        </TouchableOpacity>
      </>
    ) : (
      <>
        <Text style={styles.successTitle}>
          ID Validated
        </Text>

        <Text style={styles.resultLabel}>
          Patient ID
        </Text>

        <View style={styles.resultCard}>
          <Text style={styles.resultText}>
            {barcodeData}
          </Text>
        </View>

        <Text style={styles.note}>
          No patient record was found for this
          ID number.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={scanAgain}
        >
          <Text style={styles.buttonText}>
            Scan Again
          </Text>
        </TouchableOpacity>
      </>
    )}
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 22,
    paddingBottom: 18,
    backgroundColor: '#f8fafc',
  },

  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 5,
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 7,
  },

  headerDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },

  cameraContainer: {
    flex: 1,
    position: 'relative',
  },

  camera: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanFrame: {
    width: '82%',
    height: 180,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 14,
  },

  scanInstruction: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  instructionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  cancelButton: {
    height: 58,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },

  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 25,
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },

  button: {
    width: '100%',
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  backButton: {
    width: '100%',
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },

  resultContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: '#f8fafc',
  },

  successTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 28,
  },

  resultLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 7,
  },

  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },

  resultText: {
    fontSize: 16,
    color: '#0f172a',
  },

  note: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748b',
    marginBottom: 28,
  },

  searchingTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: '#0f172a',
  marginTop: 20,
  marginBottom: 10,
},

patientCard: {
  backgroundColor: '#ffffff',
  borderRadius: 14,
  padding: 22,
  marginBottom: 24,
},

patientName: {
  fontSize: 23,
  fontWeight: '700',
  color: '#0f172a',
  marginBottom: 15,
},

label: {
  fontSize: 13,
  color: '#64748b',
  marginTop: 12,
  marginBottom: 4,
},

value: {
  fontSize: 16,
  fontWeight: '600',
  color: '#0f172a',
},
});