import { createPatient } from '../../services/patientService';
import { getSAIdDetails } from '../../utils/saIdDetails';
import { supabase } from '../../lib/supabase';
import React, { useEffect, useState } from 'react';
import {
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

type Patient = {
  id: string;
  doctor: string;
  status: 'Assigned' | 'Unassigned';
  created: string;
};
type HealthcareWorker = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  facility: string;
  active: boolean;
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

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [healthcareWorkers, setHealthcareWorkers] =
  useState<HealthcareWorker[]>([]);

  const [showAddPatient, setShowAddPatient] = useState(false);

  const [showAssign, setShowAssign] = useState(false);

  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [selectedDoctor, setSelectedDoctor] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const [search, setSearch] = useState('');

  const [patientFirstName, setPatientFirstName] = useState('');
const [patientLastName, setPatientLastName] = useState('');

  const [patientIdNumber, setPatientIdNumber] = useState('');

  /*
   * Generates the next CARELINK file number.
   *
   * Example:
   * CL-0001
   * CL-0002
   * CL-0003
   */
  const generatePatientNumber = () => {
    const nextNumber = patients.length + 1;

    return `CL-${String(nextNumber).padStart(4, '0')}`;
  };
const fetchPatients = async () => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id, file_number, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setPatients(
  (data ?? []).map((patient) => ({
    id: patient.file_number ?? patient.id,
    doctor: 'Unassigned',
    status: 'Unassigned',
    created: new Date(patient.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }))
);

console.log('Patients loaded:', data);
  } catch (error) {
    console.error('Error fetching patients:', error);
  }
};
useEffect(() => {
  fetchPatients();
}, []);



 const addPatient = async () => {
  if (
    !patientFirstName.trim() ||
    !patientLastName.trim() ||
    !patientIdNumber.trim()
  ) {
    return;
  }

try {
  const idDetails = getSAIdDetails(patientIdNumber.trim());

  if (!idDetails) {
    setSuccessMessage(
      'Invalid South African ID number. Please check the ID number.'
    );

    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);

    return;
  }

  const patient = await createPatient({
    first_name: patientFirstName.trim(),
    last_name: patientLastName.trim(),
    id_number: patientIdNumber.trim(),
    date_of_birth: idDetails.dateOfBirth,
    gender: idDetails.gender,
  });

    setPatientFirstName('');
    setPatientLastName('');
    setPatientIdNumber('');
    setShowAddPatient(false);

    setSuccessMessage(
  `Patient registered successfully. File Number: ${patient.file_number}`
);

    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  } catch (error) {
  console.error('Error creating patient:', error);

  if (
    error instanceof Error &&
    error.message.includes('patients_id_number_key')
  ) {
    setSuccessMessage(
      'A patient with this South African ID number already exists.'
    );
  } else {
    setSuccessMessage(
      'Unable to register patient. Please try again.'
    );
  }

  setTimeout(() => {
    setSuccessMessage('');
  }, 5000);
}
};

  const openAssignDoctor = (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedDoctor(
      patient.doctor === 'Unassigned' ? '' : patient.doctor
    );
    setShowAssign(true);
  };

  const assignDoctor = () => {
    if (!selectedPatient || !selectedDoctor) {
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

    setShowAssign(false);

    setSuccessMessage(
      `${selectedPatient.id} has been assigned to ${selectedDoctor}.`
    );

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const filteredPatients = patients.filter((patient) =>
    patient.id.toLowerCase().includes(search.toLowerCase())
  );

  const assignedCount = patients.filter(
    (patient) => patient.status === 'Assigned'
  ).length;

  const unassignedCount = patients.filter(
    (patient) => patient.status === 'Unassigned'
  ).length;

  return (
    <View style={styles.appContainer}>

      {/* =========================
          SIDEBAR
      ========================= */}

      <View
        style={[
          styles.sidebar,
          !sidebarOpen && styles.sidebarCollapsed,
        ]}
      >

        {/* GOVERNMENT / CARELINK LOGO */}

        <View style={styles.logoArea}>

          <Image
            source={require('../../assets/sa-government-logo.png')}
            style={
              sidebarOpen
                ? styles.governmentLogo
                : styles.governmentLogoCollapsed
            }
            resizeMode="contain"
          />

          {sidebarOpen && (
            <View style={styles.logoTextArea}>
              <Text style={styles.carelinkText}>
                CARELINK
              </Text>

              <Text style={styles.logoSubtitle}>
                Electronic Health Records
              </Text>

              <Text style={styles.departmentText}>
                Department of Health
              </Text>
            </View>
          )}

        </View>

        {/* MENU */}

        {sidebarOpen && (
          <View style={styles.sidebarMenu}>

            <Text style={styles.menuLabel}>
              ADMINISTRATION
            </Text>

            <Pressable
              style={[
                styles.navItem,
                styles.activeNavItem,
              ]}
            >
              <Text style={styles.navIcon}>⌂</Text>

              <Text style={styles.activeNavText}>
                Dashboard
              </Text>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() =>
                setShowAddPatient(true)
              }
            >
              <Text style={styles.navIcon}>+</Text>

              <Text style={styles.navText}>
                Add Patient
              </Text>
            </Pressable>

            <Pressable style={styles.navItem}>
              <Text style={styles.navIcon}>▤</Text>

              <Text style={styles.navText}>
                Patient Files
              </Text>
            </Pressable>

            <Pressable style={styles.navItem}>
              <Text style={styles.navIcon}>♙</Text>

              <Text style={styles.navText}>
                Doctors
              </Text>
            </Pressable>

            <Text
              style={[
                styles.menuLabel,
                styles.servicesLabel,
              ]}
            >
              SYSTEM
            </Text>

            <Pressable style={styles.navItem}>
              <Text style={styles.navIcon}>◉</Text>

              <Text style={styles.navText}>
                Activity Logs
              </Text>
            </Pressable>

            <Pressable style={styles.navItem}>
              <Text style={styles.navIcon}>⚙</Text>

              <Text style={styles.navText}>
                Settings
              </Text>
            </Pressable>

          </View>
        )}

        {/* SIDEBAR FOOTER */}

        {sidebarOpen && (
          <View style={styles.sidebarFooter}>

            <Text style={styles.secureText}>
              🔒 Secure Administration
            </Text>

            <Text style={styles.versionText}>
              CARELINK EHR v1.0
            </Text>

          </View>
        )}

      </View>

      {/* =========================
          MAIN AREA
      ========================= */}

      <View style={styles.main}>

        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.headerLeft}>

            {/* MENU BUTTON */}

            <Pressable
              style={styles.menuButton}
              onPress={() =>
                setSidebarOpen(!sidebarOpen)
              }
            >
              <Text style={styles.menuButtonText}>
                ☰
              </Text>
            </Pressable>

            <View>
              <Text style={styles.headerTitle}>
                CARELINK
              </Text>

              <Text style={styles.headerSubtitle}>
                Electronic Health Records
              </Text>
            </View>

          </View>

          <View style={styles.headerRight}>

            <Pressable
              style={styles.notificationButton}
            >
              <Text style={styles.notificationIcon}>
                ♧
              </Text>

              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  3
                </Text>
              </View>
            </Pressable>

            <View style={styles.profileMini}>

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  A
                </Text>
              </View>

              <View>
                <Text style={styles.profileName}>
                  System Admin
                </Text>

                <Text style={styles.profileRole}>
                  Administrator
                </Text>
              </View>

              <Text style={styles.chevron}>
                ⌄
              </Text>

            </View>

          </View>

        </View>

        {/* =========================
            CONTENT
        ========================= */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* PAGE TITLE */}

          <View style={styles.pageHeader}>

            <View>
              <Text style={styles.pageTitle}>
                Administration Dashboard
              </Text>

              <Text style={styles.pageSubtitle}>
                Manage patient files and doctor assignments
              </Text>
            </View>

            <Pressable
              style={styles.addPatientButton}
              onPress={() =>
                setShowAddPatient(true)
              }
            >
              <Text style={styles.addPatientButtonText}>
                + Add Patient
              </Text>
            </Pressable>

          </View>

          {/* PRIVACY NOTICE */}

          <View style={styles.privacyBanner}>

            <View style={styles.infoCircle}>
              <Text style={styles.infoText}>
                i
              </Text>
            </View>

            <View style={styles.privacyTextArea}>

              <Text style={styles.privacyTitle}>
                Patient Information Restricted
              </Text>

              <Text style={styles.privacyDescription}>
                Administrators can create patient files and
                assign patients to healthcare workers. Personal
                and clinical patient information is not displayed
                in the administration dashboard.
              </Text>

            </View>

          </View>

          {/* =========================
              STATISTICS
          ========================= */}

          <View style={styles.statsGrid}>

            <AdminStat
              icon="♙"
              number={String(patients.length)}
              label="Total Patient Files"
              detail="Registered patients"
              background="#EFF6FF"
              color="#2563EB"
            />

            <AdminStat
              icon="✓"
              number={String(assignedCount)}
              label="Assigned Patients"
              detail="Assigned to doctors"
              background="#ECFDF5"
              color="#059669"
            />

            <AdminStat
              icon="!"
              number={String(unassignedCount)}
              label="Awaiting Assignment"
              detail="Needs doctor assignment"
              background="#FFF7ED"
              color="#EA580C"
            />

            <AdminStat
              icon="♙"
              number="4"
              label="Active Doctors"
              detail="Currently available"
              background="#F5F3FF"
              color="#7C3AED"
            />

          </View>

          {/* =========================
              PATIENT FILES
          ========================= */}

          <View style={styles.patientCard}>

            <View style={styles.cardHeader}>

              <View>
                <Text style={styles.cardTitle}>
                  Patient Files
                </Text>

                <Text style={styles.cardSubtitle}>
                  File numbers and doctor assignments
                </Text>
              </View>

              <Text style={styles.restrictedLabel}>
                🔒 Restricted View
              </Text>

            </View>

            {/* SEARCH */}

            <View style={styles.searchContainer}>

              <Text style={styles.searchIcon}>
                ⌕
              </Text>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by patient file number..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />

            </View>

            {/* TABLE HEADER */}

            <View style={styles.tableHeader}>

              <Text style={[
                styles.tableHeaderText,
                styles.fileColumn,
              ]}>
                FILE NUMBER
              </Text>

              <Text style={[
                styles.tableHeaderText,
                styles.doctorColumn,
              ]}>
                ASSIGNED DOCTOR
              </Text>

              <Text style={[
                styles.tableHeaderText,
                styles.statusColumn,
              ]}>
                STATUS
              </Text>

              <Text style={[
                styles.tableHeaderText,
                styles.dateColumn,
              ]}>
                CREATED
              </Text>

              <Text style={[
                styles.tableHeaderText,
                styles.actionColumn,
              ]}>
                ACTION
              </Text>

            </View>

            {/* PATIENT ROWS */}

            {filteredPatients.map((patient) => (

              <View
                key={patient.id}
                style={styles.tableRow}
              >

                {/* FILE NUMBER */}

                <View style={styles.fileColumn}>

                  <View style={styles.fileNumberContainer}>

                    <View style={styles.fileIcon}>
                      <Text style={styles.fileIconText}>
                        ▤
                      </Text>
                    </View>

                    <Text style={styles.fileNumber}>
                      {patient.id}
                    </Text>

                  </View>

                </View>

                {/* DOCTOR */}

                <View style={styles.doctorColumn}>

                  <Text style={styles.doctorText}>
                    {patient.doctor}
                  </Text>

                </View>

                {/* STATUS */}

                <View style={styles.statusColumn}>

                  <View
                    style={[
                      styles.statusBadge,
                      patient.status === 'Assigned'
                        ? styles.assignedBadge
                        : styles.unassignedBadge,
                    ]}
                  >

                    <View
                      style={[
                        styles.statusDot,
                        patient.status === 'Assigned'
                          ? styles.assignedDot
                          : styles.unassignedDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        patient.status === 'Assigned'
                          ? styles.assignedText
                          : styles.unassignedText,
                      ]}
                    >
                      {patient.status}
                    </Text>

                  </View>

                </View>

                {/* DATE */}

                <View style={styles.dateColumn}>

                  <Text style={styles.dateText}>
                    {patient.created}
                  </Text>

                </View>

                {/* ACTION */}

                <View style={styles.actionColumn}>

                  <Pressable
                    style={styles.assignButton}
                    onPress={() =>
                      openAssignDoctor(patient)
                    }
                  >
                    <Text style={styles.assignButtonText}>
                      {patient.status === 'Assigned'
                        ? 'Reassign'
                        : 'Assign Doctor'}
                    </Text>
                  </Pressable>

                </View>

              </View>

            ))}

            {filteredPatients.length === 0 && (
              <View style={styles.emptyState}>

                <Text style={styles.emptyIcon}>
                  ⌕
                </Text>

                <Text style={styles.emptyTitle}>
                  No patient files found
                </Text>

                <Text style={styles.emptyText}>
                  Try searching for another file number.
                </Text>

              </View>
            )}

          </View>

          {/* =========================
              DOCTOR ASSIGNMENT
          ========================= */}

          <View style={styles.assignmentInfo}>

            <View style={styles.assignmentIcon}>
              <Text style={styles.assignmentIconText}>
                ♙
              </Text>
            </View>

            <View style={styles.assignmentInfoText}>

              <Text style={styles.assignmentTitle}>
                Doctor Assignment
              </Text>

              <Text style={styles.assignmentDescription}>
                Assign patient files to doctors without exposing
                personal or clinical patient information.
              </Text>

            </View>

          </View>

          {/* FOOTER */}

          <View style={styles.footer}>

            <Text style={styles.footerText}>
              CARELINK Electronic Health Records System
            </Text>

            <Text style={styles.footerText}>
              Department of Health – Republic of South Africa
            </Text>

          </View>

        </ScrollView>

      </View>

      {/* =========================
          ADD PATIENT MODAL
      ========================= */}

      <Modal
        visible={showAddPatient}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowAddPatient(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modal}>

            <View style={styles.modalHeader}>

              <View>
                <Text style={styles.modalTitle}>
                  Register New Patient
                </Text>

                <Text style={styles.modalSubtitle}>
                  Create a new CARELINK patient file
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowAddPatient(false)
                }
              >
                <Text style={styles.closeButton}>
                  ×
                </Text>
              </Pressable>

            </View>

            <View style={styles.modalPrivacyNotice}>

              <Text style={styles.modalPrivacyTitle}>
                🔒 Restricted Information
              </Text>

              <Text style={styles.modalPrivacyText}>
                Registration information is used only to create
                the patient file. After registration, administrators
                will only see the generated file number.
              </Text>

            </View>

            <Text style={styles.inputLabel}>First Name</Text>

