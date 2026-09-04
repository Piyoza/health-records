import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function DashboardScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Sidebar starts open
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [patientId, setPatientId] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? '');
      setUserRole(user?.user_metadata?.role ?? 'Healthcare Worker');
    } catch (error) {
      console.error('DASHBOARD USER ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const getFirstName = () => {
    if (!userEmail) return 'User';

    return userEmail
      .split('@')[0]
      .split(/[._-]/)[0]
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const getRoleDisplay = () => {
    if (!userRole) return 'Healthcare Worker';

    const roleMap: Record<string, string> = {
      admin: 'Admin',
      administrator: 'Admin',
      doctor: 'Doctor',
      nurse: 'Nurse',
      paramedic: 'Paramedic',
      'healthcare worker': 'Healthcare Worker',
    };

    return roleMap[userRole.trim().toLowerCase()] ?? userRole;
  };

  const handlePatientSearch = () => {
    if (!patientId.trim()) {
      router.push('/(app)/patients');
      return;
    }

    // You can later replace this with:
    // router.push(`/(app)/patients/${patientId}`)
    router.push('/(app)/patients');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#123B78" />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      {sidebarOpen && (
        <View style={styles.sidebar}>

          {/* SIDEBAR LOGO */}
          <View style={styles.sidebarBrand}>

            <Image
              source={require('../../assets/sa-government-logo.png')}
              style={styles.governmentLogo}
              resizeMode="contain"
            />

            <View style={styles.brandTextContainer}>
              <Text style={styles.carelinkText}>CARELINK</Text>
              <Text style={styles.brandSubtitle}>
                Electronic Health Records
              </Text>
            </View>

          </View>

          <View style={styles.sidebarDivider} />

          {/* MAIN MENU */}
          <View style={styles.menuSection}>

            <Text style={styles.menuLabel}>MAIN MENU</Text>

            <SidebarItem
              icon="grid-outline"
              label="Dashboard"
              active
              onPress={() => {}}
            />

            <SidebarItem
              icon="people-outline"
              label="Patients"
              onPress={() => router.push('/(app)/patients')}
            />

            <SidebarItem
              icon="document-text-outline"
              label="Medical Records"
              onPress={() => {}}
            />

            <SidebarItem
              icon="calendar-outline"
              label="Appointments"
              onPress={() => {}}
            />

            <Text style={[styles.menuLabel, styles.servicesLabel]}>
              SERVICES
            </Text>

            <SidebarItem
              icon="warning-outline"
              label="Emergency"
              emergency
              onPress={() => {}}
            />

          </View>

          {/* SIDEBAR BOTTOM */}
          <View style={styles.sidebarBottom}>

            <SidebarItem
              icon="person-outline"
              label="Profile"
              onPress={() => router.push('/(app)/profile')}
            />

            <SidebarItem
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
            />

          </View>
        </View>
      )}

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <View style={styles.main}>

        {/* =====================================================
            TOP HEADER
        ===================================================== */}

        <View style={styles.header}>

          {/* LEFT HEADER */}
          <View style={styles.headerLeft}>

            {/* HAMBURGER */}
            <Pressable
              style={styles.menuButton}
              onPress={() => setSidebarOpen(!sidebarOpen)}
            >
              <Ionicons
                name="menu-outline"
                size={28}
                color="#123B78"
              />
            </Pressable>

            {/* LOGO WHEN SIDEBAR IS CLOSED */}
            {!sidebarOpen && (
              <View style={styles.compactBrand}>

                <Image
                  source={require('../../assets/sa-government-logo.png')}
                  style={styles.compactGovernmentLogo}
                  resizeMode="contain"
                />

                <View>
                  <Text style={styles.compactCarelink}>
                    CARELINK
                  </Text>

                  <Text style={styles.compactSubtitle}>
                    Electronic Health Records
                  </Text>
                </View>

              </View>
            )}

          </View>

          {/* RIGHT HEADER */}
          <View style={styles.headerRight}>

            {/* FACILITY */}
            <View style={styles.facilityContainer}>
              <Text style={styles.facilityLabel}>
                Facility:
              </Text>

              <Text style={styles.facilityName}>
                Durban Central Clinic
              </Text>

              <Ionicons
                name="chevron-down"
                size={15}
                color="#172B4D"
              />
            </View>

            {/* NOTIFICATIONS */}
            <Pressable style={styles.notificationButton}>
              <Ionicons
                name="notifications-outline"
                size={25}
                color="#123B78"
              />

              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  3
                </Text>
              </View>
            </Pressable>

            {/* USER */}
            <View style={styles.userContainer}>

              <View style={styles.userAvatar}>
                <Ionicons
                  name="person"
                  size={20}
                  color="#123B78"
                />
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {getFirstName()}
                </Text>

                <Text style={styles.userRole}>
                  {getRoleDisplay()}
                </Text>
              </View>

              <Ionicons
                name="chevron-down"
                size={15}
                color="#172B4D"
              />

            </View>

          </View>
        </View>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* PAGE TITLE */}
          <View style={styles.pageHeader}>

            <Text style={styles.pageTitle}>
              Dashboard
            </Text>

            <Text style={styles.dateText}>
              Date: 03 September 2026 | Time: 11:25
            </Text>

          </View>

          {/* INFORMATION BANNER */}
          <View style={styles.infoBanner}>

            <View style={styles.infoIcon}>
              <Ionicons
                name="information"
                size={17}
                color="#123B78"
              />
            </View>

            <Text style={styles.infoText}>
              Patient clinical records are accessible in all public health facilities.
            </Text>

          </View>

          {/* =================================================
              FIND PATIENT RECORD
          ================================================= */}

          <View style={styles.findPatientCard}>

            <Text style={styles.findPatientTitle}>
              FIND PATIENT RECORD
            </Text>

            <Text style={styles.findPatientSubtitle}>
              Search for a patient using South African ID number or biometric verification.
            </Text>

            <View style={styles.searchArea}>

              {/* ID SEARCH */}
              <View style={styles.idSearchSection}>

                <Text style={styles.searchLabel}>
                  Search by ID Number
                </Text>

                <View style={styles.searchRow}>

                  <View style={styles.inputContainer}>

                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#94A3B8"
                    />

                    <TextInput
                      value={patientId}
                      onChangeText={setPatientId}
                      placeholder="Enter South African ID Number"
                      placeholderTextColor="#94A3B8"
                      style={styles.patientInput}
                      keyboardType="numeric"
                    />

                  </View>

                  <Pressable
                    style={styles.searchButton}
                    onPress={handlePatientSearch}
                  >
                    <Text style={styles.searchButtonText}>
                      Search
                    </Text>
                  </Pressable>

                </View>

                <Text style={styles.exampleText}>
                  Example: 8801011234088
                </Text>

              </View>

              {/* OR */}
              <View style={styles.orContainer}>

                <View style={styles.orLine} />

                <Text style={styles.orText}>
                  OR
                </Text>

                <View style={styles.orLine} />

              </View>

              {/* BIOMETRIC */}
              <View style={styles.biometricSection}>

                <Text style={styles.searchLabel}>
                  Search by Biometric
                </Text>

                <View style={styles.biometricRow}>

                  <View style={styles.fingerprintIconBox}>
                    <Ionicons
                      name="finger-print-outline"
                      size={46}
                      color="#123B78"
                    />
                  </View>

                  <Pressable style={styles.scanButton}>

                    <Text style={styles.scanButtonText}>
                      Scan Fingerprint
                    </Text>

                  </Pressable>

                </View>

                <Text style={styles.fingerprintHelp}>
                  Place finger on the scanner
                </Text>

              </View>

            </View>

          </View>

          {/* =================================================
              LOWER AREA
          ================================================= */}

          <View style={styles.lowerSection}>

            {/* RECENTLY ACCESSED */}
            <View style={styles.recentCard}>

              <Text style={styles.cardSectionTitle}>
                RECENTLY ACCESSED PATIENTS
              </Text>

              {/* TABLE HEADER */}
              <View style={styles.tableHeader}>

                <Text style={[styles.tableHeaderText, styles.patientIdColumn]}>
                  Patient ID
                </Text>

                <Text style={[styles.tableHeaderText, styles.patientNameColumn]}>
                  Patient Name
                </Text>

                <Text style={[styles.tableHeaderText, styles.recordColumn]}>
                  Record Type
                </Text>

                <Text style={[styles.tableHeaderText, styles.accessedColumn]}>
                  Accessed By
                </Text>

                <Text style={[styles.tableHeaderText, styles.facilityColumn]}>
                  Facility
                </Text>

                <Text style={[styles.tableHeaderText, styles.timeColumn]}>
                  Time
                </Text>

              </View>

              <RecentPatient
                id="CL-0001"
                name="John Doe"
                recordType="Consultation"
                accessedBy="Dr. Naidoo"
                facility="Durban Central Clinic"
                time="11:20"
              />

              <RecentPatient
                id="CL-0002"
                name="Sarah Mokoena"
                recordType="Lab Result"
                accessedBy="Dr. Patel"
                facility="Wentworth Clinic"
                time="10:45"
              />

              <RecentPatient
                id="CL-0003"
                name="Thabo Khumalo"
                recordType="Radiology"
                accessedBy="Dr. Naidoo"
                facility="Durban Central Clinic"
                time="10:15"
              />

              <RecentPatient
                id="CL-0004"
                name="Nomsa Dlamini"
                recordType="Consultation"
                accessedBy="Dr. Patel"
                facility="Umlazi Clinic"
                time="09:50"
              />

              <RecentPatient
                id="CL-0005"
                name="Sipho Zulu"
                recordType="Discharge Summary"
                accessedBy="Dr. Naidoo"
                facility="King Edward Hospital"
                time="09:30"
              />

              <Pressable
                style={styles.viewAllButton}
                onPress={() => router.push('/(app)/patients')}
              >
                <Text style={styles.viewAllText}>
                  View all records
                </Text>
              </Pressable>

            </View>

            {/* SYSTEM STATUS */}
            <View style={styles.statusCard}>

              <Text style={styles.cardSectionTitle}>
                SYSTEM STATUS
              </Text>

              <SystemStatus
                icon="globe-outline"
                title="National EHR Network"
                status="Connected"
              />

              <SystemStatus
                icon="share-social-outline"
                title="Record Sharing"
                status="Operational"
              />

              <SystemStatus
                icon="finger-print-outline"
                title="Biometric Service"
                status="Operational"
              />

              <SystemStatus
                icon="server-outline"
                title="System"
                status="Operational"
              />

            </View>

          </View>

          {/* =================================================
              FOOTER
          ================================================= */}

          <View style={styles.footer}>

            <Text style={styles.footerText}>
              Carelink Electronic Health Records System
            </Text>

            <Text style={styles.footerDivider}>
              |
            </Text>

            <Text style={styles.footerText}>
              Department of Health – Republic of South Africa
            </Text>

            <View style={styles.footerRight}>

              <Text style={styles.footerLink}>
                Help Centre
              </Text>

              <Text style={styles.footerDivider}>
                |
              </Text>

              <Text style={styles.footerLink}>
                Privacy Policy
              </Text>

              <Text style={styles.footerDivider}>
                |
              </Text>

              <Text style={styles.footerLink}>
                Terms of Use
              </Text>

            </View>

          </View>

        </ScrollView>

      </View>
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
    <Pressable
      onPress={onPress}
      style={[
        styles.sidebarItem,
        active && styles.sidebarItemActive,
      ]}
    >

      <Ionicons
        name={icon}
        size={20}
        color={
          active
            ? '#FFFFFF'
            : emergency
            ? '#DC2626'
            : '#64748B'
        }
      />

      <Text
        style={[
          styles.sidebarItemText,
          active && styles.sidebarItemTextActive,
          emergency && styles.sidebarEmergencyText,
        ]}
      >
        {label}
      </Text>

    </Pressable>
  );
}


