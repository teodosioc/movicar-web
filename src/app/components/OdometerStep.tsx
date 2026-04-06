'use client'

import {
  ODOMETER_MAX_KM,
  formatOdometerKmPtBr,
  parseOdometerKmInput,
} from '@/app/lib/odometerKm'

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function OdometerStep({ value, onChange }: Props) {
  const placeholder = (28472).toLocaleString('pt-BR')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Quilometragem <span className="text-red-500">*</span>
      </h2>

      <p className="text-sm text-slate-600">
        Digite a quilometragem exibida no painel do veículo (km), como na foto que você
        acabou de registrar.
      </p>

      <label className="block text-sm font-medium text-slate-700" htmlFor="odometer-input">
        Quilometragem (km)
      </label>
      <input
        id="odometer-input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={`Ex: ${placeholder}`}
        value={formatOdometerKmPtBr(value)}
        onChange={(e) => onChange(parseOdometerKmInput(e.target.value))}
        maxLength={11}
        aria-valuemin={1}
        aria-valuemax={ODOMETER_MAX_KM}
        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 outline-none ring-emerald-600 focus:ring-2"
      />
    </div>
  )
}
