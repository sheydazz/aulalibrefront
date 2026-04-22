import { useMemo, useState } from 'react'

const HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const DAYS = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' },
  { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
] as const

const INITIAL_DEMO: Record<string, boolean> = {
  '1-lun': true,
  '2-lun': true,
  '3-lun': true,
  '2-mar': true,
  '3-mar': true,
  '4-mar': true,
  '1-mie': true,
  '2-mie': true,
  '3-mie': true,
  '2-jue': true,
  '3-jue': true,
  '4-jue': true,
  '1-vie': true,
  '2-vie': true,
  '3-vie': true,
  '1-sab': true,
  '2-sab': true,
  '3-sab': true,
}

function cellKey(hourIdx: number, day: string) {
  return `${hourIdx}-${day}`
}

type Props = {
  docenteId: string
  nombreCompleto: string
}

export default function DocenteDisponibilidadGrid({ docenteId, nombreCompleto }: Props) {
  const [porDocente, setPorDocente] = useState<Record<string, Record<string, boolean>>>({})
  const [periodo, setPeriodo] = useState('2026 - Semestre I')

  const cells = useMemo(
    () => porDocente[docenteId] ?? INITIAL_DEMO,
    [porDocente, docenteId],
  )

  const toggle = (hourIdx: number, day: string) => {
    const k = cellKey(hourIdx, day)
    setPorDocente((prev) => {
      const base = prev[docenteId] ? { ...prev[docenteId] } : { ...INITIAL_DEMO }
      return {
        ...prev,
        [docenteId]: { ...base, [k]: !base[k] },
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Bloques en los que <strong>{nombreCompleto}</strong> declara disponibilidad para asignación académica. Queda
        asociada al periodo seleccionado.
      </p>

      <div className="flex flex-col flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <label className="text-sm font-semibold text-slate-800">
          Periodo académico
          <select
            className="mt-1 w-full min-w-[220px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none lg:mt-0 lg:ml-2 lg:inline-block lg:w-auto focus:border-red-500 focus:ring-2 focus:ring-red-100"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option>2026 - Semestre I</option>
            <option>2026 - Semestre II</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400" /> Disponible
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-slate-300 bg-white" /> No disponible
          </span>
          <span className="hidden text-slate-400 sm:inline">|</span>
          <span className="text-slate-500">Lunes a domingo</span>
          <span className="flex gap-1">
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50">
              ‹
            </button>
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50">
              ›
            </button>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Copiar anterior
          </button>
          <button type="button" className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">
            Guardar disponibilidad
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] border-collapse text-center text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <th className="border-b border-slate-200 px-2 py-2">Hora</th>
              {DAYS.map((d) => (
                <th key={d.key} className="border-b border-l border-slate-200 px-1 py-2 sm:px-2">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h, hourIdx) => (
              <tr key={h}>
                <td className="border-b border-slate-100 px-2 py-2 text-left text-xs font-bold text-slate-500">{h}</td>
                {DAYS.map((d) => {
                  const k = cellKey(hourIdx, d.key)
                  const on = !!cells[k]
                  return (
                    <td key={d.key} className="border-b border-l border-slate-100 p-0">
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(hourIdx, d.key)}
                        className={`flex h-10 w-full items-center justify-center transition sm:h-12 ${
                          on ? 'bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-300' : 'bg-white hover:bg-slate-50'
                        }`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Cada docente tiene su propia grilla. En producción, el docente autenticado podrá editar la suya; aquí el
        administrador puede revisar o ajustar según políticas de la facultad.
      </p>
    </div>
  )
}
