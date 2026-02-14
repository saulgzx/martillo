export function normalizeRut(value: string): string {
  return value.replace(/\./g, '').replace(/-/g, '').toUpperCase();
}

export function isValidChileanRut(value: string): boolean {
  const clean = normalizeRut(value);
  if (clean.length < 2) {
    return false;
  }

  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);

  if (!/^\d+$/.test(body)) {
    return false;
  }

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const computedVerifier = remainder === 11 ? '0' : remainder === 10 ? 'K' : remainder.toString();

  return verifier === computedVerifier;
}
