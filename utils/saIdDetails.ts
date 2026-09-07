export type SAIdDetails = {
  dateOfBirth: string;
  gender: 'Male' | 'Female';
};

export const getSAIdDetails = (idNumber: string): SAIdDetails | null => {
  if (!/^\d{13}$/.test(idNumber)) {
    return null;
  }

  const year = Number(idNumber.substring(0, 2));
  const month = Number(idNumber.substring(2, 4));
  const day = Number(idNumber.substring(4, 6));

  const currentYear = new Date().getFullYear() % 100;

  const fullYear =
    year <= currentYear
      ? 2000 + year
      : 1900 + year;

  const date = new Date(fullYear, month - 1, day);

  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const genderNumber = Number(idNumber.substring(6, 10));

  const gender: 'Male' | 'Female' =
    genderNumber >= 5000 ? 'Male' : 'Female';

  const dateOfBirth = `${fullYear}-${String(month).padStart(
    2,
    '0'
  )}-${String(day).padStart(2, '0')}`;

  return {
    dateOfBirth,
    gender,
  };
};