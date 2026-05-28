import { useEffect, useMemo, useState } from 'react'
import {
  apiGetScheduleConfig,
  apiGetTeacherAvailability,
  apiUpdateTeacherAvailability,
  type ApiScheduleDay,
  type ApiScheduleSlot,
} from '../../services/api'

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

// key format: "{slot_index}-{day_index}"
function cellKey(slotIndex: number, dayIndex: number) {
  return `${slotIndex}-${dayIndex}`
}

type Props = { docenteId: string; nombreCompleto: string }

export default function DocenteDisponibilidadGrid({ docenteId, nombreCompleto }: Props) {
  const [cells, setCells] = useState<Record<string, boolean>>({})
  const [slots, setSlots] = useState<ApiScheduleSlot[]>(FALLBACK_SLOTS)
  const [days, setDays] = useState<ApiScheduleDay[]>(FALLBACK_DAYS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    apiGetScheduleConfig()
      .then(({ days: d, slots: s }) => {
        setDays(d.filter((x) => x.active).sort((a, b) => a.day_index - b.day_index))
        setSlots(s.filter((x) => x.active && !x.locked).sort((a, b) => a.slot_index - b.slot_index))
      })
      .catch(() => { /* keep fallback */ })
  }, [])

  useEffect(() => {
    setLoading(true)
    apiGetTeacherAvailability(docenteId)
      .then(setCells)
      .catch(() => setCells({}))
      .finally(() => setLoading(false))
  }, [docenteId])

  const toggle = (slotIndex: number, dayIndex: number) => {
    const k = cellKey(slotIndex, dayIndex)
    setCells((prev) => ({ ...prev, [k]: !prev[k] }))
    setSaved(false)
    setSaveError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await apiUpdateTeacherAvailability(docenteId, cells)
      setSaved(true)
    } catch {
      setSaveError('Error al guardar. Intenta de nuevo.')
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Disponible</span>
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-slate-300 bg-white" /> No disponible</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && !saveError ? <span className="text-sm font-semibold text-emerald-700">¡Guardado!</span> : null}
          {saveError ? <span className="text-sm font-semibold text-red-600">{saveError}</span> : null}
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
          <table className="min-w-[640px] border-collapse text-center text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2 text-left">Franja</th>
                {days.map((d) => (
                  <th key={d.day_index} className="border-b border-l border-slate-200 px-2 py-2">{d.label.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.slot_index}>
                  <td className="border-b border-slate-100 px-3 py-2 text-left text-xs font-bold text-slate-500 whitespace-nowrap">
                    {slot.label}
                  </td>
                  {days.map((day) => {
                    const k = cellKey(slot.slot_index, day.day_index)
                    const on = !!cells[k]
                    return (
                      <td key={day.day_index} className="border-b border-l border-slate-100 p-0">
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${slot.label} ${day.label}`}
                          onClick={() => toggle(slot.slot_index, day.day_index)}
                          className={`flex h-10 w-full items-center justify-center transition sm:h-12 ${on ? 'bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-300' : 'bg-white hover:bg-slate-50'}`}
                        />
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
