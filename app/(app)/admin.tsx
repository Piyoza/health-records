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

type PatientEncounter = {
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
  facility_name: string;
  healthcare_worker_name: string;
};

const initialPatients: Patient[] = [];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'workers'
  >('dashboard');

  const [patients, setPatients] =
    useState<Patient[]>([]);

  const [healthcareWorkers, setHealthcareWorkers] =
    useState<HealthcareWorker[]>([]);

  const [showCreateWorker, setShowCreateWorker] =
    useState(false);

  const [workerFirstName, setWorkerFirstName] =
    useState('');

  const [workerLastName, setWorkerLastName] =
    useState('');

  const [workerEmail, setWorkerEmail] =
    useState('');

  const [workerPassword, setWorkerPassword] =
    useState('');

  const [workerRole, setWorkerRole] =
    useState('');

  const [workerDepartment, setWorkerDepartment] =
    useState('');

  const [workerFacility, setWorkerFacility] =
    useState('');

  const [workerRoles, setWorkerRoles] = useState<
    { id: string; name: string }[]
  >([]);

  const [facilities, setFacilities] = useState<
    { id: string; name: string }[]
  >([]);

  const [showAddPatient, setShowAddPatient] =
    useState(false);

  const [showPatientFile, setShowPatientFile] =
    useState(false);

  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [patientEncounters, setPatientEncounters] =
    useState<PatientEncounter[]>([]);

  const [loadingPatientFile, setLoadingPatientFile] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [patientFirstName, setPatientFirstName] =
    useState('');

  const [patientLastName, setPatientLastName] =
    useState('');

  const [patientIdNumber, setPatientIdNumber] =
    useState('');

  // Edit Patient States
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');

  // Start Encounter States
  const [showStartEncounter, setShowStartEncounter] = useState(false);
  const [encounterFacility, setEncounterFacility] = useState('');
  const [encounterDepartment, setEncounterDepartment] = useState('');
  const [encounterReason, setEncounterReason] = useState('');

  /*
   * Generates the next CARELINK file number.
   *
   * Example:
   * CL-0001
   * CL-0002
   * CL-0003
   *
   * Kept from the existing dashboard.
   */
  const generatePatientNumber = () => {
    const nextNumber = patients.length + 1;

    return `CL-${String(nextNumber).padStart(4, '0')}`;
  };

  /*
   * FETCH PATIENTS
   *
   * Gets the actual patient information from Supabase.
   *
   * The database UUID (id) is kept internally but is
   * NOT displayed in the patient table.
   */
  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
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
          identity_verified,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setPatients(
        (data ?? []).map((patient) => ({
          id: patient.id,

          file_number: patient.file_number,

          id_number: patient.id_number,

          first_name: patient.first_name,

          last_name: patient.last_name,

          date_of_birth: patient.date_of_birth,

          gender: patient.gender,

          phone_number: patient.phone_number,

          address: patient.address,

          emergency_contact_name:
            patient.emergency_contact_name,

          emergency_contact_phone:
            patient.emergency_contact_phone,

          biometric_enrolled:
            patient.biometric_enrolled ?? false,

          biometric_enrolled_at:
            patient.biometric_enrolled_at,

          identity_verified:
            patient.identity_verified ?? false,

          created: new Date(
            patient.created_at
          ).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        }))
      );

      console.log(
        'Patients loaded:',
        data
      );
    } catch (error) {
      console.error(
        'Error fetching patients:',
        error
      );
    }
  };

  /*
   * FETCH HEALTHCARE WORKERS
   */
  const fetchHealthcareWorkers = async () => {
    try {
      const {
        data: staff,
        error: staffError,
      } = await supabase
        .from('facility_staff')
        .select(`
          id,
          user_id,
          role,
          department,
          active,
          facility_id,
          facilities (
            name
          )
        `)
        .order('created_at', {
          ascending: false,
        });

      if (staffError) {
        throw staffError;
      }

      const userIds = (staff ?? []).map(
        (worker) => worker.user_id
      );

      if (userIds.length === 0) {
        setHealthcareWorkers([]);
        return;
      }

      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from('profiles')
        .select(
          'id, first_name, last_name'
        )
        .in('id', userIds);

      if (profilesError) {
        throw profilesError;
      }

      const profileMap = new Map(
        (profiles ?? []).map((profile) => [
          profile.id,
          profile,
        ])
      );

      setHealthcareWorkers(
        (staff ?? []).map((worker: any) => {
          const profile = profileMap.get(
            worker.user_id
          );

          return {
            id: worker.id,

            first_name:
              profile?.first_name ?? '',

            last_name:
              profile?.last_name ?? '',

            role: worker.role,

            department:
              worker.department,

            facility:
              worker.facilities?.name ?? '',

            active:
              worker.active,
          };
        })
      );

      console.log(
        'STAFF:',
        JSON.stringify(
          staff,
          null,
          2
        )
      );

      console.log(
        'PROFILES:',
        JSON.stringify(
          profiles,
          null,
          2
        )
      );
    } catch (error) {
      console.error(
        'Error fetching healthcare workers:',
        error
      );
    }
  };

  /*
   * FETCH WORKER ROLES
   */
  const fetchWorkerRoles = async () => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from('roles')
        .select('id, name')
        .neq('name', 'admin')
        .order('name');

      if (error) {
        console.error(
          'ROLES ERROR:',
          error
        );

        throw error;
      }

      console.log(
        'ROLES LOADED:',
        data
      );

      setWorkerRoles(
        data ?? []
      );
    } catch (error) {
      console.error(
        'Error fetching worker roles:',
        error
      );
    }
  };

  /*
   * FETCH FACILITIES
   */
  const fetchFacilities = async () => {
    try {
      console.log(
        'Loading facilities...'
      );

      const {
        data,
        error,
      } = await supabase
        .from('facilities')
        .select('id, name')
        .order('name');

      if (error) {
        console.error(
          'FACILITIES ERROR:',
          error
        );

        throw error;
      }

      console.log(
        'FACILITIES LOADED:',
        data
      );

      setFacilities(
        data ?? []
      );
    } catch (error) {
      console.error(
        'Error fetching facilities:',
        error
      );

      setFacilities([]);
    }
  };

  /*
   * INITIAL DATA LOAD
   */
  useEffect(() => {
    fetchPatients();
    fetchHealthcareWorkers();
    fetchWorkerRoles();
    fetchFacilities();
  }, []);

  /*
   * FETCH ACTIVE ENCOUNTERS
   *
   * Uses the actual patient_encounters table.
   */
  const fetchActiveEncounterCount = async () => {
    try {
      const {
        count,
        error,
      } = await supabase
        .from('patient_encounters')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          }
        )
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      return count ?? 0;
    } catch (error) {
      console.error(
        'Error fetching active encounters:',
        error
      );

      return 0;
    }
  };

  /*
   * ACTIVE ENCOUNTER COUNT
   *
   * Loaded from patient_encounters whenever
   * the dashboard is rendered.
   */
  const [
    activeEncounterCount,
    setActiveEncounterCount,
  ] = useState(0);

  useEffect(() => {
    const loadActiveEncounters =
      async () => {
        const count =
          await fetchActiveEncounterCount();

        setActiveEncounterCount(
          count
        );
      };

    loadActiveEncounters();
  }, [patients.length]);

  /*
   * OPEN PATIENT FILE
   *
   * Loads the selected patient's encounter
   * history from patient_encounters.
   */
  const openPatientFile = async (
    patient: Patient
  ) => {
    setSelectedPatient(patient);
    setShowPatientFile(true);
    setLoadingPatientFile(true);
    setPatientEncounters([]);

    try {
      const {
        data: encounters,
        error,
      } = await supabase
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
          facilities (
            name
          )
        `)
        .eq(
          'patient_id',
          patient.id
        )
        .order('check_in_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const workerIds = [
        ...new Set(
          (encounters ?? [])
            .map(
              (encounter: any) =>
                encounter.healthcare_worker_id
            )
            .filter(Boolean)
        ),
      ];

      let workerMap = new Map<
        string,
        {
          first_name: string | null;
          last_name: string | null;
        }
      >();

      if (workerIds.length > 0) {
        const {
          data: workers,
          error: workersError,
        } = await supabase
          .from('profiles')
          .select(
            'id, first_name, last_name'
          )
          .in(
            'id',
            workerIds
          );

        if (workersError) {
          throw workersError;
        }

        workerMap = new Map(
          (workers ?? []).map(
            (worker) => [
              worker.id,
              {
                first_name:
                  worker.first_name,
                last_name:
                  worker.last_name,
              },
            ]
          )
        );
      }

      setPatientEncounters(
        (encounters ?? []).map(
          (encounter: any) => {
            const worker =
              encounter.healthcare_worker_id
                ? workerMap.get(
                    encounter.healthcare_worker_id
                  )
                : null;

            const workerName =
              worker
                ? `${worker.first_name ?? ''} ${worker.last_name ?? ''}`.trim()
                : 'Awaiting Healthcare Worker';

            return {
              id:
                encounter.id,

              patient_id:
                encounter.patient_id,

              facility_id:
                encounter.facility_id,

              healthcare_worker_id:
                encounter.healthcare_worker_id,

              department:
                encounter.department,

              reason:
                encounter.reason,

              status:
                encounter.status,

              check_in_at:
                encounter.check_in_at,

              check_out_at:
                encounter.check_out_at,

              created_at:
                encounter.created_at,

              facility_name:
                encounter.facilities?.name ??
                'Unknown facility',

              healthcare_worker_name:
                workerName,
            };
          }
        )
      );
    } catch (error) {
      console.error(
        'Error loading patient file:',
        error
      );

      setSuccessMessage(
        'Unable to load patient file information.'
      );

      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } finally {
      setLoadingPatientFile(false);
    }
  };

  /*
   * VERIFY PATIENT IDENTITY
   */
  const verifyPatientIdentity = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ 
          identity_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;

      // Refresh the patient data
      await fetchPatients();
      
      // Refresh the selected patient data
      if (selectedPatient) {
        const { data, error: fetchError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (!fetchError && data) {
          setSelectedPatient({
            id: data.id,
            file_number: data.file_number,
            id_number: data.id_number,
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            phone_number: data.phone_number,
            address: data.address,
            emergency_contact_name: data.emergency_contact_name,
            emergency_contact_phone: data.emergency_contact_phone,
            biometric_enrolled: data.biometric_enrolled ?? false,
            biometric_enrolled_at: data.biometric_enrolled_at,
            identity_verified: data.identity_verified ?? false,
            created: new Date(data.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
          });
        }
      }

      setSuccessMessage('Patient identity verified successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error verifying identity:', error);
      setSuccessMessage('Unable to verify identity. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  /*
   * ENROLL BIOMETRIC
   */
  const enrollBiometric = async (patientId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('patients')
        .update({ 
          biometric_enrolled: true,
          biometric_enrolled_at: now,
          updated_at: now
        })
        .eq('id', patientId);

      if (error) throw error;

      // Refresh the patient data
      await fetchPatients();
      
      // Refresh the selected patient data
      if (selectedPatient) {
        const { data, error: fetchError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (!fetchError && data) {
          setSelectedPatient({
            id: data.id,
            file_number: data.file_number,
            id_number: data.id_number,
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            phone_number: data.phone_number,
            address: data.address,
            emergency_contact_name: data.emergency_contact_name,
            emergency_contact_phone: data.emergency_contact_phone,
            biometric_enrolled: data.biometric_enrolled ?? false,
            biometric_enrolled_at: data.biometric_enrolled_at,
            identity_verified: data.identity_verified ?? false,
            created: new Date(data.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
          });
        }
      }

      setSuccessMessage('Biometric enrollment completed successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error enrolling biometric:', error);
      setSuccessMessage('Unable to enroll biometric. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  /*
   * CHECK FOR ACTIVE ENCOUNTER
   */
  const checkActiveEncounter = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_encounters')
        .select('id, status, check_in_at, reason, facility_id, department')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error checking active encounter:', error);
      return null;
    }
  };

  /*
   * OPEN START ENCOUNTER
   */
  const openStartEncounter = async (patient: Patient) => {
    // Check for active encounter first
    const active = await checkActiveEncounter(patient.id);
    
    if (active) {
      setSuccessMessage('Patient already has an active encounter. Please close the existing encounter first.');
      setTimeout(() => setSuccessMessage(''), 5000);
      return;
    }
    
    setSelectedPatient(patient);
    setShowStartEncounter(true);
    setEncounterFacility('');
    setEncounterDepartment('');
    setEncounterReason('');
  };

  /*
   * CREATE ENCOUNTER
   */
  const createEncounter = async () => {
    if (!selectedPatient || !encounterFacility || !encounterReason.trim()) {
      setSuccessMessage('Please select a facility and enter a reason for visit.');
      setTimeout(() => setSuccessMessage(''), 5000);
      return;
    }

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('patient_encounters')
        .insert({
          patient_id: selectedPatient.id,
          facility_id: encounterFacility,
          healthcare_worker_id: null,
          department: encounterDepartment.trim() || null,
          reason: encounterReason.trim(),
          status: 'active',
          check_in_at: now,
          created_at: now
        })
        .select()
        .single();

      if (error) throw error;

      setShowStartEncounter(false);
      setEncounterFacility('');
      setEncounterDepartment('');
      setEncounterReason('');
      
      // Refresh encounter history
      await openPatientFile(selectedPatient);
      
      setSuccessMessage(`Encounter started successfully at ${new Date(now).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error creating encounter:', error);
      setSuccessMessage('Unable to start encounter. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  /*
   * OPEN EDIT PATIENT
   */
  const openEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditFirstName(patient.first_name);
    setEditLastName(patient.last_name);
    setEditPhone(patient.phone_number || '');
    setEditAddress(patient.address || '');
    setEditEmergencyName(patient.emergency_contact_name || '');
    setEditEmergencyPhone(patient.emergency_contact_phone || '');
    setShowEditPatient(true);
  };

  /*
   * SAVE PATIENT EDIT
   */
  const savePatientEdit = async () => {
    if (!editingPatient) return;

    if (!editFirstName.trim() || !editLastName.trim()) {
      setSuccessMessage('First name and last name are required.');
      setTimeout(() => setSuccessMessage(''), 5000);
      return;
    }

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('patients')
        .update({
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          phone_number: editPhone.trim() || null,
          address: editAddress.trim() || null,
          emergency_contact_name: editEmergencyName.trim() || null,
          emergency_contact_phone: editEmergencyPhone.trim() || null,
          updated_at: now
        })
        .eq('id', editingPatient.id);

      if (error) throw error;

      setShowEditPatient(false);
      setEditingPatient(null);
      
      // Refresh patient data
      await fetchPatients();
      if (selectedPatient) {
        await openPatientFile(selectedPatient);
      }
      
      setSuccessMessage('Patient information updated successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error updating patient:', error);
      setSuccessMessage('Unable to update patient information. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  /*
   * CREATE HEALTHCARE WORKER
   */
  const createHealthcareWorker =
    async () => {
      console.log(
        'WORKER FORM VALUES:',
        {
          firstName:
            workerFirstName,

          lastName:
            workerLastName,

          email:
            workerEmail,

          password:
            workerPassword
              ? 'ENTERED'
              : 'EMPTY',

          role:
            workerRole,

          facility:
            workerFacility,
        }
      );

      if (
        !workerFirstName.trim() ||
        !workerLastName.trim() ||
        !workerEmail.trim() ||
        !workerPassword ||
        !workerRole ||
        !workerFacility
      ) {
        setSuccessMessage(
          'Please complete all required worker fields.'
        );

        setTimeout(() => {
          setSuccessMessage('');
        }, 4000);

        return;
      }

      try {
        const {
          data,
          error,
        } =
          await supabase.functions.invoke(
            'create-healthcare-worker',
            {
              body: {
                first_name:
                  workerFirstName.trim(),

                last_name:
                  workerLastName.trim(),

                email:
                  workerEmail.trim(),

                password:
                  workerPassword,

                role:
                  workerRole,

                department:
                  workerDepartment.trim() ||
                  null,

                facility_id:
                  workerFacility,
              },
            }
          );

        if (error) {
          console.error(
            'FUNCTION ERROR:',
            error
          );

          if (
            'context' in error &&
            error.context
          ) {
            const errorBody =
              await error.context.json();

            console.error(
              'FUNCTION ERROR BODY:',
              errorBody
            );

            throw new Error(
              errorBody?.error ||
                'Unable to create healthcare worker.'
            );
          }

          throw error;
        }

        if (data?.error) {
          throw new Error(
            data.error
          );
        }

        setWorkerFirstName('');
        setWorkerLastName('');
        setWorkerEmail('');
        setWorkerPassword('');
        setWorkerRole('');
        setWorkerDepartment('');
        setWorkerFacility('');

        setShowCreateWorker(
          false
        );

        await fetchHealthcareWorkers();

        setSuccessMessage(
          'Healthcare worker created successfully.'
        );

        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (error) {
        console.error(
          'Error creating healthcare worker:',
          error
        );

        setSuccessMessage(
          error instanceof Error
            ? error.message
            : 'Unable to create healthcare worker.'
        );

        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    };

  /*
   * ADD PATIENT
   */
  const addPatient = async () => {
    if (
      !patientFirstName.trim() ||
      !patientLastName.trim() ||
      !patientIdNumber.trim()
    ) {
      return;
    }

    try {
      const idDetails =
        getSAIdDetails(
          patientIdNumber.trim()
        );

      if (!idDetails) {
        setSuccessMessage(
          'Invalid South African ID number. Please check the ID number.'
        );

        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);

        return;
      }

      const patient =
        await createPatient({
          first_name:
            patientFirstName.trim(),

          last_name:
            patientLastName.trim(),

          id_number:
            patientIdNumber.trim(),

          date_of_birth:
            idDetails.dateOfBirth,

          gender:
            idDetails.gender,
        });

      setPatientFirstName('');
      setPatientLastName('');
      setPatientIdNumber('');

      setShowAddPatient(
        false
      );

      await fetchPatients();

      setSuccessMessage(
        `Patient registered successfully. File Number: ${patient.file_number}`
      );

      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error(
        'Error creating patient:',
        error
      );

      if (
        error instanceof Error &&
        error.message.includes(
          'patients_id_number_key'
        )
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

  /*
   * SEARCH PATIENTS
   *
   * Searches:
   * - File number
   * - South African ID number
   * - First name
   * - Last name
   */
  const filteredPatients =
    patients.filter(
      (patient) => {
        const searchValue =
          search
            .toLowerCase()
            .trim();

        return (
          (patient.file_number ??
            '')
            .toLowerCase()
            .includes(
              searchValue
            ) ||

          patient.id_number
            .toLowerCase()
            .includes(
              searchValue
            ) ||

          patient.first_name
            .toLowerCase()
            .includes(
              searchValue
            ) ||

          patient.last_name
            .toLowerCase()
            .includes(
              searchValue
            )
        );
      }
    );

  /*
   * DASHBOARD STATISTICS
   */
  const biometricEnrolledCount =
    patients.filter(
      (patient) =>
        patient.biometric_enrolled
    ).length;

  const unverifiedCount =
    patients.filter(
      (patient) =>
        !patient.identity_verified
    ).length;

  const [
    databaseNewPatientCount,
    setDatabaseNewPatientCount,
  ] = useState(0);

  useEffect(() => {
    const fetchNewPatientCount =
      async () => {
        try {
          const start =
            new Date();

          start.setHours(
            0,
            0,
            0,
            0
          );

          const end =
            new Date(start);

          end.setDate(
            end.getDate() + 1
          );

          const {
            count,
            error,
          } = await supabase
            .from('patients')
            .select(
              'id',
              {
                count: 'exact',
                head: true,
              }
            )
            .gte(
              'created_at',
              start.toISOString()
            )
            .lt(
              'created_at',
              end.toISOString()
            );

          if (error) {
            throw error;
          }

          setDatabaseNewPatientCount(
            count ?? 0
          );
        } catch (error) {
          console.error(
            'Error fetching new patient count:',
            error
          );

          setDatabaseNewPatientCount(
            0
          );
        }
      };

    fetchNewPatientCount();
  }, [patients.length]);

  return (
    <View
      style={
        styles.appContainer
      }
    >

      {/* =========================
          SIDEBAR
      ========================= */}

      <View
        style={[
          styles.sidebar,
          !sidebarOpen &&
            styles.sidebarCollapsed,
        ]}
      >

        <View
          style={
            styles.logoArea
          }
        >

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
            <View
              style={
                styles.logoTextArea
              }
            >

              <Text
                style={
                  styles.carelinkText
                }
              >
                CARELINK
              </Text>

              <Text
                style={
                  styles.logoSubtitle
                }
              >
                Electronic Health Records
              </Text>

              <Text
                style={
                  styles.departmentText
                }
              >
                Department of Health
              </Text>

            </View>
          )}

        </View>

        {/* ADMIN MENU */}

        {sidebarOpen && (
          <View
            style={
              styles.sidebarMenu
            }
          >

            <Text
              style={
                styles.menuLabel
              }
            >
              ADMINISTRATION
            </Text>

            <Pressable
              style={[
                styles.navItem,
                activeSection ===
                  'dashboard' &&
                  styles.activeNavItem,
              ]}
              onPress={() =>
                setActiveSection(
                  'dashboard'
                )
              }
            >

              <Text
                style={
                  styles.navIcon
                }
              >
                ⌂
              </Text>

              <Text
                style={
                  activeSection ===
                  'dashboard'
                    ? styles.activeNavText
                    : styles.navText
                }
              >
                Dashboard
              </Text>

            </Pressable>

            <Text
              style={[
                styles.menuLabel,
                styles.servicesLabel,
              ]}
            >
              PATIENTS
            </Text>

            <Pressable
              style={
                styles.navItem
              }
              onPress={() =>
                setShowAddPatient(
                  true
                )
              }
            >

              <Text
                style={
                  styles.navIcon
                }
              >
                +
              </Text>

              <Text
                style={
                  styles.navText
                }
              >
                Register Patient
              </Text>

            </Pressable>

            <Pressable
              style={
                styles.navItem
              }
              onPress={() => {
                setActiveSection(
                  'dashboard'
                );

                setTimeout(() => {
                  // Search is already visible
                  // on the dashboard.
                }, 0);
              }}
            >

              <Text
                style={
                  styles.navIcon
                }
              >
                ⌕
              </Text>

              <Text
                style={
                  styles.navText
                }
              >
                Search Patient
              </Text>

            </Pressable>

            <Text
              style={[
                styles.menuLabel,
                styles.servicesLabel,
              ]}
            >
              HEALTHCARE WORKERS
            </Text>

            <Pressable
              style={[
                styles.navItem,
                activeSection ===
                  'workers' &&
                  styles.activeNavItem,
              ]}
              onPress={() =>
                setActiveSection(
                  'workers'
                )
              }
            >

              <Text
                style={
                  styles.navIcon
                }
              >
                ♙
              </Text>

              <Text
                style={
                  activeSection ===
                  'workers'
                    ? styles.activeNavText
                    : styles.navText
                }
              >
                View Workers
              </Text>

            </Pressable>

            <Pressable
              style={
                styles.navItem
              }
              onPress={() => {
                setActiveSection(
                  'workers'
                );

                setShowCreateWorker(
                  true
                );
              }}
            >

              <Text
                style={
                  styles.navIcon
                }
              >
                +
              </Text>

              <Text
                style={
                  styles.navText
                }
              >
                Create Worker
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

            <Pressable
              style={
                styles.navItem
              }
            >

              <Text
                style={
                  styles.navIcon
                }
              >
                ◉
              </Text>

              <Text
                style={
                  styles.navText
                }
              >
                Activity Logs
              </Text>

            </Pressable>

            <Pressable
              style={
                styles.navItem
              }
            >

              <Text
                style={
                  styles.navIcon
                }
              >
                ⚙
              </Text>

              <Text
                style={
                  styles.navText
                }
              >
                Settings
              </Text>

            </Pressable>

          </View>
        )}

        {/* SIDEBAR FOOTER */}

        {sidebarOpen && (
          <View
            style={
              styles.sidebarFooter
            }
          >

            <Text
              style={
                styles.secureText
              }
            >
              🔒 Secure Administration
            </Text>

            <Text
              style={
                styles.versionText
              }
            >
              CARELINK EHR v1.0
            </Text>

          </View>
        )}

      </View>

      {/* =========================
          MAIN AREA
      ========================= */}

      <View
        style={styles.main}
      >

        {/* HEADER */}

        <View
          style={styles.header}
        >

          <View
            style={
              styles.headerLeft
            }
          >

            <Pressable
              style={
                styles.menuButton
              }
              onPress={() =>
                setSidebarOpen(
                  !sidebarOpen
                )
              }
            >

              <Text
                style={
                  styles.menuButtonText
                }
              >
                ☰
              </Text>

            </Pressable>

            <View>

              <Text
                style={
                  styles.headerTitle
                }
              >
                CARELINK
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Electronic Health Records
              </Text>

            </View>

          </View>

          <View
            style={
              styles.headerRight
            }
          >

            <Pressable
              style={
                styles.notificationButton
              }
            >

              <Text
                style={
                  styles.notificationIcon
                }
              >
                ♧
              </Text>

              <View
                style={
                  styles.notificationBadge
                }
              >

                <Text
                  style={
                    styles.badgeText
                  }
                >
                  3
                </Text>

              </View>

            </Pressable>

            <View
              style={
                styles.profileMini
              }
            >

              <View
                style={
                  styles.avatar
                }
              >

                <Text
                  style={
                    styles.avatarText
                  }
                >
                  A
                </Text>

              </View>

              <View>

                <Text
                  style={
                    styles.profileName
                  }
                >
                  System Admin
                </Text>

                <Text
                  style={
                    styles.profileRole
                  }
                >
                  Administrator
                </Text>

              </View>

              <Text
                style={
                  styles.chevron
                }
              >
                ⌄
              </Text>

            </View>

          </View>

        </View>

        {/* =========================
            CONTENT
        ========================= */}

        <ScrollView
          style={
            styles.scrollView
          }
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          {activeSection ===
          'workers' ? (

            <HealthcareWorkersSection
              healthcareWorkers={
                healthcareWorkers
              }
              onCreateWorker={() =>
                setShowCreateWorker(
                  true
                )
              }
            />

          ) : (

            <>

              {/* PAGE TITLE */}

              <View
                style={
                  styles.pageHeader
                }
              >

                <View>

                  <Text
                    style={
                      styles.pageTitle
                    }
                  >
                    Administration Dashboard
                  </Text>

                  <Text
                    style={
                      styles.pageSubtitle
                    }
                  >
                    Manage patients, healthcare workers, and system administration
                  </Text>

                </View>

                <Pressable
                  style={
                    styles.addPatientButton
                  }
                  onPress={() =>
                    setShowAddPatient(
                      true
                    )
                  }
                >

                  <Text
                    style={
                      styles.addPatientButtonText
                    }
                  >
                    + Add Patient
                  </Text>

                </Pressable>

              </View>

              {/* PRIVACY NOTICE */}

              <View
                style={
                  styles.privacyBanner
                }
              >

                <View
                  style={
                    styles.infoCircle
                  }
                >

                  <Text
                    style={
                      styles.infoText
                    }
                  >
                    i
                  </Text>

                </View>

                <View
                  style={
                    styles.privacyTextArea
                  }
                >

                  <Text
                    style={
                      styles.privacyTitle
                    }
                  >
                    Patient Information Restricted
                  </Text>

                  <Text
                    style={
                      styles.privacyDescription
                    }
                  >
                    Administrators can register and identify patients, manage patient files, and manage healthcare worker access. Clinical information is handled through patient encounters and is not displayed in this administration dashboard.
                  </Text>

                </View>

              </View>

              {/* STATISTICS */}

              <View
                style={
                  styles.statsGrid
                }
              >

                <AdminStat
                  icon="♙"
                  number={String(
                    patients.length
                  )}
                  label="Total Patient Files"
                  detail="Registered patients"
                  background="#EFF6FF"
                  color="#2563EB"
                />

                <AdminStat
                  icon="+"
                  number={String(
                    databaseNewPatientCount
                  )}
                  label="New Patients"
                  detail="Registered today"
                  background="#ECFDF5"
                  color="#059669"
                />

                <AdminStat
                  icon="◉"
                  number={String(
                    activeEncounterCount
                  )}
                  label="Active Encounters"
                  detail="Currently receiving care"
                  background="#FFF7ED"
                  color="#EA580C"
                />

                <AdminStat
                  icon="✓"
                  number={String(
                    biometricEnrolledCount
                  )}
                  label="Biometric Enrollment"
                  detail="Patients enrolled"
                  background="#F5F3FF"
                  color="#7C3AED"
                />

              </View>

              {/* UNVERIFIED PATIENTS STAT */}

              <View
                style={[
                  styles.statsGrid,
                  { marginTop: 0 }
                ]}
              >

                <AdminStat
                  icon="⚠"
                  number={String(
                    unverifiedCount
                  )}
                  label="Unverified Patients"
                  detail="Need identity verification"
                  background="#FEF2F2"
                  color="#DC2626"
                />

              </View>

              {/* =========================
                  PATIENT FILES
              ========================= */}

              <View
                style={
                  styles.patientCard
                }
              >

                <View
                  style={
                    styles.cardHeader
                  }
                >

                  <View>

                    <Text
                      style={
                        styles.cardTitle
                      }
                    >
                      Patient Files
                    </Text>

                    <Text
                      style={
                        styles.cardSubtitle
                      }
                    >
                      Patient registration and identification information
                    </Text>

                  </View>

                  <Text
                    style={
                      styles.restrictedLabel
                    }
                  >
                    🔒 Restricted View
                  </Text>

                </View>

                {/* SEARCH */}

                <View
                  style={
                    styles.searchContainer
                  }
                >

                  <Text
                    style={
                      styles.searchIcon
                    }
                  >
                    ⌕
                  </Text>

                  <TextInput
                    value={
                      search
                    }
                    onChangeText={
                      setSearch
                    }
                    placeholder="Search by file number, ID number, first name or last name..."
                    placeholderTextColor="#94A3B8"
                    style={
                      styles.searchInput
                    }
                  />

                </View>

                {/* TABLE */}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    true
                  }
                >

                  <View
                    style={
                      styles.tableContainer
                    }
                  >

                    {/* TABLE HEADER */}

                    <View
                      style={
                        styles.tableHeader
                      }
                    >

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.fileColumn,
                        ]}
                      >
                        FILE NUMBER
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.patientColumn,
                        ]}
                      >
                        PATIENT
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.idColumn,
                        ]}
                      >
                        ID NUMBER
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.dateOfBirthColumn,
                        ]}
                      >
                        DATE OF BIRTH
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.genderColumn,
                        ]}
                      >
                        GENDER
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.phoneColumn,
                        ]}
                      >
                        PHONE
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.addressColumn,
                        ]}
                      >
                        ADDRESS
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.emergencyColumn,
                        ]}
                      >
                        EMERGENCY CONTACT
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.biometricColumn,
                        ]}
                      >
                        BIOMETRIC
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.verifiedColumn,
                        ]}
                      >
                        VERIFIED
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.dateColumn,
                        ]}
                      >
                        CREATED
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.actionColumn,
                        ]}
                      >
                        ACTION
                      </Text>

                    </View>

                    {/* PATIENT ROWS */}

                    {filteredPatients.map(
                      (patient) => (

                        <View
                          key={
                            patient.id
                          }
                          style={
                            styles.tableRow
                          }
                        >

                          {/* FILE NUMBER */}

                          <View
                            style={
                              styles.fileColumn
                            }
                          >

                            <View
                              style={
                                styles.fileNumberContainer
                              }
                            >

                              <View
                                style={
                                  styles.fileIcon
                                }
                              >

                                <Text
                                  style={
                                    styles.fileIconText
                                  }
                                >
                                  ▤
                                </Text>

                              </View>

                              <Text
                                style={
                                  styles.fileNumber
                                }
                              >
                                {patient.file_number ??
                                  'Not Assigned'}
                              </Text>

                            </View>

                          </View>

                          {/* PATIENT */}

                          <View
                            style={
                              styles.patientColumn
                            }
                          >

                            <Text
                              style={
                                styles.patientNameText
                              }
                            >
                              {patient.first_name}{' '}
                              {patient.last_name}
                            </Text>

                          </View>

                          {/* ID NUMBER */}

                          <View
                            style={
                              styles.idColumn
                            }
                          >

                            <Text
                              style={
                                styles.patientDataText
                              }
                            >
                              {patient.id_number ||
                                'Not provided'}
                            </Text>

                          </View>

                          {/* DATE OF BIRTH */}

                          <View
                            style={
                              styles.dateOfBirthColumn
                            }
                          >

                            <Text
                              style={
                                styles.patientDataText
                              }
                            >
                              {patient.date_of_birth
                                ? new Date(
                                    `${patient.date_of_birth}T00:00:00`
                                  ).toLocaleDateString(
                                    'en-GB',
                                    {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    }
                                  )
                                : 'Not provided'}
                            </Text>

                          </View>

                          {/* GENDER */}

                          <View
                            style={
                              styles.genderColumn
                            }
                          >

                            <Text
                              style={
                                styles.patientDataText
                              }
                            >
                              {patient.gender ||
                                'Not provided'}
                            </Text>

                          </View>

                          {/* PHONE */}

                          <View
                            style={
                              styles.phoneColumn
                            }
                          >

                            <Text
                              style={
                                styles.patientDataText
                              }
                            >
                              {patient.phone_number ||
                                'Not provided'}
                            </Text>

                          </View>

                          {/* ADDRESS */}

                          <View
                            style={
                              styles.addressColumn
                            }
                          >

                            <Text
                              style={
                                styles.patientDataText
                              }
                            >
                              {patient.address ||
                                'Not provided'}
                            </Text>

                          </View>

                          {/* EMERGENCY CONTACT */}

                          <View
                            style={
                              styles.emergencyColumn
                            }
                          >

                            <Text
                              style={
                                styles.patientDataText
                              }
                            >
                              {patient.emergency_contact_name ||
                                'Not provided'}
                            </Text>

                            {patient.emergency_contact_phone && (
                              <Text
                                style={
                                  styles.secondaryDataText
                                }
                              >
                                {patient.emergency_contact_phone}
                              </Text>
                            )}

                          </View>

                          {/* BIOMETRIC */}

                          <View
                            style={
                              styles.biometricColumn
                            }
                          >

                            <View
                              style={[
                                styles.statusBadge,
                                patient.biometric_enrolled
                                  ? styles.assignedBadge
                                  : styles.unassignedBadge,
                              ]}
                            >

                              <View
                                style={[
                                  styles.statusDot,
                                  patient.biometric_enrolled
                                    ? styles.assignedDot
                                    : styles.unassignedDot,
                                ]}
                              />

                              <Text
                                style={[
                                  styles.statusText,
                                  patient.biometric_enrolled
                                    ? styles.assignedText
                                    : styles.unassignedText,
                                ]}
                              >
                                {patient.biometric_enrolled
                                  ? 'Enrolled'
                                  : 'Not Enrolled'}
                              </Text>

                            </View>

                          </View>

                          {/* VERIFIED */}

                          <View
                            style={
                              styles.verifiedColumn
                            }
                          >

                            <View
                              style={[
                                styles.statusBadge,
                                patient.identity_verified
                                  ? styles.assignedBadge
                                  : styles.unassignedBadge,
                              ]}
                            >

                              <View
                                style={[
                                  styles.statusDot,
                                  patient.identity_verified
                                    ? styles.assignedDot
                                    : styles.unassignedDot,
                                ]}
                              />

                              <Text
                                style={[
                                  styles.statusText,
                                  patient.identity_verified
                                    ? styles.assignedText
                                    : styles.unassignedText,
                                ]}
                              >
                                {patient.identity_verified
                                  ? 'Verified'
                                  : 'Unverified'}
                              </Text>

                            </View>

                          </View>

                          {/* CREATED */}

                          <View
                            style={
                              styles.dateColumn
                            }
                          >

                            <Text
                              style={
                                styles.dateText
                              }
                            >
                              {patient.created}
                            </Text>

                          </View>

                          {/* ACTION */}

                          <View
                            style={
                              styles.actionColumn
                            }
                          >

                            <Pressable
                              style={
                                styles.openFileButton
                              }
                              onPress={() =>
                                openPatientFile(
                                  patient
                                )
                              }
                            >

                              <Text
                                style={
                                  styles.openFileButtonText
                                }
                              >
                                Open File
                              </Text>

                            </Pressable>

                          </View>

                        </View>

                      )
                    )}

                    {filteredPatients.length ===
                      0 && (

                      <View
                        style={
                          styles.emptyState
                        }
                      >

                        <Text
                          style={
                            styles.emptyIcon
                          }
                        >
                          ⌕
                        </Text>

                        <Text
                          style={
                            styles.emptyTitle
                          }
                        >
                          No patient files found
                        </Text>

                        <Text
                          style={
                            styles.emptyText
                          }
                        >
                          {search
                            ? 'Try searching by file number, ID number, first name or last name.'
                            : 'No patients have been registered yet.'}
                        </Text>

                      </View>

                    )}

                  </View>

                </ScrollView>

              </View>

              {/* PATIENT FILE INFORMATION */}

              <View
                style={
                  styles.patientInfoBanner
                }
              >

                <View
                  style={
                    styles.patientInfoIcon
                  }
                >

                  <Text
                    style={
                      styles.patientInfoIconText
                    }
                  >
                    ▤
                  </Text>

                </View>

                <View
                  style={
                    styles.patientInfoText
                  }
                >

                  <Text
                    style={
                      styles.patientInfoTitle
                    }
                  >
                    Patient Files & Encounters
                  </Text>

                  <Text
                    style={
                      styles.patientInfoDescription
                    }
                  >
                    Patient files provide identification and demographic information. Clinical care is organised through patient encounters, allowing different healthcare workers to participate in a patient's care without assigning permanent ownership of the patient.
                  </Text>

                </View>

              </View>

              {/* FOOTER */}

              <View
                style={
                  styles.footer
                }
              >

                <Text
                  style={
                    styles.footerText
                  }
                >
                  CARELINK Electronic Health Records System
                </Text>

                <Text
                  style={
                    styles.footerText
                  }
                >
                  Department of Health – Republic of South Africa
                </Text>

              </View>

            </>

          )}

        </ScrollView>

      </View>

      {/* =========================
          ADD PATIENT MODAL
      ========================= */}

      <Modal
        visible={
          showAddPatient
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowAddPatient(
            false
          )
        }
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={
              styles.modal
            }
          >

            <View
              style={
                styles.modalHeader
              }
            >

              <View>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Register New Patient
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Create a new CARELINK patient file
                </Text>

              </View>

              <Pressable
                onPress={() =>
                  setShowAddPatient(
                    false
                  )
                }
              >

                <Text
                  style={
                    styles.closeButton
                  }
                >
                  ×
                </Text>

              </Pressable>

            </View>

            <View
              style={
                styles.modalPrivacyNotice
              }
            >

              <Text
                style={
                  styles.modalPrivacyTitle
                }
              >
                🔒 Restricted Information
              </Text>

              <Text
                style={
                  styles.modalPrivacyText
                }
              >
                Registration information is used only to create the patient file. The patient can later be identified using the generated file number and other approved identification information.
              </Text>

            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              First Name
            </Text>

            <TextInput
              value={
                patientFirstName
              }
              onChangeText={
                setPatientFirstName
              }
              placeholder="Enter first name"
              placeholderTextColor="#94A3B8"
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Last Name
            </Text>

            <TextInput
              value={
                patientLastName
              }
              onChangeText={
                setPatientLastName
              }
              placeholder="Enter last name"
              placeholderTextColor="#94A3B8"
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              South African ID Number
            </Text>

            <TextInput
              value={
                patientIdNumber
              }
              onChangeText={
                setPatientIdNumber
              }
              placeholder="Enter ID number"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              secureTextEntry
              style={
                styles.input
              }
            />

            <View
              style={
                styles.modalButtons
              }
            >

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
                onPress={
                  addPatient
                }
              >

                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  Create Patient File
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* =========================
          PATIENT FILE MODAL
      ========================= */}

      <Modal
        visible={
          showPatientFile
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowPatientFile(
            false
          )
        }
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={
              styles.patientFileModal
            }
          >

            {/* HEADER */}

            <View
              style={
                styles.modalHeader
              }
            >

              <View>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Patient File
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Patient identification and encounter history
                </Text>

              </View>

              <Pressable
                onPress={() =>
                  setShowPatientFile(
                    false
                  )
                }
              >

                <Text
                  style={
                    styles.closeButton
                  }
                >
                  ×
                </Text>

              </Pressable>

            </View>

            {selectedPatient && (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                style={
                  styles.patientFileScroll
                }
              >

                {/* PATIENT HEADER */}

                <View
                  style={
                    styles.patientFileHeader
                  }
                >

                  <View
                    style={
                      styles.patientFileIcon
                    }
                  >

                    <Text
                      style={
                        styles.patientFileIconText
                      }
                    >
                      ▤
                    </Text>

                  </View>

                  <View
                    style={
                      styles.patientFileHeaderInfo
                    }
                  >

                    <Text
                      style={
                        styles.patientFileName
                      }
                    >
                      {selectedPatient.first_name}{' '}
                      {selectedPatient.last_name}
                    </Text>

                    <Text
                      style={
                        styles.patientFileNumber
                      }
                    >
                      {selectedPatient.file_number ??
                        'File Number Not Assigned'}
                    </Text>

                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      selectedPatient.biometric_enrolled
                        ? styles.assignedBadge
                        : styles.unassignedBadge,
                    ]}
                  >

                    <View
                      style={[
                        styles.statusDot,
                        selectedPatient.biometric_enrolled
                          ? styles.assignedDot
                          : styles.unassignedDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        selectedPatient.biometric_enrolled
                          ? styles.assignedText
                          : styles.unassignedText,
                      ]}
                    >
                      {selectedPatient.biometric_enrolled
                        ? 'Biometric Enrolled'
                        : 'Biometric Not Enrolled'}
                    </Text>

                  </View>

                </View>

                {/* DEMOGRAPHICS */}

                <View
                  style={
                    styles.fileSection
                  }
                >

                  <Text
                    style={
                      styles.fileSectionTitle
                    }
                  >
                    Patient Information
                  </Text>

                  <View
                    style={
                      styles.fileGrid
                    }
                  >

                    <PatientFileField
                      label="ID NUMBER"
                      value={
                        selectedPatient.id_number
                      }
                    />

                    <PatientFileField
                      label="DATE OF BIRTH"
                      value={
                        selectedPatient.date_of_birth
                          ? new Date(
                              `${selectedPatient.date_of_birth}T00:00:00`
                            ).toLocaleDateString(
                              'en-GB',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : 'Not provided'
                      }
                    />

                    <PatientFileField
                      label="GENDER"
                      value={
                        selectedPatient.gender ??
                        'Not provided'
                      }
                    />

                    <PatientFileField
                      label="PHONE"
                      value={
                        selectedPatient.phone_number ??
                        'Not provided'
                      }
                    />

                    <PatientFileField
                      label="ADDRESS"
                      value={
                        selectedPatient.address ??
                        'Not provided'
                      }
                    />

                    <PatientFileField
                      label="REGISTERED"
                      value={
                        selectedPatient.created
                      }
                    />

                  </View>

                </View>

                {/* EMERGENCY CONTACT */}

                <View
                  style={
                    styles.fileSection
                  }
                >

                  <Text
                    style={
                      styles.fileSectionTitle
                    }
                  >
                    Emergency Contact
                  </Text>

                  <View
                    style={
                      styles.emergencyFileCard
                    }
                  >

                    <Text
                      style={
                        styles.emergencyName
                      }
                    >
                      {selectedPatient.emergency_contact_name ??
                        'Not provided'}
                    </Text>

                    <Text
                      style={
                        styles.emergencyPhone
                      }
                    >
                      {selectedPatient.emergency_contact_phone ??
                        'No phone number provided'}
                    </Text>

                  </View>

                </View>

                {/* IDENTITY & BIOMETRIC STATUS */}

                <View
                  style={
                    styles.fileSection
                  }
                >

                  <Text
                    style={
                      styles.fileSectionTitle
                    }
                  >
                    Identity & Biometric
                  </Text>

                  <View
                    style={
                      styles.fileGrid
                    }
                  >

                    <PatientFileField
                      label="IDENTITY VERIFIED"
                      value={
                        selectedPatient.identity_verified
                          ? '✅ Verified'
                          : '❌ Not Verified'
                      }
                    />

                    <PatientFileField
                      label="BIOMETRIC ENROLLMENT"
                      value={
                        selectedPatient.biometric_enrolled
                          ? `✅ Enrolled${selectedPatient.biometric_enrolled_at ? ' on ' + new Date(selectedPatient.biometric_enrolled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}`
                          : '❌ Not Enrolled'
                      }
                    />

                  </View>

                </View>

                {/* ACTION BUTTONS */}

                <View
                  style={
                    styles.actionButtonsContainer
                  }
                >

                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.editButton,
                    ]}
                    onPress={() =>
                      openEditPatient(
                        selectedPatient
                      )
                    }
                  >

                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      ✎ Edit Patient
                    </Text>

                  </Pressable>

                  {!selectedPatient.identity_verified && (
                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.verifyButton,
                      ]}
                      onPress={() =>
                        verifyPatientIdentity(
                          selectedPatient.id
                        )
                      }
                    >

                      <Text
                        style={
                          styles.actionButtonText
                        }
                      >
                        ✓ Verify Identity
                      </Text>

                    </Pressable>
                  )}

                  {!selectedPatient.biometric_enrolled && (
                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.biometricButton,
                      ]}
                      onPress={() =>
                        enrollBiometric(
                          selectedPatient.id
                        )
                      }
                    >

                      <Text
                        style={
                          styles.actionButtonText
                        }
                      >
                        ◉ Enroll Biometric
                      </Text>

                    </Pressable>
                  )}

                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.encounterButton,
                    ]}
                    onPress={() =>
                      openStartEncounter(
                        selectedPatient
                      )
                    }
                  >

                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      ▶ Start Encounter
                    </Text>

                  </Pressable>

                </View>

                {/* ENCOUNTERS */}

                <View
                  style={
                    styles.fileSection
                  }
                >

                  <View
                    style={
                      styles.encounterHeader
                    }
                  >

                    <View>

                      <Text
                        style={
                          styles.fileSectionTitle
                        }
                      >
                        Patient Encounters
                      </Text>

                      <Text
                        style={
                          styles.fileSectionSubtitle
                        }
                      >
                        Previous and active healthcare visits
                      </Text>

                    </View>

                    <View
                      style={
                        styles.encounterCountBadge
                      }
                    >

                      <Text
                        style={
                          styles.encounterCountText
                        }
                      >
                        {patientEncounters.length}
                      </Text>

                    </View>

                  </View>

                  {loadingPatientFile ? (

                    <View
                      style={
                        styles.encounterEmptyState
                      }
                    >

                      <Text
                        style={
                          styles.emptyText
                        }
                      >
                        Loading patient encounters...
                      </Text>

                    </View>

                  ) : patientEncounters.length ===
                    0 ? (

                    <View
                      style={
                        styles.encounterEmptyState
                      }
                    >

                      <Text
                        style={
                          styles.emptyIcon
                        }
                      >
                        ◉
                      </Text>

                      <Text
                        style={
                          styles.emptyTitle
                        }
                      >
                        No encounters found
                      </Text>

                      <Text
                        style={
                          styles.emptyText
                        }
                      >
                        This patient has not had any recorded healthcare encounters yet.
                      </Text>

                    </View>

                  ) : (

                    patientEncounters.map(
                      (encounter) => (

                        <View
                          key={
                            encounter.id
                          }
                          style={
                            styles.encounterCard
                          }
                        >

                          <View
                            style={
                              styles.encounterTopRow
                            }
                          >

                            <View
                              style={
                                styles.encounterDate
                              }
                            >

                              <Text
                                style={
                                  styles.encounterDateText
                                }
                              >
                                {new Date(
                                  encounter.check_in_at
                                ).toLocaleDateString(
                                  'en-GB',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )}
                              </Text>

                              <Text
                                style={
                                  styles.encounterTimeText
                                }
                              >
                                {new Date(
                                  encounter.check_in_at
                                ).toLocaleTimeString(
                                  'en-GB',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </Text>

                            </View>

                            <View
                              style={[
                                styles.encounterStatus,
                                encounter.status ===
                                  'active'
                                  ? styles.activeEncounterStatus
                                  : styles.closedEncounterStatus,
                              ]}
                            >

                              <Text
                                style={[
                                  styles.encounterStatusText,
                                  encounter.status ===
                                    'active'
                                    ? styles.activeEncounterText
                                    : styles.closedEncounterText,
                                ]}
                              >
                                {encounter.status
                                  .charAt(0)
                                  .toUpperCase() +
                                  encounter.status.slice(
                                    1
                                  )}
                              </Text>

                            </View>

                          </View>

                          <View
                            style={
                              styles.encounterDetails
                            }
                          >

                            <PatientFileField
                              label="FACILITY"
                              value={
                                encounter.facility_name
                              }
                            />

                            <PatientFileField
                              label="DEPARTMENT"
                              value={
                                encounter.department ??
                                'Not specified'
                              }
                            />

                            <PatientFileField
                              label="REASON"
                              value={
                                encounter.reason ??
                                'Not specified'
                              }
                            />

                            <PatientFileField
                              label="HEALTHCARE WORKER"
                              value={
                                encounter.healthcare_worker_name
                              }
                            />

                          </View>

                          <View
                            style={
                              styles.encounterFooter
                            }
                          >

                            <Text
                              style={
                                styles.encounterFooterText
                              }
                            >
                              Check-in:{' '}
                              {new Date(
                                encounter.check_in_at
                              ).toLocaleString(
                                'en-GB'
                              )}
                            </Text>

                            {encounter.check_out_at && (
                              <Text
                                style={
                                  styles.encounterFooterText
                                }
                              >
                                Check-out:{' '}
                                {new Date(
                                  encounter.check_out_at
                                ).toLocaleString(
                                  'en-GB'
                                )}
                              </Text>
                            )}

                          </View>

                        </View>

                      )
                    )

                  )}

                </View>

              </ScrollView>
            )}

          </View>

        </View>

      </Modal>

      {/* =========================
          EDIT PATIENT MODAL
      ========================= */}

      <Modal
        visible={showEditPatient}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditPatient(false)}
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modal}>

            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  Edit Patient
                </Text>

                <Text style={styles.modalSubtitle}>
                  {editingPatient?.first_name} {editingPatient?.last_name}
                </Text>

              </View>

              <Pressable onPress={() => setShowEditPatient(false)}>

                <Text style={styles.closeButton}>
                  ×
                </Text>

              </Pressable>

            </View>

            <View style={styles.modalPrivacyNotice}>

              <Text style={styles.modalPrivacyTitle}>
                ✎ Update Patient Information
              </Text>

              <Text style={styles.modalPrivacyText}>
                Update demographic and contact information. Clinical records are not affected by these changes.
              </Text>

            </View>

            <Text style={styles.inputLabel}>
              First Name
            </Text>

            <TextInput
              value={editFirstName}
              onChangeText={setEditFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Last Name
            </Text>

            <TextInput
              value={editLastName}
              onChangeText={setEditLastName}
              placeholder="Enter last name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Phone Number
            </Text>

            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Enter phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Address
            </Text>

            <TextInput
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Enter address"
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>
              Emergency Contact Name
            </Text>

            <TextInput
              value={editEmergencyName}
              onChangeText={setEditEmergencyName}
              placeholder="Enter emergency contact name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Emergency Contact Phone
            </Text>

            <TextInput
              value={editEmergencyPhone}
              onChangeText={setEditEmergencyPhone}
              placeholder="Enter emergency contact phone"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <View style={styles.modalButtons}>

              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowEditPatient(false)}
              >

                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>

              </Pressable>

              <Pressable
                style={[
                  styles.createButton,
                  (!editFirstName.trim() || !editLastName.trim()) &&
                    styles.disabledButton,
                ]}
                disabled={!editFirstName.trim() || !editLastName.trim()}
                onPress={savePatientEdit}
              >

                <Text style={styles.createButtonText}>
                  Save Changes
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* =========================
          START ENCOUNTER MODAL
      ========================= */}

      <Modal
        visible={showStartEncounter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStartEncounter(false)}
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modal}>

            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  Start New Encounter
                </Text>

                <Text style={styles.modalSubtitle}>
                  {selectedPatient?.first_name} {selectedPatient?.last_name}
                </Text>

              </View>

              <Pressable onPress={() => setShowStartEncounter(false)}>

                <Text style={styles.closeButton}>
                  ×
                </Text>

              </Pressable>

            </View>

            <View style={styles.modalPrivacyNotice}>

              <Text style={styles.modalPrivacyTitle}>
                🏥 New Patient Visit
              </Text>

              <Text style={styles.modalPrivacyText}>
                This will create a new active encounter for the patient. A healthcare worker will be assigned when they begin care.
              </Text>

            </View>

            <Text style={styles.inputLabel}>
              Facility
            </Text>

            <View style={styles.workerOptions}>

              {facilities.map((facility) => (

                <Pressable
                  key={facility.id}
                  style={[
                    styles.workerOption,
                    encounterFacility === facility.id &&
                      styles.selectedWorkerOption,
                  ]}
                  onPress={() => setEncounterFacility(facility.id)}
                >

                  <View
                    style={[
                      styles.radio,
                      encounterFacility === facility.id &&
                        styles.radioSelected,
                    ]}
                  >

                    {encounterFacility === facility.id && (
                      <View style={styles.radioInner} />
                    )}

                  </View>

                  <Text
                    style={[
                      styles.workerOptionText,
                      encounterFacility === facility.id &&
                        styles.selectedWorkerOptionText,
                    ]}
                  >
                    {facility.name}
                  </Text>

                </Pressable>

              ))}

            </View>

            <Text style={styles.inputLabel}>
              Department (Optional)
            </Text>

            <TextInput
              value={encounterDepartment}
              onChangeText={setEncounterDepartment}
              placeholder="Enter department"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>
              Reason for Visit
            </Text>

            <TextInput
              value={encounterReason}
              onChangeText={setEncounterReason}
              placeholder="Enter reason for visit"
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>

              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowStartEncounter(false)}
              >

                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>

              </Pressable>

              <Pressable
                style={[
                  styles.createButton,
                  (!encounterFacility || !encounterReason.trim()) &&
                    styles.disabledButton,
                ]}
                disabled={!encounterFacility || !encounterReason.trim()}
                onPress={createEncounter}
              >

                <Text style={styles.createButtonText}>
                  Start Encounter
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* =========================
          CREATE HEALTHCARE WORKER
      ========================= */}

      <Modal
        visible={
          showCreateWorker
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowCreateWorker(
            false
          )
        }
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={
              styles.modal
            }
          >

            <View
              style={
                styles.modalHeader
              }
            >

              <View>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Create Healthcare Worker
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Create a secure CARELINK staff account
                </Text>

              </View>

              <Pressable
                onPress={() =>
                  setShowCreateWorker(
                    false
                  )
                }
              >

                <Text
                  style={
                    styles.closeButton
                  }
                >
                  ×
                </Text>

              </Pressable>

            </View>

            <View
              style={
                styles.modalPrivacyNotice
              }
            >

              <Text
                style={
                  styles.modalPrivacyTitle
                }
              >
                🔒 Secure Staff Registration
              </Text>

              <Text
                style={
                  styles.modalPrivacyText
                }
              >
                The healthcare worker will receive an account with access based on their assigned role, department, and facility.
              </Text>

            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              First Name
            </Text>

            <TextInput
              value={
                workerFirstName
              }
              onChangeText={
                setWorkerFirstName
              }
              placeholder="Enter first name"
              placeholderTextColor="#94A3B8"
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Last Name
            </Text>

            <TextInput
              value={
                workerLastName
              }
              onChangeText={
                setWorkerLastName
              }
              placeholder="Enter last name"
              placeholderTextColor="#94A3B8"
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Email Address
            </Text>

            <TextInput
              value={
                workerEmail
              }
              onChangeText={
                setWorkerEmail
              }
              placeholder="Enter email address"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Temporary Password
            </Text>

            <TextInput
              value={
                workerPassword
              }
              onChangeText={
                setWorkerPassword
              }
              placeholder="Enter temporary password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Healthcare Role
            </Text>

            <View
              style={
                styles.workerOptions
              }
            >

              {workerRoles.map(
                (role) => (

                  <Pressable
                    key={
                      role.id
                    }
                    style={[
                      styles.workerOption,
                      workerRole ===
                        role.name &&
                        styles.selectedWorkerOption,
                    ]}
                    onPress={() => {
                      console.log(
                        'ROLE SELECTED:',
                        role.name
                      );

                      setWorkerRole(
                        role.name
                      );
                    }}
                  >

                    <Text
                      style={[
                        styles.workerOptionText,
                        workerRole ===
                          role.name &&
                          styles.selectedWorkerOptionText,
                      ]}
                    >
                      {role.name}
                    </Text>

                  </Pressable>

                )
              )}

            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              Department
            </Text>

            <TextInput
              value={
                workerDepartment
              }
              onChangeText={
                setWorkerDepartment
              }
              placeholder="Enter department (optional)"
              placeholderTextColor="#94A3B8"
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Facility
            </Text>

            <View
              style={
                styles.workerOptions
              }
            >

              {facilities.map(
                (facility) => (

                  <Pressable
                    key={
                      facility.id
                    }
                    style={[
                      styles.workerOption,
                      workerFacility ===
                        facility.id &&
                        styles.selectedWorkerOption,
                    ]}
                    onPress={() =>
                      setWorkerFacility(
                        facility.id
                      )
                    }
                  >

                    <View
                      style={[
                        styles.radio,
                        workerFacility ===
                          facility.id &&
                          styles.radioSelected,
                      ]}
                    >

                      {workerFacility ===
                        facility.id && (
                        <View
                          style={
                            styles.radioInner
                          }
                        />
                      )}

                    </View>

                    <Text
                      style={[
                        styles.workerOptionText,
                        workerFacility ===
                          facility.id &&
                          styles.selectedWorkerOptionText,
                      ]}
                    >
                      {facility.name}
                    </Text>

                  </Pressable>

                )
              )}

            </View>

            <View
              style={
                styles.modalButtons
              }
            >

              <Pressable
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setShowCreateWorker(
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
                style={[
                  styles.createButton,
                  (
                    !workerFirstName.trim() ||
                    !workerLastName.trim() ||
                    !workerEmail.trim() ||
                    !workerPassword ||
                    !workerRole ||
                    !workerFacility
                  ) &&
                    styles.disabledButton,
                ]}
                disabled={false}
                onPress={
                  createHealthcareWorker
                }
              >

                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  Create Worker
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* SUCCESS MESSAGE */}

      {successMessage !== '' && (

        <View
          style={
            styles.successToast
          }
        >

          <View
            style={
              styles.successCircle
            }
          >

            <Text
              style={
                styles.successCheck
              }
            >
              ✓
            </Text>

          </View>

          <Text
            style={
              styles.successText
            }
          >
            {successMessage}
          </Text>

        </View>

      )}

    </View>
  );
}

