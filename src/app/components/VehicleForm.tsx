"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { isValidPlate, normalizePlate } from "@/app/lib/plate";

export type VehicleOperationType =
  | "own"
  | "purchased"
  | "consigned"
  | "repasse";

export const VEHICLE_OPERATION_LABELS: Record<VehicleOperationType, string> = {
  own: "Próprio",
  purchased: "Comprado",
  consigned: "Consignado",
  repasse: "Repasse",
};

const OPERATION_OPTIONS = Object.entries(VEHICLE_OPERATION_LABELS) as [
  VehicleOperationType,
  string,
][];

/** Mesmas colunas da listagem de veículos do dashboard, mais os campos da loja. */
export const STORE_VEHICLE_COLUMNS =
  "id, plate, model, brand, year, active, assigned_user_id, inspection_frequency, last_inspection_at, next_inspection_due, operation_type, color";

export type SavedVehicle = {
  id: string;
  plate: string;
  model: string | null;
  brand: string | null;
  year: string | null;
  active: boolean;
  assigned_user_id: string | null;
  inspection_frequency: "daily" | "weekly" | "biweekly" | "monthly" | null;
  last_inspection_at: string | null;
  next_inspection_due: string | null;
  operation_type: VehicleOperationType | null;
  color: string | null;
};

type Props = {
  /** Empresa que receberá o veículo (a empresa em exibição no dashboard). */
  companyId: string;
  onSaved: (vehicle: SavedVehicle) => void;
  onCancel: () => void;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 outline-none ring-green-600 focus:ring-2";
const labelClass = "block text-sm font-medium text-slate-700";

export default function VehicleForm({ companyId, onSaved, onCancel }: Props) {
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [operationType, setOperationType] = useState<VehicleOperationType | "">(
    ""
  );
  const [chassis, setChassis] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const maxYear = new Date().getFullYear() + 1;
  const chassisWarning =
    chassis !== "" && chassis.length !== 17
      ? "O chassi costuma ter 17 caracteres. Confira antes de salvar."
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError("");

    const brandValue = brand.trim();
    const modelValue = model.trim();
    const colorValue = color.trim();
    const yearNumber = Number.parseInt(year, 10);

    if (!isValidPlate(plate)) {
      setError("Informe uma placa válida (ex.: ABC1D23 ou ABC1234).");
      return;
    }
    if (!brandValue || !modelValue || !colorValue) {
      setError("Preencha marca, modelo e cor.");
      return;
    }
    if (
      year.length !== 4 ||
      !Number.isFinite(yearNumber) ||
      yearNumber < 1950 ||
      yearNumber > maxYear
    ) {
      setError(`Informe o ano com 4 dígitos, entre 1950 e ${maxYear}.`);
      return;
    }
    if (!operationType) {
      setError("Selecione o tipo da operação.");
      return;
    }

    try {
      setSaving(true);

      const { data: existing, error: existingError } = await supabase
        .from("vehicles")
        .select("id")
        .eq("company_id", companyId)
        .eq("plate", plate)
        .eq("active", true)
        .limit(1);

      if (existingError) throw existingError;
      if (existing && existing.length > 0) {
        setError("Já existe um veículo ativo com esta placa.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("vehicles")
        .insert({
          company_id: companyId,
          plate,
          brand: brandValue,
          model: modelValue,
          year,
          color: colorValue,
          operation_type: operationType,
          chassis: chassis || null,
          active: true,
        })
        .select(STORE_VEHICLE_COLUMNS)
        .single();

      if (insertError) throw insertError;

      onSaved(data as SavedVehicle);
    } catch (err) {
      console.error("Erro ao cadastrar veículo:", err);
      setError("Não foi possível cadastrar o veículo. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="vehicle-plate">
            Placa <span className="text-red-500">*</span>
          </label>
          <input
            id="vehicle-plate"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="ABC1D23"
            value={plate}
            onChange={(e) => setPlate(normalizePlate(e.target.value))}
            className={`${inputClass} uppercase`}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="vehicle-year">
            Ano <span className="text-red-500">*</span>
          </label>
          <input
            id="vehicle-year"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="2020"
            maxLength={4}
            value={year}
            onChange={(e) =>
              setYear(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="vehicle-brand">
            Marca <span className="text-red-500">*</span>
          </label>
          <input
            id="vehicle-brand"
            type="text"
            autoComplete="off"
            placeholder="Ex.: Volkswagen"
            maxLength={60}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="vehicle-model">
            Modelo <span className="text-red-500">*</span>
          </label>
          <input
            id="vehicle-model"
            type="text"
            autoComplete="off"
            placeholder="Ex.: Gol 1.0"
            maxLength={60}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="vehicle-color">
            Cor <span className="text-red-500">*</span>
          </label>
          <input
            id="vehicle-color"
            type="text"
            autoComplete="off"
            placeholder="Ex.: Prata"
            maxLength={30}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="vehicle-chassis">
            Chassi <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            id="vehicle-chassis"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={17}
            value={chassis}
            onChange={(e) =>
              setChassis(
                e.target.value
                  .replace(/[^A-Za-z0-9]/g, "")
                  .toUpperCase()
                  .slice(0, 17)
              )
            }
            className={`${inputClass} uppercase`}
          />
          {chassisWarning ? (
            <p className="mt-1 text-xs text-amber-700">{chassisWarning}</p>
          ) : null}
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>
          Tipo da operação <span className="text-red-500">*</span>
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OPERATION_OPTIONS.map(([value, label]) => {
            const isActive = operationType === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setOperationType(value)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                  isActive
                    ? "border-green-600 bg-green-600 text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-11 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar veículo"}
        </button>
      </div>
    </form>
  );
}
