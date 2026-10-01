/**
 * Utility functions for CPF Masking, Normalization, Security, and Mathematical Validation.
 * Follows the official Brazilian Receita Federal algorithm (DVs calculation).
 */

/**
 * Strips all non-numeric characters from the CPF string.
 */
export function cleanCpf(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).replace(/\D/g, "").slice(0, 11);
}

/**
 * Progressively masks a CPF as the user types or pastes.
 * Works seamlessly with mobile, paste, deletions, and standard inputs.
 * Example: '12345678901' -> '123.456.789-01'
 */
export function maskCpf(value: string | null | undefined): string {
  if (!value) return "";
  
  const numbers = String(value).replace(/\D/g, "").slice(0, 11);
  
  if (numbers.length <= 3) {
    return numbers;
  }
  if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  }
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Formats a clean 11-digit CPF into standard format 000.000.000-00.
 */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = cleanCpf(value);
  if (cleaned.length !== 11) return value; // Return original if not full 11 digits
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

/**
 * Masks CPF for secure display (Privacy / LGPD compliant).
 * Example: '12345678901' -> '***.456.789-**'
 */
export function maskCpfPrivacy(value: string | null | undefined): string {
  if (!value) return "---";
  const cleaned = cleanCpf(value);
  if (cleaned.length !== 11) return value || "---";
  return `***.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-**`;
}

/**
 * Validates a Brazilian CPF using the official check-digit algorithm.
 * Rejects:
 * - Non-11 digit lengths
 * - Identical sequences (111.111.111-11, 222.222.222-22, etc.)
 * - Invalid check digits (DV1 & DV2)
 */
export function validateCpf(cpf: string | null | undefined): { isValid: boolean; error?: string } {
  if (!cpf || String(cpf).trim() === "") {
    return { isValid: false, error: "CPF é obrigatório." };
  }

  const cleaned = cleanCpf(cpf);

  // Check length
  if (cleaned.length !== 11) {
    return { isValid: false, error: "CPF incompleto. Deve conter exatamente 11 dígitos numéricos." };
  }

  // Reject sequences of all identical digits (00000000000, 11111111111, ..., 99999999999)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, error: "CPF inválido. Verifique os números informados." };
  }

  // Validate 1st Check Digit (DV 1)
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let remainder1 = (sum1 * 10) % 11;
  let checkDigit1 = remainder1 === 10 || remainder1 === 11 ? 0 : remainder1;

  if (checkDigit1 !== parseInt(cleaned.charAt(9), 10)) {
    return { isValid: false, error: "CPF inválido. Verifique os números informados." };
  }

  // Validate 2nd Check Digit (DV 2)
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  let remainder2 = (sum2 * 10) % 11;
  let checkDigit2 = remainder2 === 10 || remainder2 === 11 ? 0 : remainder2;

  if (checkDigit2 !== parseInt(cleaned.charAt(10), 10)) {
    return { isValid: false, error: "CPF inválido. Verifique os números informados." };
  }

  return { isValid: true };
}

/**
 * Generates a valid 11-digit CPF string for tests, seed, or auto-generation.
 */
export function generateValidCpf(): string {
  const digits: number[] = [];
  for (let i = 0; i < 9; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }

  // Calculate 1st Check Digit
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += digits[i] * (10 - i);
  }
  let rem1 = (sum1 * 10) % 11;
  const dv1 = rem1 === 10 || rem1 === 11 ? 0 : rem1;
  digits.push(dv1);

  // Calculate 2nd Check Digit
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += digits[i] * (11 - i);
  }
  let rem2 = (sum2 * 10) % 11;
  const dv2 = rem2 === 10 || rem2 === 11 ? 0 : rem2;
  digits.push(dv2);

  return digits.join("");
}