/*
 * =========================
 * PATIENT FILE FIELD
 * =========================
 */

function PatientFileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.patientFileField
      }
    >

      <Text
        style={
          styles.patientFileFieldLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.patientFileFieldValue
        }
      >
        {value}
      </Text>

    </View>
  );
}

/*
 * =========================
 * HEALTHCARE WORKERS
 * =========================
 */

function HealthcareWorkersSection({
  healthcareWorkers,
  onCreateWorker,
}: {
  healthcareWorkers: HealthcareWorker[];
  onCreateWorker: () => void;
}) {
  return (
    <View
      style={
        styles.workerSection
      }
    >

      <View
        style={
          styles.pageHeader
        }
      >

        <View>

          <Text
            style={
              styles.pageTitle
            }
          >
            Healthcare Workers
          </Text>

          <Text
            style={
              styles.pageSubtitle
            }
          >
            Manage staff access, departments, and facilities
          </Text>

        </View>

        <Pressable
          style={
            styles.addPatientButton
          }
          onPress={
            onCreateWorker
          }
        >

          <Text
            style={
              styles.addPatientButtonText
            }
          >
            + Create Worker
          </Text>

        </Pressable>

      </View>

      <View
        style={
          styles.patientCard
        }
      >

        <View
          style={
            styles.cardHeader
          }
        >

          <View>

            <Text
              style={
                styles.cardTitle
              }
            >
              Workers
            </Text>

            <Text
              style={
                styles.cardSubtitle
              }
            >
              Active staff roster
            </Text>

          </View>

        </View>

        {healthcareWorkers.length ===
        0 ? (

          <View
            style={
              styles.emptyState
            }
          >

            <Text
              style={
                styles.emptyIcon
              }
            >
              ♙
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No healthcare workers found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Create a worker profile to manage roles and facilities.
            </Text>

          </View>

        ) : (

          healthcareWorkers.map(
            (worker) => (

              <View
                key={
                  worker.id
                }
                style={
                  styles.workerRow
                }
              >

                <View
                  style={
                    styles.workerAvatar
                  }
                >

                  <Text
                    style={
                      styles.workerAvatarText
                    }
                  >
                    {worker.first_name.charAt(
                      0
                    ) || 'W'}

                    {worker.last_name.charAt(
                      0
                    ) || ''}
                  </Text>

                </View>

                <View
                  style={
                    styles.workerInfo
                  }
                >

                  <Text
                    style={
                      styles.workerName
                    }
                  >
                    {worker.first_name}{' '}
                    {worker.last_name}
                  </Text>

                  <Text
                    style={
                      styles.workerMeta
                    }
                  >
                    {worker.role} •{' '}
                    {worker.facility ||
                      'No facility'}
                  </Text>

                </View>

                <View
                  style={[
                    styles.statusBadge,
                    worker.active
                      ? styles.assignedBadge
                      : styles.unassignedBadge,
                  ]}
                >

                  <View
                    style={[
                      styles.statusDot,
                      worker.active
                        ? styles.assignedDot
                        : styles.unassignedDot,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      worker.active
                        ? styles.assignedText
                        : styles.unassignedText,
                    ]}
                  >
                    {worker.active
                      ? 'Active'
                      : 'Inactive'}
                  </Text>

                </View>

              </View>

            )
          )

        )}

      </View>

    </View>
  );
}

