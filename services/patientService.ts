import { supabase } from '../lib/supabase';

type CreatePatientInput = {
  first_name: string;
  last_name: string;
  id_number: string;
  date_of_birth: string;
  gender: 'Male' | 'Female';
};

export const createPatient = async (patient: CreatePatientInput) => {
  const { data, error } = await supabase
    .from('patients')
   .insert({
  first_name: patient.first_name,
  last_name: patient.last_name,
  id_number: patient.id_number,
  date_of_birth: patient.date_of_birth,
  gender: patient.gender,
})
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};