type UniversidadLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { box: 'h-9 w-9 rounded-lg p-1', img: 'max-h-6 max-w-[2.25rem]' },
  md: { box: 'h-12 w-12 rounded-xl p-1.5', img: 'max-h-9 max-w-[3.25rem]' },
  lg: { box: 'h-14 w-14 rounded-xl p-2', img: 'max-h-11 max-w-[4rem]' },
} as const

export default function UniversidadLogo({ size = 'md', className = '' }: UniversidadLogoProps) {
  const s = SIZES[size]
  return (
    <div
      className={`grid shrink-0 place-items-center bg-white shadow-sm ring-1 ring-red-100 ${s.box} ${className}`}
    >
      <img
        src="/logounilibre.png"
        alt="Universidad Libre"
        className={`h-auto w-auto object-contain ${s.img}`}
      />
    </div>
  )
}