/* ============================================================
   RECENT PATIENT
============================================================ */

function RecentPatient({
  id,
  name,
  recordType,
  accessedBy,
  facility,
  time,
}: {
  id: string;
  name: string;
  recordType: string;
  accessedBy: string;
  facility: string;
  time: string;
}) {
  return (
    <Pressable style={styles.patientTableRow}>

      <Text style={[styles.tableText, styles.patientIdColumn]}>
        {id}
      </Text>

      <Text style={[styles.tableText, styles.patientNameColumn]}>
        {name}
      </Text>

      <Text style={[styles.tableText, styles.recordColumn]}>
        {recordType}
      </Text>

      <Text style={[styles.tableText, styles.accessedColumn]}>
        {accessedBy}
      </Text>

      <Text style={[styles.tableText, styles.facilityColumn]}>
        {facility}
      </Text>

      <Text style={[styles.tableText, styles.timeColumn]}>
        {time}
      </Text>

    </Pressable>
  );
}


/* ============================================================
   SYSTEM STATUS
============================================================ */

function SystemStatus({
  icon,
  title,
  status,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  status: string;
}) {
  return (
    <View style={styles.statusRow}>

      <View style={styles.statusIcon}>
        <Ionicons
          name="checkmark"
          size={16}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.statusInfo}>

        <View style={styles.statusTitleRow}>

          <Ionicons
            name={icon}
            size={17}
            color="#123B78"
          />

          <Text style={styles.statusTitle}>
            {title}
          </Text>

        </View>

        <Text style={styles.statusText}>
          {status}
        </Text>

      </View>

    </View>
  );
}


