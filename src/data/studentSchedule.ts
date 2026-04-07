export type CardAccent = 'emerald' | 'violet' | 'amber' | 'teal' | 'slate' | 'orange'

export type ClassBlock = {
  type: 'class'
  start: string
  end: string
  title: string
  professor: string
  location: string
  accent: CardAccent
}

export type EmptyBlock = {
  type: 'empty'
  start: string
  end: string
}

export type ScheduleBlock = ClassBlock | EmptyBlock

export type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab'

export const DAY_LABELS: { key: DayKey; short: string }[] = [
  { key: 'lun', short: 'Lun' },
  { key: 'mar', short: 'Mar' },
  { key: 'mie', short: 'Mié' },
  { key: 'jue', short: 'Jue' },
  { key: 'vie', short: 'Vie' },
  { key: 'sab', short: 'Sáb' },
]

/** Horario de ejemplo por día (misma estructura que el mock). */
export const SCHEDULE_BY_DAY: Record<DayKey, { morning: ScheduleBlock[]; afternoon: ScheduleBlock[] }> = {
  lun: {
    morning: [
      {
        type: 'class',
        start: '06:00',
        end: '08:00',
        title: 'CÁLCULO DIFERENCIAL',
        professor: 'Ing. Ricardo Mendoza',
        location: 'Aula 302 - Bloque C',
        accent: 'teal',
      },
      {
        type: 'class',
        start: '08:00',
        end: '10:00',
        title: 'PROGRAMACIÓN II',
        professor: 'Dra. Sandra Jiménez',
        location: 'Laboratorio de Sistemas 4',
        accent: 'emerald',
      },
      { type: 'empty', start: '10:00', end: '12:00' },
    ],
    afternoon: [
      {
        type: 'class',
        start: '18:00',
        end: '20:00',
        title: 'BASES DE DATOS I',
        professor: 'Ing. Alberto Ruiz',
        location: 'Sala de Cómputo B',
        accent: 'violet',
      },
      {
        type: 'class',
        start: '20:00',
        end: '22:00',
        title: 'ÉTICA Y HUMANIDADES',
        professor: 'Mag. Carmen Orozco',
        location: 'Aula Virtual Zoom',
        accent: 'orange',
      },
    ],
  },
  mar: {
    morning: [
      {
        type: 'class',
        start: '08:00',
        end: '10:00',
        title: 'PROGRAMACIÓN II',
        professor: 'Dra. Sandra Jiménez',
        location: 'Laboratorio de Sistemas 4',
        accent: 'emerald',
      },
      { type: 'empty', start: '10:00', end: '12:00' },
    ],
    afternoon: [
      {
        type: 'class',
        start: '18:00',
        end: '20:00',
        title: 'BASES DE DATOS I',
        professor: 'Ing. Alberto Ruiz',
        location: 'Sala de Cómputo B',
        accent: 'violet',
      },
    ],
  },
  mie: {
    morning: [
      {
        type: 'class',
        start: '06:00',
        end: '08:00',
        title: 'CÁLCULO DIFERENCIAL',
        professor: 'Ing. Ricardo Mendoza',
        location: 'Aula 302 - Bloque C',
        accent: 'teal',
      },
    ],
    afternoon: [],
  },
  jue: {
    morning: [],
    afternoon: [
      {
        type: 'class',
        start: '18:00',
        end: '20:00',
        title: 'BASES DE DATOS I',
        professor: 'Ing. Alberto Ruiz',
        location: 'Sala de Cómputo B',
        accent: 'violet',
      },
    ],
  },
  vie: {
    morning: [
      { type: 'empty', start: '08:00', end: '12:00' },
    ],
    afternoon: [
      {
        type: 'class',
        start: '20:00',
        end: '22:00',
        title: 'ÉTICA Y HUMANIDADES',
        professor: 'Mag. Carmen Orozco',
        location: 'Aula Virtual Zoom',
        accent: 'orange',
      },
    ],
  },
  sab: {
    morning: [],
    afternoon: [],
  },
}