<TextInput
  value={patientFirstName}
  onChangeText={setPatientFirstName}
  placeholder="Enter first name"
  placeholderTextColor="#94A3B8"
  style={styles.input}
/>

<Text style={styles.inputLabel}>Last Name</Text>

<TextInput
  value={patientLastName}
  onChangeText={setPatientLastName}
  placeholder="Enter last name"
  placeholderTextColor="#94A3B8"
  style={styles.input}
/>

            <Text style={styles.inputLabel}>
              South African ID Number
            </Text>

            <TextInput
              value={patientIdNumber}
              onChangeText={setPatientIdNumber}
              placeholder="Enter ID number"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              secureTextEntry
              style={styles.input}
            />

            <View style={styles.modalButtons}>

             <Pressable
  style={[
    styles.createButton,
    (!patientFirstName.trim() ||
      !patientLastName.trim() ||
      !patientIdNumber.trim()) &&
      styles.disabledButton,
  ]}
  disabled={
    !patientFirstName.trim() ||
    !patientLastName.trim() ||
    !patientIdNumber.trim()
  }
  onPress={addPatient}
>
                <Text style={styles.createButtonText}>
                  Create Patient File
                </Text>
              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* =========================
          ASSIGN DOCTOR MODAL
      ========================= */}

      <Modal
        visible={showAssign}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowAssign(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modal}>

            <View style={styles.modalHeader}>

              <View>
                <Text style={styles.modalTitle}>
                  Assign Doctor
                </Text>

                <Text style={styles.modalSubtitle}>
                  Assign a healthcare worker to this file
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowAssign(false)
                }
              >
                <Text style={styles.closeButton}>
                  ×
                </Text>
              </Pressable>

            </View>

            <View style={styles.selectedFile}>

              <Text style={styles.selectedFileLabel}>
                PATIENT FILE
              </Text>

              <Text style={styles.selectedFileNumber}>
                {selectedPatient?.id}
              </Text>

            </View>

            <Text style={styles.inputLabel}>
              Select Doctor
            </Text>

            <View style={styles.doctorOptions}>

              {doctors.map((doctor) => (

                <Pressable
                  key={doctor}
                  style={[
                    styles.doctorOption,
                    selectedDoctor === doctor &&
                      styles.selectedDoctorOption,
                  ]}
                  onPress={() =>
                    setSelectedDoctor(doctor)
                  }
                >

                  <View
                    style={[
                      styles.radio,
                      selectedDoctor === doctor &&
                        styles.radioSelected,
                    ]}
                  >

                    {selectedDoctor === doctor && (
                      <View
                        style={styles.radioInner}
                      />
                    )}

                  </View>

                  <Text
                    style={[
                      styles.doctorOptionText,
                      selectedDoctor === doctor &&
                        styles.selectedDoctorText,
                    ]}
                  >
                    {doctor}
                  </Text>

                </Pressable>

              ))}

            </View>

            <View style={styles.modalButtons}>

              <Pressable
                style={styles.cancelButton}
                onPress={() =>
                  setShowAssign(false)
                }
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.createButton,
                  !selectedDoctor &&
                    styles.disabledButton,
                ]}
                disabled={!selectedDoctor}
                onPress={assignDoctor}
              >
                <Text style={styles.createButtonText}>
                  Assign Doctor
                </Text>
              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* =========================
          SUCCESS MESSAGE
      ========================= */}

      {successMessage !== '' && (

        <View style={styles.successToast}>

          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>
              ✓
            </Text>
          </View>

          <Text style={styles.successText}>
            {successMessage}
          </Text>

        </View>

      )}

    </View>
  );
}


