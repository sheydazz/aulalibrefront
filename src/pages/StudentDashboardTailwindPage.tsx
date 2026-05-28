import { useEffect, useMemo, useState, type DragEvent } from 'react'
import {
  apiGetPublishedCombos,
  apiGetScheduleOffer,
  apiGetStudentSchedule,
  type ApiGroup,
  type PublishedCombo,
  type StudentBlock,
} from '../services/api'
import {
  DAY_LABELS,
  type CardAccent,
  type DayKey,
  type ScheduleBlock,
} from '../data/studentSchedule'

type TabId = 'horario' | 'crear'
const DRAG_TYPE = 'application/x-aulalibre-student-materia'
const STUDENT_BUILDER_STORAGE_KEY = 'aulalibre-student-builder'
const BUILDER_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const
const BUILDER_SLOTS = [
  { id: 'b0', label: '07:00 - 09:00', locked: false },
  { id: 'b1', label: '09:00 - 11:00', locked: false },
  { id: 'b2', label: '11:00 - 13:00', locked: false },
  { id: 'lunch', label: '13:00 - 15:00', locked: true },
] as const

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
  map: Record<string, string | null>,
  slotIdx: number,
  dayIdx: number,
  materiaId: string,
): { ok: true } | { ok: false; reason: string } {
  const slot = BUILDER_SLOTS[slotIdx]
  if (!slot || slot.locked) return { ok: false, reason: 'El bloque de almuerzo no admite clases.' }
  const materia = findOfertaMateria(oferta, materiaId)
  if (!materia) return { ok: false, reason: 'Materia no encontrada.' }

  const sim = simulatePlacement(map, slotIdx, dayIdx, materiaId)
  const docente = (materia.docente ?? '').trim()
  if (docente && docente !== '—') {
    const norm = normalizeDocente(docente)
    for (let d = 0; d < BUILDER_DAYS.length; d++) {
      if (d === dayIdx) continue
      const otherId = sim[builderCellKey(slotIdx, d)]
      if (!otherId) continue
      const other = findOfertaMateria(oferta, otherId)
      if (other && normalizeDocente(other.docente ?? '') === norm) {
        return { ok: false, reason: `Cruce de docente: ${docente} ya ocupa esta franja.` }
      }
    }
  }
  return { ok: true }
}

