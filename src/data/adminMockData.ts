export type RolTag = 'Administrador' | 'Secretaria' | 'Docente'

export type AdminUserRow = {
  id: string
  nombre: string
  email: string
  rol: RolTag
  ultimoAcceso: string
  activo: boolean
  iniciales: string
}

export const MOCK_ADMIN_USERS: AdminUserRow[] = [
  {
    id: '1',
    nombre: 'Ana María López',
    email: 'ana.lopez@unilibre.edu.co',
    rol: 'Administrador',
    ultimoAcceso: 'Hoy, 09:23 AM',
    activo: true,
    iniciales: 'AL',
  },
  {
    id: '2',
    nombre: 'Carlos Ruiz',
    email: 'carlos.ruiz@unilibre.edu.co',
    rol: 'Docente',
    ultimoAcceso: '12 Oct, 10:30 AM',
    activo: true,
    iniciales: 'CR',
  },
  {
    id: '3',
    nombre: 'María Fernanda Soto',
    email: 'mf.soto@unilibre.edu.co',
    rol: 'Secretaria',
    ultimoAcceso: '11 Oct, 04:15 PM',
    activo: false,
    iniciales: 'MS',
  },
  {
    id: '4',
    nombre: 'Alberto Martínez',
    email: 'alberto.martinez@unilibre.edu.co',
    rol: 'Docente',
    ultimoAcceso: 'Hoy, 07:10 AM',
    activo: true,
    iniciales: 'AM',
  },
  {
    id: '5',
    nombre: 'Laura Gómez',
    email: 'laura.gomez@unilibre.edu.co',
    rol: 'Docente',
    ultimoAcceso: '09 Oct, 02:00 PM',
    activo: true,
    iniciales: 'LG',
  },
]

export type ProgramaCard = {
  id: string
  nombre: string
  snies: string
  semestres: number
  creditos: number
}

export const MOCK_PROGRAMAS: ProgramaCard[] = [
  { id: 'sis', nombre: 'Ingeniería de Sistemas', snies: '12345', semestres: 10, creditos: 160 },
  { id: 'ind', nombre: 'Ingeniería Industrial', snies: '22334', semestres: 10, creditos: 158 },
  { id: 'civ', nombre: 'Ingeniería Civil', snies: '33445', semestres: 10, creditos: 165 },
]

export type AsignaturaRow = {
  codigo: string
  nombre: string
  creditos: number
  hTeoria: number
  hPractica: number
  area: string
  areaTone: 'slate' | 'blue' | 'emerald' | 'pink'
}

export const MOCK_PLAN_SISTEMAS_SEM1: AsignaturaRow[] = [
  {
    codigo: 'IS-101',
    nombre: 'Introducción a la Ingeniería',
    creditos: 2,
    hTeoria: 2,
    hPractica: 0,
    area: 'Básica Institucional',
    areaTone: 'slate',
  },
  {
    codigo: 'CB-102',
    nombre: 'Cálculo Diferencial',
    creditos: 4,
    hTeoria: 4,
    hPractica: 0,
    area: 'Ciencias Básicas',
    areaTone: 'blue',
  },
  {
    codigo: 'IS-103',
    nombre: 'Lógica de Programación',
    creditos: 4,
    hTeoria: 2,
    hPractica: 4,
    area: 'Específica',
    areaTone: 'emerald',
  },
  {
    codigo: 'HU-104',
    nombre: 'Comunicación Oral y Escrita',
    creditos: 3,
    hTeoria: 3,
    hPractica: 0,
    area: 'Humanidades',
    areaTone: 'pink',
  },
  {
    codigo: 'CB-105',
    nombre: 'Álgebra Lineal',
    creditos: 3,
    hTeoria: 3,
    hPractica: 0,
    area: 'Ciencias Básicas',
    areaTone: 'blue',
  },
  {
    codigo: 'IS-106',
    nombre: 'Fundamentos de Organización',
    creditos: 2,
    hTeoria: 2,
    hPractica: 0,
    area: 'Específica',
    areaTone: 'emerald',
  },
]

export type GrupoRow = {
  codigo: string
  nombre: string
  semestre: string
  cupoMax: number
  cupoPlaneado: number
  docente: string | null
  docenteIniciales: string | null
  estadoProg: 'horario' | 'pendiente'
}

