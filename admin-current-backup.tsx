import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

type Screen =
  | 'dashboard'
  | 'search-patient'
  | 'register-patient'
  | 'assign-patient'
  | 'view-workers'
  | 'create-worker'
  | 'assign-role'
  | 'assign-facility'
  | 'assign-department'
  | 'activity-logs';

type Patient = {
  id: string;
  doctor: string;
  status: 'Assigned' | 'Unassigned';
  created: string;
};

type Worker = {
  id: string;
  name: string;
  role: string;
  facility: string;
  department: string;
};

const doctors = [
  'Dr. Naidoo',
  'Dr. Patel',
  'Dr. Mkhize',
  'Dr. Dlamini',
];

const initialPatients: Patient[] = [
  {
    id: 'CL-0001',
    doctor: 'Dr. Naidoo',
    status: 'Assigned',
    created: '03 Sep 2026',
  },
  {
    id: 'CL-0002',
    doctor: 'Dr. Patel',
    status: 'Assigned',
    created: '03 Sep 2026',
  },
  {
    id: 'CL-0003',
    doctor: 'Dr. Mkhize',
    status: 'Assigned',
    created: '02 Sep 2026',
  },
  {
    id: 'CL-0004',
    doctor: 'Unassigned',
    status: 'Unassigned',
    created: '02 Sep 2026',
  },
];

const initialWorkers: Worker[] = [
  {
    id: 'HW-0001',
    name: 'Dr. Naidoo',
    role: 'Doctor',
    facility: 'Durban Central Hospital',
    department: 'General Medicine',
  },
  {
    id: 'HW-0002',
    name: 'Dr. Patel',
    role: 'Doctor',
    facility: 'Addington Hospital',
    department: 'General Medicine',
  },
  {
    id: 'HW-0003',
    name: 'Dr. Mkhize',
    role: 'Doctor',
    facility: 'King Edward VIII Hospital',
    department: 'Emergency',
  },
];

