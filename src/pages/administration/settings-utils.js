// Form values are strings while typing; compare and validate as numbers.
export const toStrings = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === 'boolean' ? v : String(v ?? '')]));

export const isDirty = (form, initial) => JSON.stringify(form) !== JSON.stringify(initial);

// `rules`: { key: { min, max, whole, label } } → { key: message }
export function validateNumbers(form, rules) {
  const errors = {};
  Object.entries(rules).forEach(([key, { min, max, whole }]) => {
    const raw = form[key];
    const n = Number(raw);
    if (raw === '' || Number.isNaN(n)) errors[key] = 'Enter a number';
    else if (whole && !Number.isInteger(n)) errors[key] = 'Use a whole number';
    else if (min !== undefined && n < min) errors[key] = `Must be at least ${min}`;
    else if (max !== undefined && n > max) errors[key] = `Must be ${max} or less`;
  });
  return errors;
}