export const MOCK_GRUPOS_POO: GrupoRow[] = [
  {
    codigo: '01',
    nombre: 'Grupo 01',
    semestre: 'Semestre 3',
    cupoMax: 40,
    cupoPlaneado: 40,
    docente: 'Alberto Martínez',
    docenteIniciales: 'AM',
    estadoProg: 'horario',
  },
  {
    codigo: '02',
    nombre: 'Grupo 02',
    semestre: 'Semestre 3',
    cupoMax: 40,
    cupoPlaneado: 40,
    docente: 'Laura Gómez',
    docenteIniciales: 'LG',
    estadoProg: 'pendiente',
  },
  {
    codigo: '03',
    nombre: 'Grupo 03',
    semestre: 'Semestre 3',
    cupoMax: 40,
    cupoPlaneado: 40,
    docente: null,
    docenteIniciales: null,
    estadoProg: 'pendiente',
  },
  {
    codigo: '04',
    nombre: 'Grupo 04',
    semestre: 'Semestre 3',
    cupoMax: 40,
    cupoPlaneado: 40,
    docente: 'Carlos Ruiz',
    docenteIniciales: 'CR',
    estadoProg: 'horario',
  },
]

export type CargaDocenteRow = {
  asignatura: string
  codigo: string
  grupo: string
  programa: string
  horasSemana: number
  horario: string
  salon: string
}

/** @deprecated Usar perfil en MOCK_DOCENTES_PERFIL; se mantiene por compatibilidad con imports antiguos */
export const MOCK_CARGA_MARTINEZ: CargaDocenteRow[] = [
  {
    asignatura: 'Programación Avanzada',
    codigo: 'ING-SIS-401',
    grupo: 'Grupo A1',
    programa: 'Ing. de Sistemas',
    horasSemana: 6,
    horario: 'Lun / Mié 07:00 - 09:00',
    salon: 'C-305 (Sistemas)',
  },
  {
    asignatura: 'Programación Avanzada',
    codigo: 'ING-SIS-401',
    grupo: 'Grupo B1',
    programa: 'Ing. de Sistemas',
    horasSemana: 6,
    horario: 'Mar / Jue 09:00 - 11:00',
    salon: 'C-305 (Sistemas)',
  },
  {
    asignatura: 'Estructuras de Datos',
    codigo: 'ING-SIS-302',
    grupo: 'Grupo A2',
    programa: 'Ing. de Sistemas',
    horasSemana: 4,
    horario: 'Lun / Mié 14:00 - 16:00',
    salon: 'B-203',
  },
  {
    asignatura: 'Estructuras de Datos',
    codigo: 'ING-SIS-302',
    grupo: 'Grupo C1',
    programa: 'Ing. de Sistemas',
    horasSemana: 4,
    horario: 'Vie 18:00 - 22:00',
    salon: 'B-203',
  },
  {
    asignatura: 'Arquitectura de Computadores',
    codigo: 'ING-SIS-315',
    grupo: 'Grupo A1',
    programa: 'Ing. de Sistemas',
    horasSemana: 6,
    horario: 'Mar 14:00 - 16:00 (Teoría) / Jue 14:00 - 16:00 (Lab)',
    salon: 'B-203 / L-101',
  },
  {
    asignatura: 'Trabajo de Grado I',
    codigo: 'ING-SIS-490',
    grupo: 'Tutoría',
    programa: 'Ing. de Sistemas',
    horasSemana: 10,
    horario: 'Horario flexible',
    salon: 'Sala de Profesores',
  },
]

export type VinculacionDocente = 'Titular' | 'Cátedra' | 'Ocasional'

export type DocentePerfil = {
  id: string
  nombreCompleto: string
  tituloProfesional: string
  iniciales: string
  vinculacion: VinculacionDocente
  departamento: string
  email: string
  telefono: string
  maxHorasSemana: number
  gruposActivos: number
  asignaturasDistintas: number
  espaciosFrecuentes: string[]
  ultimaActualizacionCarga: string
  carga: CargaDocenteRow[]
}

