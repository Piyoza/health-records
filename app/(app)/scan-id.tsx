import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useRef, useState } from 'react';

import { Redirect, router } from 'expo-router';

import {
  CameraView,
  useCameraPermissions,
  Camera,
} from 'expo-camera';

import * as ImageManipulator from 'expo-image-manipulator';

import { useAuth } from '../../context/AuthContext';

export default function ScanIdScreen() {
  const { session } = useAuth();

  const [permission, requestPermission] =
    useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);

  const [processing, setProcessing] =
    useState(false);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          Camera Access Required
        </Text>

        <Text style={styles.description}>
          Camera access is required to capture the
          patient's identification card.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>
            Allow Camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

const takePhoto = async () => {
  if (!cameraRef.current || processing) {
    return;
  }

  try {
    setProcessing(true);

    console.log('CAPTURING ID CARD...');

    const photo =
      await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

    if (!photo?.uri) {
      throw new Error(
        'The camera did not return an image.'
      );
    }

    console.log(
      'PHOTO CAPTURED:',
      photo.uri
    );

    /*
     * Resize the image first.
     * This gives the barcode scanner a
     * manageable high-quality image.
     */
    const manipulated =
      await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            resize: {
              width: 1600,
            },
          },
        ],
        {
          compress: 1,
          format:
            ImageManipulator.SaveFormat.JPEG,
        }
      );

    console.log(
      'IMAGE PROCESSED:',
      manipulated.uri
    );

    /*
     * Scan the captured image.
     */
    const results =
      await Camera.scanFromURLAsync(
        manipulated.uri,
        [
          'code39',
          'pdf417',
          'code128',
        ]
      );

    console.log(
      '================================'
    );

    console.log(
      'BARCODE SCAN RESULTS:'
    );

    console.log(results);

    console.log(
      '================================'
    );

    if (!results || results.length === 0) {
      Alert.alert(
        'No barcode detected',
        'The ID barcode could not be detected. Make sure the barcode is clearly visible, then try again.'
      );

      return;
    }

    const firstResult = results[0];

    console.log(
      'BARCODE TYPE:',
      firstResult.type
    );

    console.log(
      'BARCODE DATA LENGTH:',
      firstResult.data.length
    );

    Alert.alert(
      'Barcode detected',
      `Type: ${firstResult.type}\n\nData length: ${firstResult.data.length}`
    );

  } catch (error) {
    console.error(
      'ID SCAN ERROR:',
      error
    );

    Alert.alert(
      'Scan error',
      'Something went wrong while scanning the ID image.'
    );
  } finally {
    setProcessing(false);
  }
};

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      />

      <View style={styles.overlay}>
        <View style={styles.topArea}>
          <Text style={styles.heading}>
            Scan Patient ID
          </Text>

          <Text style={styles.instruction}>
            Place the entire ID card inside the
            frame.
          </Text>
        </View>

        <View style={styles.cardFrame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        <View style={styles.bottomArea}>
          <Text style={styles.hint}>
            Make sure the barcode is sharp and
            well lit.
          </Text>

          <TouchableOpacity
            style={[
              styles.captureButton,
              processing &&
                styles.captureButtonDisabled,
            ]}
            onPress={takePhoto}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <View
                style={styles.captureCircle}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  camera: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  topArea: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  heading: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },

  instruction: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },

  cardFrame: {
    width: '88%',
    height: 240,
    alignSelf: 'center',
    position: 'relative',
  },

  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 35,
    height: 35,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#ffffff',
  },

  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 35,
    height: 35,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#ffffff',
  },

  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 35,
    height: 35,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#ffffff',
  },

  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 35,
    height: 35,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#ffffff',
  },

  bottomArea: {
    paddingBottom: 30,
    alignItems: 'center',
  },

  hint: {
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 18,
    textAlign: 'center',
  },

  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureButtonDisabled: {
    opacity: 0.6,
  },

  captureCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },

  cancelButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },

  cancelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#f8fafc',
  },

  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
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
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});