import { useEffect, useMemo, useState } from 'react'
import { apiGetTeacherAvailability, apiUpdateTeacherAvailability } from '../../services/api'

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

function cellKey(hourIdx: number, day: string) {
  return `${hourIdx}-${day}`
}

type Props = { docenteId: string; nombreCompleto: string }

export default function DocenteDisponibilidadGrid({ docenteId, nombreCompleto }: Props) {
  const [cells, setCells] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [periodo, setPeriodo] = useState('2026 - Semestre I')

  useEffect(() => {
    setLoading(true)
    apiGetTeacherAvailability(docenteId)
      .then(setCells)
      .catch(() => setCells({}))
      .finally(() => setLoading(false))
  }, [docenteId])

  const toggle = (hourIdx: number, day: string) => {
    const k = cellKey(hourIdx, day)
    setCells((prev) => ({ ...prev, [k]: !prev[k] }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiUpdateTeacherAvailability(docenteId, cells)
      setSaved(true)
    } catch {
      // keep state
    } finally {
      setSaving(false)
    }
  }

  const busyCells = useMemo(() => Object.values(cells).filter(Boolean).length, [cells])

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Bloques en los que <strong>{nombreCompleto}</strong> declara disponibilidad para asignación académica.
        {' '}<span className="font-bold text-emerald-700">{busyCells} bloques disponibles</span> marcados.
      </p>

      <div className="flex flex-col flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <label className="text-sm font-semibold text-slate-800">
          Periodo académico
          <select
            className="mt-1 w-full min-w-[220px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none lg:mt-0 lg:ml-2 lg:inline-block lg:w-auto focus:border-red-500 focus:ring-2 focus:ring-red-100"
            value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option>2026 - Semestre I</option>
            <option>2026 - Semestre II</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Disponible</span>
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-slate-300 bg-white" /> No disponible</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {saved ? <span className="text-sm font-semibold text-emerald-700">¡Guardado!</span> : null}
          <button type="button" onClick={handleSave} disabled={saving || loading}
            className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar disponibilidad'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-12 text-sm text-slate-500">
          Cargando disponibilidad...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[720px] border-collapse text-center text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <th className="border-b border-slate-200 px-2 py-2">Hora</th>
                {DAYS.map((d) => (
                  <th key={d.key} className="border-b border-l border-slate-200 px-1 py-2 sm:px-2">{d.label}</th>
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
                        <button type="button" aria-pressed={on} onClick={() => toggle(hourIdx, d.key)}
                          className={`flex h-10 w-full items-center justify-center transition sm:h-12 ${on ? 'bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-300' : 'bg-white hover:bg-slate-50'}`} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