/*
 * =========================
 * ADMIN STAT
 * =========================
 */

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
    <View
      style={
        styles.statCard
      }
    >

      <View
        style={[
          styles.statIcon,
          {
            backgroundColor:
              background,
          },
        ]}
      >

        <Text
          style={[
            styles.statIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>

      </View>

      <Text
        style={
          styles.statNumber
        }
      >
        {number}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>

      <Text
        style={[
          styles.statDetail,
          {
            color,
          },
        ]}
      >
        {detail}
      </Text>

    </View>
  );
}

/*
 * =========================
 * STYLES
 * =========================
 */

const styles = StyleSheet.create({

  appContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },

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

  main: {
    flex: 1,
    minWidth: 0,
  },

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

  patientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    padding: 20,
  },

  workerSection: {
    gap: 18,
  },

  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  workerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  workerAvatarText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },

  workerInfo: {
    flex: 1,
  },

  workerName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  workerMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
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

  /*
   * TABLE
   */

  tableContainer: {
    minWidth: 1450,
  },

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
    width: 150,
  },

  patientColumn: {
    width: 150,
  },

  idColumn: {
    width: 145,
  },

  dateOfBirthColumn: {
    width: 120,
  },

  genderColumn: {
    width: 90,
  },

  phoneColumn: {
    width: 130,
  },

  addressColumn: {
    width: 140,
  },

  emergencyColumn: {
    width: 160,
  },

  biometricColumn: {
    width: 125,
  },

  verifiedColumn: {
    width: 115,
  },

  dateColumn: {
    width: 110,
  },

  actionColumn: {
    width: 135,
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

  patientNameText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },

  patientDataText: {
    color: '#475569',
    fontSize: 10,
  },

  secondaryDataText: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 3,
  },

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

  openFileButton: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  openFileButtonText: {
    color: '#1D4ED8',
    fontSize: 9,
    fontWeight: '700',
  },

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
    textAlign: 'center',
  },

  /*
   * PATIENT INFORMATION BANNER
   */

  patientInfoBanner: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  patientInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  patientInfoIconText: {
    color: '#2563EB',
    fontSize: 19,
  },

  patientInfoText: {
    flex: 1,
    marginLeft: 12,
  },

  patientInfoTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  patientInfoDescription: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  footer: {
    alignItems: 'center',
    marginTop: 30,
  },

  footerText: {
    color: '#94A3B8',
    fontSize: 9,
    marginBottom: 3,
  },

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

  patientFileModal: {
    width: '100%',
    maxWidth: 850,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },

  patientFileScroll: {
    flexGrow: 0,
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

  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },

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

  /*
   * PATIENT FILE
   */

  patientFileHeader: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  patientFileIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  patientFileIconText: {
    color: '#2563EB',
    fontSize: 20,
  },

  patientFileHeaderInfo: {
    flex: 1,
    marginLeft: 13,
  },

  patientFileName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },

  patientFileNumber: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  fileSection: {
    marginBottom: 20,
  },

  fileSectionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },

  fileSectionSubtitle: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: -6,
    marginBottom: 10,
  },

  fileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    overflow: 'hidden',
  },

  patientFileField: {
    width: '50%',
    padding: 11,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F1F5F9',
  },

  patientFileFieldLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  patientFileFieldValue: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },

  emergencyFileCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    padding: 13,
  },

  emergencyName: {
    color: '#9A3412',
    fontSize: 11,
    fontWeight: '700',
  },

  emergencyPhone: {
    color: '#C2410C',
    fontSize: 10,
    marginTop: 4,
  },

  encounterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  encounterCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  encounterCountText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
  },

  encounterCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },

  encounterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  encounterDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  encounterDateText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
  },

  encounterTimeText: {
    color: '#94A3B8',
    fontSize: 9,
    marginLeft: 8,
  },

  encounterStatus: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  activeEncounterStatus: {
    backgroundColor: '#ECFDF5',
  },

  closedEncounterStatus: {
    backgroundColor: '#F1F5F9',
  },

  encounterStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  activeEncounterText: {
    color: '#047857',
  },

  closedEncounterText: {
    color: '#475569',
  },

  encounterDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  encounterFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 5,
    paddingTop: 8,
  },

  encounterFooterText: {
    color: '#94A3B8',
    fontSize: 8,
    marginBottom: 3,
  },

  encounterEmptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  editButton: {
    backgroundColor: '#2563EB',
  },

  verifyButton: {
    backgroundColor: '#059669',
  },

  biometricButton: {
    backgroundColor: '#7C3AED',
  },

  encounterButton: {
    backgroundColor: '#EA580C',
  },

  /*
   * SUCCESS MESSAGE
   */

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

  /*
   * WORKER OPTIONS
   */

  workerOptions: {
    marginBottom: 10,
  },

  workerOption: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  selectedWorkerOption: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  workerOptionText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },

  selectedWorkerOptionText: {
    color: '#1D4ED8',
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

});