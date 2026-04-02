"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      if (!normalizedEmail || !normalizedPassword) {
        setError("Informe e-mail e senha.");
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .eq("active", true)
        .maybeSingle();

      if (supabaseError) {
        console.error("Erro Supabase:", supabaseError);
        setError("Erro ao validar login.");
        return;
      }

      if (!data) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      if (String(data.password ?? "").trim() !== normalizedPassword) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      const role = String(data.role ?? data.profile ?? "").toLowerCase();

      localStorage.setItem("movicar_token", "ok");
      localStorage.setItem("movicar_user", JSON.stringify(data));

      if (role === "motorista") {
        router.push("/driver");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError("Não foi possível realizar o login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-2 text-slate-900">Login MoviCar</h1>
        <p className="text-sm text-slate-500 mb-4">
          Acesse o sistema de vistoria
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              className="w-full p-3 pr-11 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-3 rounded-xl font-semibold transition"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}