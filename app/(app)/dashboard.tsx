import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';

import { supabase } from '../../lib/supabase';

type Patient = {
  id: string;
  file_number: string | null;
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  biometric_enrolled: boolean;
  biometric_enrolled_at: string | null;
  identity_verified: boolean;
};

type Encounter = {
  id: string;
  patient_id: string;
  facility_id: string;
  healthcare_worker_id: string | null;
  department: string | null;
  reason: string | null;
  status: string;
  check_in_at: string;
  check_out_at: string | null;
  created_at: string;
  patient: Patient;
  facility_name: string;
  healthcare_worker_name: string | null;
};

type MedicalRecord = {
  id: string;
  patient_id: string;
  encounter_id: string;
  created_by: string;
  facility_id: string;
  record_type: string;
  content: string;
  created_at: string;
  creator_name: string;
};

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

export default function DashboardScreen() {

  /* ==========================================================
     RESPONSIVE SCREEN SIZE
  ========================================================== */

  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1000;
  const isDesktop = width >= 1000;

  /* ==========================================================
     STATE
  ========================================================== */

  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dashboard data
  const [activeEncounters, setActiveEncounters] = useState<Encounter[]>([]);
  const [myEncounters, setMyEncounters] = useState<Encounter[]>([]);
  const [waitingEncounters, setWaitingEncounters] = useState<Encounter[]>([]);
  const [completedToday, setCompletedToday] = useState<Encounter[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    active: 0,
    myActive: 0,
    waiting: 0,
    completedToday: 0,
  });

  // Patient search
  const [patientId, setPatientId] = useState('');

  // Encounter workspace
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [showEncounterWorkspace, setShowEncounterWorkspace] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isTakingEncounter, setIsTakingEncounter] = useState(false);

  // Medical record creation
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [recordType, setRecordType] = useState('');
  const [recordContent, setRecordContent] = useState('');
  const [recordTypes, setRecordTypes] = useState<string[]>([
    'observation',
    'diagnosis',
    'clinical_note',
    'lab_request',
    'radiology_request',
    'prescription',
  ]);
  const [availableRecordTypes, setAvailableRecordTypes] = useState<string[]>([]);

  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /* ==========================================================
     LOAD USER & PROFILE
  ========================================================== */

  useEffect(() => {
    loadUserAndProfile();
  }, []);

  const loadUserAndProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      setUserEmail(user.email ?? '');

      // Load profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setUserProfile(profile);

      // Set available record types based on role
      const role = profile?.role?.toLowerCase() || '';
      const types = ['observation', 'clinical_note'];

      if (['doctor', 'paramedic', 'nurse'].includes(role)) {
        types.push('diagnosis');
      }
      if (['doctor', 'pharmacist'].includes(role)) {
        types.push('prescription');
      }
      if (['doctor', 'laboratory'].includes(role)) {
        types.push('lab_request');
      }
      if (['doctor', 'radiology'].includes(role)) {
        types.push('radiology_request');
      }

      setAvailableRecordTypes(types);

      // Load dashboard data
      await loadDashboardData();

    } catch (error) {
      console.error('DASHBOARD USER ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     LOAD DASHBOARD DATA
  ========================================================== */

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch all active encounters with patient data
      const { data: encounters, error } = await supabase
        .from('patient_encounters')
        .select(`
          id,
          patient_id,
          facility_id,
          healthcare_worker_id,
          department,
          reason,
          status,
          check_in_at,
          check_out_at,
          created_at,
          patients:patient_id (
            id,
            file_number,
            id_number,
            first_name,
            last_name,
            date_of_birth,
            gender,
            phone_number,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            biometric_enrolled,
            biometric_enrolled_at,
            identity_verified
          ),
          facilities:facility_id (name)
        `)
        .eq('status', 'active')
        .order('check_in_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedEncounters = (encounters || []).map((enc: any) => ({
        id: enc.id,
        patient_id: enc.patient_id,
        facility_id: enc.facility_id,
        healthcare_worker_id: enc.healthcare_worker_id,
        department: enc.department,
        reason: enc.reason,
        status: enc.status,
        check_in_at: enc.check_in_at,
        check_out_at: enc.check_out_at,
        created_at: enc.created_at,
        patient: {
          id: enc.patients.id,
          file_number: enc.patients.file_number,
          id_number: enc.patients.id_number,
          first_name: enc.patients.first_name,
          last_name: enc.patients.last_name,
          date_of_birth: enc.patients.date_of_birth,
          gender: enc.patients.gender,
          phone_number: enc.patients.phone_number,
          address: enc.patients.address,
          emergency_contact_name: enc.patients.emergency_contact_name,
          emergency_contact_phone: enc.patients.emergency_contact_phone,
          biometric_enrolled: enc.patients.biometric_enrolled,
          biometric_enrolled_at: enc.patients.biometric_enrolled_at,
          identity_verified: enc.patients.identity_verified,
        },
        facility_name: enc.facilities?.name || 'Unknown Facility',
        healthcare_worker_name: null,
      }));

      // Get healthcare worker names
      const workerIds = transformedEncounters
        .map(e => e.healthcare_worker_id)
        .filter(Boolean);

      if (workerIds.length > 0) {
        const { data: workers, error: workerError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', workerIds);

        if (!workerError) {
          const workerMap = new Map(workers.map(w => [w.id, w]));
          transformedEncounters.forEach(e => {
            if (e.healthcare_worker_id) {
              const w = workerMap.get(e.healthcare_worker_id);
              if (w) {
                e.healthcare_worker_name = `${w.first_name} ${w.last_name}`;
              }
            }
          });
        }
      }

      setActiveEncounters(transformedEncounters);

      // Filter my encounters
      const my = transformedEncounters.filter(
        e => e.healthcare_worker_id === userProfile?.id
      );
      setMyEncounters(my);

      // Filter waiting encounters
      const waiting = transformedEncounters.filter(
        e => e.healthcare_worker_id === null
      );
      setWaitingEncounters(waiting);

      // Fetch completed today
      const { data: completed, error: completedError } = await supabase
        .from('patient_encounters')
        .select(`
          id,
          patient_id,
          facility_id,
          healthcare_worker_id,
          department,
          reason,
          status,
          check_in_at,
          check_out_at,
          created_at,
          patients:patient_id (
            id,
            file_number,
            id_number,
            first_name,
            last_name,
            date_of_birth,
            gender,
            phone_number,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            biometric_enrolled,
            biometric_enrolled_at,
            identity_verified
          ),
          facilities:facility_id (name)
        `)
        .eq('status', 'completed')
        .gte('check_out_at', today.toISOString())
        .lt('check_out_at', tomorrow.toISOString())
        .order('check_out_at', { ascending: false });

      if (!completedError && completed) {
        const transformedCompleted = (completed || []).map((enc: any) => ({
          id: enc.id,
          patient_id: enc.patient_id,
          facility_id: enc.facility_id,
          healthcare_worker_id: enc.healthcare_worker_id,
          department: enc.department,
          reason: enc.reason,
          status: enc.status,
          check_in_at: enc.check_in_at,
          check_out_at: enc.check_out_at,
          created_at: enc.created_at,
          patient: {
            id: enc.patients.id,
            file_number: enc.patients.file_number,
            id_number: enc.patients.id_number,
            first_name: enc.patients.first_name,
            last_name: enc.patients.last_name,
            date_of_birth: enc.patients.date_of_birth,
            gender: enc.patients.gender,
            phone_number: enc.patients.phone_number,
            address: enc.patients.address,
            emergency_contact_name: enc.patients.emergency_contact_name,
            emergency_contact_phone: enc.patients.emergency_contact_phone,
            biometric_enrolled: enc.patients.biometric_enrolled,
            biometric_enrolled_at: enc.patients.biometric_enrolled_at,
            identity_verified: enc.patients.identity_verified,
          },
          facility_name: enc.facilities?.name || 'Unknown Facility',
          healthcare_worker_name: null,
        }));
        setCompletedToday(transformedCompleted);
      }

      // Update stats
      setStats({
        active: transformedEncounters.length,
        myActive: my.length,
        waiting: waiting.length,
        completedToday: completed?.length || 0,
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setErrorMessage('Unable to load dashboard data. Please refresh.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setRefreshing(false);
    }
  };

  /* ==========================================================
     PATIENT SEARCH
  ========================================================== */

  const handlePatientSearch = () => {
    if (!patientId.trim()) {
      router.push('/(app)/patients');
      return;
    }
    router.push(`/(app)/patients?search=${patientId}`);
  };

  /* ==========================================================
     FINGERPRINT SCAN
  ========================================================== */

  const handleFingerprintScan = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        alert('This device does not have a fingerprint or biometric sensor.');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        alert('No fingerprint is registered on this device.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Scan your fingerprint',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        console.log('Fingerprint authentication successful');
        alert('Fingerprint verified successfully!');
        // Later: use biometric to find patient record
      } else {
        console.log('Fingerprint authentication failed:', result);
        alert('Fingerprint verification was cancelled or unsuccessful.');
      }
    } catch (error) {
      console.error('FINGERPRINT ERROR:', error);
      alert('Unable to start fingerprint verification.');
    }
  };

  /* ==========================================================
     OPEN ENCOUNTER WORKSPACE
  ========================================================== */

  const openEncounterWorkspace = async (encounter: Encounter) => {
    setSelectedEncounter(encounter);
    setShowEncounterWorkspace(true);
    await loadMedicalRecords(encounter.id);
  };

  /* ==========================================================
     LOAD MEDICAL RECORDS
  ========================================================== */

  const loadMedicalRecords = async (encounterId: string) => {
    try {
      setLoadingRecords(true);

      const { data: records, error } = await supabase
        .from('medical_records')
        .select(`
          id,
          patient_id,
          encounter_id,
          created_by,
          facility_id,
          record_type,
          content,
          created_at
        `)
        .eq('encounter_id', encounterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get creator names
      const creatorIds = (records || []).map(r => r.created_by).filter(Boolean);
      let creatorMap = new Map();

      if (creatorIds.length > 0) {
        const { data: creators, error: creatorError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        if (!creatorError) {
          creatorMap = new Map(creators.map(c => [c.id, c]));
        }
      }

      const transformedRecords = (records || []).map((r: any) => {
        const creator = creatorMap.get(r.created_by);
        return {
          id: r.id,
          patient_id: r.patient_id,
          encounter_id: r.encounter_id,
          created_by: r.created_by,
          facility_id: r.facility_id,
          record_type: r.record_type,
          content: r.content,
          created_at: r.created_at,
          creator_name: creator ? `${creator.first_name} ${creator.last_name}` : 'Unknown',
        };
      });

      setMedicalRecords(transformedRecords);
    } catch (error) {
      console.error('Error loading medical records:', error);
      setErrorMessage('Unable to load medical records.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoadingRecords(false);
    }
  };

  /* ==========================================================
     TAKE ENCOUNTER
  ========================================================== */

  const takeEncounter = async (encounter: Encounter) => {
    if (!userProfile) return;

    try {
      setIsTakingEncounter(true);

      // First, check if the encounter is still active and not taken
      const { data: current, error: checkError } = await supabase
        .from('patient_encounters')
        .select('id, status, healthcare_worker_id')
        .eq('id', encounter.id)
        .single();

      if (checkError) throw checkError;

      if (current.status !== 'active') {
        setErrorMessage('This encounter is no longer active.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      if (current.healthcare_worker_id) {
        setErrorMessage('This encounter has already been taken by another healthcare worker.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      // Take the encounter
      const { error: updateError } = await supabase
        .from('patient_encounters')
        .update({
          healthcare_worker_id: userProfile.id,
        })
        .eq('id', encounter.id)
        .eq('healthcare_worker_id', null); // Ensure no race condition

      if (updateError) throw updateError;

      // Refresh data
      await loadDashboardData();
      if (selectedEncounter) {
        await openEncounterWorkspace({ ...selectedEncounter, healthcare_worker_id: userProfile.id });
      }

      setSuccessMessage('Encounter taken successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error taking encounter:', error);
      setErrorMessage('Unable to take encounter. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsTakingEncounter(false);
    }
  };

  /* ==========================================================
     ADD MEDICAL RECORD
  ========================================================== */

  const addMedicalRecord = async () => {
    if (!selectedEncounter || !userProfile || !recordType || !recordContent.trim()) {
      setErrorMessage('Please fill in all fields.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          patient_id: selectedEncounter.patient_id,
          encounter_id: selectedEncounter.id,
          created_by: userProfile.id,
          facility_id: selectedEncounter.facility_id,
          record_type: recordType,
          content: recordContent.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh medical records
      await loadMedicalRecords(selectedEncounter.id);

      // Reset form
      setShowAddRecord(false);
      setRecordType('');
      setRecordContent('');

      setSuccessMessage(`${recordType.replace('_', ' ')} added successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error adding medical record:', error);
      setErrorMessage('Unable to add medical record. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  /* ==========================================================
     COMPLETE ENCOUNTER
  ========================================================== */

  const completeEncounter = async () => {
    if (!selectedEncounter) return;

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('patient_encounters')
        .update({
          status: 'completed',
          check_out_at: now,
        })
        .eq('id', selectedEncounter.id)
        .eq('status', 'active');

      if (error) throw error;

      // Refresh data
      await loadDashboardData();
      setShowEncounterWorkspace(false);
      setSelectedEncounter(null);

      setSuccessMessage('Encounter completed successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error completing encounter:', error);
      setErrorMessage('Unable to complete encounter. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  /* ==========================================================
     GET ROLE DISPLAY
  ========================================================== */

  const getRoleDisplay = () => {
    if (!userProfile?.role) return 'Healthcare Worker';
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      administrator: 'Admin',
      doctor: 'Doctor',
      nurse: 'Nurse',
      paramedic: 'Paramedic',
      laboratory: 'Laboratory',
      radiology: 'Radiology',
      pharmacist: 'Pharmacist',
      'healthcare worker': 'Healthcare Worker',
    };
    return roleMap[userProfile.role.trim().toLowerCase()] ?? userProfile.role;
  };

  const getFirstName = () => {
    if (!userProfile?.first_name) return 'User';
    return userProfile.first_name;
  };

  /* ==========================================================
     FORMAT DATE/TIME
  ========================================================== */

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (date: string) => {
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  /* ==========================================================
     GET STATUS COLOR
  ========================================================== */

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#059669';
      case 'completed':
        return '#475569';
      default:
        return '#94A3B8';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  /* ==========================================================
     GET RECORD TYPE LABEL
  ========================================================== */

  const getRecordTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      observation: 'Observation',
      diagnosis: 'Diagnosis',
      clinical_note: 'Clinical Note',
      lab_request: 'Lab Request',
      radiology_request: 'Radiology Request',
      prescription: 'Prescription',
    };
    return map[type] || type;
  };

  /* ==========================================================
     SIGN OUT
  ========================================================== */

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#123B78" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  /* ==========================================================
     RENDER ENCOUNTER CARD
  ========================================================== */

  const renderEncounterCard = (encounter: Encounter, showTakeButton = false) => {
    const isWaiting = encounter.healthcare_worker_id === null;
    const isMine = encounter.healthcare_worker_id === userProfile?.id;

    return (
      <Pressable
        key={encounter.id}
        style={styles.encounterCard}
        onPress={() => openEncounterWorkspace(encounter)}
      >
        <View style={styles.encounterHeader}>
          <View style={styles.encounterPatient}>
            <Text style={styles.encounterPatientName}>
              {encounter.patient.first_name} {encounter.patient.last_name}
            </Text>
            <Text style={styles.encounterFileNumber}>
              {encounter.patient.file_number || 'No file number'}
            </Text>
          </View>
          <View style={[styles.encounterStatusBadge, { backgroundColor: getStatusColor(encounter.status) + '20' }]}>
            <Text style={[styles.encounterStatusText, { color: getStatusColor(encounter.status) }]}>
              {getStatusDisplay(encounter.status)}
            </Text>
          </View>
        </View>

        <View style={styles.encounterDetails}>
          <View style={styles.encounterDetailItem}>
            <Ionicons name="business-outline" size={14} color="#64748B" />
            <Text style={styles.encounterDetailText}>{encounter.facility_name}</Text>
          </View>
          {encounter.department && (
            <View style={styles.encounterDetailItem}>
              <Ionicons name="folder-outline" size={14} color="#64748B" />
              <Text style={styles.encounterDetailText}>{encounter.department}</Text>
            </View>
          )}
          {encounter.reason && (
            <View style={styles.encounterDetailItem}>
              <Ionicons name="document-text-outline" size={14} color="#64748B" />
              <Text style={styles.encounterDetailText}>{encounter.reason}</Text>
            </View>
          )}
          <View style={styles.encounterDetailItem}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.encounterDetailText}>Check-in: {formatDateTime(encounter.check_in_at)}</Text>
          </View>
        </View>

        <View style={styles.encounterFooter}>
          <View style={styles.encounterWorkerStatus}>
            {isWaiting ? (
              <View style={styles.waitingBadge}>
                <Ionicons name="time" size={12} color="#EA580C" />
                <Text style={styles.waitingText}>Waiting for Healthcare Worker</Text>
              </View>
            ) : isMine ? (
              <View style={styles.myBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <Text style={styles.myText}>My Encounter</Text>
              </View>
            ) : (
              <View style={styles.assignedBadge}>
                <Ionicons name="person" size={12} color="#2563EB" />
                <Text style={styles.assignedText}>Assigned to: {encounter.healthcare_worker_name || 'Unknown'}</Text>
              </View>
            )}
          </View>

          {showTakeButton && isWaiting && (
            <Pressable
              style={[styles.takeButton, isTakingEncounter && styles.takeButtonDisabled]}
              onPress={() => takeEncounter(encounter)}
              disabled={isTakingEncounter}
            >
              <Text style={styles.takeButtonText}>
                {isTakingEncounter ? 'Taking...' : 'Take Encounter'}
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  /* ==========================================================
     MAIN RENDER
  ========================================================== */

  return (
    <View style={[styles.appContainer, isMobile && styles.mobileAppContainer]}>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      {sidebarOpen && (
        <View style={[styles.sidebar, isMobile && styles.mobileSidebar, isTablet && styles.tabletSidebar]}>
          <View style={styles.sidebarBrand}>
            <Image
              source={require('../../assets/sa-government-logo.png')}
              style={styles.governmentLogo}
              resizeMode="contain"
            />
            <View style={styles.brandTextContainer}>
              <Text style={styles.carelinkText}>CARELINK</Text>
              <Text style={styles.brandSubtitle}>Electronic Health Records</Text>
            </View>
          </View>

          <View style={styles.sidebarDivider} />

          <View style={styles.menuSection}>
            <Text style={styles.menuLabel}>MAIN MENU</Text>
            <SidebarItem icon="grid-outline" label="Dashboard" active onPress={() => {}} />
            <SidebarItem icon="people-outline" label="Patients" onPress={() => router.push('/(app)/patients')} />
            <SidebarItem icon="calendar-outline" label="Appointments" onPress={() => {}} />

            <Text style={[styles.menuLabel, styles.servicesLabel]}>CLINICAL</Text>
            <SidebarItem icon="document-text-outline" label="Active Encounters" onPress={() => {}} />
            <SidebarItem icon="checkbox-outline" label="Completed" onPress={() => {}} />

            <Text style={[styles.menuLabel, styles.servicesLabel]}>SERVICES</Text>
            <SidebarItem icon="warning-outline" label="Emergency" emergency onPress={() => {}} />
          </View>

          <View style={styles.sidebarBottom}>
            <SidebarItem icon="person-outline" label="Profile" onPress={() => router.push('/(app)/profile')} />
            <SidebarItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} />
          </View>
        </View>
      )}

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <View style={styles.main}>
        {/* HEADER */}
        <View style={[styles.header, isMobile && styles.mobileHeader, isTablet && styles.tabletHeader]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.menuButton} onPress={() => setSidebarOpen(!sidebarOpen)}>
              <Ionicons name="menu-outline" size={28} color="#123B78" />
            </Pressable>
            {!sidebarOpen && (
              <View style={styles.compactBrand}>
                <Image
                  source={require('../../assets/sa-government-logo.png')}
                  style={styles.compactGovernmentLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.compactCarelink}>CARELINK</Text>
                  <Text style={styles.compactSubtitle}>Electronic Health Records</Text>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.headerRight, isMobile && styles.mobileHeaderRight]}>
            <View style={[styles.facilityContainer, isMobile && styles.mobileFacility]}>
              <Text style={styles.facilityLabel}>Facility:</Text>
              <Text style={styles.facilityName}>Durban Central Clinic</Text>
              <Ionicons name="chevron-down" size={15} color="#172B4D" />
            </View>

            <Pressable style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={25} color="#123B78" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{stats.active}</Text>
              </View>
            </Pressable>

            <View style={styles.userContainer}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={20} color="#123B78" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{getFirstName()}</Text>
                <Text style={styles.userRole}>{getRoleDisplay()}</Text>
              </View>
              {!isMobile && <Ionicons name="chevron-down" size={15} color="#172B4D" />}
            </View>
          </View>
        </View>

        {/* CONTENT */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, isMobile && styles.mobileContent, isTablet && styles.tabletContent]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={loadDashboardData}
        >

          {/* PAGE TITLE */}
          <View style={[styles.pageHeader, isMobile && styles.mobilePageHeader]}>
            <Text style={styles.pageTitle}>Healthcare Worker Dashboard</Text>
            <Text style={styles.dateText}>
              Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>

          {/* INFO BANNER */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIcon}>
              <Ionicons name="information" size={17} color="#123B78" />
            </View>
            <Text style={styles.infoText}>
              Patient clinical records are accessible in all public health facilities.
            </Text>
          </View>

          {/* FIND PATIENT */}
          <View style={styles.findPatientCard}>
            <Text style={styles.findPatientTitle}>FIND PATIENT RECORD</Text>
            <Text style={styles.findPatientSubtitle}>
              Search for a patient using South African ID number or biometric verification.
            </Text>

            <View style={[styles.searchArea, isMobile && styles.mobileSearchArea]}>
              <View style={styles.idSearchSection}>
                <Text style={styles.searchLabel}>Search by ID Number</Text>
                <View style={[styles.searchRow, isMobile && styles.mobileSearchRow]}>
                  <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                    <Ionicons name="person-outline" size={20} color="#94A3B8" />
                    <TextInput
                      value={patientId}
                      onChangeText={setPatientId}
                      placeholder="Enter ID Number"
                      placeholderTextColor="#94A3B8"
                      style={styles.patientInput}
                      keyboardType="numeric"
                    />
                  </View>
                  <Pressable style={[styles.searchButton, isMobile && styles.mobileSearchButton]} onPress={handlePatientSearch}>
                    <Text style={styles.searchButtonText}>Search</Text>
                  </Pressable>
                </View>
                <Text style={styles.exampleText}>Example: 8801011234088</Text>
              </View>

              <View style={styles.orContainer}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              <View style={styles.biometricSection}>
                <Text style={styles.searchLabel}>Search by Biometric</Text>
                <View style={[styles.biometricRow, isMobile && styles.mobileBiometricRow]}>
                  <View style={styles.fingerprintIconBox}>
                    <Ionicons name="finger-print-outline" size={46} color="#123B78" />
                  </View>
                  <Pressable style={[styles.scanButton, isMobile && styles.mobileScanButton]} onPress={handleFingerprintScan}>
                    <Text style={styles.scanButtonText}>Scan Fingerprint</Text>
                  </Pressable>
                </View>
                <Text style={[styles.fingerprintHelp, isMobile && styles.mobileFingerprintHelp]}>
                  Place finger on the scanner
                </Text>
              </View>
            </View>
          </View>

          {/* STATISTICS */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statNumber}>{stats.active}</Text>
              <Text style={styles.statLabel}>Active Encounters</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="person" size={20} color="#059669" />
              </View>
              <Text style={styles.statNumber}>{stats.myActive}</Text>
              <Text style={styles.statLabel}>My Encounters</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="time" size={20} color="#EA580C" />
              </View>
              <Text style={styles.statNumber}>{stats.waiting}</Text>
              <Text style={styles.statLabel}>Waiting Encounters</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="checkmark-done" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.statNumber}>{stats.completedToday}</Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </View>
          </View>

          {/* WAITING ENCOUNTERS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Waiting for Healthcare Worker</Text>
              <Text style={styles.sectionCount}>{waitingEncounters.length}</Text>
            </View>
            {waitingEncounters.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No waiting encounters</Text>
                <Text style={styles.emptyStateText}>All active encounters have been assigned.</Text>
              </View>
            ) : (
              waitingEncounters.map(e => renderEncounterCard(e, true))
            )}
          </View>

          {/* MY ACTIVE ENCOUNTERS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Active Encounters</Text>
              <Text style={styles.sectionCount}>{myEncounters.length}</Text>
            </View>
            {myEncounters.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open" size={40} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No active encounters</Text>
                <Text style={styles.emptyStateText}>You have no active encounters assigned.</Text>
              </View>
            ) : (
              myEncounters.map(e => renderEncounterCard(e, false))
            )}
          </View>

          {/* ALL ACTIVE ENCOUNTERS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Active Encounters</Text>
              <Text style={styles.sectionCount}>{activeEncounters.length}</Text>
            </View>
            {activeEncounters.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people" size={40} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No active encounters</Text>
                <Text style={styles.emptyStateText}>There are no active encounters in the system.</Text>
              </View>
            ) : (
              activeEncounters.map(e => renderEncounterCard(e, false))
            )}
          </View>

          {/* COMPLETED TODAY */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed Today</Text>
              <Text style={styles.sectionCount}>{completedToday.length}</Text>
            </View>
            {completedToday.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar" size={40} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No completed encounters today</Text>
                <Text style={styles.emptyStateText}>No encounters have been completed today.</Text>
              </View>
            ) : (
              completedToday.map(e => renderEncounterCard(e, false))
            )}
          </View>

          {/* FOOTER */}
          <View style={[styles.footer, isMobile && styles.mobileFooter]}>
            <Text style={styles.footerText}>Carelink Electronic Health Records System</Text>
            <Text style={styles.footerDivider}>|</Text>
            <Text style={styles.footerText}>Department of Health – Republic of South Africa</Text>
            <View style={styles.footerRight}>
              <Text style={styles.footerLink}>Help Centre</Text>
              <Text style={styles.footerDivider}>|</Text>
              <Text style={styles.footerLink}>Privacy Policy</Text>
              <Text style={styles.footerDivider}>|</Text>
              <Text style={styles.footerLink}>Terms of Use</Text>
            </View>
          </View>

        </ScrollView>
      </View>

      {/* =====================================================
          ENCOUNTER WORKSPACE MODAL
      ===================================================== */}

      <Modal
        visible={showEncounterWorkspace}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEncounterWorkspace(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.workspaceModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Encounter Workspace</Text>
                {selectedEncounter && (
                  <Text style={styles.modalSubtitle}>
                    {selectedEncounter.patient.first_name} {selectedEncounter.patient.last_name}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => setShowEncounterWorkspace(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </Pressable>
            </View>

            {selectedEncounter && (
              <ScrollView style={styles.workspaceContent} showsVerticalScrollIndicator={false}>
                {/* Patient Information */}
                <View style={styles.workspaceSection}>
                  <Text style={styles.workspaceSectionTitle}>Patient Information</Text>
                  <View style={styles.patientInfoGrid}>
                    <View style={styles.patientInfoItem}>
                      <Text style={styles.patientInfoLabel}>File Number</Text>
                      <Text style={styles.patientInfoValue}>
                        {selectedEncounter.patient.file_number || 'Not Assigned'}
                      </Text>
                    </View>
                    <View style={styles.patientInfoItem}>
                      <Text style={styles.patientInfoLabel}>Name</Text>
                      <Text style={styles.patientInfoValue}>
                        {selectedEncounter.patient.first_name} {selectedEncounter.patient.last_name}
                      </Text>
                    </View>
                    <View style={styles.patientInfoItem}>
                      <Text style={styles.patientInfoLabel}>ID Number</Text>
                      <Text style={styles.patientInfoValue}>{selectedEncounter.patient.id_number}</Text>
                    </View>
                    <View style={styles.patientInfoItem}>
                      <Text style={styles.patientInfoLabel}>Date of Birth</Text>
                      <Text style={styles.patientInfoValue}>
                        {selectedEncounter.patient.date_of_birth
                          ? formatDate(selectedEncounter.patient.date_of_birth)
                          : 'Not provided'}
                      </Text>
                    </View>
                    <View style={styles.patientInfoItem}>
                      <Text style={styles.patientInfoLabel}>Gender</Text>
                      <Text style={styles.patientInfoValue}>
                        {selectedEncounter.patient.gender || 'Not provided'}
                      </Text>
                    </View>
                    <View style={styles.patientInfoItem}>
                      <Text style={styles.patientInfoLabel}>Phone</Text>
                      <Text style={styles.patientInfoValue}>
                        {selectedEncounter.patient.phone_number || 'Not provided'}
                      </Text>
                    </View>
                    <View style={styles.patientInfoItem}>
                      <Text style={styles.patientInfoLabel}>Identity Verified</Text>
                      <Text style={[
                        styles.patientInfoValue,
                        selectedEncounter.patient.identity_verified ? styles.verifiedText : styles.unverifiedText
                      ]}>
                        {selectedEncounter.patient.identity_verified ? '✅ Verified' : '❌ Not Verified'}
                      </Text>
                    </View>
                    <View style={styles.patientInfoItem}>
                      <Text style={styles.patientInfoLabel}>Biometric</Text>
                      <Text style={[
                        styles.patientInfoValue,
                        selectedEncounter.patient.biometric_enrolled ? styles.enrolledText : styles.notEnrolledText
                      ]}>
                        {selectedEncounter.patient.biometric_enrolled ? '✅ Enrolled' : '❌ Not Enrolled'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Encounter Information */}
                <View style={styles.workspaceSection}>
                  <Text style={styles.workspaceSectionTitle}>Encounter Information</Text>
                  <View style={styles.encounterInfoGrid}>
                    <View style={styles.encounterInfoItem}>
                      <Text style={styles.encounterInfoLabel}>Facility</Text>
                      <Text style={styles.encounterInfoValue}>{selectedEncounter.facility_name}</Text>
                    </View>
                    {selectedEncounter.department && (
                      <View style={styles.encounterInfoItem}>
                        <Text style={styles.encounterInfoLabel}>Department</Text>
                        <Text style={styles.encounterInfoValue}>{selectedEncounter.department}</Text>
                      </View>
                    )}
                    {selectedEncounter.reason && (
                      <View style={styles.encounterInfoItem}>
                        <Text style={styles.encounterInfoLabel}>Reason</Text>
                        <Text style={styles.encounterInfoValue}>{selectedEncounter.reason}</Text>
                      </View>
                    )}
                    <View style={styles.encounterInfoItem}>
                      <Text style={styles.encounterInfoLabel}>Status</Text>
                      <Text style={[styles.encounterInfoValue, { color: getStatusColor(selectedEncounter.status) }]}>
                        {getStatusDisplay(selectedEncounter.status)}
                      </Text>
                    </View>
                    <View style={styles.encounterInfoItem}>
                      <Text style={styles.encounterInfoLabel}>Check-in</Text>
                      <Text style={styles.encounterInfoValue}>{formatDateTime(selectedEncounter.check_in_at)}</Text>
                    </View>
                    {selectedEncounter.check_out_at && (
                      <View style={styles.encounterInfoItem}>
                        <Text style={styles.encounterInfoLabel}>Check-out</Text>
                        <Text style={styles.encounterInfoValue}>{formatDateTime(selectedEncounter.check_out_at)}</Text>
                      </View>
                    )}
                    <View style={styles.encounterInfoItem}>
                      <Text style={styles.encounterInfoLabel}>Healthcare Worker</Text>
                      <Text style={styles.encounterInfoValue}>
                        {selectedEncounter.healthcare_worker_name || 'Not assigned'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Take Encounter Button */}
                {selectedEncounter.healthcare_worker_id === null && (
                  <Pressable
                    style={[styles.takeEncounterButton, isTakingEncounter && styles.takeButtonDisabled]}
                    onPress={() => takeEncounter(selectedEncounter)}
                    disabled={isTakingEncounter}
                  >
                    <Ionicons name="hand-right" size={20} color="#FFFFFF" />
                    <Text style={styles.takeEncounterButtonText}>
                      {isTakingEncounter ? 'Taking...' : 'Take Encounter'}
                    </Text>
                  </Pressable>
                )}

                {/* Medical Records */}
                <View style={styles.workspaceSection}>
                  <View style={styles.recordsHeader}>
                    <Text style={styles.workspaceSectionTitle}>Medical Records</Text>
                    {selectedEncounter.status === 'active' && selectedEncounter.healthcare_worker_id === userProfile?.id && (
                      <Pressable
                        style={styles.addRecordButton}
                        onPress={() => setShowAddRecord(true)}
                      >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.addRecordButtonText}>Add Record</Text>
                      </Pressable>
                    )}
                  </View>

                  {loadingRecords ? (
                    <View style={styles.loadingRecords}>
                      <ActivityIndicator size="small" color="#123B78" />
                      <Text style={styles.loadingRecordsText}>Loading records...</Text>
                    </View>
                  ) : medicalRecords.length === 0 ? (
                    <View style={styles.emptyRecords}>
                      <Ionicons name="document-text" size={40} color="#94A3B8" />
                      <Text style={styles.emptyRecordsTitle}>No medical records</Text>
                      <Text style={styles.emptyRecordsText}>No records have been added for this encounter.</Text>
                    </View>
                  ) : (
                    medicalRecords.map(record => (
                      <View key={record.id} style={styles.recordCard}>
                        <View style={styles.recordHeader}>
                          <View style={styles.recordTypeBadge}>
                            <Text style={styles.recordTypeText}>{getRecordTypeLabel(record.record_type)}</Text>
                          </View>
                          <Text style={styles.recordDate}>{formatDateTime(record.created_at)}</Text>
                        </View>
                        <Text style={styles.recordContent}>{record.content}</Text>
                        <Text style={styles.recordCreator}>Created by: {record.creator_name}</Text>
                      </View>
                    ))
                  )}
                </View>

                {/* Complete Encounter Button */}
                {selectedEncounter.status === 'active' && selectedEncounter.healthcare_worker_id === userProfile?.id && (
                  <Pressable
                    style={styles.completeButton}
                    onPress={completeEncounter}
                  >
                    <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>Complete Encounter</Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* =====================================================
          ADD MEDICAL RECORD MODAL
      ===================================================== */}

      <Modal
        visible={showAddRecord}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddRecord(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recordModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medical Record</Text>
              <Pressable onPress={() => setShowAddRecord(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Record Type</Text>
            <View style={styles.recordTypeOptions}>
              {availableRecordTypes.map(type => (
                <Pressable
                  key={type}
                  style={[
                    styles.recordTypeOption,
                    recordType === type && styles.recordTypeOptionSelected,
                  ]}
                  onPress={() => setRecordType(type)}
                >
                  <Text style={[
                    styles.recordTypeOptionText,
                    recordType === type && styles.recordTypeOptionTextSelected,
                  ]}>
                    {getRecordTypeLabel(type)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              value={recordContent}
              onChangeText={setRecordContent}
              placeholder="Enter clinical information..."
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={5}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowAddRecord(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.saveButton,
                  (!recordType || !recordContent.trim()) && styles.saveButtonDisabled,
                ]}
                disabled={!recordType || !recordContent.trim()}
                onPress={addMedicalRecord}
              >
                <Text style={styles.saveButtonText}>Add Record</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUCCESS MESSAGE */}
      {successMessage !== '' && (
        <View style={styles.successToast}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* ERROR MESSAGE */}
      {errorMessage !== '' && (
        <View style={styles.errorToast}>
          <View style={styles.errorCircle}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

    </View>
  );
}

/* ============================================================
   SIDEBAR ITEM
============================================================ */

function SidebarItem({
  icon,
  label,
  active = false,
  emergency = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  emergency?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.sidebarItem, active && styles.sidebarItemActive]}>
      <Ionicons
        name={icon}
        size={20}
        color={active ? '#FFFFFF' : emergency ? '#DC2626' : '#64748B'}
      />
      <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive, emergency && styles.sidebarEmergencyText]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#123B78',
    fontSize: 14,
    fontWeight: '600',
  },

  // App
  appContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  mobileAppContainer: {
    flexDirection: 'column',
  },

  // Sidebar
  sidebar: {
    width: 255,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingVertical: 25,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  tabletSidebar: { width: 220 },
  mobileSidebar: {
    position: 'absolute',
    zIndex: 100,
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    elevation: 10,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  governmentLogo: { width: 58, height: 72 },
  brandTextContainer: { marginLeft: 10, flex: 1 },
  carelinkText: {
    color: '#123B78',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#475569',
    fontSize: 10,
    marginTop: 4,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 25,
  },
  menuSection: { flex: 1 },
  menuLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 12,
    marginBottom: 9,
  },
  servicesLabel: { marginTop: 28 },
  sidebarItem: {
    height: 46,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 4,
  },
  sidebarItemActive: { backgroundColor: '#123B78' },
  sidebarItemText: {
    color: '#475569',
    fontSize: 13,
    marginLeft: 13,
    fontWeight: '500',
  },
  sidebarItemTextActive: { color: '#FFFFFF', fontWeight: '700' },
  sidebarEmergencyText: { color: '#DC2626', fontWeight: '600' },
  sidebarBottom: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 15,
  },

  // Main
  main: { flex: 1, minWidth: 0 },

  // Header
  header: {
    height: 84,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabletHeader: { paddingHorizontal: 18 },
  mobileHeader: { height: 70, paddingHorizontal: 12 },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  compactBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  compactGovernmentLogo: {
    width: 42,
    height: 55,
    marginRight: 10,
  },
  compactCarelink: {
    color: '#123B78',
    fontSize: 17,
    fontWeight: '800',
  },
  compactSubtitle: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 27,
    flexShrink: 1,
  },
  mobileHeaderRight: { gap: 8 },
  facilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  mobileFacility: { display: 'none' },
  facilityLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  facilityName: {
    color: '#172B4D',
    fontSize: 13,
    fontWeight: '700',
  },
  notificationButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: 2,
    top: 1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userInfo: { marginRight: 9 },
  userName: {
    color: '#172B4D',
    fontSize: 13,
    fontWeight: '700',
  },
  userRole: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  // Content
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: 32,
    paddingTop: 25,
    paddingBottom: 35,
  },
  tabletContent: { paddingHorizontal: 20, paddingTop: 22 },
  mobileContent: { paddingHorizontal: 12, paddingTop: 18, paddingBottom: 25 },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  mobilePageHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  pageTitle: {
    color: '#172B4D',
    fontSize: 27,
    fontWeight: '700',
  },
  dateText: {
    color: '#172B4D',
    fontSize: 12,
    fontWeight: '600',
  },

  // Info Banner
  infoBanner: {
    minHeight: 52,
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#BFD3FF',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 23,
  },
  infoIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#123B78',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    color: '#123B78',
    fontSize: 13,
    fontWeight: '600',
  },

  // Find Patient
  findPatientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    padding: 20,
    marginBottom: 23,
  },
  findPatientTitle: {
    color: '#172B4D',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 17,
  },
  findPatientSubtitle: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 25,
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mobileSearchArea: {
    flexDirection: 'column',
    width: '100%',
  },
  idSearchSection: { flex: 1 },
  searchLabel: {
    color: '#172B4D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileSearchRow: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'stretch',
  },
  inputContainer: {
    flex: 1,
    height: 51,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
  },
  mobileInputContainer: {
    width: '100%',
    flex: 0,
  },
  patientInput: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    color: '#172B4D',
    fontSize: 12,
    outlineStyle: 'none' as any,
  },
  searchButton: {
    height: 51,
    width: 105,
    marginLeft: 18,
    backgroundColor: '#123B78',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileSearchButton: {
    width: '100%',
    marginLeft: 0,
    marginTop: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exampleText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 12,
  },

  orContainer: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  orLine: {
    height: 40,
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  orText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginVertical: 6,
  },

  biometricSection: { flex: 1, paddingLeft: 5 },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileBiometricRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  fingerprintIconBox: {
    width: 76,
    height: 76,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    height: 53,
    flex: 1,
    marginLeft: 18,
    borderWidth: 1,
    borderColor: '#123B78',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileScanButton: {
    marginLeft: 0,
    marginTop: 10,
    minHeight: 53,
    flex: 0,
  },
  scanButtonText: {
    color: '#123B78',
    fontSize: 13,
    fontWeight: '700',
  },
  fingerprintHelp: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 94,
    marginTop: 10,
  },
  mobileFingerprintHelp: {
    marginLeft: 0,
    textAlign: 'center',
  },

  // Statistics
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    color: '#172B4D',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#172B4D',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Encounter Card
  encounterCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  encounterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  encounterPatient: { flex: 1 },
  encounterPatientName: {
    color: '#172B4D',
    fontSize: 15,
    fontWeight: '700',
  },
  encounterFileNumber: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  encounterStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  encounterStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  encounterDetails: {
    gap: 4,
    marginBottom: 10,
  },
  encounterDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  encounterDetailText: {
    color: '#475569',
    fontSize: 12,
    flex: 1,
  },
  encounterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  encounterWorkerStatus: { flex: 1 },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waitingText: {
    color: '#EA580C',
    fontSize: 11,
    fontWeight: '600',
  },
  myBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignedText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '600',
  },
  takeButton: {
    backgroundColor: '#123B78',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  takeButtonDisabled: {
    opacity: 0.6,
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyStateText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },

  // Footer
  footer: {
    minHeight: 70,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginTop: 10,
  },
  mobileFooter: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 18,
    gap: 8,
  },
  footerText: { color: '#64748B', fontSize: 11 },
  footerDivider: {
    color: '#94A3B8',
    fontSize: 12,
    marginHorizontal: 14,
  },
  footerRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: { color: '#475569', fontSize: 11 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  workspaceModal: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },
  recordModal: {
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
    color: '#172B4D',
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },

  // Workspace
  workspaceContent: { flexGrow: 0 },
  workspaceSection: {
    marginBottom: 20,
  },
  workspaceSectionTitle: {
    color: '#172B4D',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Patient Info
  patientInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  patientInfoItem: {
    width: '50%',
    padding: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F1F5F9',
  },
  patientInfoLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  patientInfoValue: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Encounter Info
  encounterInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  encounterInfoItem: {
    width: '50%',
    padding: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F1F5F9',
  },
  encounterInfoLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  encounterInfoValue: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Records
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123B78',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addRecordButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingRecords: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingRecordsText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },
  emptyRecords: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyRecordsTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyRecordsText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  recordCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordTypeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordTypeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '600',
  },
  recordDate: {
    color: '#94A3B8',
    fontSize: 10,
  },
  recordContent: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  recordCreator: {
    color: '#94A3B8',
    fontSize: 10,
    fontStyle: 'italic',
  },

  // Buttons
  takeEncounterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  takeEncounterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Record Modal
  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 12,
    color: '#172B4D',
    fontSize: 12,
    marginBottom: 10,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  recordTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  recordTypeOption: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recordTypeOptionSelected: {
    borderColor: '#123B78',
    backgroundColor: '#EFF6FF',
  },
  recordTypeOptionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
  recordTypeOptionTextSelected: {
    color: '#123B78',
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#123B78',
    borderRadius: 7,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Status text colors
  verifiedText: { color: '#059669' },
  unverifiedText: { color: '#DC2626' },
  enrolledText: { color: '#059669' },
  notEnrolledText: { color: '#DC2626' },

  // Toast Messages
  successToast: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 360,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  successCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  successText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  errorToast: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 360,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});