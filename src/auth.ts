// Roles soportados por la aplicación para control de acceso por módulo.
export type UserRole = 'admin' | 'docente' | 'estudiante'

// Estructura mínima que se guarda en sesión del cliente.
export type SessionUser = {
  email: string
  role: UserRole
  remember: boolean
}

// Clave única usada en localStorage para persistir la sesión.
const SESSION_KEY = 'aulalibre-session'

export function getSession(): SessionUser | null {
  // Lee sesión del navegador; si no existe, no hay usuario autenticado.
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    // Convierte JSON a objeto de sesión tipado.
    return JSON.parse(raw) as SessionUser
  } catch {
    // Si el contenido está corrupto, limpia storage para evitar errores futuros.
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(user: SessionUser) {
  // Persiste sesión actual en localStorage.
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  // Elimina completamente la sesión local (logout).
  localStorage.removeItem(SESSION_KEY)
}

export function resolveRoleByEmail(email: string): UserRole {
  // Regla demo para inferir rol por contenido del correo.
  // En producción debe reemplazarse por respuesta de backend/autenticación real.
  if (email.includes('admin')) return 'admin'
  if (email.includes('docente')) return 'docente'
  return 'estudiante'
}
