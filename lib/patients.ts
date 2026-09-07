import { supabase } from './supabase';

/**
 * Search for patients using:
 * - Patient number
 * - First name
 * - Last name
 */
export async function searchPatients(searchTerm: string) {
  const term = searchTerm.trim();

  if (!term) {
    return [];
  }

  const { data, error } = await supabase
    .from('patients')
    .select(`
      id,
      patient_number,
      first_name,
      last_name,
      date_of_birth,
      gender
    `)
    .or(
      `patient_number.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
    )
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}


/**
 * Get one patient using their UUID.
 */
export async function getPatientById(patientId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      id,
      patient_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      address,
      emergency_contact_name,
      emergency_contact_phone
    `)
    .eq('id', patientId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}