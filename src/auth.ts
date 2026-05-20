export type UserRole = 'admin' | 'docente' | 'estudiante'

export type SessionUser = {
  id?: number
  email: string
  role: UserRole
  nombre?: string
  iniciales?: string
  remember: boolean
}

const SESSION_KEY = 'aulalibre-session'
const TOKEN_KEY = 'aulalibre-token'

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
  localStorage.removeItem(TOKEN_KEY)
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
