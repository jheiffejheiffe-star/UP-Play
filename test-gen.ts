import { generateValidCpf, formatCpf, validateCpf } from "./src/utils/cpf.ts";

for (let i = 0; i < 6; i++) {
  const c = generateValidCpf();
  const f = formatCpf(c);
  console.log(`Generated: ${f} -> Valid: ${validateCpf(f).isValid}`);
}
