import { useMemo, useState, type FormEvent } from 'react'
import { getSession } from '../auth'
import { MOCK_DOCENTES_PERFIL, type DocentePerfil } from '../data/adminMockData'

type TabId = 'horario' | 'reportes' | 'perfil'
type ReportType = 'cruce' | 'no_disponibilidad' | 'novedad'
type ReportStatus = 'pendiente' | 'en_revision' | 'resuelto'
type TeacherDayFilter = 'all' | 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab'

type TeacherReport = {
  id: string
  createdAt: string
  type: ReportType
  subject: string
  detail: string
  status: ReportStatus
}

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  cruce: 'Cruce de horario',
  no_disponibilidad: 'No disponibilidad',
  novedad: 'Otra novedad',
}

const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revision',
  resuelto: 'Resuelto',
}

const REPORT_STATUS_TONE: Record<ReportStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-900',
  en_revision: 'bg-sky-100 text-sky-900',
  resuelto: 'bg-emerald-100 text-emerald-900',
}

const TEACHER_DAYS: { key: Exclude<TeacherDayFilter, 'all'>; label: string; token: string }[] = [
  { key: 'lun', label: 'Lun', token: 'lun' },
  { key: 'mar', label: 'Mar', token: 'mar' },
  { key: 'mie', label: 'Mie', token: 'mie' },
  { key: 'jue', label: 'Jue', token: 'jue' },
  { key: 'vie', label: 'Vie', token: 'vie' },
  { key: 'sab', label: 'Sab', token: 'sab' },
]

function initiales(nombreCompleto: string) {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)
  const a = partes[0]?.[0] ?? ''
  const b = partes[1]?.[0] ?? partes[0]?.[1] ?? ''
  return (a + b).toUpperCase() || 'DC'
}

