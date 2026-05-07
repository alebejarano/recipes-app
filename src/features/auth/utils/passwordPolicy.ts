export const PASSWORD_REQUIREMENTS = [
  {
    id: 'length',
    label: 'At least 8 characters',
    validate: (password: string) => password.length >= 8,
  },
  {
    id: 'letter-number',
    label: 'At least one character and one number',
    validate: (password: string) => /[A-Za-z]/.test(password) && /\d/.test(password),
  },
] as const

export function getPasswordPolicyIssues(password: string) {
  return PASSWORD_REQUIREMENTS.filter((requirement) => !requirement.validate(password))
}

export function isPasswordStrong(password: string) {
  return getPasswordPolicyIssues(password).length === 0
}
