/**
 * Password validation rules
 *
 * Used by FirstPasswordChangePage and ResetPasswordPage to show
 * real-time per-rule validation indicators.
 */

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'At least 10 characters',
    test: (p) => p.length >= 10,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A–Z)',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a–z)',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'digit',
    label: 'One number (0–9)',
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: 'special',
    label: 'One special character (!@#$…)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

/**
 * Returns a map of ruleId → boolean (passed/failed).
 */
export function checkPasswordRules(password: string): Record<string, boolean> {
  return Object.fromEntries(
    PASSWORD_RULES.map((rule) => [rule.id, rule.test(password)])
  );
}

/**
 * Returns true only when every rule passes.
 */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