/* =========================
   ADMIN STAT
========================= */

function AdminStat({
  icon,
  number,
  label,
  detail,
  background,
  color,
}: {
  icon: string;
  number: string;
  label: string;
  detail: string;
  background: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>

      <View
        style={[
          styles.statIcon,
          { backgroundColor: background },
        ]}
      >
        <Text
          style={[
            styles.statIconText,
            { color },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.statNumber}>
        {number}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.statDetail,
          { color },
        ]}
      >
        {detail}
      </Text>

    </View>
  );
}


const styles = StyleSheet.create({

  /* =====================================================
     APP
  ===================================================== */

  appContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },

  /* =====================================================
     SIDEBAR
  ===================================================== */

  sidebar: {
    width: 245,
    backgroundColor: '#0F2A43',
    paddingVertical: 24,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },

  sidebarCollapsed: {
    width: 82,
    paddingHorizontal: 12,
  },

  logoArea: {
    alignItems: 'center',
    marginBottom: 30,
  },

  governmentLogo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },

  governmentLogoCollapsed: {
    width: 55,
    height: 55,
    marginTop: 8,
  },

  logoTextArea: {
    alignItems: 'center',
  },

  carelinkText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },

  logoSubtitle: {
    color: '#CBD5E1',
    fontSize: 10,
    marginTop: 3,
  },

  departmentText: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 5,
  },

  sidebarMenu: {
    flex: 1,
  },

  menuLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 12,
    marginBottom: 8,
  },

  servicesLabel: {
    marginTop: 25,
  },

  navItem: {
    height: 45,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },

  activeNavItem: {
    backgroundColor: '#1D4ED8',
  },

  navIcon: {
    width: 28,
    color: '#94A3B8',
    fontSize: 18,
    textAlign: 'center',
  },

  activeNavText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 3,
  },

  navText: {
    color: '#CBD5E1',
    fontSize: 13,
    marginLeft: 3,
  },

  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E3A56',
    paddingTop: 15,
  },

  secureText: {
    color: '#94A3B8',
    fontSize: 9,
    textAlign: 'center',
  },

  versionText: {
    color: '#64748B',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 5,
  },

  /* =====================================================
     MAIN AREA
  ===================================================== */

  main: {
    flex: 1,
    minWidth: 0,
  },

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    height: 76,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  menuButtonText: {
    color: '#0F2A43',
    fontSize: 24,
    fontWeight: '600',
  },

  headerTitle: {
    color: '#0F2A43',
    fontSize: 17,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 18,
  },

  notificationIcon: {
    color: '#475569',
    fontSize: 19,
  },

  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  profileMini: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '800',
  },

  profileName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  profileRole: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },

  chevron: {
    color: '#94A3B8',
    fontSize: 17,
    marginLeft: 9,
  },

  /* =====================================================
     CONTENT
  ===================================================== */

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 30,
    paddingBottom: 50,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  pageTitle: {
    color: '#0F172A',
    fontSize: 25,
    fontWeight: '700',
  },

  pageSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },

  addPatientButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },

  addPatientButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* =====================================================
     PRIVACY BANNER
  ===================================================== */

  privacyBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 9,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  infoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  privacyTextArea: {
    flex: 1,
    marginLeft: 12,
  },

  privacyTitle: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '700',
  },

  privacyDescription: {
    color: '#475569',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  /* =====================================================
     STATISTICS
  ===================================================== */

  statsGrid: {
    flexDirection: 'row',
    marginBottom: 25,
  },

  statCard: {
    flex: 1,
    minHeight: 145,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    padding: 18,
    marginRight: 15,
  },

  statIcon: {
    width: 39,
    height: 39,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  statIconText: {
    fontSize: 18,
    fontWeight: '700',
  },

  statNumber: {
    color: '#0F172A',
    fontSize: 25,
    fontWeight: '700',
  },

  statLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  statDetail: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 7,
  },

  /* =====================================================
     PATIENT CARD
  ===================================================== */

  patientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    padding: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  cardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },

  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 3,
  },

  restrictedLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
  },

  /* =====================================================
     SEARCH
  ===================================================== */

  searchContainer: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },

  searchIcon: {
    color: '#94A3B8',
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 11,
  },

  /* =====================================================
     TABLE
  ===================================================== */

  tableHeader: {
    minHeight: 42,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  tableHeaderText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  tableRow: {
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  fileColumn: {
    flex: 1.4,
  },

  doctorColumn: {
    flex: 1.4,
  },

  statusColumn: {
    flex: 1.2,
  },

  dateColumn: {
    flex: 1.1,
  },

  actionColumn: {
    flex: 1.3,
    alignItems: 'flex-end',
  },

  fileNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  fileIcon: {
    width: 32,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  fileIconText: {
    color: '#2563EB',
    fontSize: 14,
  },

  fileNumber: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },

  doctorText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },

  /* =====================================================
     STATUS
  ===================================================== */

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },

  assignedBadge: {
    backgroundColor: '#ECFDF5',
  },

  unassignedBadge: {
    backgroundColor: '#FFF7ED',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },

  assignedDot: {
    backgroundColor: '#059669',
  },

  unassignedDot: {
    backgroundColor: '#EA580C',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },

  assignedText: {
    color: '#047857',
  },

  unassignedText: {
    color: '#C2410C',
  },

  dateText: {
    color: '#64748B',
    fontSize: 10,
  },

  /* =====================================================
     ASSIGN BUTTON
  ===================================================== */

  assignButton: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  assignButtonText: {
    color: '#1D4ED8',
    fontSize: 9,
    fontWeight: '700',
  },

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  emptyState: {
    alignItems: 'center',
    paddingVertical: 45,
  },

  emptyIcon: {
    fontSize: 30,
    color: '#94A3B8',
  },

  emptyTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },

  /* =====================================================
     ASSIGNMENT INFO
  ===================================================== */

  assignmentInfo: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  assignmentIcon: {
    width: 42,
    height: 42,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  assignmentIconText: {
    color: '#2563EB',
    fontSize: 19,
  },

  assignmentInfoText: {
    flex: 1,
    marginLeft: 12,
  },

  assignmentTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  assignmentDescription: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  /* =====================================================
     FOOTER
  ===================================================== */

  footer: {
    alignItems: 'center',
    marginTop: 30,
  },

  footerText: {
    color: '#94A3B8',
    fontSize: 9,
    marginBottom: 3,
  },

  /* =====================================================
     MODAL
  ===================================================== */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modal: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },

  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },

  closeButton: {
    color: '#64748B',
    fontSize: 27,
    lineHeight: 25,
  },

  /* =====================================================
     MODAL PRIVACY
  ===================================================== */

  modalPrivacyNotice: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },

  modalPrivacyTitle: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
  },

  modalPrivacyText: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  /* =====================================================
     FORM INPUTS
  ===================================================== */

  inputLabel: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 12,
    color: '#0F172A',
    fontSize: 11,
    marginBottom: 15,
  },

  /* =====================================================
     MODAL BUTTONS
  ===================================================== */

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginRight: 10,
  },

  cancelButtonText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },

  createButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  disabledButton: {
    backgroundColor: '#94A3B8',
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  /* =====================================================
     ASSIGN DOCTOR
  ===================================================== */

  selectedFile: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
  },

  selectedFileLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  selectedFileNumber: {
    color: '#1D4ED8',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },

  doctorOptions: {
    marginBottom: 10,
  },

  doctorOption: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  selectedDoctorOption: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  radioSelected: {
    borderColor: '#2563EB',
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },

  doctorOptionText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },

  selectedDoctorText: {
    color: '#1D4ED8',
  },

  /* =====================================================
     SUCCESS TOAST
  ===================================================== */

  successToast: {
    position: 'absolute',
    top: 92,
    right: 25,
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 9,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 5,
  },

  successCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  successCheck: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '800',
  },

  successText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },

});