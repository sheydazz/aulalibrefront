import type { SessionUser, UserRole } from '../auth'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

const TOKEN_KEY = 'aulalibre-token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Error ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(
  email: string,
  password: string,
): Promise<{ token: string; user: SessionUser & { id?: number; nombre?: string } }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function apiForgotPassword(email: string): Promise<{ message: string }> {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type ApiUser = {
  id: string
  nombre: string
  email: string
  rol: string
  ultimoAcceso: string
  activo: boolean
  iniciales: string
}

export async function apiGetUsers(): Promise<ApiUser[]> {
  return request('/users')
}

export async function apiCreateUser(data: {
  nombre: string; email: string; rol: string; activo: boolean; password?: string
}): Promise<ApiUser> {
  return request('/users', { method: 'POST', body: JSON.stringify(data) })
}

export async function apiUpdateUser(id: string, data: Partial<ApiUser>): Promise<ApiUser> {
  return request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function apiDeleteUser(id: string): Promise<void> {
  return request(`/users/${id}`, { method: 'DELETE' })
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export type ApiProgram = {
  id: string; nombre: string; snies: string; semestres: number; creditos: number
}

export type ApiSubject = {
  id: number; program_id: string; semestre: number; codigo: string; nombre: string
  creditos: number; h_teoria: number; h_practica: number; area: string; area_tone: string
}

export async function apiGetPrograms(): Promise<ApiProgram[]> {
  return request('/programs')
}

export async function apiCreateProgram(data: ApiProgram): Promise<ApiProgram> {
  return request('/programs', { method: 'POST', body: JSON.stringify(data) })
}

export async function apiGetSubjects(programId: string, semestre?: number): Promise<ApiSubject[]> {
  const qs = semestre ? `?semestre=${semestre}` : ''
  return request(`/programs/${programId}/subjects${qs}`)
}

export async function apiCreateSubject(
  programId: string,
  data: Omit<ApiSubject, 'id' | 'program_id'>,
): Promise<ApiSubject> {
  return request(`/programs/${programId}/subjects`, { method: 'POST', body: JSON.stringify(data) })
}

export async function apiDeleteSubject(subjectId: number): Promise<void> {
  return request(`/programs/subjects/${subjectId}`, { method: 'DELETE' })
}

// ─── Teachers ─────────────────────────────────────────────────────────────────

export type ApiTeacherLoad = {
  asignatura: string; codigo: string; grupo: string; programa: string
  horasSemana: number; horario: string; salon: string
}

export type ApiTeacher = {
  id: string; nombreCompleto: string; tituloProfesional: string; iniciales: string
  vinculacion: string; departamento: string; email: string; telefono: string
  maxHorasSemana: number; gruposActivos: number; asignaturasDistintas: number
  espaciosFrecuentes: string[]; ultimaActualizacionCarga: string; carga: ApiTeacherLoad[]
}

export async function apiGetTeachers(): Promise<ApiTeacher[]> {
  return request('/teachers')
}

export async function apiGetTeacherByEmail(email: string): Promise<ApiTeacher> {
  return request(`/teachers/by-email/${encodeURIComponent(email)}`)
}

export async function apiCreateTeacher(data: Partial<ApiTeacher> & { maxHorasSemana?: number }): Promise<ApiTeacher> {
  return request('/teachers', { method: 'POST', body: JSON.stringify(data) })
}

export async function apiGetTeacherAvailability(id: string): Promise<Record<string, boolean>> {
  return request(`/teachers/${id}/availability`)
}

export async function apiUpdateTeacherAvailability(id: string, data: Record<string, boolean>): Promise<void> {
  return request(`/teachers/${id}/availability`, { method: 'PUT', body: JSON.stringify(data) })
}

export type ApiReport = {
  id: string; teacher_id: string; tipo: string; subject: string; detail: string
  status: string; created_at: string
}

export async function apiGetTeacherReports(id: string): Promise<ApiReport[]> {
  return request(`/teachers/${id}/reports`)
}

export async function apiCreateTeacherReport(
  id: string,
  data: { tipo: string; subject: string; detail: string },
): Promise<ApiReport> {
  return request(`/teachers/${id}/reports`, { method: 'POST', body: JSON.stringify(data) })
}

// ─── Spaces ───────────────────────────────────────────────────────────────────

export type ApiSpace = {
  codigo: string; nombre: string; tipoEspacio: string; tipoUso: string
  capacidad: number; ocupacion: number; icon: string
  claseLaboratorio?: string; software: string[]; equipamiento: Array<{ nombre: string; cantidad: number }>
}

export async function apiGetSpaces(q?: string): Promise<ApiSpace[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  return request(`/spaces${qs}`)
}

export async function apiCreateSpace(data: {
  codigo: string; nombre: string; tipoEspacio: string; tipoUso: string; capacidad: number
  claseLaboratorio?: string; software?: string[]; equipamiento?: Array<{ nombre: string; cantidad: number }>
}): Promise<ApiSpace> {
  return request('/spaces', { method: 'POST', body: JSON.stringify(data) })
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export type ApiGroup = {
  id: string; codigo: string; nombre: string; semestre: string; cupoMax: number; cupoPlaneado: number
  docente: string | null; docenteIniciales: string | null; estadoProg: string
  asignatura?: string; horas?: number; programaId?: string; semestreNum?: number; grupoSeccion?: string
  alerta?: string; estudiantes?: number
}

export async function apiGetGroups(): Promise<ApiGroup[]> {
  return request('/groups')
}

export async function apiGetScheduleOffer(): Promise<ApiGroup[]> {
  return request('/schedules/offer')
}

export type ApiScheduleAssignment = {
  groupId: string
  spaceCodigo: string
  dayIndex: number
  slotIndex: number
  status?: 'draft' | 'published'
}

export async function apiGetScheduleAssignments(params: {
  programaId: string
  semestreNum: number
  grupoSeccion: string
  status?: 'draft' | 'published'
}): Promise<ApiScheduleAssignment[]> {
  const qs = new URLSearchParams({
    programaId: params.programaId,
    semestreNum: String(params.semestreNum),
    grupoSeccion: params.grupoSeccion,
    status: params.status ?? 'draft',
  })
  return request(`/schedules/assignments?${qs.toString()}`)
}

export async function apiSaveScheduleAssignments(data: {
  programaId: string
  semestreNum: number
  grupoSeccion: string
  status: 'draft' | 'published'
  assignments: ApiScheduleAssignment[]
}): Promise<{ message: string; count: number }> {
  return request('/schedules/assignments', { method: 'PUT', body: JSON.stringify(data) })
}

export async function apiCreateGroup(data: Partial<ApiGroup>): Promise<ApiGroup> {
  return request('/groups', { method: 'POST', body: JSON.stringify(data) })
}

export async function apiUpdateGroup(id: string, data: Partial<ApiGroup>): Promise<ApiGroup> {
  return request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// ─── Role helper ─────────────────────────────────────────────────────────────

export function rolDisplayToRole(rolDisplay: string): UserRole {
  if (rolDisplay === 'Administrador' || rolDisplay === 'Secretaria') return 'admin'
  if (rolDisplay === 'Docente') return 'docente'
  return 'estudiante'
}