const MOCK_CARGA_GOMEZ: CargaDocenteRow[] = [
  {
    asignatura: 'Programación Orientada a Objetos',
    codigo: 'ING-SIS-301',
    grupo: 'Grupo 02',
    programa: 'Ing. de Sistemas',
    horasSemana: 4,
    horario: 'Mar / Jue 07:00 - 09:00',
    salon: 'C-201',
  },
  {
    asignatura: 'Ingeniería de Software I',
    codigo: 'ING-SIS-350',
    grupo: 'Grupo A',
    programa: 'Ing. de Sistemas',
    horasSemana: 4,
    horario: 'Lun / Mié 14:00 - 16:00',
    salon: 'C-305',
  },
]

const MOCK_CARGA_RUIZ: CargaDocenteRow[] = [
  {
    asignatura: 'Física I',
    codigo: 'CB-FIS-110',
    grupo: 'Grupo 01',
    programa: 'Ing. Industrial',
    horasSemana: 4,
    horario: 'Vie 07:00 - 11:00',
    salon: 'A-102',
  },
]

export const MOCK_DOCENTES_PERFIL: DocentePerfil[] = [
  {
    id: 'd-martinez',
    nombreCompleto: 'Alberto Martínez',
    tituloProfesional: 'Ing.',
    iniciales: 'AM',
    vinculacion: 'Titular',
    departamento: 'Departamento de Ingeniería de Sistemas',
    email: 'alberto.martinez@unilibre.edu.co',
    telefono: '+57 300 000 0000',
    maxHorasSemana: 40,
    gruposActivos: 6,
    asignaturasDistintas: 4,
    espaciosFrecuentes: ['C-305', 'L-101', 'B-203'],
    ultimaActualizacionCarga: 'Hace 2 días',
    carga: MOCK_CARGA_MARTINEZ,
  },
  {
    id: 'd-gomez',
    nombreCompleto: 'Laura Gómez',
    tituloProfesional: 'Ing.',
    iniciales: 'LG',
    vinculacion: 'Cátedra',
    departamento: 'Departamento de Ingeniería de Sistemas',
    email: 'laura.gomez@unilibre.edu.co',
    telefono: '+57 301 111 2233',
    maxHorasSemana: 24,
    gruposActivos: 2,
    asignaturasDistintas: 2,
    espaciosFrecuentes: ['C-201', 'C-305'],
    ultimaActualizacionCarga: 'Hace 5 horas',
    carga: MOCK_CARGA_GOMEZ,
  },
  {
    id: 'd-ruiz',
    nombreCompleto: 'Carlos Ruiz',
    tituloProfesional: 'Msc.',
    iniciales: 'CR',
    vinculacion: 'Ocasional',
    departamento: 'Departamento de Ciencias Básicas',
    email: 'carlos.ruiz@unilibre.edu.co',
    telefono: '+57 302 444 5566',
    maxHorasSemana: 12,
    gruposActivos: 1,
    asignaturasDistintas: 1,
    espaciosFrecuentes: ['A-102'],
    ultimaActualizacionCarga: 'Ayer',
    carga: MOCK_CARGA_RUIZ,
  },
]

export type EspacioRow = {
  codigo: string
  nombre: string
  tipoUso: 'Teórico' | 'Práctico' | 'Mixto'
  capacidad: number
  ocupacion: number
  icon: 'book' | 'flask' | 'pc'
}

export const MOCK_ESPACIOS: EspacioRow[] = [
  { codigo: 'B-201', nombre: 'Bloque B', tipoUso: 'Teórico', capacidad: 40, ocupacion: 85, icon: 'book' },
  { codigo: 'L-101', nombre: 'Laboratorio', tipoUso: 'Práctico', capacidad: 24, ocupacion: 0, icon: 'flask' },
  { codigo: 'C-305', nombre: 'Sistemas', tipoUso: 'Teórico', capacidad: 40, ocupacion: 100, icon: 'book' },
  { codigo: 'SC-02', nombre: 'Sala de cómputo', tipoUso: 'Mixto', capacidad: 30, ocupacion: 45, icon: 'pc' },
]

export type GrupoPendienteCard = {
  id: string
  semestre: string
  asignatura: string
  horas: number
  docente: string
  estudiantes: number
  alerta?: 'sin_docente'
}

/** Materias ofertadas por programa + semestre numérico + sección de grupo (constructor de horarios) */
export type ItemHorarioMateria = GrupoPendienteCard & {
  programaId: string
  semestreNum: number
  grupoSeccion: string
}

