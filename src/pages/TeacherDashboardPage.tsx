import { useEffect, useMemo, useState, type FormEvent } from 'react'
import UniversidadLogo from '../components/UniversidadLogo'
import { getSession } from '../auth'
import {
  apiGetTeacherByEmail, apiGetTeacherReports, apiCreateTeacherReport,
  type ApiTeacher, type ApiReport,
} from '../services/api'

type TabId = 'horario' | 'reportes' | 'perfil'
type ReportType = 'cruce' | 'no_disponibilidad' | 'novedad'
type TeacherDayFilter = 'all' | 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab'

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  cruce: 'Cruce de horario',
  no_disponibilidad: 'No disponibilidad',
  novedad: 'Otra novedad',
}

const REPORT_STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', en_revision: 'En revisión', resuelto: 'Resuelto',
}

const REPORT_STATUS_TONE: Record<string, string> = {
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

function detectDayLabels(horario: string) {
  const lowered = horario.toLowerCase()
  return TEACHER_DAYS.filter((d) => lowered.includes(d.token)).map((d) => d.label)
}

export default function TeacherDashboardPage() {
  const session = getSession()
  const [docente, setDocente] = useState<ApiTeacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('horario')
  const [q, setQ] = useState('')
  const [dayFilter, setDayFilter] = useState<TeacherDayFilter>('all')
  const [reportType, setReportType] = useState<ReportType>('cruce')
  const [reportSubject, setReportSubject] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reportMsg, setReportMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reports, setReports] = useState<ApiReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)

  useEffect(() => {
    if (!session?.email) return
    setLoading(true)
    apiGetTeacherByEmail(session.email)
      .then(setDocente)
      .catch(() => setDocente(null))
      .finally(() => setLoading(false))
  }, [session?.email])

  useEffect(() => {
    if (tab !== 'reportes' || !docente) return
    setLoadingReports(true)
    apiGetTeacherReports(docente.id)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false))
  }, [tab, docente])

  const filteredCarga = useMemo(() => {
    if (!docente) return []
    const term = q.trim().toLowerCase()
    const byDay = dayFilter === 'all'
      ? docente.carga
      : docente.carga.filter((r) => r.horario.toLowerCase().includes(dayFilter))
    if (!term) return byDay
    return byDay.filter(
      (r) => r.asignatura.toLowerCase().includes(term) || r.codigo.toLowerCase().includes(term) || r.grupo.toLowerCase().includes(term),
    )
  }, [docente, dayFilter, q])

  const onSubmitReport = async (e: FormEvent) => {
    e.preventDefault()
    const subject = reportSubject.trim()
    const detail = reportDetail.trim()
    if (!subject || !detail || !docente) return
    setSubmitting(true)
    try {
      const created = await apiCreateTeacherReport(docente.id, { tipo: reportType, subject, detail })
      setReports((prev) => [created, ...prev])
      setReportSubject('')
      setReportDetail('')
      setReportType('cruce')
      setReportMsg('Reporte enviado al equipo académico.')
    } catch {
      setReportMsg('Error al enviar el reporte. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalHoras = useMemo(() => docente?.carga.reduce((acc, row) => acc + row.horasSemana, 0) ?? 0, [docente])

  if (loading) {
    return <main className="flex items-center justify-center py-20 text-slate-500">Cargando panel docente...</main>
  }

  if (!docente) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-bold">No se encontró perfil docente</p>
          <p>Tu cuenta no está vinculada a un perfil docente. Contacta al administrador.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <UniversidadLogo size="lg" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">
                Universidad Libre
              </p>
              <h1 className="text-2xl font-bold text-slate-900">Panel docente</h1>
              <p className="text-sm text-slate-600">{docente.tituloProfesional} {docente.nombreCompleto} · {docente.departamento}</p>
              <p className="text-xs text-slate-500">Periodo 2026-1</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-right text-xs text-slate-600">
            <p className="font-bold text-slate-800">{docente.vinculacion}</p>
            <p>{totalHoras} / {docente.maxHorasSemana} horas</p>
          </div>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {(['horario', 'reportes', 'perfil'] as const).map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 transition ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {id === 'horario' ? 'Mi horario' : id === 'reportes' ? 'Reportar novedad' : 'Mi perfil'}
          </button>
        ))}
      </section>

      {tab === 'horario' ? (
        <section className="mt-4 rounded-2xl border border-rose-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Mi horario semanal</h2>
              <p className="text-xs text-slate-500">Bloques por asignatura con filtros por día.</p>
            </div>
            <input className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none sm:max-w-xs focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Buscar en mi horario..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="px-4 pt-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button type="button"
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${dayFilter === 'all' ? 'bg-red-700 text-white' : 'bg-rose-100 text-slate-700 hover:bg-rose-200'}`}
                onClick={() => setDayFilter('all')}>Todos</button>
              {TEACHER_DAYS.map((d) => (
                <button key={d.key} type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${dayFilter === d.key ? 'bg-red-700 text-white' : 'bg-rose-100 text-slate-700 hover:bg-rose-200'}`}
                  onClick={() => setDayFilter(d.key)}>{d.label}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
            {filteredCarga.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-8 text-center text-sm text-slate-500">
                No hay bloques para ese filtro o búsqueda.
              </p>
            ) : filteredCarga.map((r) => {
              const dayLabels = detectDayLabels(r.horario)
              return (
                <article key={`${r.codigo}-${r.grupo}-${r.horario}`} className="rounded-xl border-l-4 border-l-red-700 bg-rose-50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold tracking-wide text-rose-900">{r.asignatura}</h3>
                      <p className="text-xs font-semibold text-slate-600">{r.codigo} · Grupo {r.grupo}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-rose-200">{r.horasSemana} h</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{r.horario}</p>
                  <p className="mt-1 text-xs text-slate-600">Salón: {r.salon}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {dayLabels.length > 0 ? dayLabels.map((label) => (
                      <span key={label} className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">{label}</span>
                    )) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">Flexible</span>
                    )}
                  </div>
                </article>
              )
            })}
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
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
                <option value="cruce">Cruce de horario</option>
                <option value="no_disponibilidad">No disponibilidad</option>
                <option value="novedad">Otra novedad</option>
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-slate-800">
              Asignatura / grupo afectado
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Ej. Bases de Datos - Grupo A" value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)} required />
            </label>
            <label className="mt-3 block text-sm font-semibold text-slate-800">
              Detalle
              <textarea className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Describe la franja, el motivo y propuesta de ajuste..." value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)} required />
            </label>
            {reportMsg ? <p className="mt-2 text-sm font-semibold text-emerald-700">{reportMsg}</p> : null}
            <button type="submit" disabled={submitting}
              className="mt-3 w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
              {submitting ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Mis reportes</h3>
            {loadingReports ? <p className="mt-4 text-center text-sm text-slate-500">Cargando reportes...</p> : (
              <ul className="mt-3 space-y-2">
                {reports.map((r) => (
                  <li key={r.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">{REPORT_TYPE_LABEL[r.tipo as ReportType] ?? r.tipo}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${REPORT_STATUS_TONE[r.status] ?? 'bg-slate-100 text-slate-700'}`}>
                        {REPORT_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{r.subject}</p>
                    <p className="mt-1 text-xs text-slate-600">{r.detail}</p>
                    <p className="mt-2 text-[11px] text-slate-400">Reportado: {r.created_at}</p>
                  </li>
                ))}
                {reports.length === 0 ? <li className="text-center text-sm text-slate-500 py-4">Sin reportes registrados.</li> : null}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'perfil' ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Mi perfil docente</h2>
          <p className="mt-1 text-sm text-slate-600">Datos visibles para coordinación académica.</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-xs font-bold uppercase text-slate-500">Nombre</dt><dd className="mt-1 font-semibold text-slate-900">{docente.tituloProfesional} {docente.nombreCompleto}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-500">Correo</dt><dd className="mt-1 font-semibold text-blue-700">{docente.email}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-500">Teléfono</dt><dd className="mt-1 font-semibold text-slate-900">{docente.telefono}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-500">Departamento</dt><dd className="mt-1 font-semibold text-slate-900">{docente.departamento}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-500">Vinculación</dt>
              <dd className="mt-1"><span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">{docente.vinculacion}</span></dd>
            </div>
            <div><dt className="text-xs font-bold uppercase text-slate-500">Tope semanal</dt><dd className="mt-1 font-semibold text-slate-900">{docente.maxHorasSemana} h</dd></div>
          </dl>
        </section>
      ) : null}
    </main>
  )
}
