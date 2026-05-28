import { useEffect, useMemo, useState, type DragEvent } from 'react'
import UniversidadLogo from '../components/UniversidadLogo'
import {
  apiGetPublishedCombos,
  apiGetPrograms,
  apiGetScheduleConfig,
  apiGetScheduleOffer,
  apiGetStudentPreselection,
  apiGetStudentSchedule,
  apiSubmitStudentPreselection,
  type ApiGroup,
  type ApiPreselection,
  type ApiPreselectionResult,
  type ApiProgram,
  type ApiScheduleDay,
  type ApiScheduleSlot,
  type PublishedCombo,
  type StudentBlock,
} from '../services/api'
import { getSession } from '../auth'
import {
  DAY_LABELS,
  type CardAccent,
  type DayKey,
  type ScheduleBlock,
} from '../data/studentSchedule'

type TabId = 'horario' | 'preseleccion'
const DRAG_TYPE = 'application/x-aulalibre-student-materia'
// Key prefix — includes user ID to prevent cross-user leakage in shared browsers
const BUILDER_STORAGE_PREFIX = 'aulalibre-student-builder'

// Fallback slots/days used before the config loads from backend
const FALLBACK_SLOTS: ApiScheduleSlot[] = [
  { slot_index: 0, label: '07:00 - 09:00', start_time: '07:00', end_time: '09:00', duration_hours: 2, locked: 0, active: 1 },
  { slot_index: 1, label: '09:00 - 11:00', start_time: '09:00', end_time: '11:00', duration_hours: 2, locked: 0, active: 1 },
  { slot_index: 2, label: '11:00 - 13:00', start_time: '11:00', end_time: '13:00', duration_hours: 2, locked: 0, active: 1 },
  { slot_index: 3, label: '13:00 - 15:00', start_time: '13:00', end_time: '15:00', duration_hours: 2, locked: 0, active: 1 },
  { slot_index: 4, label: '15:00 - 17:00', start_time: '15:00', end_time: '17:00', duration_hours: 2, locked: 0, active: 1 },
  { slot_index: 5, label: '17:00 - 19:00', start_time: '17:00', end_time: '19:00', duration_hours: 2, locked: 0, active: 1 },
  { slot_index: 6, label: '19:00 - 21:00', start_time: '19:00', end_time: '21:00', duration_hours: 2, locked: 0, active: 1 },
]
const FALLBACK_DAYS: ApiScheduleDay[] = [
  { day_index: 0, label: 'Lunes', active: 1 },
  { day_index: 1, label: 'Martes', active: 1 },
  { day_index: 2, label: 'Miércoles', active: 1 },
  { day_index: 3, label: 'Jueves', active: 1 },
  { day_index: 4, label: 'Viernes', active: 1 },
  { day_index: 5, label: 'Sábado', active: 1 },
]

const ACCENT_CYCLE: CardAccent[] = ['emerald', 'violet', 'amber', 'teal', 'slate', 'orange']

