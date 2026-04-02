"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  ClipboardList,
  LogOut,
  PlusCircle,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";

type MoviCarUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MoviCarUser | null>(null);

  useEffect(() => {
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
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      localStorage.removeItem("movicar_token");
      localStorage.removeItem("movicar_user");
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("movicar_token");
    localStorage.removeItem("movicar_user");
    router.replace("/login");
  };

  const handleNewInspection = () => {
    router.push("/inspection/new");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <p className="text-lg text-slate-700">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
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
                  Bem-vindo, <span className="font-semibold">{user?.name || "Admin"}</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Gerencie vistorias, acompanhe o fluxo operacional e inicie novas inspeções com rapidez.
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
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Vistorias hoje</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100">
                <ClipboardList className="text-blue-600" size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">0</p>
            <p className="mt-2 text-sm text-slate-500">
              Total de inspeções iniciadas no dia.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Veículos cadastrados</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100">
                <Car className="text-green-600" size={18} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">0</p>
            <p className="mt-2 text-sm text-slate-500">
              Base disponível para vistorias e controle.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Status da operação</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                <ShieldCheck className="text-emerald-600" size={18} />
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-slate-900">Sistema online</p>
            <p className="mt-2 text-sm text-slate-500">
              Ambiente pronto para uso pelos motoristas.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Perfil</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100">
                <UserCircle2 className="text-violet-600" size={18} />
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-slate-900">
              {user?.role || "admin"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Acesso atual do usuário autenticado.
            </p>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Ações rápidas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Atalhos principais para acelerar a operação.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                onClick={handleNewInspection}
                className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:bg-slate-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <PlusCircle className="text-green-600" size={22} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Iniciar nova vistoria</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Abra um novo fluxo de inspeção do veículo.
                  </p>
                </div>
              </button>

              <button
                onClick={() => router.push("/inspection/new")}
                className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:bg-slate-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <ClipboardList className="text-blue-600" size={22} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Acessar inspeções</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Continue o fluxo operacional do app.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Usuário logado</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nome
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {user?.name || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  E-mail
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900 break-all">
                  {user?.email || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Perfil
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {user?.role || "-"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}