/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({

  /* APP */

  appContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  /* ==========================================================
     SIDEBAR
  ========================================================== */

  sidebar: {
    width: 255,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingVertical: 25,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },

  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  governmentLogo: {
    width: 58,
    height: 72,
  },

  brandTextContainer: {
    marginLeft: 10,
    flex: 1,
  },

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

  menuSection: {
    flex: 1,
  },

  menuLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 12,
    marginBottom: 9,
  },

  servicesLabel: {
    marginTop: 28,
  },

  sidebarItem: {
    height: 46,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 4,
  },

  sidebarItemActive: {
    backgroundColor: '#123B78',
  },

  sidebarItemText: {
    color: '#475569',
    fontSize: 13,
    marginLeft: 13,
    fontWeight: '500',
  },

  sidebarItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  sidebarEmergencyText: {
    color: '#DC2626',
    fontWeight: '600',
  },

  sidebarBottom: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 15,
  },

  /* ==========================================================
     MAIN
  ========================================================== */

  main: {
    flex: 1,
    minWidth: 0,
  },

  /* ==========================================================
     HEADER
  ========================================================== */

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

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },

  facilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

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
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
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

  userInfo: {
    marginRight: 9,
  },

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

  /* ==========================================================
     CONTENT
  ========================================================== */

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 32,
    paddingTop: 25,
    paddingBottom: 35,
  },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
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

  /* ==========================================================
     INFO BANNER
  ========================================================== */

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
    color: '#123B78',
    fontSize: 13,
    fontWeight: '600',
  },

  /* ==========================================================
     FIND PATIENT
  ========================================================== */

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

  idSearchSection: {
    flex: 1,
  },

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

  /* OR */

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

  /* BIOMETRIC */

  biometricSection: {
    flex: 1,
    paddingLeft: 5,
  },

  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

  /* ==========================================================
     LOWER SECTION
  ========================================================== */

  lowerSection: {
    flexDirection: 'row',
    gap: 22,
    marginBottom: 28,
  },

  recentCard: {
    flex: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },

  statusCard: {
    flex: 1.1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },

  cardSectionTitle: {
    color: '#172B4D',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 19,
    paddingVertical: 17,
  },

  /* ==========================================================
     TABLE
  ========================================================== */

  tableHeader: {
    minHeight: 48,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  tableHeaderText: {
    color: '#172B4D',
    fontSize: 11,
    fontWeight: '800',
  },

  patientTableRow: {
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  tableText: {
    color: '#172B4D',
    fontSize: 11,
  },

  patientIdColumn: {
    width: 95,
  },

  patientNameColumn: {
    flex: 1.2,
  },

  recordColumn: {
    flex: 1.25,
  },

  accessedColumn: {
    flex: 1.15,
  },

  facilityColumn: {
    flex: 1.4,
  },

  timeColumn: {
    width: 55,
    textAlign: 'right',
  },

  viewAllButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 18,
  },

  viewAllText: {
    color: '#123B78',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ==========================================================
     SYSTEM STATUS
  ========================================================== */

  statusRow: {
    minHeight: 75,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  statusIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  statusInfo: {
    flex: 1,
  },

  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  statusTitle: {
    color: '#172B4D',
    fontSize: 12,
    fontWeight: '700',
  },

  statusText: {
    color: '#475569',
    fontSize: 11,
    marginTop: 5,
    marginLeft: 24,
  },

  /* ==========================================================
     FOOTER
  ========================================================== */

  footer: {
    minHeight: 70,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  footerText: {
    color: '#64748B',
    fontSize: 11,
  },

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

  footerLink: {
    color: '#475569',
    fontSize: 11,
  },
});