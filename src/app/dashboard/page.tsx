"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  MapPin,
  PlusCircle,
  Search,
  UserCircle2,
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import {
  resolveMoviCarUserFromAuth,
  signOutMoviCar,
} from "@/app/lib/movicarAuth";
import { buildKmTraveledByInspectionId } from "@/app/lib/inspectionKmPeriod";
import { buildInspectionMapsUrl } from "@/app/lib/inspectionMapsUrl";
import {
  countInspectionsToday,
  fetchInspectionHistory,
  fetchOdometerHistoryForVehicles,
  type InspectionHistoryFilters,
  type InspectionHistoryPeriod,
  type InspectionHistoryRow,
  type InspectionHistoryVehicle,
  type OdometerHistoryRow,
} from "@/app/lib/services/inspectionHistory";

type MoviCarUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
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

type DashboardTab = "vistorias" | "veiculos";

const PER_PAGE_OPTIONS = [10, 25, 50];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "completed", label: "Concluída" },
  { value: "in_progress", label: "Em andamento" },
  { value: "pending", label: "Pendente" },
  { value: "cancelled", label: "Cancelada" },
];

const PERIOD_OPTIONS: { value: InspectionHistoryPeriod; label: string }[] = [
  { value: "all", label: "Todos os períodos" },
  { value: "month", label: "Este mês" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "custom", label: "Intervalo personalizado" },
];

