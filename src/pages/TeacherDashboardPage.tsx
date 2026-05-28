import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import UniversidadLogo from '../components/UniversidadLogo'
import DocenteDisponibilidadGrid from '../components/admin/DocenteDisponibilidadGrid'
import { getSession } from '../auth'
import {
  apiGetTeacherByEmail,
  apiGetTeacherReports,
  apiCreateTeacherReport,
  apiGetTeacherSchedule,
  type ApiTeacher,
  type ApiReport,
  type ApiTeacherBlock,
} from '../services/api'

type TabId = 'horario' | 'disponibilidad' | 'reportes' | 'perfil'
type ReportType = 'cruce' | 'no_disponibilidad' | 'novedad'

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  cruce: 'Cruce de horario',
  no_disponibilidad: 'No disponibilidad',
  novedad: 'Otra novedad',
}

const REPORT_STATUS_TONE: Record<string, string> = {
  'Enviado': 'bg-amber-100 text-amber-900',
  'En revisión': 'bg-sky-100 text-sky-900',
  'Atendido': 'bg-emerald-100 text-emerald-900',
  'Rechazado': 'bg-red-100 text-red-900',
}

export default function TeacherDashboardPage() {
  const session = getSession()
  const [docente, setDocente] = useState<ApiTeacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('horario')
  const [q, setQ] = useState('')

  // ── Schedule tab ──────────────────────────────────────────────────────────
  const [scheduleBlocks, setScheduleBlocks] = useState<ApiTeacherBlock[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [dayFilter, setDayFilter] = useState<number | null>(null)

  // ── Reports tab ───────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState<ReportType>('cruce')
  const [reportSubject, setReportSubject] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reportMsg, setReportMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const reportMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    if (tab !== 'horario' || !docente) return
    setLoadingSchedule(true)
    setDayFilter(null)
    apiGetTeacherSchedule({ status: 'published' })
      .then((r) => setScheduleBlocks(r.bloques))
      .catch(() => setScheduleBlocks([]))
      .finally(() => setLoadingSchedule(false))
  }, [tab, docente])

  useEffect(() => {
    if (tab !== 'reportes' || !docente) return
    setLoadingReports(true)
    apiGetTeacherReports(docente.id)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false))
  }, [tab, docente])

  // ── Derived data ──────────────────────────────────────────────────────────

  // Unique days present in the published schedule
  const scheduleDays = useMemo(() => {
    const seen = new Set<number>()
    return scheduleBlocks
      .filter((b) => { if (seen.has(b.day_index)) return false; seen.add(b.day_index); return true })
      .map((b) => ({ day_index: b.day_index, dia: b.dia }))
      .sort((a, b) => a.day_index - b.day_index)
  }, [scheduleBlocks])

  const filteredBlocks = useMemo(() => {
    let blocks = dayFilter !== null
      ? scheduleBlocks.filter((b) => b.day_index === dayFilter)
      : scheduleBlocks
    const term = q.trim().toLowerCase()
    if (term) {
      blocks = blocks.filter(
        (b) =>
          b.asignatura.toLowerCase().includes(term) ||
          b.grupo_codigo.toLowerCase().includes(term) ||
          b.grupo_nombre.toLowerCase().includes(term) ||
          b.salon.toLowerCase().includes(term),
      )
    }
    return blocks
  }, [scheduleBlocks, dayFilter, q])

  // Total weekly hours from published schedule (each slot entry = its duration)
  const totalHorasSchedule = useMemo(
    () => scheduleBlocks.reduce((acc, b) => {
      const [h1, h2] = [b.start_time, b.end_time].map((t) => {
        const [hh, mm] = t.split(':').map(Number)
        return hh + mm / 60
      })
      return acc + (h2 - h1)
    }, 0),
    [scheduleBlocks],
  )

  const setReportFeedback = (text: string, ok: boolean) => {
    if (reportMsgTimer.current) clearTimeout(reportMsgTimer.current)
    setReportMsg({ text, ok })
    reportMsgTimer.current = setTimeout(() => setReportMsg(null), 5000)
  }

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
      setReportFeedback('Reporte enviado al equipo académico.', true)
    } catch {
      setReportFeedback('Error al enviar el reporte. Intenta de nuevo.', false)
    } finally {
      setSubmitting(false)
    }
  }

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
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <UniversidadLogo size="lg" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">Universidad Libre</p>
              <h1 className="text-2xl font-bold text-slate-900">Panel docente</h1>
              <p className="text-sm text-slate-600">{docente.tituloProfesional} {docente.nombreCompleto} · {docente.departamento}</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-right text-xs text-slate-600">
            <p className="font-bold text-slate-800">{docente.vinculacion}</p>
            {tab === 'horario' && !loadingSchedule
              ? <p>{totalHorasSchedule} / {docente.maxHorasSemana} horas semanales</p>
              : <p>{docente.maxHorasSemana} h máx. semanales</p>
            }
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="mt-4 flex flex-wrap gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {(['horario', 'disponibilidad', 'reportes', 'perfil'] as const).map((id) => (
          <button key={id} type="button" onClick={() => { setTab(id); setQ('') }}
            className={`rounded-full px-4 py-1.5 transition ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {id === 'horario' ? 'Mi horario' : id === 'disponibilidad' ? 'Mi disponibilidad' : id === 'reportes' ? 'Reportar novedad' : 'Mi perfil'}
          </button>
        ))}
      </section>

      {/* ── Horario ── */}
      {tab === 'horario' ? (
        <section className="mt-4 rounded-2xl border border-rose-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Mi horario publicado</h2>
              <p className="text-xs text-slate-500">Bloques asignados en el horario vigente.</p>
            </div>
            <input
              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none sm:max-w-xs focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Buscar asignatura, código, salón..." value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loadingSchedule ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Cargando horario...</p>
          ) : scheduleBlocks.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              <p className="font-semibold">No tienes un horario publicado aún.</p>
              <p className="mt-1 text-xs">Cuando coordinación publique el horario, aparecerá aquí.</p>
            </div>
          ) : (
            <>
              <div className="px-4 pt-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button type="button"
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${dayFilter === null ? 'bg-red-700 text-white' : 'bg-rose-100 text-slate-700 hover:bg-rose-200'}`}
                    onClick={() => setDayFilter(null)}>Todos</button>
                  {scheduleDays.map((d) => (
                    <button key={d.day_index} type="button"
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${dayFilter === d.day_index ? 'bg-red-700 text-white' : 'bg-rose-100 text-slate-700 hover:bg-rose-200'}`}
                      onClick={() => setDayFilter(d.day_index)}>{d.dia.slice(0, 3)}</button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
                {filteredBlocks.length === 0 ? (
                  <p className="col-span-full rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-8 text-center text-sm text-slate-500">
                    No hay bloques para ese filtro o búsqueda.
                  </p>
                ) : filteredBlocks.map((b) => (
                  <article key={`${b.group_id}-${b.day_index}-${b.slot_index}`}
                    className="rounded-xl border-l-4 border-l-red-700 bg-rose-50 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold tracking-wide text-rose-900">{b.asignatura}</h3>
                        <p className="text-xs font-semibold text-slate-600">{b.grupo_codigo} · {b.grupo_nombre}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-rose-200">
                        {b.hora}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{b.dia}</p>
                    <p className="mt-1 text-xs text-slate-600">Salón: {b.salon}</p>
                    <p className="mt-1 text-xs text-slate-500">{b.programa_nombre} · Sem. {b.semestre_num} · Sec. {b.grupo_seccion}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* ── Disponibilidad ── */}
      {tab === 'disponibilidad' ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Mi disponibilidad horaria</h2>
          <p className="mt-1 text-sm text-slate-600">
            Indica los bloques en los que estás disponible para ser asignado. Coordinación usará esta información al construir el horario.
          </p>
          <div className="mt-4">
            <DocenteDisponibilidadGrid docenteId={docente.id} nombreCompleto={docente.nombreCompleto} />
          </div>
        </section>
      ) : null}

      {/* ── Reportes ── */}
      {tab === 'reportes' ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <form className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={onSubmitReport}>
            <h2 className="text-lg font-bold text-slate-900">Reportar cruce o no disponibilidad</h2>
            <p className="mt-1 text-sm text-slate-600">Informa novedades para que coordinación ajuste la asignación.</p>
            <label className="mt-4 block text-sm font-semibold text-slate-800">
              Tipo de reporte
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
                <option value="cruce">Cruce de horario</option>
                <option value="no_disponibilidad">No disponibilidad</option>
                <option value="novedad">Otra novedad</option>
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-slate-800">
              Asignatura / grupo afectado
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Ej. Bases de Datos - Grupo A" value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)} required />
            </label>
            <label className="mt-3 block text-sm font-semibold text-slate-800">
              Detalle
              <textarea
                className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Describe la franja, el motivo y propuesta de ajuste..." value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)} required />
            </label>
            {reportMsg ? (
              <p className={`mt-2 text-sm font-semibold ${reportMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                {reportMsg.text}
              </p>
            ) : null}
            <button type="submit" disabled={submitting}
              className="mt-3 w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
              {submitting ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Mis reportes</h3>
            {loadingReports ? (
              <p className="mt-4 text-center text-sm text-slate-500">Cargando reportes...</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reports.map((r) => (
                  <li key={r.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">{REPORT_TYPE_LABEL[r.tipo as ReportType] ?? r.tipo}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${REPORT_STATUS_TONE[r.status] ?? 'bg-slate-100 text-slate-700'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{r.subject}</p>
                    <p className="mt-1 text-xs text-slate-600">{r.detail}</p>
                    {r.adminResponse ? (
                      <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 p-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700">Respuesta del administrador</p>
                        <p className="mt-0.5 text-xs text-sky-900">{r.adminResponse}</p>
                      </div>
                    ) : null}
                    <p className="mt-2 text-[11px] text-slate-400">Reportado: {r.createdAt}</p>
                  </li>
                ))}
                {reports.length === 0 ? (
                  <li className="py-4 text-center text-sm text-slate-500">Sin reportes registrados.</li>
                ) : null}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {/* ── Perfil ── */}
      {tab === 'perfil' ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Mi perfil docente</h2>
          <p className="mt-1 text-sm text-slate-600">Datos visibles para coordinación académica.</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Nombre</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.tituloProfesional} {docente.nombreCompleto}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Correo</dt>
              <dd className="mt-1 font-semibold text-blue-700">{docente.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Teléfono</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.telefono}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Departamento</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.departamento}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Vinculación</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">{docente.vinculacion}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Tope semanal</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.maxHorasSemana} h</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Grupos asignados</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.gruposActivos}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Asignaturas distintas</dt>
              <dd className="mt-1 font-semibold text-slate-900">{docente.asignaturasDistintas}</dd>
            </div>
            {docente.espaciosFrecuentes.length > 0 ? (
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">Espacios frecuentes</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {docente.espaciosFrecuentes.map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{s}</span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
    </main>
  )
}