const ACCENT_STYLES: Record<CardAccent, string> = {
  emerald: 'border-l-emerald-600 bg-emerald-50 text-emerald-900',
  violet: 'border-l-violet-600 bg-violet-50 text-violet-900',
  amber: 'border-l-amber-600 bg-amber-50 text-amber-900',
  teal: 'border-l-teal-600 bg-teal-50 text-teal-900',
  slate: 'border-l-slate-600 bg-slate-50 text-slate-900',
  orange: 'border-l-orange-600 bg-orange-50 text-orange-900',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function builderCellKey(slotIdx: number, dayIdx: number) {
  return `${slotIdx}-${dayIdx}`
}

function normalizeDocente(s: string) {
  return s.trim().toLowerCase().replace(/[.,\s]+/g, '')
}

function findOfertaMateria(oferta: ApiGroup[], id: string): ApiGroup | undefined {
  return oferta.find((m) => m.id === id)
}

function simulatePlacement(
  map: Record<string, string | null>,
  slotIdx: number,
  dayIdx: number,
  materiaId: string,
): Record<string, string | null> {
  const key = builderCellKey(slotIdx, dayIdx)
  const out: Record<string, string | null> = {}
  for (const [k, v] of Object.entries(map)) {
    if (!v || v === materiaId) continue
    if (k === key) continue
    out[k] = v
  }
  out[key] = materiaId
  return out
}

function validatePlacement(
  oferta: ApiGroup[],
  slots: ApiScheduleSlot[],
  map: Record<string, string | null>,
  slotIdx: number,
  dayIdx: number,
  materiaId: string,
): { ok: true } | { ok: false; reason: string } {
  const slot = slots[slotIdx]
  if (!slot || slot.locked) return { ok: false, reason: 'Este bloque no admite clases.' }
  const materia = findOfertaMateria(oferta, materiaId)
  if (!materia) return { ok: false, reason: 'Materia no encontrada.' }

  const sim = simulatePlacement(map, slotIdx, dayIdx, materiaId)
  const docente = (materia.docente ?? '').trim()
  if (docente && docente !== '—') {
    const norm = normalizeDocente(docente)
    for (const key of Object.keys(sim)) {
      const [sIdx, dIdx] = key.split('-').map(Number)
      if (sIdx === slotIdx && dIdx === dayIdx) continue
      if (sIdx !== slotIdx) continue
      const otherId = sim[key]
      if (!otherId) continue
      const other = findOfertaMateria(oferta, otherId)
      if (other && normalizeDocente(other.docente ?? '') === norm) {
        return { ok: false, reason: `Cruce de docente: ${docente} ya ocupa esta franja.` }
      }
    }
  }
  return { ok: true }
}

/** Unique localStorage key per user and builder selection to prevent cross-user leaks. */
function getBuilderStorageKey(userId: number | null, selection: string) {
  return `${BUILDER_STORAGE_PREFIX}:${userId ?? 'anon'}:${selection}`
}

const DAY_INDEX_TO_KEY: Record<number, DayKey> = { 0: 'lun', 1: 'mar', 2: 'mie', 3: 'jue', 4: 'vie', 5: 'sab' }

function transformBloques(
  bloques: StudentBlock[],
): Record<DayKey, { morning: ScheduleBlock[]; afternoon: ScheduleBlock[] }> {
  const subjectAccents = new Map<string, CardAccent>()
  let accentIdx = 0

  const byDay: Record<DayKey, StudentBlock[]> = { lun: [], mar: [], mie: [], jue: [], vie: [], sab: [] }
  for (const b of bloques) {
    const key = DAY_INDEX_TO_KEY[b.day_index]
    if (!key) continue
    if (!subjectAccents.has(b.asignatura)) {
      subjectAccents.set(b.asignatura, ACCENT_CYCLE[accentIdx % ACCENT_CYCLE.length])
      accentIdx++
    }
    byDay[key].push(b)
  }
  for (const blocks of Object.values(byDay)) {
    blocks.sort((a, c) => a.start_time.localeCompare(c.start_time))
  }

  const result = {} as Record<DayKey, { morning: ScheduleBlock[]; afternoon: ScheduleBlock[] }>
  for (const key of Object.keys(byDay) as DayKey[]) {
    const morning: ScheduleBlock[] = []
    const afternoon: ScheduleBlock[] = []
    for (const b of byDay[key]) {
      const block: ScheduleBlock = {
        type: 'class',
        start: b.start_time,
        end: b.end_time,
        title: (b.asignatura ?? '').toUpperCase(),
        professor: b.docente ?? 'Sin docente asignado',
        location: b.salon,
        accent: subjectAccents.get(b.asignatura) ?? 'emerald',
      }
      if (b.start_time < '13:00') morning.push(block)
      else afternoon.push(block)
    }
    if (morning.length === 0) morning.push({ type: 'empty', start: '07:00', end: '13:00' })
    if (afternoon.length === 0) afternoon.push({ type: 'empty', start: '13:00', end: '21:00' })
    result[key] = { morning, afternoon }
  }
  return result
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentDashboardTailwindPage() {
  // Current user ID (for localStorage key isolation)
  const [userId, setUserId] = useState<number | null>(null)

  // Schedule config from backend
  const [configSlots, setConfigSlots] = useState<ApiScheduleSlot[]>(FALLBACK_SLOTS)
  const [configDays, setConfigDays] = useState<ApiScheduleDay[]>(FALLBACK_DAYS)

  const [oferta, setOferta] = useState<ApiGroup[]>([])
  const [programs, setPrograms] = useState<ApiProgram[]>([])
  const [tab, setTab] = useState<TabId>('horario')

  // ── "Mi horario" state ──────────────────────────────────────────────────────
  const [combos, setCombos] = useState<PublishedCombo[]>([])
  const [selectedComboKey, setSelectedComboKey] = useState<string>('')
  const [scheduleByDay, setScheduleByDay] = useState<Record<DayKey, { morning: ScheduleBlock[]; afternoon: ScheduleBlock[] }> | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [day, setDay] = useState<DayKey>('lun')

  // ── "Preselección" state ────────────────────────────────────────────────────
  // Key format: "programaId::semestreNum::grupoSeccion" — unambiguous across programs
  const [builderSelection, setBuilderSelection] = useState('')
  const [builderAssignments, setBuilderAssignments] = useState<Record<string, string | null>>({})
  const [builderPendingIds, setBuilderPendingIds] = useState<Set<string>>(new Set())
  const [builderSearch, setBuilderSearch] = useState('')
  const [builderDragOverCell, setBuilderDragOverCell] = useState<{ key: string; valid: boolean } | null>(null)
  const [builderDraggingId, setBuilderDraggingId] = useState<string | null>(null)
  const [builderMessage, setBuilderMessage] = useState<string | null>(null)
  const [builderMessageType, setBuilderMessageType] = useState<'error' | 'success' | 'warning'>('error')
  const [isSaving, setIsSaving] = useState(false)
  const [savedPreselection, setSavedPreselection] = useState<ApiPreselection | null>(null)

  // ── Initial data load ───────────────────────────────────────────────────────
  useEffect(() => {
    const session = getSession()
    setUserId(session?.id ?? null)

    apiGetScheduleConfig()
      .then(({ days, slots }) => {
        const activeDays = days.filter((d) => d.active)
        const activeSlots = slots.filter((s) => s.active)
        if (activeDays.length > 0) setConfigDays(activeDays)
        if (activeSlots.length > 0) setConfigSlots(activeSlots)
      })
      .catch(() => { /* use fallback */ })

    apiGetScheduleOffer().then(setOferta).catch(() => {})
    apiGetPrograms().then(setPrograms).catch(() => {})
    apiGetPublishedCombos()
      .then((data) => {
        setCombos(data)
        if (data.length > 0) {
          const first = data[0]
          setSelectedComboKey(`${first.program_id}:${first.semestre_num}:${first.grupo_seccion}`)
        }
      })
      .catch(() => {})

    // Load student's existing preselection from backend
    apiGetStudentPreselection()
      .then((data) => { if (data) setSavedPreselection(data) })
      .catch(() => {})
  }, [])

  // Set default builder selection once offer loads
  useEffect(() => {
    if (oferta.length > 0 && !builderSelection) {
      const first = oferta.find((m) => m.programaId && m.semestreNum && m.grupoSeccion)
      if (first) {
        setBuilderSelection(`${first.programaId}::${first.semestreNum}::${first.grupoSeccion}`)
      }
    }
  }, [oferta, builderSelection])

  // Fetch schedule whenever selected combo changes
  useEffect(() => {
    if (!selectedComboKey) { setScheduleByDay(null); return }
    const [programaId, semestreNumStr, grupoSeccion] = selectedComboKey.split(':')
    if (!programaId || !semestreNumStr || !grupoSeccion) return

    setScheduleLoading(true)
    setScheduleError(null)
    apiGetStudentSchedule({ programaId, semestreNum: Number(semestreNumStr), grupoSeccion })
      .then(({ bloques }) => setScheduleByDay(transformBloques(bloques)))
      .catch(() => {
        setScheduleError('No se pudo cargar el horario. Intenta de nuevo.')
        setScheduleByDay(null)
      })
      .finally(() => setScheduleLoading(false))
  }, [selectedComboKey])

  const daySchedule = scheduleByDay?.[day] ?? { morning: [], afternoon: [] }

  // ── Builder derived data ────────────────────────────────────────────────────

  const builderOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    for (const m of oferta) {
      if (!m.programaId || !m.semestreNum || !m.grupoSeccion) continue
      const key = `${m.programaId}::${m.semestreNum}::${m.grupoSeccion}`
      if (seen.has(key)) continue
      seen.add(key)
      const progNombre = programs.find((p) => p.id === m.programaId)?.nombre ?? m.programaId?.toUpperCase() ?? ''
      opts.push({ value: key, label: `${progNombre} · Sem. ${m.semestreNum} - Grupo ${m.grupoSeccion}` })
    }
    return opts.sort((a, b) => a.value.localeCompare(b.value, 'es'))
  }, [oferta, programs])

  const builderCatalog = useMemo(() => {
    if (!builderSelection) return []
    const [programaId, semestreStr, grupoSeccion] = builderSelection.split('::')
    const semestreNum = Number(semestreStr)
    return oferta.filter(
      (m) => m.programaId === programaId && m.semestreNum === semestreNum && m.grupoSeccion === grupoSeccion,
    )
  }, [builderSelection, oferta])

  // Restore layout from localStorage (visual only — authoritative data is backend)
  useEffect(() => {
    if (!builderSelection) return
    setBuilderMessage(null)

    const storageKey = getBuilderStorageKey(userId, builderSelection)
    const raw = localStorage.getItem(storageKey)
    const validIds = new Set(builderCatalog.map((m) => m.id))

    let restored: Record<string, string | null> = {}
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, string | null>
        for (const [key, materiaId] of Object.entries(parsed)) {
          if (materiaId && validIds.has(materiaId)) restored[key] = materiaId
        }
      } catch {
        restored = {}
      }
    }

    // If backend has a preselection for this selection, use those group IDs
    // and place them into cells if no local layout exists
    if (savedPreselection && !raw) {
      const [programaId, semestreStr, grupoSeccion] = builderSelection.split('::')
      if (
        savedPreselection.programId === programaId &&
        String(savedPreselection.semestreNum) === semestreStr &&
        savedPreselection.groups.every((g) => !grupoSeccion || g.grupo_seccion === grupoSeccion)
      ) {
        let slotI = 0
        let dayI = 0
        for (const g of savedPreselection.groups) {
          if (!validIds.has(g.id)) continue
          while (configSlots[slotI]?.locked && slotI < configSlots.length) slotI++
          if (slotI >= configSlots.length) break
          restored[builderCellKey(slotI, dayI)] = g.id
          dayI++
          if (dayI >= configDays.length) { dayI = 0; slotI++ }
        }
      }
    }

    setBuilderAssignments(restored)
    const usedIds = new Set(Object.values(restored).filter((id): id is string => Boolean(id)))
    setBuilderPendingIds(new Set(builderCatalog.map((m) => m.id).filter((id) => !usedIds.has(id))))
  }, [builderCatalog, builderSelection, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const builderPendingList = useMemo(() => {
    const q = builderSearch.trim().toLowerCase()
    return builderCatalog.filter((m) => builderPendingIds.has(m.id)).filter(
      (m) =>
        !q ||
        (m.asignatura ?? '').toLowerCase().includes(q) ||
        (m.docente ?? '').toLowerCase().includes(q) ||
        m.semestre.toLowerCase().includes(q),
    )
  }, [builderCatalog, builderPendingIds, builderSearch])

  const activeDays = configDays.filter((d) => d.active)
  const activeSlots = configSlots.filter((s) => s.active)

  // ── Builder actions ─────────────────────────────────────────────────────────

  const onBuilderPlace = (slotIdx: number, dayIdx: number, materiaId: string) => {
    const key = builderCellKey(slotIdx, dayIdx)
    const v = validatePlacement(oferta, activeSlots, builderAssignments, slotIdx, dayIdx, materiaId)
    if (!v.ok) { setBuilderMessage(v.reason); setBuilderMessageType('error'); return }
    setBuilderMessage(null)
    const previousId = builderAssignments[key] ?? null
    const newMap = simulatePlacement(builderAssignments, slotIdx, dayIdx, materiaId)
    setBuilderAssignments(newMap)
    setBuilderPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(materiaId)
      if (previousId && previousId !== materiaId) next.add(previousId)
      return next
    })
  }

  const onBuilderClearCell = (slotIdx: number, dayIdx: number) => {
    const key = builderCellKey(slotIdx, dayIdx)
    const id = builderAssignments[key]
    if (!id) return
    setBuilderAssignments((prev) => { const next = { ...prev }; delete next[key]; return next })
    setBuilderPendingIds((prev) => new Set(prev).add(id))
    setBuilderMessage(null)
  }

  const onBuilderDragStart = (e: DragEvent, materiaId: string) => {
    e.dataTransfer.setData(DRAG_TYPE, materiaId)
    e.dataTransfer.effectAllowed = 'move'
    setBuilderDraggingId(materiaId)
    setBuilderMessage(null)
  }

  const onBuilderDragEnd = () => { setBuilderDraggingId(null); setBuilderDragOverCell(null) }

  const onBuilderDragOver = (e: DragEvent, slotIdx: number, dayIdx: number) => {
    e.preventDefault()
    if (!builderDraggingId) { setBuilderDragOverCell(null); return }
    const slot = activeSlots[slotIdx]
    if (slot?.locked) {
      setBuilderDragOverCell({ key: builderCellKey(slotIdx, dayIdx), valid: false })
      e.dataTransfer.dropEffect = 'none'
      return
    }
    const v = validatePlacement(oferta, activeSlots, builderAssignments, slotIdx, dayIdx, builderDraggingId)
    setBuilderDragOverCell({ key: builderCellKey(slotIdx, dayIdx), valid: v.ok })
    e.dataTransfer.dropEffect = v.ok ? 'move' : 'none'
  }

  const onBuilderDrop = (e: DragEvent, slotIdx: number, dayIdx: number) => {
    e.preventDefault()
    const materiaId = e.dataTransfer.getData(DRAG_TYPE) || builderDraggingId
    setBuilderDragOverCell(null)
    setBuilderDraggingId(null)
    if (!materiaId) return
    onBuilderPlace(slotIdx, dayIdx, materiaId)
  }

  const onSavePreselection = async () => {
    const groupIds = [...new Set(
      Object.values(builderAssignments).filter((id): id is string => Boolean(id))
    )]
    if (groupIds.length === 0) {
      setBuilderMessage('Agrega al menos una materia antes de enviar la preselección.')
      setBuilderMessageType('error')
      return
    }

    setIsSaving(true)
    setBuilderMessage(null)

    // Save visual layout to localStorage (user-isolated) for next session
    localStorage.setItem(
      getBuilderStorageKey(userId, builderSelection),
      JSON.stringify(builderAssignments),
    )

    const [programaId, semestreStr] = builderSelection.split('::')

    try {
      const result: ApiPreselectionResult = await apiSubmitStudentPreselection({
        groupIds,
        programaId,
        semestreNum: Number(semestreStr),
      })

      if (result.status === 'validado') {
        setBuilderMessage(`Preselección enviada correctamente. ${groupIds.length} materia(s) registrada(s) sin conflictos.`)
        setBuilderMessageType('success')
      } else {
        setBuilderMessage(`Preselección enviada con ${result.conflicts.length} conflicto(s) detectado(s). Revisa los detalles abajo.`)
        setBuilderMessageType('warning')
      }

      // Refresh the saved preselection from backend
      apiGetStudentPreselection().then((data) => { if (data) setSavedPreselection(data) }).catch(() => {})
    } catch (err) {
      setBuilderMessage(`Error al enviar la preselección: ${(err as Error).message}`)
      setBuilderMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  // Label for current combo selection
  const selectedComboLabel = useMemo(() => {
    const [pid, snStr, gs] = selectedComboKey.split(':')
    const combo = combos.find((c) => c.program_id === pid && String(c.semestre_num) === snStr && c.grupo_seccion === gs)
    if (!combo) return 'Sin horario publicado'
    return `${combo.programa_nombre} · Sem. ${combo.semestre_num} - Grupo ${combo.grupo_seccion}`
  }, [selectedComboKey, combos])

  const selectedGroupCount = Object.values(builderAssignments).filter(Boolean).length

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-rose-50 text-rose-900 lg:my-6 lg:overflow-hidden lg:rounded-3xl lg:shadow-2xl lg:shadow-rose-900/10">
      <header className="rounded-b-3xl bg-gradient-to-br from-red-700 via-rose-700 to-red-800 px-4 pb-4 pt-5 text-rose-50 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <UniversidadLogo size="md" className="bg-white/95 ring-white/40" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-100/90">
                Universidad Libre
              </p>
              <h1 className="text-2xl font-bold leading-tight">Horario Académico</h1>
              <p className="mt-0.5 text-sm font-medium text-rose-100">Sede Barranquilla · AulaLibre</p>
            </div>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 print:hidden">
            🔔
          </button>
        </div>

        <nav className="mt-4 flex gap-2 print:hidden">
          <button
            type="button"
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              tab === 'horario'
                ? 'border-transparent bg-rose-50 text-rose-900'
                : 'border-white/35 bg-black/10 text-rose-50'
            }`}
            onClick={() => setTab('horario')}
          >
            Mi horario
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              tab === 'preseleccion'
                ? 'border-transparent bg-rose-50 text-rose-900'
                : 'border-white/35 bg-black/10 text-rose-50'
            }`}
            onClick={() => setTab('preseleccion')}
          >
            Preselección
          </button>
        </nav>

        {tab === 'horario' ? (
          <div className="mt-4 flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-widest text-rose-100">
              <span>Programa · Semestre · Grupo</span>
              {combos.length === 0 ? (
                <p className="rounded-xl border border-white/30 bg-rose-50/20 px-3 py-2 text-sm font-semibold text-rose-100">
                  {scheduleLoading ? 'Cargando...' : 'No hay horarios publicados aún.'}
                </p>
              ) : (
                <select
                  className="w-full rounded-xl border border-white/30 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900"
                  value={selectedComboKey}
                  onChange={(e) => setSelectedComboKey(e.target.value)}
                >
                  {combos.map((c) => {
                    const key = `${c.program_id}:${c.semestre_num}:${c.grupo_seccion}`
                    return (
                      <option key={key} value={key}>
                        {c.programa_nombre} · Sem. {c.semestre_num} - Grupo {c.grupo_seccion}
                      </option>
                    )
                  })}
                </select>
              )}
            </label>
          </div>
        ) : null}
      </header>

      {tab === 'preseleccion' ? (
        <main className="flex-1 px-4 py-6 sm:px-6">
          {/* Info banner */}
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-100/60 px-4 py-3 text-sm text-rose-800">
            <span className="font-bold">Nota:</span> Esta es una preselección de materias. No garantiza que sea tu horario definitivo. El administrador construirá y publicará el horario oficial una vez procese todas las solicitudes.
          </div>

          <section className="space-y-4 rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-rose-900">Preselección de horario</h2>
                <p className="text-sm text-slate-600">
                  Elige el semestre/grupo y arrastra las materias que deseas cursar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900"
                  value={builderSelection}
                  onChange={(e) => setBuilderSelection(e.target.value)}
                >
                  {builderOptions.length === 0 ? (
                    <option value="">Cargando oferta...</option>
                  ) : (
                    builderOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={onSavePreselection}
                  disabled={isSaving || selectedGroupCount === 0}
                  className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Enviando...' : `Enviar preselección${selectedGroupCount > 0 ? ` (${selectedGroupCount})` : ''}`}
                </button>
              </div>
            </div>

            {/* Feedback message */}
            {builderMessage ? (
              <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                builderMessageType === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : builderMessageType === 'warning'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {builderMessage}
              </p>
            ) : null}

            {/* Previous preselection status */}
            {savedPreselection && (
              <div className={`rounded-lg border px-3 py-2 text-sm ${
                savedPreselection.status === 'validado'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : savedPreselection.status === 'conflicto'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
                <p className="font-bold">
                  Preselección guardada — {savedPreselection.status === 'validado' ? '✓ Sin conflictos' : savedPreselection.status === 'conflicto' ? '⚠ Con conflictos' : 'Pendiente de validación'}
                </p>
                <p className="mt-0.5 text-xs opacity-80">
                  {savedPreselection.groups.length} materia(s) · Actualizada {new Date(savedPreselection.updatedAt).toLocaleDateString('es-CO')}
                </p>
                {savedPreselection.conflicts.length > 0 && (
                  <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
                    {savedPreselection.conflicts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
              {/* Pending subjects sidebar */}
              <aside className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-rose-700">Materias disponibles</h3>
                <input
                  className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
                  placeholder="Buscar materia o docente..."
                  value={builderSearch}
                  onChange={(e) => setBuilderSearch(e.target.value)}
                />
                <ul className="mt-3 space-y-2">
                  {builderPendingList.map((m) => (
                    <li
                      key={m.id}
                      draggable
                      onDragStart={(e) => onBuilderDragStart(e, m.id)}
                      onDragEnd={onBuilderDragEnd}
                      className="cursor-grab rounded-lg border border-rose-200 bg-white p-3 text-xs active:cursor-grabbing"
                    >
                      <p className="font-bold text-slate-900">{m.asignatura ?? 'Asignatura sin nombre'}</p>
                      <p className="mt-1 text-slate-600">{m.docente ?? 'Sin docente asignado'}</p>
                      <p className="mt-1 text-slate-500">{m.horas} h semanales · Cupo: {m.cupoMax}</p>
                    </li>
                  ))}
                  {builderCatalog.length > 0 && builderPendingList.length === 0 && builderSearch === '' ? (
                    <li className="rounded-lg border border-dashed border-emerald-200 p-3 text-center text-xs text-emerald-700 bg-emerald-50">
                      ✓ Todas las materias están en el horario.
                    </li>
                  ) : null}
                  {builderCatalog.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-rose-200 p-3 text-center text-xs text-slate-400">
                      No hay oferta de materias para este semestre/grupo.
                    </li>
                  ) : null}
                </ul>
              </aside>

              {/* Builder grid */}
              <section className="overflow-x-auto rounded-xl border border-rose-100">
                <table className="min-w-[520px] border-collapse text-center text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-rose-50 text-xs font-bold uppercase text-rose-700">
                      <th className="border-b border-rose-100 px-2 py-2 text-left">Franja</th>
                      {activeDays.map((d) => (
                        <th key={d.day_index} className="border-b border-l border-rose-100 px-2 py-2">{d.label.slice(0, 3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSlots.map((slot, slotIdx) => (
                      <tr key={slot.slot_index}>
                        <td className="border-b border-rose-100 px-2 py-3 text-left text-[11px] font-bold text-slate-500 whitespace-nowrap">
                          {slot.label}
                          {slot.locked ? <span className="ml-1 text-slate-400">(bloq.)</span> : null}
                        </td>
                        {activeDays.map((_, dayIdx) => {
                          const key = builderCellKey(slotIdx, dayIdx)
                          const materiaId = builderAssignments[key]
                          const m: ApiGroup | null = materiaId ? (findOfertaMateria(oferta, materiaId) ?? null) : null
                          const isOver = builderDragOverCell?.key === key
                          const validOver = builderDragOverCell?.valid ?? false

                          if (slot.locked) {
                            return (
                              <td key={key} className="border-b border-l border-rose-100 p-1">
                                <div className="flex min-h-[64px] items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-400">
                                  —
                                </div>
                              </td>
                            )
                          }

                          return (
                            <td key={key} className="border-b border-l border-rose-100 p-1">
                              <div
                                role="button"
                                tabIndex={0}
                                onDragOver={(e) => onBuilderDragOver(e, slotIdx, dayIdx)}
                                onDragLeave={() => setBuilderDragOverCell(null)}
                                onDrop={(e) => onBuilderDrop(e, slotIdx, dayIdx)}
                                className={`relative min-h-[64px] rounded-lg p-2 text-left text-[11px] font-semibold ${
                                  m
                                    ? 'bg-rose-100/80 text-slate-800 ring-1 ring-rose-200'
                                    : isOver
                                      ? validOver
                                        ? 'border-2 border-dashed border-emerald-400 bg-emerald-50/80'
                                        : 'border-2 border-dashed border-red-400 bg-red-50/80'
                                      : 'border border-dashed border-rose-200 text-slate-400'
                                }`}
                              >
                                {m ? (
                                  <div
                                    draggable
                                    onDragStart={(e) => { e.stopPropagation(); onBuilderDragStart(e, m.id) }}
                                    onDragEnd={onBuilderDragEnd}
                                    className="cursor-grab active:cursor-grabbing"
                                  >
                                    <button
                                      type="button"
                                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded text-slate-500 hover:bg-white hover:text-red-700"
                                      onClick={() => onBuilderClearCell(slotIdx, dayIdx)}
                                      aria-label="Quitar materia"
                                    >
                                      ✕
                                    </button>
                                    <p className="pr-6 font-bold text-slate-900 leading-tight">{m.asignatura ?? '—'}</p>
                                    <p className="mt-1 text-[10px] text-slate-500">{m.docente ?? '—'}</p>
                                  </div>
                                ) : (
                                  <span className="flex min-h-[48px] items-center justify-center text-[10px]">Soltar</span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </section>
        </main>
      ) : (
        <>
          <div className="bg-rose-50 px-4 pt-3 sm:px-6 print:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DAY_LABELS.map(({ key, short }) => (
                <button
                  key={key}
                  type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    day === key
                      ? 'bg-red-700 text-white'
                      : 'bg-rose-100 text-slate-700 hover:bg-rose-200'
                  }`}
                  onClick={() => setDay(key)}
                >
                  {short}
                </button>
              ))}
            </div>
          </div>

          <main className="flex-1 px-4 py-4 pb-24 sm:px-6">
            {scheduleLoading ? (
              <div className="flex items-center justify-center py-16 text-rose-700 font-semibold">
                Cargando horario...
              </div>
            ) : scheduleError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {scheduleError}
              </div>
            ) : combos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-rose-300 bg-rose-100/40 p-8 text-center">
                <p className="text-base font-bold text-rose-800">No hay horarios publicados</p>
                <p className="mt-1 text-sm text-rose-600">El administrador aún no ha publicado ningún horario.</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{selectedComboLabel}</p>
                <section className="mb-6">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Jornada mañana
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {daySchedule.morning.map((block, i) => (
                      <ScheduleCard key={`${block.type}-${block.start}-${i}`} block={block} />
                    ))}
                  </div>
                </section>
                <section className="mb-6">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Jornada tarde / noche
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {daySchedule.afternoon.map((block, i) => (
                      <ScheduleCard key={`${block.type}-${block.start}-${i}`} block={block} />
                    ))}
                  </div>
                </section>
              </>
            )}
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-red-700 to-rose-700 px-4 py-3 text-sm font-bold text-white print:hidden"
              onClick={() => window.print()}
            >
              Descargar horario (PDF)
            </button>
          </main>
        </>
      )}

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-rose-200 bg-rose-50/90 px-4 py-3 text-sm backdrop-blur print:hidden sm:px-6">
        <span className="font-semibold text-slate-600">AulaLibre · Estudiante</span>
        <span className="font-medium text-slate-500">Usa "Salir" en la barra superior</span>
      </footer>
    </div>
  )
}

function ScheduleCard({ block }: { block: ScheduleBlock }) {
  if (block.type === 'empty') {
    return (
      <article className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="mb-1 text-xs font-bold text-slate-700">
          {block.start} - {block.end}
        </div>
        <p className="text-sm font-semibold text-slate-500">Sin clases programadas</p>
      </article>
    )
  }

  return (
    <article className={`rounded-xl border-l-4 p-4 shadow-sm ${ACCENT_STYLES[block.accent]}`}>
      <div className="mb-2 text-xs font-bold text-slate-700">
        {block.start} - {block.end}
      </div>
      <h3 className="mb-2 text-base font-extrabold tracking-wide">{block.title}</h3>
      <p className="flex flex-col gap-1 text-sm font-medium">
        <span>{block.professor}</span>
        <span>{block.location}</span>
      </p>
    </article>
  )
}