export const MOCK_GRUPOS_PENDIENTES: GrupoPendienteCard[] = [
  {
    id: 'g1',
    semestre: 'SEMESTRE 4',
    asignatura: 'Estructuras de Datos',
    horas: 4,
    docente: 'Martinez, A.',
    estudiantes: 35,
  },
  {
    id: 'g2',
    semestre: 'SEMESTRE 2',
    asignatura: 'Introducción a la Ing.',
    horas: 2,
    docente: '—',
    estudiantes: 40,
    alerta: 'sin_docente',
  },
]

export const MOCK_OFERTA_MATERIAS: ItemHorarioMateria[] = [
  {
    id: 'sis-4a-poo',
    programaId: 'sis',
    semestreNum: 4,
    grupoSeccion: 'A',
    semestre: 'Semestre 4',
    asignatura: 'Programación Orientada a Objetos',
    horas: 4,
    docente: 'Gómez, L.',
    estudiantes: 38,
  },
  {
    id: 'sis-4a-calc',
    programaId: 'sis',
    semestreNum: 4,
    grupoSeccion: 'A',
    semestre: 'Semestre 4',
    asignatura: 'Cálculo Multivariable',
    horas: 4,
    docente: 'Ruiz, C.',
    estudiantes: 38,
  },
  {
    id: 'sis-4a-fis',
    programaId: 'sis',
    semestreNum: 4,
    grupoSeccion: 'A',
    semestre: 'Semestre 4',
    asignatura: 'Física II',
    horas: 4,
    docente: 'Ruiz, C.',
    estudiantes: 36,
  },
  {
    id: 'sis-4b-poo',
    programaId: 'sis',
    semestreNum: 4,
    grupoSeccion: 'B',
    semestre: 'Semestre 4',
    asignatura: 'Programación Orientada a Objetos',
    horas: 4,
    docente: 'Martinez, A.',
    estudiantes: 40,
  },
  {
    id: 'sis-4b-est',
    programaId: 'sis',
    semestreNum: 4,
    grupoSeccion: 'B',
    semestre: 'Semestre 4',
    asignatura: 'Estadística',
    horas: 3,
    docente: 'Soto, M.',
    estudiantes: 40,
  },
  {
    id: 'sis-5a-ed',
    programaId: 'sis',
    semestreNum: 5,
    grupoSeccion: 'A',
    semestre: 'Semestre 5',
    asignatura: 'Estructuras de Datos',
    horas: 4,
    docente: 'Martinez, A.',
    estudiantes: 35,
  },
  {
    id: 'sis-5a-bd',
    programaId: 'sis',
    semestreNum: 5,
    grupoSeccion: 'A',
    semestre: 'Semestre 5',
    asignatura: 'Bases de Datos',
    horas: 4,
    docente: 'Martinez, A.',
    estudiantes: 35,
  },
  {
    id: 'sis-5a-iso',
    programaId: 'sis',
    semestreNum: 5,
    grupoSeccion: 'A',
    semestre: 'Semestre 5',
    asignatura: 'Ingeniería de Software I',
    horas: 4,
    docente: 'Gómez, L.',
    estudiantes: 34,
  },
  {
    id: 'sis-5b-ed',
    programaId: 'sis',
    semestreNum: 5,
    grupoSeccion: 'B',
    semestre: 'Semestre 5',
    asignatura: 'Estructuras de Datos',
    horas: 4,
    docente: 'Gómez, L.',
    estudiantes: 32,
  },
  {
    id: 'sis-5b-redes',
    programaId: 'sis',
    semestreNum: 5,
    grupoSeccion: 'B',
    semestre: 'Semestre 5',
    asignatura: 'Redes de Computadores',
    horas: 4,
    docente: 'Ruiz, C.',
    estudiantes: 30,
  },
  {
    id: 'ind-3a-proc',
    programaId: 'ind',
    semestreNum: 3,
    grupoSeccion: 'A',
    semestre: 'Semestre 3',
    asignatura: 'Procesos Industriales',
    horas: 4,
    docente: 'López, A.',
    estudiantes: 42,
  },
  {
    id: 'ind-3a-mat',
    programaId: 'ind',
    semestreNum: 3,
    grupoSeccion: 'A',
    semestre: 'Semestre 3',
    asignatura: 'Materiales',
    horas: 3,
    docente: '—',
    estudiantes: 42,
    alerta: 'sin_docente',
  },
]
