import { validateCpf, maskCpf, cleanCpf, generateValidCpf, formatCpf } from "./src/utils/cpf.ts";

console.log("=== EXECUTING CPF VALIDATION AND MASK SUITE ===");

// 1. Test Known Valid CPFs
const validCpf1 = "52998224725";
const validCpf2 = generateValidCpf();
const validCpfWithMask = "529.982.247-25";

console.assert(validateCpf(validCpf1).isValid === true, `Test 1 Failed for ${validCpf1}`);
console.assert(validateCpf(validCpf2).isValid === true, `Test 2 Failed for generated ${validCpf2}`);
console.assert(validateCpf(validCpfWithMask).isValid === true, `Test 3 Failed for ${validCpfWithMask}`);
console.log("✓ Valid CPFs passed");

// 2. Test Invalid Check Digits
const invalidCheckDigit = "52998224720"; // last digit altered
const resInvalid = validateCpf(invalidCheckDigit);
console.assert(resInvalid.isValid === false, `Test 4 Failed for ${invalidCheckDigit}`);
console.assert(resInvalid.error === "CPF inválido. Verifique os números informados.", "Test 4 Error Message Mismatch");
console.log("✓ Invalid check digits rejected");

// 3. Test Repeated Digits
const repeatedList = [
  "00000000000",
  "11111111111",
  "22222222222",
  "333.333.333-33",
  "44444444444",
  "55555555555",
  "66666666666",
  "77777777777",
  "88888888888",
  "999.999.999-99"
];

for (const rep of repeatedList) {
  const r = validateCpf(rep);
  console.assert(r.isValid === false, `Repeated digit test failed for ${rep}`);
}
console.log("✓ Repeated identical digits rejected");

// 4. Test Incomplete & Letters
console.assert(validateCpf("123456").isValid === false, "Incomplete length test failed");
console.assert(validateCpf("123.456.789").isValid === false, "Incomplete masked length test failed");
console.assert(validateCpf("abc.def.ghi-jk").isValid === false, "Letters only test failed");
console.log("✓ Incomplete and lettered CPFs rejected");

// 5. Test Masking Behavior
console.assert(maskCpf("1") === "1", "Mask 1 failed");
console.assert(maskCpf("123") === "123", "Mask 3 failed");
console.assert(maskCpf("1234") === "123.4", "Mask 4 failed");
console.assert(maskCpf("123456") === "123.456", "Mask 6 failed");
console.assert(maskCpf("1234567") === "123.456.7", "Mask 7 failed");
console.assert(maskCpf("123456789") === "123.456.789", "Mask 9 failed");
console.assert(maskCpf("1234567890") === "123.456.789-0", "Mask 10 failed");
console.assert(maskCpf("12345678901") === "123.456.789-01", "Mask 11 failed");
console.assert(maskCpf("123.456.789-01") === "123.456.789-01", "Mask idempotency failed");
console.assert(maskCpf("123abc456def789gh01") === "123.456.789-01", "Mask with letters stripping failed");
console.log("✓ Masking progressive and paste formatting passed");

// 6. Test Normalization (Cleaning)
console.assert(cleanCpf("123.456.789-01") === "12345678901", "Clean test failed");
console.assert(formatCpf("12345678901") === "123.456.789-01", "Format test failed");
console.log("✓ Normalization passed");

console.log("=== ALL CPF UNIT TESTS PASSED ===");
