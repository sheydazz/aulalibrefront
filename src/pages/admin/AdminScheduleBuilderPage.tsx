import { useEffect, useMemo, useState, type DragEvent } from 'react'
import {
  MOCK_ESPACIOS,
  MOCK_OFERTA_MATERIAS,
  MOCK_PROGRAMAS,
  type ItemHorarioMateria,
} from '../../data/adminMockData'

const DEFAULT_SALON_CODIGO = MOCK_ESPACIOS[0]?.codigo ?? 'B-201'

const TIME_SLOTS = [
  { id: 'b0', label: '07:00 – 09:00', locked: false },
  { id: 'b1', label: '09:00 – 11:00', locked: false },
  { id: 'b2', label: '11:00 – 13:00', locked: false },
  { id: 'lunch', label: '13:00 – 15:00', locked: true },
] as const

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const

function cellKey(slotIdx: number, dayIdx: number) {
  return `${slotIdx}-${dayIdx}`
}

function normalizeDocente(s: string) {
  return s.trim().toLowerCase().replace(/[.,\s]+/g, '')
}

function findMateria(id: string): ItemHorarioMateria | undefined {
  return MOCK_OFERTA_MATERIAS.find((g) => g.id === id)
}

function findSalon(codigo: string) {
  return MOCK_ESPACIOS.find((s) => s.codigo === codigo)
}

const DRAG_TYPE = 'application/x-aulalibre-grupo'

function simulatePlacement(
  map: Record<string, string | null>,
  slotIdx: number,
  dayIdx: number,
  grupoId: string,
): Record<string, string | null> {
  const key = cellKey(slotIdx, dayIdx)
  const out: Record<string, string | null> = {}
  for (const [k, v] of Object.entries(map)) {
    if (!v || v === grupoId) continue
    if (k === key) continue
    out[k] = v
  }
  out[key] = grupoId
  return out
}

function validatePlacement(
  map: Record<string, string | null>,
  slotIdx: number,
  dayIdx: number,
  grupoId: string,
): { ok: true } | { ok: false; reason: string } {
  const slot = TIME_SLOTS[slotIdx]
  if (!slot || slot.locked) {
    return { ok: false, reason: 'Este bloque no admite clases (almuerzo / bloqueado).' }
  }
  const grupo = findMateria(grupoId)
  if (!grupo) return { ok: false, reason: 'Materia no encontrada.' }

  const sim = simulatePlacement(map, slotIdx, dayIdx, grupoId)
  const doc = grupo.docente.trim()
  if (doc && doc !== '—') {
    const norm = normalizeDocente(doc)
    for (let d = 0; d < DAYS.length; d++) {
      if (d === dayIdx) continue
      const otherId = sim[cellKey(slotIdx, d)]
      if (!otherId) continue
      const other = findMateria(otherId)
      if (other && normalizeDocente(other.docente) === norm) {
        return {
          ok: false,
          reason: `Cruce de docente: ${grupo.docente} ya está asignado en este mismo horario en otra columna.`,
        }
      }
    }
  }
  return { ok: true }
}

const firstOferta = MOCK_OFERTA_MATERIAS[0]

