"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("movicar_user_email") || "";
    const token = localStorage.getItem("movicar_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setUserEmail(savedEmail);
  }, [router]);

  const handleNewInspection = () => {
    router.push("/inspection/new");
  };

  const handleLogout = () => {
    localStorage.removeItem("movicar_token");
    localStorage.removeItem("movicar_user_email");
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dashboard MoviCar
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Bem-vindo ao sistema de vistoria de veículos.
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Usuário logado:</p>
            <p className="mt-2 break-all text-base font-semibold text-slate-900">
              {userEmail || "Usuário não identificado"}
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleNewInspection}
              className="flex w-full items-center justify-center rounded-2xl bg-green-600 px-4 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.99]"
            >
              Nova vistoria
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.99]"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}