const DEFAULT_FILTERS: InspectionHistoryFilters = {
  search: "",
  period: "all",
  customFrom: "",
  customTo: "",
  status: "",
  sort: "desc",
  page: 1,
  perPage: 10,
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
      return 'Diária';
    case "weekly":
      return 'Semanal';
    case "biweekly":
      return 'Quinzenal';
    case "monthly":
      return 'Mensal';
    default:
      return 'Não definida';
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

function getInspectionVehicle(
  vehicles?: InspectionHistoryVehicle | InspectionHistoryVehicle[] | null
) {
  if (!vehicles) return null;
  return Array.isArray(vehicles) ? vehicles[0] ?? null : vehicles;
}

/**
 * Estado da consulta (aba, busca, filtros, ordenação e página) na URL, para
 * que o "Voltar" dos detalhes restaure exatamente o contexto anterior.
 */
function parseStateFromUrl(): {
  tab: DashboardTab;
  filters: InspectionHistoryFilters;
} {
  if (typeof window === "undefined") {
    return { tab: "vistorias", filters: DEFAULT_FILTERS };
  }

  const params = new URLSearchParams(window.location.search);

  const tab: DashboardTab =
    params.get("tab") === "veiculos" ? "veiculos" : "vistorias";

  const period = PERIOD_OPTIONS.some((o) => o.value === params.get("periodo"))
    ? (params.get("periodo") as InspectionHistoryPeriod)
    : "all";

  const status = STATUS_OPTIONS.some(
    (o) => o.value && o.value === params.get("status")
  )
    ? (params.get("status") as string)
    : "";

  const perPage = PER_PAGE_OPTIONS.includes(Number(params.get("pp")))
    ? Number(params.get("pp"))
    : 10;

  const page = Math.max(1, Number(params.get("pagina")) || 1);

  return {
    tab,
    filters: {
      search: params.get("q") ?? "",
      period,
      customFrom: params.get("de") ?? "",
      customTo: params.get("ate") ?? "",
      status,
      sort: params.get("ordem") === "asc" ? "asc" : "desc",
      page,
      perPage,
    },
  };
}

function writeStateToUrl(tab: DashboardTab, filters: InspectionHistoryFilters) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();
  if (tab !== "vistorias") params.set("tab", tab);
  if (filters.search) params.set("q", filters.search);
  if (filters.period !== "all") params.set("periodo", filters.period);
  if (filters.customFrom) params.set("de", filters.customFrom);
  if (filters.customTo) params.set("ate", filters.customTo);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort !== "desc") params.set("ordem", filters.sort);
  if (filters.page !== 1) params.set("pagina", String(filters.page));
  if (filters.perPage !== 10) params.set("pp", String(filters.perPage));

  const query = params.toString();
  const url = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  window.history.replaceState(window.history.state, "", url);
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Página anterior"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="min-w-[7rem] text-center text-sm text-slate-600">
        Página {totalPages === 0 ? 0 : page} de {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Próxima página"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/inspection/new");
  }, [router]);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MoviCarUser | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [todayInspections, setTodayInspections] = useState(0);

  const [initialState] = useState(parseStateFromUrl);
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialState.tab);
  const [filters, setFilters] = useState<InspectionHistoryFilters>(
    initialState.filters
  );
  const [searchInput, setSearchInput] = useState(initialState.filters.search);

  const [historyRows, setHistoryRows] = useState<InspectionHistoryRow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [kmTraveledByInspectionId, setKmTraveledByInspectionId] = useState<
    Record<string, number | null>
  >({});

  const historyRequestIdRef = useRef(0);
  const [historyReloadToken, setHistoryReloadToken] = useState(0);
  // Histórico de odômetro por veículo, carregado uma única vez por sessão da
  // página: o cálculo de "Km no período" usa o histórico completo do veículo,
  // não apenas as linhas visíveis, e não precisa ser rebaixado a cada página.
  const odometerHistoryCacheRef = useRef(
    new Map<string, OdometerHistoryRow[]>()
  );

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const parsedUser = await resolveMoviCarUserFromAuth();
        if (!parsedUser) {
          router.replace("/login");
          return;
        }

        const role = String(parsedUser.role ?? "").toLowerCase();

        if (role === "motorista") {
          router.replace("/driver");
          return;
        }

        if (!parsedUser.active) {
          await signOutMoviCar();
          router.replace("/login");
          return;
        }

        setUser(parsedUser);

        const [vehiclesRes, todayCount] = await Promise.all([
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
          countInspectionsToday(),
        ]);

        if (vehiclesRes.error) throw vehiclesRes.error;

        setVehicles((vehiclesRes.data ?? []) as VehicleRow[]);
        setTodayInspections(todayCount);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        await signOutMoviCar();
        router.replace("/login");
        return;
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  // Busca com debounce, sempre voltando para a primeira página.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setFilters((current) => {
        if (current.search === searchInput) return current;
        return { ...current, search: searchInput, page: 1 };
      });
    }, 400);

    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    writeStateToUrl(activeTab, filters);
  }, [activeTab, filters]);

  useEffect(() => {
    if (!user) return;

    const requestId = ++historyRequestIdRef.current;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(false);

      try {
        const result = await fetchInspectionHistory(filters);
        if (requestId !== historyRequestIdRef.current) return;

        // Página além do total (ex.: filtro reduziu o resultado): recua.
        if (result.rows.length === 0 && result.total > 0 && filters.page > 1) {
          const lastPage = Math.max(
            1,
            Math.ceil(result.total / filters.perPage)
          );
          setFilters((current) => ({
            ...current,
            page: Math.min(current.page, lastPage),
          }));
          return;
        }

        const vehicleIds = [...new Set(result.rows.map((r) => r.vehicle_id))];

        const cache = odometerHistoryCacheRef.current;
        const missingIds = vehicleIds.filter((id) => !cache.has(id));
        if (missingIds.length > 0) {
          const fetched = await fetchOdometerHistoryForVehicles(missingIds);
          for (const id of missingIds) cache.set(id, []);
          for (const row of fetched) {
            cache.get(row.vehicle_id)?.push(row);
          }
        }

        const kmMap = buildKmTraveledByInspectionId(
          vehicleIds.flatMap((id) => cache.get(id) ?? [])
        );

        if (requestId !== historyRequestIdRef.current) return;

        setHistoryRows(result.rows);
        setHistoryTotal(result.total);
        setKmTraveledByInspectionId(kmMap);
      } catch (error) {
        if (requestId !== historyRequestIdRef.current) return;
        console.error("Erro ao carregar histórico de vistorias:", error);
        setHistoryError(true);
      } finally {
        if (requestId === historyRequestIdRef.current) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();
  }, [user, filters, historyReloadToken]);

  const handleLogout = async () => {
    await signOutMoviCar();
    router.replace("/login");
  };

  const handleNewInspection = () => {
    router.push("/inspection/new");
  };

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/inspections/${id}`);
  };

  const updateFilters = useCallback(
    (changes: Partial<InspectionHistoryFilters>) => {
      setFilters((current) => ({ ...current, ...changes, page: 1 }));
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setFilters((current) => ({ ...current, page: Math.max(1, page) }));
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(historyTotal / filters.perPage));
  const rangeStart =
    historyTotal === 0 ? 0 : (filters.page - 1) * filters.perPage + 1;
  const rangeEnd = Math.min(
    historyTotal,
    (filters.page - 1) * filters.perPage + historyRows.length
  );

  const hasActiveFilters =
    filters.search !== "" ||
    filters.period !== "all" ||
    filters.status !== "";

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <p className="text-lg text-slate-700">Carregando...</p>
      </main>
    );
  }

  const countLabel =
    historyTotal === 0
      ? "Nenhuma vistoria"
      : `Exibindo ${rangeStart}–${rangeEnd} de ${historyTotal} ${
          historyTotal === 1 ? "vistoria" : "vistorias"
        }`;

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
                onClick={() => void handleLogout()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 sm:text-sm">
                Vistorias hoje
              </p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-100">
                <ClipboardList className="text-blue-600" size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {todayInspections}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 sm:text-sm">
                Veículos ativos
              </p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                <Car className="text-green-600" size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {vehicles.length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 sm:text-sm">
                Vistorias em atraso
              </p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                <AlertTriangle className="text-red-600" size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {vehicleStats.overdue}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 sm:text-sm">Vencem hoje</p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <CalendarClock className="text-amber-600" size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {vehicleStats.dueToday}
            </p>
          </div>
        </section>

        <div
          role="tablist"
          aria-label="Seções do dashboard"
          className="mt-5 flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:inline-flex"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "vistorias"}
            onClick={() => setActiveTab("vistorias")}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
              activeTab === "vistorias"
                ? "bg-green-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ClipboardList size={16} />
            Vistorias
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "veiculos"}
            onClick={() => setActiveTab("veiculos")}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
              activeTab === "veiculos"
                ? "bg-green-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Car size={16} />
            Veículos
          </button>
        </div>

        {activeTab === "vistorias" ? (
          <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Histórico de vistorias
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Todas as inspeções registradas, com busca, filtros e paginação.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <div className="relative sm:col-span-2 xl:col-span-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Buscar por placa ou motorista"
                  aria-label="Buscar por placa ou motorista"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </div>

              <select
                value={filters.period}
                onChange={(event) =>
                  updateFilters({
                    period: event.target.value as InspectionHistoryPeriod,
                  })
                }
                aria-label="Filtrar por período"
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(event) =>
                  updateFilters({ status: event.target.value })
                }
                aria-label="Filtrar por status"
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() =>
                  updateFilters({
                    sort: filters.sort === "desc" ? "asc" : "desc",
                  })
                }
                aria-label={
                  filters.sort === "desc"
                    ? "Ordenado por data: mais recentes primeiro. Inverter"
                    : "Ordenado por data: mais antigas primeiro. Inverter"
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {filters.sort === "desc" ? (
                  <ArrowDownWideNarrow size={16} />
                ) : (
                  <ArrowUpNarrowWide size={16} />
                )}
                {filters.sort === "desc" ? "Mais recentes" : "Mais antigas"}
              </button>
            </div>

            {filters.period === "custom" ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-md">
                <label className="text-sm text-slate-600">
                  De
                  <input
                    type="date"
                    value={filters.customFrom}
                    onChange={(event) =>
                      updateFilters({ customFrom: event.target.value })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  Até
                  <input
                    type="date"
                    value={filters.customTo}
                    onChange={(event) =>
                      updateFilters({ customTo: event.target.value })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </label>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600" aria-live="polite">
                {countLabel}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  Por página
                  <select
                    value={filters.perPage}
                    onChange={(event) =>
                      updateFilters({ perPage: Number(event.target.value) })
                    }
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  >
                    {PER_PAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <PaginationControls
                  page={filters.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  disabled={historyLoading}
                />
              </div>
            </div>

            <div className="mt-4">
              {historyError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50/60 px-4 py-10 text-center">
                  <p className="text-sm font-medium text-red-800">
                    Não foi possível carregar o histórico de vistorias.
                  </p>
                  <button
                    type="button"
                    onClick={() => setHistoryReloadToken((t) => t + 1)}
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : historyLoading ? (
                <div className="rounded-3xl border border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                  Carregando vistorias...
                </div>
              ) : historyRows.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                  {hasActiveFilters
                    ? "Nenhuma vistoria encontrada para a busca ou os filtros atuais."
                    : "Nenhuma vistoria registrada até o momento."}
                </div>
              ) : (
                <>
                  {/* Desktop: tabela com coluna de ações fixa à direita */}
                  <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 md:block">
                    <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-left">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3 font-semibold">Veículo</th>
                          <th className="px-4 py-3 font-semibold">
                            Motorista
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            Data e hora
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Hodômetro
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Km no período
                          </th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="sticky right-0 bg-slate-50 px-4 py-3 font-semibold shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRows.map((inspection) => {
                          const statusBadge = getInspectionStatusBadge(
                            inspection.status
                          );
                          const relatedVehicle = getInspectionVehicle(
                            inspection.vehicles
                          );
                          const vehicleName = [
                            relatedVehicle?.brand,
                            relatedVehicle?.model,
                          ]
                            .filter(Boolean)
                            .join(" ");
                          const kmPeriod =
                            kmTraveledByInspectionId[inspection.id];

                          return (
                            <tr key={inspection.id} className="group">
                              <td className="border-t border-slate-200 px-4 py-3">
                                <p className="font-semibold text-slate-900">
                                  {relatedVehicle?.plate || "-"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {vehicleName ||
                                    relatedVehicle?.model ||
                                    "-"}
                                </p>
                              </td>
                              <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                                {inspection.driver_name || "-"}
                              </td>
                              <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                                {formatDateTime(
                                  inspection.finished_at ||
                                    inspection.created_at
                                )}
                              </td>
                              <td className="border-t border-slate-200 px-4 py-3 text-right text-sm tabular-nums text-slate-700">
                                {inspection.odometer != null
                                  ? inspection.odometer.toLocaleString("pt-BR")
                                  : "-"}
                              </td>
                              <td className="border-t border-slate-200 px-4 py-3 text-right text-sm tabular-nums text-slate-700">
                                {kmPeriod != null
                                  ? kmPeriod.toLocaleString("pt-BR")
                                  : "-"}
                              </td>
                              <td className="border-t border-slate-200 px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.tone}`}
                                >
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="sticky right-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleViewDetails(inspection.id)
                                    }
                                    className="inline-flex min-h-9 items-center rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/90"
                                  >
                                    Detalhes
                                  </button>
                                  {inspection.latitude != null &&
                                  inspection.longitude != null ? (
                                    <a
                                      href={buildInspectionMapsUrl(
                                        inspection.latitude,
                                        inspection.longitude
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50"
                                    >
                                      <MapPin size={14} />
                                      Mapa
                                    </a>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: cartões sem rolagem horizontal */}
                  <div className="space-y-3 md:hidden">
                    {historyRows.map((inspection) => {
                      const statusBadge = getInspectionStatusBadge(
                        inspection.status
                      );
                      const relatedVehicle = getInspectionVehicle(
                        inspection.vehicles
                      );
                      const vehicleName = [
                        relatedVehicle?.brand,
                        relatedVehicle?.model,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      const kmPeriod = kmTraveledByInspectionId[inspection.id];

                      return (
                        <article
                          key={inspection.id}
                          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-base font-bold text-slate-900">
                                {relatedVehicle?.plate || "-"}
                              </p>
                              <p className="truncate text-sm text-slate-600">
                                {vehicleName || relatedVehicle?.model || "-"}
                              </p>
                            </div>
                            <span
                              className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.tone}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                            <div className="col-span-2">
                              <dt className="text-xs text-slate-500">
                                Motorista
                              </dt>
                              <dd className="text-slate-700">
                                {inspection.driver_name || "-"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-slate-500">
                                Data e hora
                              </dt>
                              <dd className="text-slate-700">
                                {formatDateTime(
                                  inspection.finished_at ||
                                    inspection.created_at
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-slate-500">
                                Hodômetro
                              </dt>
                              <dd className="tabular-nums text-slate-700">
                                {inspection.odometer != null
                                  ? `${inspection.odometer.toLocaleString(
                                      "pt-BR"
                                    )} km`
                                  : "-"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-slate-500">
                                Km no período
                              </dt>
                              <dd className="tabular-nums text-slate-700">
                                {kmPeriod != null
                                  ? `${kmPeriod.toLocaleString("pt-BR")} km`
                                  : "-"}
                              </dd>
                            </div>
                          </dl>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewDetails(inspection.id)}
                              className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/90"
                            >
                              Detalhes
                            </button>
                            {inspection.latitude != null &&
                            inspection.longitude != null ? (
                              <a
                                href={buildInspectionMapsUrl(
                                  inspection.latitude,
                                  inspection.longitude
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-sm font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                <MapPin size={15} />
                                Mapa
                              </a>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">{countLabel}</p>
              <PaginationControls
                page={filters.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                disabled={historyLoading}
              />
            </div>
          </section>
        ) : (
          <section className="mt-4 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Resumo da frota
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Status das periodicidades configuradas por veículo.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl bg-emerald-50 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-emerald-600"
                    />
                    <p className="text-xs font-semibold text-emerald-800 sm:text-sm">
                      Em dia
                    </p>
                  </div>
                  <p className="mt-2 text-xl font-bold text-emerald-900 sm:text-2xl">
                    {vehicleStats.onTime}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock
                      size={18}
                      className="shrink-0 text-amber-600"
                    />
                    <p className="text-xs font-semibold text-amber-800 sm:text-sm">
                      Vence hoje
                    </p>
                  </div>
                  <p className="mt-2 text-xl font-bold text-amber-900 sm:text-2xl">
                    {vehicleStats.dueToday}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="shrink-0 text-red-600" />
                    <p className="text-xs font-semibold text-red-800 sm:text-sm">
                      Atrasada
                    </p>
                  </div>
                  <p className="mt-2 text-xl font-bold text-red-900 sm:text-2xl">
                    {vehicleStats.overdue}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <UserCircle2
                      size={18}
                      className="shrink-0 text-slate-600"
                    />
                    <p className="text-xs font-semibold text-slate-700 sm:text-sm">
                      Pendente inicial
                    </p>
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                    {vehicleStats.pendingInitial}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