function getBuilderStorageKey(selection: string) {
  return `${STUDENT_BUILDER_STORAGE_KEY}:${selection}`
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
  const [oferta, setOferta] = useState<ApiGroup[]>([])
  const [tab, setTab] = useState<TabId>('horario')

  // ── "Mi horario" state ──────────────────────────────────────────────────────
  const [combos, setCombos] = useState<PublishedCombo[]>([])
  const [selectedComboKey, setSelectedComboKey] = useState<string>('')
  const [scheduleByDay, setScheduleByDay] = useState<Record<DayKey, { morning: ScheduleBlock[]; afternoon: ScheduleBlock[] }> | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [day, setDay] = useState<DayKey>('lun')

  // ── "Crear mi horario" state ────────────────────────────────────────────────
  const [builderSelection, setBuilderSelection] = useState('5-A')
  const [builderAssignments, setBuilderAssignments] = useState<Record<string, string | null>>({})
  const [builderPendingIds, setBuilderPendingIds] = useState<Set<string>>(() => new Set())
  const [builderSearch, setBuilderSearch] = useState('')
  const [builderDragOverCell, setBuilderDragOverCell] = useState<{ key: string; valid: boolean } | null>(null)
  const [builderDraggingId, setBuilderDraggingId] = useState<string | null>(null)
  const [builderMessage, setBuilderMessage] = useState<string | null>(null)

  // Load schedule offer and published combos on mount
  useEffect(() => {
    apiGetScheduleOffer().then(setOferta).catch(() => {})
    apiGetPublishedCombos()
      .then((data) => {
        setCombos(data)
        if (data.length > 0) {
          const first = data[0]
          setSelectedComboKey(`${first.program_id}:${first.semestre_num}:${first.grupo_seccion}`)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch schedule whenever selected combo changes
  useEffect(() => {
    if (!selectedComboKey) {
      setScheduleByDay(null)
      return
    }
    const [programaId, semestreNumStr, grupoSeccion] = selectedComboKey.split(':')
    if (!programaId || !semestreNumStr || !grupoSeccion) return

    setScheduleLoading(true)
    setScheduleError(null)
    apiGetStudentSchedule({ programaId, semestreNum: Number(semestreNumStr), grupoSeccion })
      .then(({ bloques }) => {
        setScheduleByDay(transformBloques(bloques))
      })
      .catch(() => {
        setScheduleError('No se pudo cargar el horario. Intenta de nuevo.')
        setScheduleByDay(null)
      })
      .finally(() => setScheduleLoading(false))
  }, [selectedComboKey])

  const daySchedule = scheduleByDay?.[day] ?? { morning: [], afternoon: [] }

  // Builder derived data
  const builderOptions = useMemo(() => {
    const combosSet = new Set(oferta.map((m) => `${m.semestreNum}-${m.grupoSeccion}`))
    return [...combosSet]
      .map((key) => {
        const [semestreNum, grupoSeccion] = key.split('-')
        return { value: key, label: `${semestreNum}to Semestre - Grupo ${grupoSeccion}` }
      })
      .sort((a, b) => a.value.localeCompare(b.value, 'es'))
  }, [oferta])

  const builderCatalog = useMemo(() => {
    const [semestreStr, grupoSeccion] = builderSelection.split('-')
    const semestreNum = Number(semestreStr)
    return oferta.filter((m) => m.semestreNum === semestreNum && m.grupoSeccion === grupoSeccion)
  }, [builderSelection, oferta])

  useEffect(() => {
    const raw = localStorage.getItem(getBuilderStorageKey(builderSelection))
    if (!raw) {
      setBuilderAssignments({})
      setBuilderPendingIds(new Set(builderCatalog.map((m) => m.id)))
      setBuilderMessage(null)
      return
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, string | null>
      const validIds = new Set(builderCatalog.map((m) => m.id))
      const restored: Record<string, string | null> = {}
      for (const [key, materiaId] of Object.entries(parsed)) {
        if (!materiaId || !validIds.has(materiaId)) continue
        restored[key] = materiaId
      }
      setBuilderAssignments(restored)
      const usedIds = new Set(Object.values(restored).filter((id): id is string => Boolean(id)))
      setBuilderPendingIds(new Set(builderCatalog.map((m) => m.id).filter((id) => !usedIds.has(id))))
    } catch {
      setBuilderAssignments({})
      setBuilderPendingIds(new Set(builderCatalog.map((m) => m.id)))
    }
    setBuilderMessage(null)
  }, [builderCatalog, builderSelection])

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

  const onBuilderPlace = (slotIdx: number, dayIdx: number, materiaId: string) => {
    const key = builderCellKey(slotIdx, dayIdx)
    const v = validatePlacement(oferta, builderAssignments, slotIdx, dayIdx, materiaId)
    if (!v.ok) { setBuilderMessage(v.reason); return }
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
    const slot = BUILDER_SLOTS[slotIdx]
    if (slot?.locked) {
      setBuilderDragOverCell({ key: builderCellKey(slotIdx, dayIdx), valid: false })
      e.dataTransfer.dropEffect = 'none'
      return
    }
    const v = validatePlacement(oferta, builderAssignments, slotIdx, dayIdx, builderDraggingId)
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

  const onSaveBuilder = () => {
    localStorage.setItem(getBuilderStorageKey(builderSelection), JSON.stringify(builderAssignments))
    setBuilderMessage('Horario guardado correctamente en este navegador.')
  }

  // Label for current combo selection
  const selectedComboLabel = useMemo(() => {
    const [pid, snStr, gs] = selectedComboKey.split(':')
    const combo = combos.find((c) => c.program_id === pid && String(c.semestre_num) === snStr && c.grupo_seccion === gs)
    if (!combo) return 'Sin horario publicado'
    return `${combo.programa_nombre} · Sem. ${combo.semestre_num} - Grupo ${combo.grupo_seccion}`
  }, [selectedComboKey, combos])

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
              tab === 'crear'
                ? 'border-transparent bg-rose-50 text-rose-900'
                : 'border-white/35 bg-black/10 text-rose-50'
            }`}
            onClick={() => setTab('crear')}
          >
            Crear mi horario
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

      {tab === 'crear' ? (
        <main className="flex-1 px-4 py-6 sm:px-6">
          <section className="space-y-4 rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-rose-900">Crear mi horario</h2>
                <p className="text-sm text-slate-600">Elige semestre/grupo y arma tu horario con arrastrar y soltar.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900"
                  value={builderSelection}
                  onChange={(e) => setBuilderSelection(e.target.value)}
                >
                  {builderOptions.length === 0 ? (
                    <option value="5-A">Sin oferta disponible</option>
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
                  onClick={onSaveBuilder}
                  className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800"
                >
                  Guardar borrador
                </button>
              </div>
            </div>

            {builderMessage ? <p className="text-sm font-semibold text-red-700">{builderMessage}</p> : null}

            <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-rose-700">Materias pendientes</h3>
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
                      <p className="mt-1 text-slate-500">{m.horas} h semanales</p>
                    </li>
                  ))}
                  {builderCatalog.length > 0 && builderPendingList.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-rose-200 p-3 text-center text-xs text-slate-500">
                      Ya ubicaste todas las materias de esta oferta.
                    </li>
                  ) : null}
                  {builderCatalog.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-rose-200 p-3 text-center text-xs text-slate-400">
                      No hay materias en la oferta para este semestre/grupo.
                    </li>
                  ) : null}
                </ul>
              </aside>

              <section className="overflow-x-auto rounded-xl border border-rose-100">
                <table className="min-w-[620px] border-collapse text-center text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-rose-50 text-xs font-bold uppercase text-rose-700">
                      <th className="border-b border-rose-100 px-2 py-2">Hora</th>
                      {BUILDER_DAYS.map((d) => (
                        <th key={d} className="border-b border-l border-rose-100 px-2 py-2">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BUILDER_SLOTS.map((slot, slotIdx) => (
                      <tr key={slot.id}>
                        <td className="border-b border-rose-100 px-2 py-3 text-left text-xs font-bold text-slate-500">
                          {slot.label}
                        </td>
                        {BUILDER_DAYS.map((_, dayIdx) => {
                          const key = builderCellKey(slotIdx, dayIdx)
                          const materiaId = builderAssignments[key]
                          const m: ApiGroup | null = materiaId ? (findOfertaMateria(oferta, materiaId) ?? null) : null
                          const isOver = builderDragOverCell?.key === key
                          const validOver = builderDragOverCell?.valid ?? false

                          if (slot.locked) {
                            return (
                              <td key={key} className="border-b border-l border-rose-100 p-1">
                                <div className="flex min-h-[78px] items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-500">
                                  ALMUERZO
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
                                className={`relative min-h-[78px] rounded-lg p-2 text-left text-[11px] font-semibold ${
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
                                    <p className="pr-6 font-bold text-slate-900">{m.asignatura ?? 'Asignatura sin nombre'}</p>
                                    <p className="mt-1 text-[10px] text-slate-600">{m.docente ?? 'Sin docente asignado'}</p>
                                  </div>
                                ) : (
                                  <span className="flex min-h-[62px] items-center justify-center">Soltar aquí</span>
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
