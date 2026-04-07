export type UserRole = 'admin' | 'docente' | 'estudiante'

export type SessionUser = {
  email: string
  role: UserRole
  remember: boolean
}

const SESSION_KEY = 'aulalibre-session'

export function getSession(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(user: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function resolveRoleByEmail(email: string): UserRole {
  if (email.includes('admin')) return 'admin'
  if (email.includes('docente')) return 'docente'
  return 'estudiante'
}
