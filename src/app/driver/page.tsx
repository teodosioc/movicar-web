"use client";

import { useEffect, useMemo } from "react";
import { ClipboardCheck, LogOut, PlusCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";

type MoviCarUser = {
  id?: string;
  name?: string;
  nome?: string;
  email?: string;
  role?: string;
  profile?: string;
};

export default function DriverPage() {
  const router = useRouter();

  const authData = useMemo(() => {
    if (typeof window === "undefined") {
      return { token: null as string | null, user: null as MoviCarUser | null, role: "" };
    }

    try {
      const token = localStorage.getItem("movicar_token");
      const userData = localStorage.getItem("movicar_user");
      const parsedUser: MoviCarUser | null = userData ? JSON.parse(userData) : null;
      const role = String(parsedUser?.role ?? parsedUser?.profile ?? "").toLowerCase();

      return { token, user: parsedUser, role };
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      return { token: null as string | null, user: null as MoviCarUser | null, role: "" };
    }
  }, []);

  useEffect(() => {
    if (!authData.token || !authData.user) {
      router.replace("/login");
      return;
    }

    if (authData.role && authData.role !== "motorista") {
      router.replace("/dashboard");
    }
  }, [authData, router]);

  const handleNewInspection = () => {
    router.push("/inspection/new");
  };

  const handleLogout = () => {
    localStorage.removeItem("movicar_token");
    localStorage.removeItem("movicar_user");
    router.replace("/login");
  };

  const userName = authData.user?.name || authData.user?.nome || "Motorista";

  if (!authData.token || !authData.user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <p className="text-slate-700 text-lg">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
              <User className="text-green-700" size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Bem-vindo</p>
              <h1 className="text-xl font-bold text-slate-900">{userName}</h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            Pronto para iniciar uma nova vistoria?
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <button
            onClick={handleNewInspection}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-green-700"
          >
            <PlusCircle size={20} />
            Nova vistoria
          </button>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 text-slate-500" size={20} />
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Orientação rápida
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Verifique o veículo selecionado e siga as etapas da vistoria
                  até o envio final.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </main>
  );
}