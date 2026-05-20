import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiCreateSubject } from '../../services/api'

type AddProgramModalProps = {
  open: boolean
  onClose: () => void
  onSave?: (payload: { id: string; nombre: string; snies: string; semestres: number; creditos: number }) => Promise<void>
}

type AddSubjectModalProps = {
  open: boolean
  onClose: () => void
  programOptions: string[]
  defaultProgram?: string
  selectedProgramId?: string
  selectedSemestre?: number
  onSaved?: () => void
  onSave?: (payload: {
    programaAsignatura: string; codigo: string; nombre: string
    creditos: number; intensidad: number; semestre: number; jornada: 'Diurna' | 'Nocturna'
  }) => void
}

export function AddProgramModal({ open, onClose, onSave }: AddProgramModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const submitPrograma = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const nombre = String(formData.get('nombre') ?? '').trim()
    const codigo = String(formData.get('codigo') ?? '').trim()
    const semestres = Number.parseInt(String(formData.get('semestres') ?? '10'), 10) || 10
    const creditos = Number.parseInt(String(formData.get('creditos') ?? '160'), 10) || 160
    const id = codigo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    setSaving(true)
    try {
      await onSave?.({ id, nombre, snies: codigo, semestres, creditos })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Añadir programa</h3>
        <p className="mt-1 text-sm text-slate-600">
          Registra un nuevo programa académico para asociar asignaturas y grupos.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={submitPrograma}>
          <label className="text-sm font-semibold text-slate-800">
            Nombre del programa *
            <input required name="nombre"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Ej. Ingeniería Electrónica" />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Código / SNIES *
            <input required name="codigo"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Ej. 67890" />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800">
              Semestres
              <input name="semestres" type="number" min={1} max={14} defaultValue="10"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Créditos totales
              <input name="creditos" type="number" min={1} max={300} defaultValue="160"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
            </label>
          </div>
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar programa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AddSubjectModal({
  open, onClose, programOptions, defaultProgram, selectedProgramId, selectedSemestre, onSaved, onSave,
}: AddSubjectModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const submitAsignatura = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const codigo = String(formData.get('codigo') ?? '').trim()
    const nombre = String(formData.get('nombre') ?? '').trim()
    const creditos = Number.parseInt(String(formData.get('creditos') ?? '4'), 10) || 4
    const intensidad = Number.parseInt(String(formData.get('intensidad') ?? '4'), 10) || 4
    const semestre = Number.parseInt(String(formData.get('semestre') ?? String(selectedSemestre ?? 1)), 10) || 1
    const jornada = String(formData.get('jornada') ?? 'Diurna') as 'Diurna' | 'Nocturna'
    const programaAsignatura = String(formData.get('programaAsignatura') ?? '')

    if (selectedProgramId && onSaved) {
      setSaving(true)
      try {
        await apiCreateSubject(selectedProgramId, {
          semestre, codigo, nombre, creditos,
          h_teoria: intensidad, h_practica: 0,
          area: 'Específica', area_tone: 'emerald',
        })
        onSaved()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      } finally {
        setSaving(false)
      }
    } else {
      onSave?.({ programaAsignatura, codigo, nombre, creditos, intensidad, semestre, jornada })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Añadir asignatura</h3>
        <p className="mt-1 text-sm text-slate-600">
          Crea una asignatura para luego habilitar sus grupos por semestre y jornada.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={submitAsignatura}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800">
              Programa *
              <select name="programaAsignatura" defaultValue={defaultProgram ?? programOptions[0] ?? ''}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100">
                {programOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Código *
              <input required name="codigo"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Ej. IS405" />
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-800">
            Nombre de la asignatura *
            <input required name="nombre"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Ej. Arquitectura de Software" />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="text-sm font-semibold text-slate-800">
              Créditos
              <input name="creditos" type="number" min={1} max={12} defaultValue="4"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Intensidad
              <input name="intensidad" type="number" min={1} max={20} defaultValue="4"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Semestre
              <input name="semestre" type="number" min={1} max={14} defaultValue={String(selectedSemestre ?? 1)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Jornada
              <select name="jornada" defaultValue="Diurna"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100">
                <option>Diurna</option>
                <option>Nocturna</option>
              </select>
            </label>
          </div>
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar asignatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
