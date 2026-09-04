export interface PasswordRule {
  key: string
  label: string
  passed: boolean
}

export function validatePassword(password: string): { rules: PasswordRule[]; isValid: boolean } {
  const rules: PasswordRule[] = [
    {
      key: 'minLength',
      label: 'passwordMinLength',
      passed: password.length >= 8,
    },
    {
      key: 'requireLetter',
      label: 'passwordRequireLetter',
      passed: /[a-zA-Z]/.test(password),
    },
    {
      key: 'requireNumber',
      label: 'passwordRequireNumber',
      passed: /\d/.test(password),
    },
  ]

  return {
    rules,
    isValid: rules.every((r) => r.passed),
  }
}