export default function AdminScheduleBuilderPage() {
  // Constructor visual: arma horario por programa/semestre/grupo.
  const [programaId, setProgramaId] = useState(firstOferta.programaId)
  const [semestreNum, setSemestreNum] = useState(firstOferta.semestreNum)
  const [grupoSeccion, setGrupoSeccion] = useState(firstOferta.grupoSeccion)

  const semestresOpciones = useMemo(() => {
    // Lista de semestres disponibles para el programa seleccionado.
    const s = new Set(MOCK_OFERTA_MATERIAS.filter((m) => m.programaId === programaId).map((m) => m.semestreNum))
    return [...s].sort((a, b) => a - b)
  }, [programaId])

  const gruposOpciones = useMemo(() => {
    // Lista de grupos existentes dentro del semestre actual.
    const s = new Set(
      MOCK_OFERTA_MATERIAS.filter((m) => m.programaId === programaId && m.semestreNum === semestreNum).map(
        (m) => m.grupoSeccion,
      ),
    )
    return [...s].sort()
  }, [programaId, semestreNum])

  useEffect(() => {
    if (semestresOpciones.length > 0 && !semestresOpciones.includes(semestreNum)) {
      setSemestreNum(semestresOpciones[0])
    }
  }, [programaId, semestresOpciones, semestreNum])

  useEffect(() => {
    if (gruposOpciones.length > 0 && !gruposOpciones.includes(grupoSeccion)) {
      setGrupoSeccion(gruposOpciones[0])
    }
  }, [programaId, semestreNum, gruposOpciones, grupoSeccion])

  const catalog = useMemo(
    // Catálogo de materias específico para combinación seleccionada.
    () =>
      MOCK_OFERTA_MATERIAS.filter(
        (m) => m.programaId === programaId && m.semestreNum === semestreNum && m.grupoSeccion === grupoSeccion,
      ),
    [programaId, semestreNum, grupoSeccion],
  )

  const [assignments, setAssignments] = useState<Record<string, string | null>>({})
  const [salonByCell, setSalonByCell] = useState<Record<string, string>>({})
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [search, setSearch] = useState('')
  const [dragOverCell, setDragOverCell] = useState<{ key: string; valid: boolean } | null>(null)
  const [draggingGrupoId, setDraggingGrupoId] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  useEffect(() => {
    setAssignments({})
    setSalonByCell({})
    setPendingIds(new Set(catalog.map((c) => c.id)))
    setLastMessage(null)
  }, [catalog])

  const pendingList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return catalog.filter((g) => pendingIds.has(g.id)).filter(
      (g) =>
        !q ||
        g.asignatura.toLowerCase().includes(q) ||
        g.docente.toLowerCase().includes(q) ||
        g.semestre.toLowerCase().includes(q),
    )
  }, [catalog, pendingIds, search])

  const placeInCell = (slotIdx: number, dayIdx: number, grupoId: string) => {
    // Valida y ubica materia en celda; si estaba en otra, la mueve.
    const key = cellKey(slotIdx, dayIdx)
    const v = validatePlacement(assignments, slotIdx, dayIdx, grupoId)
    if (v.ok === false) {
      setLastMessage(v.reason)
      return
    }
    setLastMessage(null)
    const previousId = assignments[key] ?? null
    const newMap = simulatePlacement(assignments, slotIdx, dayIdx, grupoId)
    setAssignments(newMap)
    setSalonByCell((prev) => {
      const next = { ...prev }
      if (!next[key]) next[key] = DEFAULT_SALON_CODIGO
      return next
    })
    setPendingIds((ids) => {
      const next = new Set(ids)
      next.delete(grupoId)
      if (previousId && previousId !== grupoId) next.add(previousId)
      return next
    })
  }

  const clearCell = (slotIdx: number, dayIdx: number) => {
    const key = cellKey(slotIdx, dayIdx)
    const id = assignments[key]
    if (!id) return
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setSalonByCell((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setPendingIds((ids) => new Set(ids).add(id))
    setLastMessage(null)
  }

  const setSalonForCell = (slotIdx: number, dayIdx: number, salonCodigo: string) => {
    // Permite escoger salón por celda/materia en el tablero.
    const key = cellKey(slotIdx, dayIdx)
    setSalonByCell((prev) => ({ ...prev, [key]: salonCodigo }))
    setLastMessage(null)
  }

  const onDragStartGrupo = (e: DragEvent, grupoId: string) => {
    e.dataTransfer.setData(DRAG_TYPE, grupoId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingGrupoId(grupoId)
    setLastMessage(null)
  }

  const onDragEndGrupo = () => {
    setDraggingGrupoId(null)
    setDragOverCell(null)
  }

  const onDragOverCell = (e: DragEvent, slotIdx: number, dayIdx: number) => {
    e.preventDefault()
    const grupoId = draggingGrupoId
    if (!grupoId) {
      setDragOverCell(null)
      return
    }
    const slot = TIME_SLOTS[slotIdx]
    if (slot?.locked) {
      setDragOverCell({ key: cellKey(slotIdx, dayIdx), valid: false })
      e.dataTransfer.dropEffect = 'none'
      return
    }
    const v = validatePlacement(assignments, slotIdx, dayIdx, grupoId)
    setDragOverCell({ key: cellKey(slotIdx, dayIdx), valid: v.ok })
    e.dataTransfer.dropEffect = v.ok ? 'move' : 'none'
  }

  const onDropCell = (e: DragEvent, slotIdx: number, dayIdx: number) => {
    e.preventDefault()
    const grupoId = e.dataTransfer.getData(DRAG_TYPE) || draggingGrupoId
    setDragOverCell(null)
    setDraggingGrupoId(null)
    if (!grupoId) return
    placeInCell(slotIdx, dayIdx, grupoId)
  }

  const capacityAlerts = useMemo(() => {
    const list: { id: string; text: string }[] = []
    for (const [key, gid] of Object.entries(assignments)) {
      if (!gid) continue
      const g = findMateria(gid)
      const salonCodigo = salonByCell[key] ?? DEFAULT_SALON_CODIGO
      const salon = findSalon(salonCodigo)
      const capacidad = salon?.capacidad ?? 0
      if (g && g.estudiantes > capacidad) {
        list.push({
          id: `${gid}-${key}`,
          text: `“${g.asignatura}” (${g.estudiantes} est.) supera la capacidad de ${salonCodigo} (${capacidad}).`,
        })
      }
    }
    return list
  }, [assignments, salonByCell])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Constructor de horarios</h2>
          <p className="text-sm text-slate-600">
            Elige programa, semestre y grupo: solo verás las materias de esa oferta. Arrástralas al tablero por grupo y
            selecciona el salón de cada materia en su celda. El almuerzo está bloqueado; no se puede asignar el mismo
            docente en dos columnas del mismo horario.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-900">Arrastrar y soltar activo</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
              Vista: por grupo · salón por materia
            </span>
          </div>
          {lastMessage ? (
            <p className="mt-2 text-sm font-semibold text-red-700" role="status">
              {lastMessage}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            onClick={() => setLastMessage('Borrador guardado (demo local).')}
          >
            Guardar borrador
          </button>
          <button
            type="button"
            className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
            onClick={() => setLastMessage('Publicación simulada: el horario quedaría visible para docentes y estudiantes.')}
          >
            Publicar horario
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        <p className="font-bold">Cómo armar horarios en la práctica</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong>Arrastrar</strong> cada grupo pendiente a un bloque; si un docente ya ocupa ese mismo tramo en otro
            día, el sistema lo rechaza (un docente no puede estar en dos sitios a la vez).
          </li>
          <li>
            <strong>Materias de varios bloques</strong> (ej. 4 h): coloca el mismo grupo en dos filas consecutivas o
            reparte teoría/práctica en días distintos según el plan.
          </li>
          <li>
            <strong>Clic en ✕</strong> en una celda ocupada devuelve el grupo a “Pendientes”.
          </li>
          <li>
            Más adelante: reglas por <strong>disponibilidad docente</strong>, <strong>tipo de sala</strong> y
            optimización automática (solver / IA).
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
        <label className="font-semibold text-slate-800">
          Programa
          <select
            className="ml-2 max-w-[220px] rounded-lg border border-slate-200 px-2 py-1.5 font-normal"
            value={programaId}
            onChange={(e) => setProgramaId(e.target.value)}
          >
            {MOCK_PROGRAMAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="font-semibold text-slate-800">
          Semestre
          <select
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 font-normal"
            value={semestresOpciones.includes(semestreNum) ? String(semestreNum) : ''}
            onChange={(e) => setSemestreNum(Number(e.target.value))}
            disabled={semestresOpciones.length === 0}
          >
            {semestresOpciones.length === 0 ? (
              <option value="">—</option>
            ) : (
              semestresOpciones.map((n) => (
                <option key={n} value={n}>
                  {n}º
                </option>
              ))
            )}
          </select>
        </label>
        <label className="font-semibold text-slate-800">
          Grupo
          <select
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 font-normal"
            value={gruposOpciones.includes(grupoSeccion) ? grupoSeccion : ''}
            onChange={(e) => setGrupoSeccion(e.target.value)}
            disabled={gruposOpciones.length === 0}
          >
            {gruposOpciones.length === 0 ? (
              <option value="">—</option>
            ) : (
              gruposOpciones.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="font-semibold text-slate-800">
          Vista
          <select className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 font-normal" defaultValue="grupo">
            <option value="grupo">Por grupo (asignar salón por materia)</option>
            <option disabled>Por docente (próximamente)</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Materias pendientes</h3>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="mt-3 space-y-2">
            {catalog.length === 0 ? (
              <li className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center text-xs text-amber-950">
                No hay materias en oferta para esta combinación en la demo. Prueba otro programa (p. ej. Sistemas o
                Industrial) o revisa semestre/grupo.
              </li>
            ) : pendingList.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                Todas las materias de esta oferta están en el tablero. Usa ✕ en una celda para devolver una aquí.
              </li>
            ) : (
              pendingList.map((g) => (
                <li
                  key={g.id}
                  draggable
                  onDragStart={(e) => onDragStartGrupo(e, g.id)}
                  onDragEnd={onDragEndGrupo}
                  className={`cursor-grab rounded-xl border p-3 text-sm shadow-sm active:cursor-grabbing ${
                    g.alerta ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="text-[10px] font-bold text-slate-500">{g.semestre}</p>
                  <p className="font-bold text-slate-900">{g.asignatura}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {g.horas} h · {g.docente} · {g.estudiantes} est.
                  </p>
                  {g.alerta === 'sin_docente' ? (
                    <p className="mt-2 text-xs font-bold text-amber-800">⚠ Sin docente asignado</p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </aside>

        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[640px] border-collapse text-center text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <th className="border-b border-slate-200 px-2 py-2">Hora</th>
                {DAYS.map((d) => (
                  <th key={d} className="border-b border-l border-slate-200 px-1 py-2">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, slotIdx) => (
                <tr key={slot.id}>
                  <td className="border-b border-slate-100 px-2 py-3 text-left text-xs font-bold text-slate-500">
                    {slot.label}
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const key = cellKey(slotIdx, dayIdx as number)
                    const gid = assignments[key]
                    const g = gid ? findMateria(gid) : null
                    const selectedSalon = salonByCell[key] ?? DEFAULT_SALON_CODIGO
                    const isOver = dragOverCell?.key === key
                    const validOver = dragOverCell?.valid ?? false

                    if (slot.locked) {
                      return (
                        <td key={key} className="border-b border-l border-slate-100 p-1 align-top">
                          <div className="flex min-h-[80px] items-center justify-center rounded-lg bg-slate-100 p-2 text-[11px] font-semibold text-slate-500">
                            ALMUERZO
                          </div>
                        </td>
                      )
                    }

                    return (
                      <td key={key} className="border-b border-l border-slate-100 p-1 align-top">
                        <div
                          role="button"
                          tabIndex={0}
                          onDragOver={(e) => onDragOverCell(e, slotIdx, dayIdx as number)}
                          onDragLeave={() => setDragOverCell(null)}
                          onDrop={(e) => onDropCell(e, slotIdx, dayIdx as number)}
                          className={`relative min-h-[80px] rounded-lg p-2 text-left text-[11px] font-semibold leading-snug transition ${
                            g
                              ? 'bg-sky-50 text-slate-800 ring-1 ring-sky-100'
                              : isOver
                                ? validOver
                                  ? 'border-2 border-dashed border-emerald-400 bg-emerald-50/80'
                                  : 'border-2 border-dashed border-red-400 bg-red-50/80'
                                : 'border border-dashed border-slate-200 text-slate-400'
                          }`}
                        >
                          {g ? (
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation()
                                onDragStartGrupo(e, g.id)
                              }}
                              onDragEnd={onDragEndGrupo}
                              className="cursor-grab active:cursor-grabbing"
                            >
                              <button
                                type="button"
                                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-red-700"
                                aria-label="Quitar del horario"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => clearCell(slotIdx, dayIdx as number)}
                              >
                                ✕
                              </button>
                              <p className="pr-6 font-bold text-slate-900">{g.asignatura}</p>
                              <p className="mt-1 text-[10px] text-slate-600">
                                {g.docente} · {g.estudiantes} est.
                              </p>
                              <label className="mt-2 block text-[10px] font-semibold text-slate-500">
                                Salón
                                <select
                                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-slate-700"
                                  value={selectedSalon}
                                  onChange={(e) => setSalonForCell(slotIdx, dayIdx as number, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {MOCK_ESPACIOS.map((s) => (
                                    <option key={s.codigo} value={s.codigo}>
                                      {s.codigo} ({s.capacidad})
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <p className="mt-1 text-[9px] font-medium text-slate-400">Arrastra para mover</p>
                            </div>
                          ) : (
                            <span className="flex min-h-[64px] items-center justify-center">Soltar aquí</span>
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

        <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Alertas y sugerencias</h3>
          {capacityAlerts.length ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
              <p className="font-bold">Posible exceso de capacidad</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {capacityAlerts.map((a) => (
                  <li key={a.id}>{a.text}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-red-800">Sugerencia: mover a un salón con más cupo o fraccionar el grupo.</p>
            </div>
          ) : (
            <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              No hay alertas de cupo con la asignación actual de salones.
            </p>
          )}
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950">
            <p className="font-bold">Sugerencia</p>
            <p className="mt-1">
              Si una materia no entra en cupo, cambia su salón en la celda por uno con mayor capacidad.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
