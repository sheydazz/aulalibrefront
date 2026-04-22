import type { FormEvent } from 'react'

type AddProgramModalProps = {
  open: boolean
  onClose: () => void
  onSave?: (payload: {
    nombre: string
    codigo: string
    semestres: number
    creditos: number
  }) => void
}

type AddSubjectModalProps = {
  open: boolean
  onClose: () => void
  programOptions: string[]
  defaultProgram?: string
  onSave?: (payload: {
    programaAsignatura: string
    codigo: string
    nombre: string
    creditos: number
    intensidad: number
    semestre: number
    jornada: 'Diurna' | 'Nocturna'
  }) => void
}

export function AddProgramModal({ open, onClose, onSave }: AddProgramModalProps) {
  // Modal controlado por props; si open=false no renderiza nada.
  if (!open) return null

  const submitPrograma = (e: FormEvent<HTMLFormElement>) => {
    // Lee datos del formulario con FormData para evitar estado por campo.
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSave?.({
      nombre: String(formData.get('nombre') ?? '').trim(),
      codigo: String(formData.get('codigo') ?? '').trim(),
      semestres: Number.parseInt(String(formData.get('semestres') ?? '10'), 10) || 10,
      creditos: Number.parseInt(String(formData.get('creditos') ?? '160'), 10) || 160,
    })
    onClose()
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
            <input
              required
              name="nombre"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Ej. Ingeniería Electrónica"
              defaultValue=""
            />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Código / SNIES *
            <input
              required
              name="codigo"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Ej. SNIES 67890"
              defaultValue=""
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800">
              Semestres
              <input
                name="semestres"
                type="number"
                min={1}
                max={14}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                defaultValue="10"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Créditos totales
              <input
                name="creditos"
                type="number"
                min={1}
                max={300}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                defaultValue="160"
              />
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800">
              Guardar programa
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AddSubjectModal({
  open,
  onClose,
  programOptions,
  defaultProgram,
  onSave,
}: AddSubjectModalProps) {
  // Modal reutilizable para crear asignaturas en programas y grupos.
  if (!open) return null

  const submitAsignatura = (e: FormEvent<HTMLFormElement>) => {
    // Normaliza entradas y emite payload al contenedor padre.
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSave?.({
      programaAsignatura: String(formData.get('programaAsignatura') ?? ''),
      codigo: String(formData.get('codigo') ?? '').trim(),
      nombre: String(formData.get('nombre') ?? '').trim(),
      creditos: Number.parseInt(String(formData.get('creditos') ?? '4'), 10) || 4,
      intensidad: Number.parseInt(String(formData.get('intensidad') ?? '4'), 10) || 4,
      semestre: Number.parseInt(String(formData.get('semestre') ?? '1'), 10) || 1,
      jornada: String(formData.get('jornada') ?? 'Diurna') as 'Diurna' | 'Nocturna',
    })
    onClose()
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
              <select
                name="programaAsignatura"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                defaultValue={defaultProgram ?? programOptions[0] ?? ''}
              >
                {programOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Código *
              <input
                required
                name="codigo"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="Ej. IS405"
                defaultValue=""
              />
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-800">
            Nombre de la asignatura *
            <input
              required
              name="nombre"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Ej. Arquitectura de Software"
              defaultValue=""
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="text-sm font-semibold text-slate-800">
              Créditos
              <input
                name="creditos"
                type="number"
                min={1}
                max={12}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                defaultValue="4"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Intensidad
              <input
                name="intensidad"
                type="number"
                min={1}
                max={20}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                defaultValue="4"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Semestre
              <input
                name="semestre"
                type="number"
                min={1}
                max={14}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                defaultValue="3"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Jornada
              <select
                name="jornada"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                defaultValue="Diurna"
              >
                <option>Diurna</option>
                <option>Nocturna</option>
              </select>
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800">
              Guardar asignatura
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