export default function AdminDashboard() {
  const [screen, setScreen] = useState<Screen>('dashboard');

  // SIDEBAR
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [patientsOpen, setPatientsOpen] = useState(true);
  const [workersOpen, setWorkersOpen] = useState(false);

  // PATIENTS
  const [patients, setPatients] = useState<Patient[]>(
    initialPatients
  );

  const [search, setSearch] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientIdNumber, setPatientIdNumber] = useState('');

  // ASSIGNMENT
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [selectedDoctor, setSelectedDoctor] =
    useState('');

  const [showAssignModal, setShowAssignModal] =
    useState(false);

  // WORKERS
  const [workers] = useState<Worker[]>(initialWorkers);

  // SUCCESS MESSAGE
  const [successMessage, setSuccessMessage] =
    useState('');

  // CREATE WORKER
  const [workerFirstName, setWorkerFirstName] = useState('');
  const [workerLastName, setWorkerLastName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [workerRole, setWorkerRole] = useState('Doctor');

  const navigate = (newScreen: Screen) => {
    setScreen(newScreen);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------

  const logout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const { error } =
              await supabase.auth.signOut();

            if (error) {
              Alert.alert(
                'Logout Error',
                error.message
              );
              return;
            }

            router.replace('(auth)/login');
          },
        },
      ]
    );
  };

  // ------------------------------------------------
  // PATIENT NUMBER
  // ------------------------------------------------

  const generatePatientNumber = () => {
    const nextNumber = patients.length + 1;

    return `CL-${String(nextNumber).padStart(4, '0')}`;
  };

  // ------------------------------------------------
  // REGISTER PATIENT
  // ------------------------------------------------

  const registerPatient = () => {
    if (
      !patientName.trim() ||
      !patientIdNumber.trim()
    ) {
      Alert.alert(
        'Missing Information',
        'Please enter the patient name and South African ID number.'
      );

      return;
    }

    const newPatientNumber =
      generatePatientNumber();

    const newPatient: Patient = {
      id: newPatientNumber,
      doctor: 'Unassigned',
      status: 'Unassigned',
      created: '04 Sep 2026',
    };

    setPatients((current) => [
      ...current,
      newPatient,
    ]);

    setPatientName('');
    setPatientIdNumber('');

    showSuccess(
      `Patient registered successfully. File Number: ${newPatientNumber}`
    );

    navigate('search-patient');
  };

  // ------------------------------------------------
  // ASSIGN PATIENT
  // ------------------------------------------------

  const openAssignPatient = (
    patient: Patient
  ) => {
    setSelectedPatient(patient);

    setSelectedDoctor(
      patient.doctor === 'Unassigned'
        ? ''
        : patient.doctor
    );

    setShowAssignModal(true);
  };

  const assignPatient = () => {
    if (
      !selectedPatient ||
      !selectedDoctor
    ) {
      Alert.alert(
        'Select Doctor',
        'Please select a healthcare worker.'
      );

      return;
    }

    setPatients((current) =>
      current.map((patient) =>
        patient.id === selectedPatient.id
          ? {
              ...patient,
              doctor: selectedDoctor,
              status: 'Assigned',
            }
          : patient
      )
    );

    setShowAssignModal(false);

    showSuccess(
      `${selectedPatient.id} assigned to ${selectedDoctor}`
    );

    setSelectedPatient(null);
    setSelectedDoctor('');
  };

  // ------------------------------------------------
  // SEARCH
  // ------------------------------------------------

  const filteredPatients =
    patients.filter((patient) =>
      patient.id
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const assignedPatients =
    patients.filter(
      (patient) =>
        patient.status === 'Assigned'
    ).length;

  const unassignedPatients =
    patients.filter(
      (patient) =>
        patient.status === 'Unassigned'
    ).length;

  // ------------------------------------------------
  // PAGE HEADER
  // ------------------------------------------------

  const renderHeader = (
    title: string,
    subtitle: string
  ) => {
    return (
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>
          {title}
        </Text>

        <Text style={styles.pageSubtitle}>
          {subtitle}
        </Text>
      </View>
    );
  };

  // ------------------------------------------------
  // DASHBOARD
  // ------------------------------------------------

  const renderDashboard = () => (
    <>
      {renderHeader(
        'Administration Dashboard',
        'CARELINK healthcare administration'
      )}

      <View style={styles.privacyBanner}>
        <Text style={styles.privacyIcon}>
          🔒
        </Text>

        <View
          style={styles.privacyTextContainer}
        >
          <Text style={styles.privacyTitle}>
            Patient Privacy Protected
          </Text>

          <Text style={styles.privacyText}>
            Administrators can manage patient
            files and assignments but cannot
            access clinical or personal patient
            information.
          </Text>
        </View>
      </View>

      {/* STATISTICS */}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {patients.length}
          </Text>

          <Text style={styles.statLabel}>
            Patient Files
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {assignedPatients}
          </Text>

          <Text style={styles.statLabel}>
            Assigned
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {unassignedPatients}
          </Text>

          <Text style={styles.statLabel}>
            Unassigned
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {workers.length}
          </Text>

          <Text style={styles.statLabel}>
            Healthcare Workers
          </Text>
        </View>
      </View>

      {/* PATIENT FILES */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>
              Patient Files
            </Text>

            <Text style={styles.cardSubtitle}>
              Administrative view only
            </Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              navigate('register-patient')
            }
          >
            <Text
              style={styles.primaryButtonText}
            >
              + Register Patient
            </Text>
          </Pressable>
        </View>

        {patients.slice(0, 5).map(
          (patient) => (
            <View
              key={patient.id}
              style={styles.patientRow}
            >
              <View>
                <Text
                  style={
                    styles.patientFileNumber
                  }
                >
                  {patient.id}
                </Text>

                <Text
                  style={styles.createdText}
                >
                  Created {patient.created}
                </Text>
              </View>

              <View
                style={
                  styles.assignmentContainer
                }
              >
                <Text
                  style={styles.doctorText}
                >
                  {patient.doctor}
                </Text>

                <Text
                  style={
                    patient.status ===
                    'Assigned'
                      ? styles.assignedText
                      : styles.unassignedText
                  }
                >
                  {patient.status}
                </Text>
              </View>

              <Pressable
                style={styles.smallButton}
                onPress={() =>
                  openAssignPatient(
                    patient
                  )
                }
              >
                <Text
                  style={
                    styles.smallButtonText
                  }
                >
                  Assign
                </Text>
              </Pressable>
            </View>
          )
        )}
      </View>
    </>
  );

  // ------------------------------------------------
  // SEARCH PATIENT
  // ------------------------------------------------

  const renderSearchPatient = () => (
    <>
      {renderHeader(
        'Search Patient',
        'Search using the patient file number'
      )}

      <View style={styles.privacyBanner}>
        <Text style={styles.privacyIcon}>
          🔒
        </Text>

        <View
          style={styles.privacyTextContainer}
        >
          <Text style={styles.privacyTitle}>
            Restricted Patient Information
          </Text>

          <Text style={styles.privacyText}>
            Only administrative file information
            is displayed. Personal and clinical
            information is hidden.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>
          Patient File Number
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Example: CL-0001"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Patient Files
        </Text>

        {filteredPatients.length ===
        0 ? (
          <Text style={styles.emptyText}>
            No patient files found.
          </Text>
        ) : (
          filteredPatients.map(
            (patient) => (
              <View
                key={patient.id}
                style={styles.patientRow}
              >
                <View>
                  <Text
                    style={
                      styles.patientFileNumber
                    }
                  >
                    {patient.id}
                  </Text>

                  <Text
                    style={
                      styles.createdText
                    }
                  >
                    Created {patient.created}
                  </Text>
                </View>

                <View
                  style={
                    styles.assignmentContainer
                  }
                >
                  <Text
                    style={
                      styles.doctorText
                    }
                  >
                    {patient.doctor}
                  </Text>

                  <Text
                    style={
                      patient.status ===
                      'Assigned'
                        ? styles.assignedText
                        : styles.unassignedText
                    }
                  >
                    {patient.status}
                  </Text>
                </View>

                <Pressable
                  style={
                    styles.smallButton
                  }
                  onPress={() =>
                    openAssignPatient(
                      patient
                    )
                  }
                >
                  <Text
                    style={
                      styles.smallButtonText
                    }
                  >
                    Assign
                  </Text>
                </Pressable>
              </View>
            )
          )
        )}
      </View>
    </>
  );

  // ------------------------------------------------
  // REGISTER PATIENT
  // ------------------------------------------------

  const renderRegisterPatient = () => (
    <>
      {renderHeader(
        'Register Patient',
        'Create a new CARELINK patient file'
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Patient Registration
        </Text>

        <Text style={styles.cardSubtitle}>
          Enter the required information to
          create a patient file.
        </Text>

        <Text style={styles.inputLabel}>
          Patient Name
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter patient name"
          value={patientName}
          onChangeText={setPatientName}
        />

        <Text style={styles.inputLabel}>
          South African ID Number
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter ID number"
          value={patientIdNumber}
          onChangeText={
            setPatientIdNumber
          }
          keyboardType="numeric"
        />

        <View style={styles.formNote}>
          <Text
            style={styles.formNoteText}
          >
            🔒 The administrator will only
            see the generated CARELINK file
            number after registration.
          </Text>
        </View>

        <Pressable
          style={
            styles.primaryButtonLarge
          }
          onPress={registerPatient}
        >
          <Text
            style={styles.primaryButtonText}
          >
            Register Patient
          </Text>
        </Pressable>
      </View>
    </>
  );

  // ------------------------------------------------
  // ASSIGN PATIENT
  // ------------------------------------------------

  const renderAssignPatient = () => (
    <>
      {renderHeader(
        'Assign Patient',
        'Assign patient files to healthcare workers'
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Patient Files
        </Text>

        <Text style={styles.cardSubtitle}>
          Only file numbers and assignment
          information are visible.
        </Text>

        {patients.map((patient) => (
          <View
            key={patient.id}
            style={styles.patientRow}
          >
            <View>
              <Text
                style={
                  styles.patientFileNumber
                }
              >
                {patient.id}
              </Text>

              <Text
                style={styles.createdText}
              >
                {patient.status}
              </Text>
            </View>

            <Text style={styles.doctorText}>
              {patient.doctor}
            </Text>

            <Pressable
              style={styles.smallButton}
              onPress={() =>
                openAssignPatient(
                  patient
                )
              }
            >
              <Text
                style={
                  styles.smallButtonText
                }
              >
                Assign
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </>
  );

  // ------------------------------------------------
  // VIEW WORKERS
  // ------------------------------------------------

  const renderWorkers = () => (
    <>
      {renderHeader(
        'Healthcare Workers',
        'Manage healthcare worker administration'
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Healthcare Workers
        </Text>

        <Text style={styles.cardSubtitle}>
          View healthcare workers and their
          administrative assignments.
        </Text>

        {workers.map((worker) => (
          <View
            key={worker.id}
            style={styles.workerRow}
          >
            <View
              style={styles.workerAvatar}
            >
              <Text
                style={
                  styles.workerAvatarText
                }
              >
                {worker.name.charAt(0)}
              </Text>
            </View>

            <View
              style={styles.workerInfo}
            >
              <Text
                style={styles.workerName}
              >
                {worker.name}
              </Text>

              <Text
                style={
                  styles.workerDetails
                }
              >
                {worker.id} • {worker.role}
              </Text>

              <Text
                style={
                  styles.workerDetails
                }
              >
                {worker.facility}
              </Text>

              <Text
                style={
                  styles.workerDetails
                }
              >
                {worker.department}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // ------------------------------------------------
  // OTHER WORKER PAGES
  // ------------------------------------------------

  const renderAdminModule = (
    title: string,
    subtitle: string,
    description: string
  ) => (
    <>
      {renderHeader(
        title,
        subtitle
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {title}
        </Text>

        <Text style={styles.cardSubtitle}>
          {description}
        </Text>

        <View
          style={styles.comingSoonBox}
        >
          <Text
            style={styles.comingSoonIcon}
          >
            ⚙
          </Text>

          <Text
            style={styles.comingSoonTitle}
          >
            Administration Module
          </Text>

          <Text
            style={styles.comingSoonText}
          >
            This section is ready for the
            next development stage. We will
            connect it to Supabase and add
            the required administration
            controls.
          </Text>
        </View>
      </View>
    </>
  );

  // ------------------------------------------------
  // SCREEN SELECTOR
  // ------------------------------------------------

  const renderCurrentScreen = () => {
    switch (screen) {
      case 'dashboard':
        return renderDashboard();

      case 'search-patient':
        return renderSearchPatient();

      case 'register-patient':
        return renderRegisterPatient();

      case 'assign-patient':
        return renderAssignPatient();

      case 'view-workers':
        return renderWorkers();

      case 'create-worker':
        return (
          <>
            {renderHeader(
              'Create Healthcare Worker',
              'Create a healthcare worker account for CARELINK'
            )}

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Worker Details</Text>

              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={workerFirstName}
                onChangeText={setWorkerFirstName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={workerLastName}
                onChangeText={setWorkerLastName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={workerEmail}
                onChangeText={setWorkerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create temporary password"
                value={workerPassword}
                onChangeText={setWorkerPassword}
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Role</Text>

              <View style={styles.roleOptions}>
                {['Doctor', 'Nurse', 'Administrator'].map((role) => (
                  <Pressable
                    key={role}
                    style={[
                      styles.roleButton,
                      workerRole === role && styles.roleButtonActive,
                    ]}
                    onPress={() => setWorkerRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        workerRole === role && styles.roleButtonTextActive,
                      ]}
                    >
                      {role}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  The healthcare worker will be given access according to the role
                  assigned by the administrator.
                </Text>
              </View>

              <Pressable
                style={styles.primaryButtonLarge}
                onPress={() => {
                  Alert.alert(
                    'Create Worker',
                    'The worker form is ready. Database account creation will be connected next.'
                  );
                }}
              >
                <Text style={styles.primaryButtonText}>Create Worker</Text>
              </Pressable>
            </View>
          </>
        );

      case 'assign-role':
        return renderAdminModule(
          'Assign Role',
          'Manage healthcare worker roles',
          'Assign appropriate roles to healthcare workers.'
        );

      case 'assign-facility':
        return renderAdminModule(
          'Assign Facility',
          'Assign healthcare workers to facilities',
          'Manage the facility associated with each healthcare worker.'
        );

      case 'assign-department':
        return renderAdminModule(
          'Assign Department',
          'Manage healthcare worker departments',
          'Assign healthcare workers to the correct department.'
        );

      case 'activity-logs':
        return renderAdminModule(
          'Activity Logs',
          'Monitor administrative activity',
          'View important administrative actions performed in CARELINK.'
        );

      default:
        return renderDashboard();
    }
  };

  // ------------------------------------------------
  // MAIN UI
  // ------------------------------------------------

  return (
    <View style={styles.container}>

      {/* ================= SIDEBAR ================= */}

      {sidebarOpen && (
        <View style={styles.sidebar}>

          {/* BRAND */}

          <View>
            <View
              style={styles.brandContainer}
            >
              <Image
                source={require('../../assets/sa-government-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              <View>
                <Text
                  style={styles.brandTitle}
                >
                  CARELINK
                </Text>

                <Text
                  style={styles.brandSubtitle}
                >
                  Department of Health
                </Text>
              </View>
            </View>

            <View
              style={styles.divider}
            />

            <Text
              style={styles.menuLabel}
            >
              ADMINISTRATION
            </Text>

            {/* DASHBOARD */}

            <Pressable
              style={[
                styles.navItem,
                screen === 'dashboard' &&
                  styles.navItemActive,
              ]}
              onPress={() =>
                navigate('dashboard')
              }
            >
              <Text
                style={styles.navIcon}
              >
                ▦
              </Text>

              <Text
                style={[
                  styles.navText,
                  screen === 'dashboard' &&
                    styles.navTextActive,
                ]}
              >
                Dashboard
              </Text>
            </Pressable>

            {/* PATIENTS */}

            <Pressable
              style={styles.navItem}
              onPress={() =>
                setPatientsOpen(
                  !patientsOpen
                )
              }
            >
              <Text
                style={styles.navIcon}
              >
                ♙
              </Text>

              <Text
                style={styles.navText}
              >
                Patients
              </Text>

              <Text
                style={styles.arrow}
              >
                {patientsOpen
                  ? '⌃'
                  : '⌄'}
              </Text>
            </Pressable>

            {patientsOpen && (
              <View
                style={styles.subMenu}
              >
                <Pressable
                  style={[
                    styles.subNavItem,
                    screen ===
                      'search-patient' &&
                      styles.subNavItemActive,
                  ]}
                  onPress={() =>
                    navigate(
                      'search-patient'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.subNavText,
                      screen ===
                        'search-patient' &&
                        styles.subNavTextActive,
                    ]}
                  >
                    Search Patient
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.subNavItem,
                    screen ===
                      'register-patient' &&
                      styles.subNavItemActive,
                  ]}
                  onPress={() =>
                    navigate(
                      'register-patient'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.subNavText,
                      screen ===
                        'register-patient' &&
                        styles.subNavTextActive,
                    ]}
                  >
                    Register Patient
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.subNavItem,
                    screen ===
                      'assign-patient' &&
                      styles.subNavItemActive,
                  ]}
                  onPress={() =>
                    navigate(
                      'assign-patient'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.subNavText,
                      screen ===
                        'assign-patient' &&
                        styles.subNavTextActive,
                    ]}
                  >
                    Assign Patient
                  </Text>
                </Pressable>
              </View>
            )}

            {/* HEALTHCARE WORKERS */}

            <Pressable
              style={styles.navItem}
              onPress={() =>
                setWorkersOpen(
                  !workersOpen
                )
              }
            >
              <Text
                style={styles.navIcon}
              >
                ⚕
              </Text>

              <Text
                style={styles.navText}
              >
                Healthcare Workers
              </Text>

              <Text
                style={styles.arrow}
              >
                {workersOpen
                  ? '⌃'
                  : '⌄'}
              </Text>
            </Pressable>

            {workersOpen && (
              <View
                style={styles.subMenu}
              >
                <Pressable
                  style={[
                    styles.subNavItem,
                    screen ===
                      'view-workers' &&
                      styles.subNavItemActive,
                  ]}
                  onPress={() =>
                    navigate(
                      'view-workers'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.subNavText,
                      screen ===
                        'view-workers' &&
                        styles.subNavTextActive,
                    ]}
                  >
                    View Workers
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.subNavItem,
                    screen ===
                      'create-worker' &&
                      styles.subNavItemActive,
                  ]}
                  onPress={() =>
                    navigate(
                      'create-worker'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.subNavText,
                      screen ===
                        'create-worker' &&
                        styles.subNavTextActive,
                    ]}
                  >
                    Create Worker
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.subNavItem,
                    screen ===
                      'assign-role' &&
                      styles.subNavItemActive,
                  ]}
                  onPress={() =>
                    navigate(
                      'assign-role'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.subNavText,
                      screen ===
                        'assign-role' &&
                        styles.subNavTextActive,
                    ]}
                  >
                    Assign Role
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.subNavItem,
                    screen ===
                      'assign-facility' &&
                      styles.subNavItemActive,
                  ]}
                  onPress={() =>
                    navigate(
                      'assign-facility'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.subNavText,
                      screen ===
                        'assign-facility' &&
                        styles.subNavTextActive,
                    ]}
                  >
                    Assign Facility
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.subNavItem,
                    screen ===
                      'assign-department' &&
                      styles.subNavItemActive,
                  ]}
                  onPress={() =>
                    navigate(
                      'assign-department'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.subNavText,
                      screen ===
                        'assign-department' &&
                        styles.subNavTextActive,
                    ]}
                  >
                    Assign Department
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ACTIVITY LOGS */}

            <Pressable
              style={[
                styles.navItem,
                screen ===
                  'activity-logs' &&
                  styles.navItemActive,
              ]}
              onPress={() =>
                navigate(
                  'activity-logs'
                )
              }
            >
              <Text
                style={styles.navIcon}
              >
                ◷
              </Text>

              <Text
                style={[
                  styles.navText,
                  screen ===
                    'activity-logs' &&
                    styles.navTextActive,
                ]}
              >
                Activity Logs
              </Text>
            </Pressable>
          </View>

          {/* LOGOUT */}

          <Pressable
            style={styles.logoutButton}
            onPress={logout}
          >
            <Text
              style={styles.logoutIcon}
            >
              ⇥
            </Text>

            <Text
              style={styles.logoutText}
            >
              Logout
            </Text>
          </Pressable>
        </View>
      )}

      {/* ================= MAIN ================= */}

      <View style={styles.main}>

        {/* TOP BAR */}

        <View style={styles.topBar}>

          <View
            style={styles.topBarLeft}
          >

            {/* MENU */}

            <Pressable
              style={styles.menuButton}
              onPress={() =>
                setSidebarOpen(
                  !sidebarOpen
                )
              }
            >
              <Text
                style={styles.menuIcon}
              >
                ☰
              </Text>
            </Pressable>

            {/* COAT OF ARMS ONLY WHEN SIDEBAR HIDDEN */}

            {!sidebarOpen && (
              <Image
                source={require('../../assets/sa-government-logo.png')}
                style={styles.topBarLogo}
                resizeMode="contain"
              />
            )}

            <View>
              <Text
                style={styles.topBarTitle}
              >
                CARELINK
              </Text>

              <Text
                style={styles.topBarSubtitle}
              >
                Administration Portal
              </Text>
            </View>
          </View>

          {/* ADMIN */}

          <View
            style={styles.adminBadge}
          >
            <View
              style={styles.adminCircle}
            >
              <Text
                style={
                  styles.adminCircleText
                }
              >
                A
              </Text>
            </View>

            <View>
              <Text
                style={styles.adminName}
              >
                Administrator
              </Text>

              <Text
                style={styles.adminRole}
              >
                System Administrator
              </Text>
            </View>
          </View>
        </View>

        {/* PAGE */}

        <ScrollView
          style={styles.content}
          contentContainerStyle={
            styles.contentContainer
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {renderCurrentScreen()}
        </ScrollView>
      </View>

      {/* SUCCESS MESSAGE */}

      {successMessage !== '' && (
        <View
          style={styles.successToast}
        >
          <Text
            style={styles.successIcon}
          >
            ✓
          </Text>

          <Text
            style={styles.successText}
          >
            {successMessage}
          </Text>
        </View>
      )}

      {/* ASSIGN PATIENT MODAL */}

      <Modal
        visible={showAssignModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowAssignModal(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>

            <Text
              style={styles.modalTitle}
            >
              Assign Patient
            </Text>

            {selectedPatient && (
              <View
                style={
                  styles.selectedFileBox
                }
              >
                <Text
                  style={
                    styles.selectedFileLabel
                  }
                >
                  Patient File
                </Text>

                <Text
                  style={
                    styles.selectedFileNumber
                  }
                >
                  {selectedPatient.id}
                </Text>
              </View>
            )}

            <Text
              style={styles.inputLabel}
            >
              Select Healthcare Worker
            </Text>

            {doctors.map((doctor) => (
              <Pressable
                key={doctor}
                style={[
                  styles.doctorOption,
                  selectedDoctor ===
                    doctor &&
                    styles.doctorOptionSelected,
                ]}
                onPress={() =>
                  setSelectedDoctor(
                    doctor
                  )
                }
              >
                <Text
                  style={[
                    styles.doctorOptionText,
                    selectedDoctor ===
                      doctor &&
                      styles.doctorOptionTextSelected,
                  ]}
                >
                  {doctor}
                </Text>

                {selectedDoctor ===
                  doctor && (
                  <Text
                    style={styles.checkMark}
                  >
                    ✓
                  </Text>
                )}
              </Pressable>
            ))}

            <View
              style={styles.modalButtons}
            >
              <Pressable
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setShowAssignModal(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.assignButton
                }
                onPress={assignPatient}
              >
                <Text
                  style={
                    styles.assignButtonText
                  }
                >
                  Assign Patient
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },

  /* SIDEBAR */

  sidebar: {
    width: 270,
    backgroundColor: '#0F2A43',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  logo: {
    width: 48,
    height: 58,
    marginRight: 10,
  },

  brandTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 1,
  },

  brandSubtitle: {
    color: '#B8C7D9',
    fontSize: 10,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#29435C',
    marginBottom: 20,
  },

  menuLabel: {
    color: '#7891A8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 10,
  },

  navItem: {
    minHeight: 46,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },

  navItemActive: {
    backgroundColor: '#1D4ED8',
  },

  navIcon: {
    width: 28,
    color: '#D8E4F0',
    fontSize: 18,
  },

  navText: {
    color: '#D8E4F0',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  navTextActive: {
    color: '#FFFFFF',
  },

  arrow: {
    color: '#AFC2D5',
    fontSize: 16,
  },

  subMenu: {
    marginLeft: 28,
    marginBottom: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#38536B',
  },

  subNavItem: {
    minHeight: 38,
    justifyContent: 'center',
    paddingLeft: 16,
    borderRadius: 6,
    marginBottom: 2,
  },

  subNavItemActive: {
    backgroundColor: '#173C61',
  },

  subNavText: {
    color: '#B8C7D9',
    fontSize: 13,
  },

  subNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  logoutButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#39546D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 20,
  },

  logoutIcon: {
    color: '#FCA5A5',
    fontSize: 20,
    marginRight: 12,
  },

  logoutText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '700',
  },

  /* MAIN */

  main: {
    flex: 1,
  },

  topBar: {
    height: 76,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },

  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  menuIcon: {
    color: '#0F2A43',
    fontSize: 22,
    fontWeight: '700',
  },

  topBarLogo: {
    width: 42,
    height: 48,
    marginRight: 12,
  },

  topBarTitle: {
    color: '#0F2A43',
    fontSize: 18,
    fontWeight: '800',
  },

  topBarSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  adminCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  adminCircleText: {
    color: '#1D4ED8',
    fontWeight: '800',
  },

  adminName: {
    color: '#0F2A43',
    fontSize: 13,
    fontWeight: '700',
  },

  adminRole: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 30,
    paddingBottom: 60,
  },

  /* PAGE HEADER */

  pageHeader: {
    marginBottom: 24,
  },

  pageTitle: {
    color: '#0F2A43',
    fontSize: 26,
    fontWeight: '800',
  },

  pageSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },

  /* PRIVACY */

  privacyBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 22,
  },

  privacyIcon: {
    fontSize: 22,
    marginRight: 12,
  },

  privacyTextContainer: {
    flex: 1,
  },

  privacyTitle: {
    color: '#1E40AF',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
  },

  privacyText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },

  /* STATS */

  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 20,
  },

  statNumber: {
    color: '#0F2A43',
    fontSize: 27,
    fontWeight: '800',
  },

  statLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
  },

  /* CARDS */

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
    marginBottom: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  cardTitle: {
    color: '#0F2A43',
    fontSize: 17,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 18,
  },

  /* BUTTONS */

  primaryButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 7,
  },

  primaryButtonLarge: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 13,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 20,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  smallButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 6,
  },

  smallButtonText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },

  /* PATIENT */

  patientRow: {
    minHeight: 70,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  patientFileNumber: {
    color: '#0F2A43',
    fontSize: 14,
    fontWeight: '800',
  },

  createdText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },

  assignmentContainer: {
    alignItems: 'center',
    minWidth: 130,
  },

  doctorText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },

  assignedText: {
    color: '#15803D',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '700',
  },

  unassignedText: {
    color: '#B45309',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '700',
  },

  /* CREATE WORKER FORM */

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    maxWidth: 700,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },

  formTitle: {
    color: '#0F2A43',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },

  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },

  roleButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },

  roleButtonActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },

  roleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  roleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  infoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 14,
    marginTop: 22,
    marginBottom: 2,
  },

  infoBoxText: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 17,
  },

  /* FORM */

  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 13,
    color: '#0F2A43',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
  },

  formNote: {
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    padding: 13,
    marginTop: 18,
  },

  formNoteText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
  },

  emptyText: {
    color: '#64748B',
    fontSize: 13,
    paddingVertical: 20,
  },

  /* WORKERS */

  workerRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  workerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  workerAvatarText: {
    color: '#1D4ED8',
    fontSize: 17,
    fontWeight: '800',
  },

  workerInfo: {
    flex: 1,
  },

  workerName: {
    color: '#0F2A43',
    fontSize: 14,
    fontWeight: '800',
  },

  workerDetails: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },

  /* OTHER MODULES */

  comingSoonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },

  comingSoonIcon: {
    fontSize: 30,
    marginBottom: 12,
  },

  comingSoonTitle: {
    color: '#0F2A43',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },

  comingSoonText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 500,
  },

  /* SUCCESS */

  successToast: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    backgroundColor: '#0F2A43',
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 420,
  },

  successIcon: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 10,
  },

  successText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* MODAL */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15, 42, 67, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modal: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 25,
  },

  modalTitle: {
    color: '#0F2A43',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 18,
  },

  selectedFileBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
  },

  selectedFileLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  selectedFileNumber: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },

  doctorOption: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 7,
    marginBottom: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  doctorOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },

  doctorOptionText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },

  doctorOptionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '800',
  },

  checkMark: {
    color: '#1D4ED8',
    fontWeight: '800',
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  cancelButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },

  assignButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});