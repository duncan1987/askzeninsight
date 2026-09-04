export interface UsernameValidationResult {
  isValid: boolean
  errorKey?: string
}

const RESERVED_USERNAMES = ['admin', 'system', 'root', 'support', 'help', 'moderator']

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

export function validateUsername(username: string): UsernameValidationResult {
  if (!username || username.trim().length === 0) {
    return { isValid: false, errorKey: 'usernameRequired' }
  }

  if (username.length < 3) {
    return { isValid: false, errorKey: 'usernameInvalid' }
  }

  if (username.length > 20) {
    return { isValid: false, errorKey: 'usernameInvalid' }
  }

  if (!USERNAME_PATTERN.test(username)) {
    return { isValid: false, errorKey: 'usernameInvalid' }
  }

  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { isValid: false, errorKey: 'usernameReserved' }
  }

  return { isValid: true }
}
