import { validateCpf } from "./src/utils/cpf.ts";

const list = [
  "529.982.247-25",
  "704.853.190-33",
  "061.328.749-00",
  "839.152.640-79"
];

for (const c of list) {
  const v = validateCpf(c);
  console.log(c, v);
  console.assert(v.isValid === true);
}
