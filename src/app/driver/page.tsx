"use client";

import { useEffect, useState } from "react";
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
      const role = String(parsedUser.role ?? parsedUser.profile ?? "").toLowerCase();

      if (role && role !== "motorista") {
        router.replace("/dashboard");
        return;
      }

      setUser(parsedUser);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      router.replace("/login");
    }
  }, [router]);

  const handleNewInspection = () => {
    router.push("/inspection/new");
  };

  const handleLogout = () => {
    localStorage.removeItem("movicar_token");
    localStorage.removeItem("movicar_user");
    router.replace("/login");
  };

  const userName = user?.name || user?.nome || "Motorista";

  if (loading) {
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