function formatFecha(date = new Date()) {
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function findTeacherBySessionEmail(email: string | undefined): DocentePerfil {
  if (!email) return MOCK_DOCENTES_PERFIL[0]
  const byEmail = MOCK_DOCENTES_PERFIL.find((d) => d.email.toLowerCase() === email.toLowerCase())
  if (byEmail) return byEmail
  return MOCK_DOCENTES_PERFIL[0]
}

function detectDayLabels(horario: string) {
  const lowered = horario.toLowerCase()
  return TEACHER_DAYS.filter((d) => lowered.includes(d.token)).map((d) => d.label)
}

export default function TeacherDashboardPage() {
  const session = getSession()
  const docente = useMemo(() => findTeacherBySessionEmail(session?.email), [session?.email])
  const [tab, setTab] = useState<TabId>('horario')
  const [q, setQ] = useState('')
  const [dayFilter, setDayFilter] = useState<TeacherDayFilter>('all')
  const [reportType, setReportType] = useState<ReportType>('cruce')
  const [reportSubject, setReportSubject] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reportMsg, setReportMsg] = useState<string | null>(null)
  const [reports, setReports] = useState<TeacherReport[]>([
    {
      id: 'rep-1',
      createdAt: '12 mar 2026',
      type: 'cruce',
      subject: 'Estructuras de Datos - Grupo B',
      detail: 'Tengo cruce con comité curricular el martes 9:00-11:00.',
      status: 'en_revision',
    },
    {
      id: 'rep-2',
      createdAt: '07 mar 2026',
      type: 'no_disponibilidad',
      subject: 'Bases de Datos - Grupo A',
      detail: 'No dispongo del bloque jueves 11:00-13:00 por incapacidad medica.',
      status: 'resuelto',
    },
  ])

  const filteredCarga = useMemo(() => {
    const term = q.trim().toLowerCase()
    const byDay =
      dayFilter === 'all'
        ? docente.carga
        : docente.carga.filter((r) => r.horario.toLowerCase().includes(dayFilter))
    if (!term) return byDay
    return byDay.filter(
      (r) =>
        r.asignatura.toLowerCase().includes(term) ||
        r.codigo.toLowerCase().includes(term) ||
        r.grupo.toLowerCase().includes(term) ||
        r.horario.toLowerCase().includes(term),
    )
  }, [docente.carga, dayFilter, q])

  const onSubmitReport = (e: FormEvent) => {
    e.preventDefault()
    const subject = reportSubject.trim()
    const detail = reportDetail.trim()
    if (!subject || !detail) return
    const created: TeacherReport = {
      id: `rep-${Date.now()}`,
      createdAt: formatFecha(),
      type: reportType,
      subject,
      detail,
      status: 'pendiente',
    }
    setReports((prev) => [created, ...prev])
    setReportSubject('')
    setReportDetail('')
    setReportType('cruce')
    setReportMsg('Reporte enviado al equipo académico.')
  }

  const totalHoras = docente.carga.reduce((acc, row) => acc + row.horasSemana, 0)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-red-700 text-base font-bold text-white">
              {initiales(docente.nombreCompleto)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Panel docente</h1>
              <p className="text-sm text-slate-600">
                {docente.tituloProfesional} {docente.nombreCompleto} · {docente.departamento}
              </p>
              <p className="text-xs text-slate-500">Periodo 2026-1</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-right text-xs text-slate-600">
            <p className="font-bold text-slate-800">{docente.vinculacion}</p>
            <p>
              {totalHoras} / {docente.maxHorasSemana} horas
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {(
          [
            ['horario', 'Mi horario'],
            ['reportes', 'Reportar novedad'],
            ['perfil', 'Mi perfil'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 transition ${
              tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      {tab === 'horario' ? (
        <section className="mt-4 rounded-2xl border border-rose-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Mi horario semanal</h2>
              <p className="text-xs text-slate-500">Visual tipo estudiante con bloques por asignatura y filtros por dia.</p>
            </div>
            <input
              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none sm:max-w-xs focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Buscar en mi horario..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="px-4 pt-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  dayFilter === 'all' ? 'bg-red-700 text-white' : 'bg-rose-100 text-slate-700 hover:bg-rose-200'
                }`}
                onClick={() => setDayFilter('all')}
              >
                Todos
              </button>
              {TEACHER_DAYS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    dayFilter === d.key ? 'bg-red-700 text-white' : 'bg-rose-100 text-slate-700 hover:bg-rose-200'
                  }`}
                  onClick={() => setDayFilter(d.key)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
            {filteredCarga.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-8 text-center text-sm text-slate-500">
                No hay bloques para ese filtro o busqueda.
              </p>
            ) : (
              filteredCarga.map((r) => {
                const dayLabels = detectDayLabels(r.horario)
                return (
                  <article
                    key={`${r.codigo}-${r.grupo}-${r.horario}`}
                    className="rounded-xl border-l-4 border-l-red-700 bg-rose-50 p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold tracking-wide text-rose-900">{r.asignatura}</h3>
                        <p className="text-xs font-semibold text-slate-600">
                          {r.codigo} · Grupo {r.grupo}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-rose-200">
                        {r.horasSemana} h
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">{r.horario}</p>
                    <p className="mt-1 text-xs text-slate-600">Salon: {r.salon}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {dayLabels.length > 0 ? (
                        dayLabels.map((label) => (
                          <span key={label} className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          Flexible
                        </span>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
      ) : null}

      {tab === 'reportes' ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <form className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={onSubmitReport}>
            <h2 className="text-lg font-bold text-slate-900">Reportar cruce o no disponibilidad</h2>
            <p className="mt-1 text-sm text-slate-600">Informa novedades para que coordinación ajuste la asignación.</p>

            <label className="mt-4 block text-sm font-semibold text-slate-800">
              Tipo de reporte
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                <option value="cruce">Cruce de horario</option>
                <option value="no_disponibilidad">No disponibilidad</option>
                <option value="novedad">Otra novedad</option>
              </select>
            </label>

            <label className="mt-3 block text-sm font-semibold text-slate-800">
              Asignatura / grupo afectado
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Ej. Bases de Datos - Grupo A"
                value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)}
                required
              />
            </label>

            <label className="mt-3 block text-sm font-semibold text-slate-800">
              Detalle
              <textarea
                className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Describe la franja, el motivo y propuesta de ajuste..."
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                required
              />
            </label>

            {reportMsg ? <p className="mt-2 text-sm font-semibold text-emerald-700">{reportMsg}</p> : null}

            <button type="submit" className="mt-3 w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800">
              Enviar reporte
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Mis reportes</h3>
            <ul className="mt-3 space-y-2">
              {reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-900">{REPORT_TYPE_LABEL[r.type]}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${REPORT_STATUS_TONE[r.status]}`}>
                      {REPORT_STATUS_LABEL[r.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{r.subject}</p>
                  <p className="mt-1 text-xs text-slate-600">{r.detail}</p>
                  <p className="mt-2 text-[11px] text-slate-400">Reportado: {r.createdAt}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {tab === 'perfil' ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Mi perfil docente</h2>
          <p className="mt-1 text-sm text-slate-600">Datos visibles para coordinación académica.</p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Nombre</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {docente.tituloProfesional} {docente.nombreCompleto}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Correo</dt>
              <dd className="mt-1 font-semibold text-blue-700">{docente.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Telefono</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.telefono}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Departamento</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.departamento}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Vinculacion</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                  {docente.vinculacion}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Tope semanal</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.maxHorasSemana} h</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </main>
  )
}
