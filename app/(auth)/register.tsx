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
import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

const roles = [
  {
    label: 'Admin',
    value: 'admin',
  },
  {
    label: 'Doctor',
    value: 'doctor',
  },
  {
    label: 'Nurse',
    value: 'nurse',
  },
  {
    label: 'Paramedic',
    value: 'paramedic',
  },
];

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');

  const [showRoles, setShowRoles] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // -----------------------------------------
    // VALIDATE FORM
    // -----------------------------------------

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !role ||
      !password
    ) {
      Alert.alert(
        'Missing information',
        'Please complete all fields, including selecting your role.'
      );

      return;
    }

    // -----------------------------------------
    // VALIDATE PASSWORD
    // -----------------------------------------

    if (password.length < 6) {
      Alert.alert(
        'Invalid password',
        'Password must contain at least 6 characters.'
      );

      return;
    }

    try {
      setLoading(true);

      // Close dropdown if it is open
      setShowRoles(false);

      console.log('REGISTER: attempting...');
      console.log('REGISTER ROLE:', role);

      // -----------------------------------------
      // CREATE SUPABASE ACCOUNT
      // -----------------------------------------

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),

            // Save the role in lowercase.
            // Example: doctor, nurse, admin, paramedic
            role: role,
          },
        },
      });

      // -----------------------------------------
      // HANDLE REGISTRATION ERROR
      // -----------------------------------------

      if (error) {
        console.error('REGISTER ERROR:', error.message);

        Alert.alert(
          'Registration failed',
          error.message
        );

        return;
      }

      // -----------------------------------------
      // REGISTRATION SUCCESS
      // -----------------------------------------

      console.log(
        'REGISTER SUCCESS:',
        data.user?.id
      );

      Alert.alert(
  'Registration successful',
  'Your account has been created. Please sign in.',
  [
    {
      text: 'Continue',
      onPress: () => router.replace('/(auth)/login'),
    },
  ]
);

      console.log(
        'REGISTERED ROLE:',
        role
      );


      Alert.alert(
        'Registration successful',
        `Your CARELINK account has been created as a ${roleLabel}. Please sign in.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              router.replace('/(auth)/login');
            },
          },
        ]
      );

      // -----------------------------------------
      // CLEAR FORM
      // -----------------------------------------

      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('');
      setPassword('');
      setShowRoles(false);

    } catch (error) {
      console.error(
        'REGISTER EXCEPTION:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong while registering.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* =====================================
          LOGO
      ====================================== */}

      <Text style={styles.logo}>
        CARELINK
      </Text>

      {/* =====================================
          HEADING
      ====================================== */}

      <Text style={styles.title}>
        Create Account
      </Text>

      <Text style={styles.subtitle}>
        Register as a healthcare worker
      </Text>

      {/* =====================================
          FIRST NAME
      ====================================== */}

      <TextInput
        style={styles.input}
        placeholder="First name"
        placeholderTextColor="#94a3b8"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!loading}
      />

      {/* =====================================
          LAST NAME
      ====================================== */}

      <TextInput
        style={styles.input}
        placeholder="Last name"
        placeholderTextColor="#94a3b8"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!loading}
      />

      {/* =====================================
          EMAIL
      ====================================== */}

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

      {/* =====================================
          ROLE LABEL
      ====================================== */}

      <Text style={styles.roleLabel}>
        Role
      </Text>

      {/* =====================================
          ROLE DROPDOWN
      ====================================== */}

      <Pressable
        style={[
          styles.dropdown,
          showRoles && styles.dropdownActive,
        ]}
        onPress={() => {
          if (!loading) {
            setShowRoles((previous) => !previous);
          }
        }}
      >
        <Text
          style={
            role
              ? styles.dropdownText
              : styles.placeholderText
          }
        >
          {role
            ? roles.find((item) => item.value === role)?.label
            : 'Select your role'}
        </Text>

        <Text style={styles.arrow}>
          {showRoles ? '▲' : '▼'}
        </Text>
      </Pressable>

      {/* =====================================
          DROPDOWN OPTIONS
      ====================================== */}

      {showRoles && (
        <View style={styles.dropdownList}>
          {roles.map((item, index) => (
            <Pressable
              key={item.value}
              style={[
                styles.roleOption,
                index === roles.length - 1 &&
                  styles.lastRoleOption,
                role === item.value &&
                  styles.selectedRoleOption,
              ]}
              onPress={() => {
                setRole(item.value);
                setShowRoles(false);
              }}
            >
              <Text
                style={[
                  styles.roleOptionText,
                  role === item.value &&
                    styles.selectedRoleOptionText,
                ]}
              >
                {item.label}
              </Text>

              {role === item.value && (
                <Text style={styles.checkMark}>
                  ✓
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* =====================================
          PASSWORD
      ====================================== */}

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      {/* =====================================
          CREATE ACCOUNT BUTTON
      ====================================== */}

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      {/* =====================================
          LOGIN LINK
      ====================================== */}

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>
          Already have an account?{' '}
        </Text>

    
       
        
          Sign In
       
      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  // =========================================
  // CONTAINER
  // =========================================

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },

  // =========================================
  // LOGO
  // =========================================

  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 35,
    letterSpacing: 1,
  },

  // =========================================
  // TITLE
  // =========================================

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },

  // =========================================
  // SUBTITLE
  // =========================================

  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 28,
  },

  // =========================================
  // INPUT
  // =========================================

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

  // =========================================
  // ROLE LABEL
  // =========================================

  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 7,
  },

  // =========================================
  // DROPDOWN
  // =========================================

  dropdown: {
    height: 52,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownActive: {
    borderColor: '#2563eb',
  },

  dropdownText: {
    fontSize: 16,
    color: '#0f172a',
  },

  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
  },

  arrow: {
    fontSize: 12,
    color: '#64748b',
  },

  // =========================================
  // DROPDOWN LIST
  // =========================================

  dropdownList: {
    marginTop: -8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    overflow: 'hidden',

    // Web shadow
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 4,
  },

  // =========================================
  // ROLE OPTION
  // =========================================

  roleOption: {
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  lastRoleOption: {
    borderBottomWidth: 0,
  },

  selectedRoleOption: {
    backgroundColor: '#eff6ff',
  },

  roleOptionText: {
    fontSize: 16,
    color: '#0f172a',
  },

  selectedRoleOptionText: {
    color: '#2563eb',
    fontWeight: '600',
  },

  checkMark: {
    fontSize: 18,
    color: '#2563eb',
    fontWeight: '700',
  },

  // =========================================
  // BUTTON
  // =========================================

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

  // =========================================
  // LOGIN LINK
  // =========================================

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  loginText: {
    fontSize: 15,
    color: '#64748b',
  },

  loginLink: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
});