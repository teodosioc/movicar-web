"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  Car,
  CheckCircle2,
  ClipboardList,
  LogOut,
  MapPin,
  PlusCircle,
  UserCircle2,
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

type MoviCarUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
};

type InspectionVehicleRelation = {
  id: string;
  plate: string;
  model: string | null;
  brand: string | null;
  year: string | null;
  inspection_frequency: "daily" | "weekly" | "biweekly" | "monthly" | null;
  last_inspection_at: string | null;
  next_inspection_due: string | null;
};

type InspectionRow = {
  id: string;
  vehicle_id: string;
  created_by: string | null;
  driver_name: string | null;
  status: string;
  odometer: number | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string | null;
  vehicles?: InspectionVehicleRelation[] | null;
};

type VehicleRow = {
  id: string;
  plate: string;
  model: string | null;
  brand: string | null;
  year: string | null;
  active: boolean;
  inspection_frequency: "daily" | "weekly" | "biweekly" | "monthly" | null;
  last_inspection_at: string | null;
  next_inspection_due: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR");
}

function formatFrequency(
  frequency?: "daily" | "weekly" | "biweekly" | "monthly" | null
) {
  switch (frequency) {
    case "daily":
      return "Diária";
    case "weekly":
      return "Semanal";
    case "biweekly":
      return "Quinzenal";
    case "monthly":
      return "Mensal";
    default:
      return "Não definida";
  }
}

function getVehicleInspectionStatus(vehicle: VehicleRow) {
  if (!vehicle.last_inspection_at) {
    return {
      label: "Pendente inicial",
      tone: "bg-slate-100 text-slate-700",
    };
  }

  if (!vehicle.next_inspection_due) {
    return {
      label: "Sem próxima data",
      tone: "bg-slate-100 text-slate-700",
    };
  }

  const today = new Date();
  const due = new Date(vehicle.next_inspection_due);

  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueOnly.getTime() < todayOnly.getTime()) {
    return {
      label: "Atrasada",
      tone: "bg-red-100 text-red-700",
    };
  }

  if (dueOnly.getTime() === todayOnly.getTime()) {
    return {
      label: "Vence hoje",
      tone: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Em dia",
    tone: "bg-emerald-100 text-emerald-700",
  };
}

