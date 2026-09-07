import { supabase } from '../supabase';

export type CreatePatientInput = {
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

export async function createPatient(
  patient: CreatePatientInput
) {
  // Basic validation
  if (!patient.patient_number.trim()) {
    throw new Error('Patient number is required.');
  }

  if (!patient.first_name.trim()) {
    throw new Error('First name is required.');
  }

  if (!patient.last_name.trim()) {
    throw new Error('Last name is required.');
  }

  const { data, error } = await supabase
    .from('patients')
    .insert({
      patient_number: patient.patient_number.trim(),
      first_name: patient.first_name.trim(),
      last_name: patient.last_name.trim(),
      date_of_birth: patient.date_of_birth ?? null,
      gender: patient.gender ?? null,
      phone: patient.phone ?? null,
      address: patient.address ?? null,
      emergency_contact_name:
        patient.emergency_contact_name ?? null,
      emergency_contact_phone:
        patient.emergency_contact_phone ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('CREATE PATIENT ERROR:', error);
    throw error;
  }

  return data;
}