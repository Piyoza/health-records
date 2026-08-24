export function isValidSouthAfricanId(
  idNumber: string
): boolean {
  const id = idNumber.replace(/\s/g, '');

  // Must contain exactly 13 digits
  if (!/^\d{13}$/.test(id)) {
    return false;
  }

  // --------------------------------------------------
  // 1. Validate date of birth
  // YYMMDD
  // --------------------------------------------------

  const year = Number(id.substring(0, 2));
  const month = Number(id.substring(2, 4));
  const day = Number(id.substring(4, 6));

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  // --------------------------------------------------
  // 2. Validate citizenship/status digit
  // --------------------------------------------------

  const citizenshipDigit = Number(id[10]);

  if (
    citizenshipDigit !== 0 &&
    citizenshipDigit !== 1
  ) {
    return false;
  }

  // --------------------------------------------------
  // 3. Validate Luhn checksum
  // --------------------------------------------------

  let sum = 0;

  // Add digits in odd positions
  // positions 1,3,5,7,9,11
  for (let i = 0; i < 12; i += 2) {
    sum += Number(id[i]);
  }

  // Take even-position digits
  let evenDigits = '';

  for (let i = 1; i < 12; i += 2) {
    evenDigits += id[i];
  }

  // Multiply the even-position number by 2
  const doubled = String(
    Number(evenDigits) * 2
  );

  // Add all digits of the doubled number
  for (const digit of doubled) {
    sum += Number(digit);
  }

  const checksum = (10 - (sum % 10)) % 10;

  return checksum === Number(id[12]);
}