function getInspectionStatusBadge(status?: string | null) {
  switch (String(status ?? "").toLowerCase()) {
    case "completed":
      return {
        label: "Concluída",
        tone: "bg-emerald-100 text-emerald-700",
      };
    case "in_progress":
      return {
        label: "Em andamento",
        tone: "bg-amber-100 text-amber-700",
      };
    case "pending":
      return {
        label: "Pendente",
        tone: "bg-slate-100 text-slate-700",
      };
    case "cancelled":
      return {
        label: "Cancelada",
        tone: "bg-red-100 text-red-700",
      };
    default:
      return {
        label: "Desconhecido",
        tone: "bg-slate-100 text-slate-700",
      };
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MoviCarUser | null>(null);
  const [inspections, setInspections] = useState<InspectionRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("movicar_token");
        const userData = localStorage.getItem("movicar_user");

        if (!token || !userData) {
          router.replace("/login");
          return;
        }

        const parsedUser: MoviCarUser = JSON.parse(userData);
        const role = String(parsedUser.role ?? "").toLowerCase();

        if (role === "motorista") {
          router.replace("/driver");
          return;
        }

        if (!parsedUser.active) {
          localStorage.removeItem("movicar_token");
          localStorage.removeItem("movicar_user");
          router.replace("/login");
          return;
        }

        setUser(parsedUser);

        const [inspectionsRes, vehiclesRes] = await Promise.all([
          supabase
            .from("inspections")
            .select(
              `
                id,
                vehicle_id,
                created_by,
                driver_name,
                status,
                odometer,
                notes,
                latitude,
                longitude,
                address,
                started_at,
                finished_at,
                created_at,
                vehicles (
                  id,
                  plate,
                  model,
                  brand,
                  year,
                  inspection_frequency,
                  last_inspection_at,
                  next_inspection_due
                )
              `
            )
            .order("created_at", { ascending: false })
            .limit(10),

          supabase
            .from("vehicles")
            .select(
              `
                id,
                plate,
                model,
                brand,
                year,
                active,
                inspection_frequency,
                last_inspection_at,
                next_inspection_due
              `
            )
            .eq("active", true)
            .order("plate", { ascending: true }),
        ]);

        if (inspectionsRes.error) throw inspectionsRes.error;
        if (vehiclesRes.error) throw vehiclesRes.error;

        setInspections((inspectionsRes.data ?? []) as InspectionRow[]);
        setVehicles((vehiclesRes.data ?? []) as VehicleRow[]);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        localStorage.removeItem("movicar_token");
        localStorage.removeItem("movicar_user");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("movicar_token");
    localStorage.removeItem("movicar_user");
    router.replace("/login");
  };

  const handleNewInspection = () => {
    router.push("/inspection/new");
  };

  const handleOpenMaps = (
    latitude?: number | null,
    longitude?: number | null
  ) => {
    if (latitude == null || longitude == null) return;
    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const todayInspections = useMemo(() => {
    const today = new Date();

    return inspections.filter((inspection) => {
      if (!inspection.created_at) return false;

      const created = new Date(inspection.created_at);

      return (
        created.getDate() === today.getDate() &&
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [inspections]);

  const vehicleStats = useMemo(() => {
    let onTime = 0;
    let dueToday = 0;
    let overdue = 0;
    let pendingInitial = 0;

    for (const vehicle of vehicles) {
      const status = getVehicleInspectionStatus(vehicle).label;

      if (status === "Em dia") onTime += 1;
      else if (status === "Vence hoje") dueToday += 1;
      else if (status === "Atrasada") overdue += 1;
      else if (status === "Pendente inicial") pendingInitial += 1;
    }

    return {
      onTime,
      dueToday,
      overdue,
      pendingInitial,
    };
  }, [vehicles]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <p className="text-lg text-slate-700">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                <Car className="text-green-700" size={22} />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Dashboard MoviCar
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Bem-vindo,{" "}
                  <span className="font-semibold">{user?.name || "Admin"}</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Acompanhe vistorias, veículos e pendências operacionais em
                  tempo real.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleNewInspection}
                className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                <PlusCircle size={18} />
                Nova vistoria
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Vistorias hoje</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100">
                <ClipboardList className="text-blue-600" size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {todayInspections}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Total de inspeções registradas hoje.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Veículos ativos</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100">
                <Car className="text-green-600" size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {vehicles.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Base disponível para operação e controle.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Vistorias em atraso</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100">
                <AlertTriangle className="text-red-600" size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {vehicleStats.overdue}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Veículos com vistoria vencida.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Vencem hoje</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
                <CalendarClock className="text-amber-600" size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {vehicleStats.dueToday}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Veículos que precisam de vistoria hoje.
            </p>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Vistorias recentes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Últimas inspeções registradas no sistema.
                </p>
              </div>

              <button
                onClick={handleNewInspection}
                className="hidden rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 md:block"
              >
                Nova vistoria
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
              <div className="hidden grid-cols-6 gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <div>Placa</div>
                <div>Veículo</div>
                <div>Motorista</div>
                <div>Data</div>
                <div>Status</div>
                <div>Local</div>
              </div>

              {inspections.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhuma vistoria encontrada.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {inspections.map((inspection) => {
                    const statusBadge = getInspectionStatusBadge(
                      inspection.status
                    );
                    const relatedVehicle = inspection.vehicles?.[0] ?? null;
                    const plate = relatedVehicle?.plate || "-";
                    const vehicleName = [
                      relatedVehicle?.brand,
                      relatedVehicle?.model,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={inspection.id}
                        className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-6 md:items-center"
                      >
                        <div>
                          <p className="text-xs text-slate-500 md:hidden">
                            Placa
                          </p>
                          <p className="font-semibold text-slate-900">{plate}</p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 md:hidden">
                            Veículo
                          </p>
                          <p className="text-sm text-slate-700">
                            {vehicleName || relatedVehicle?.model || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 md:hidden">
                            Motorista
                          </p>
                          <p className="text-sm text-slate-700">
                            {inspection.driver_name || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 md:hidden">
                            Data
                          </p>
                          <p className="text-sm text-slate-700">
                            {formatDateTime(
                              inspection.finished_at || inspection.created_at
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 md:hidden">
                            Status
                          </p>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.tone}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 md:hidden">
                            Local
                          </p>
                          {inspection.latitude != null &&
                          inspection.longitude != null ? (
                            <button
                              onClick={() =>
                                handleOpenMaps(
                                  inspection.latitude,
                                  inspection.longitude
                                )
                              }
                              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                            >
                              <MapPin size={14} />
                              Ver mapa
                            </button>
                          ) : (
                            <p className="text-sm text-slate-500">-</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Resumo da frota
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Status das periodicidades configuradas por veículo.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800">
                    Em dia
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-emerald-900">
                  {vehicleStats.onTime}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock size={18} className="text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">
                    Vence hoje
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-amber-900">
                  {vehicleStats.dueToday}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-600" />
                  <p className="text-sm font-semibold text-red-800">
                    Atrasada
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-red-900">
                  {vehicleStats.overdue}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <UserCircle2 size={18} className="text-slate-600" />
                  <p className="text-sm font-semibold text-slate-700">
                    Pendente inicial
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {vehicleStats.pendingInitial}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Veículos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Periodicidade, última vistoria e próxima vistoria prevista.
          </p>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <div className="hidden grid-cols-5 gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <div>Placa</div>
              <div>Veículo</div>
              <div>Periodicidade</div>
              <div>Última vistoria</div>
              <div>Status</div>
            </div>

            {vehicles.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Nenhum veículo encontrado.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {vehicles.map((vehicle) => {
                  const status = getVehicleInspectionStatus(vehicle);
                  const fullName = [vehicle.brand, vehicle.model]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={vehicle.id}
                      className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-5 md:items-center"
                    >
                      <div>
                        <p className="text-xs text-slate-500 md:hidden">
                          Placa
                        </p>
                        <p className="font-semibold text-slate-900">
                          {vehicle.plate}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 md:hidden">
                          Veículo
                        </p>
                        <p className="text-sm text-slate-700">
                          {fullName || vehicle.model || "-"}
                        </p>
                        {vehicle.year ? (
                          <p className="text-xs text-slate-500">
                            {vehicle.year}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 md:hidden">
                          Periodicidade
                        </p>
                        <p className="text-sm text-slate-700">
                          {formatFrequency(vehicle.inspection_frequency)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Próxima: {formatDate(vehicle.next_inspection_due)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 md:hidden">
                          Última vistoria
                        </p>
                        <p className="text-sm text-slate-700">
                          {formatDateTime(vehicle.last_inspection_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 md:hidden">
                          Status
                        </p>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}