"use client";

import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { cacheProfileFromSession } from "@/app/lib/movicarAuth";

type MoviCarProfile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  active: boolean | null;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      if (!normalizedEmail || !normalizedPassword) {
        setError("Preencha e-mail e senha.");
        return;
      }

      localStorage.removeItem("movicar_token");
      localStorage.removeItem("movicar_user");

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        });

      if (authError || !authData.user) {
        console.error("Erro auth:", authError);
        setError("E-mail ou senha inválidos.");
        return;
      }

      const authUser = authData.user;

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, name, email, role, active")
        .eq("id", authUser.id)
        .single<MoviCarProfile>();

      if (profileError) {
        console.error("Erro ao carregar perfil:", profileError);
        await supabase.auth.signOut();
        setError("Não foi possível carregar seu perfil de acesso.");
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();
        setError("Usuário autenticado, mas sem cadastro no MoviCar.");
        return;
      }

      if (profile.active === false) {
        await supabase.auth.signOut();
        setError("Esta conta está inativa. Contacte o suporte.");
        return;
      }

      const role = String(profile.role ?? "").toLowerCase();

      if (role !== "admin" && role !== "motorista") {
        await supabase.auth.signOut();
        setError("Perfil inválido para este acesso.");
        return;
      }

      if (!authData.session) {
        setError("Sessão inválida após o login.");
        return;
      }

      cacheProfileFromSession(profile, authData.session, normalizedEmail);

      if (role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/driver");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.10),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.10),_transparent_30%)]" />
      <div className="absolute inset-0 bg-slate-50/70" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.2fr_0.9fr] xl:gap-14">
          {/* INSTITUCIONAL */}
          <section className="order-2 lg:order-1">
            <div className="max-w-2xl">
              <a
                href="https://www.movicarweb.com.br"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
              >
                MoviCar • Vistorias veiculares digitais
              </a>

              <h1 className="mt-6 text-4xl font-black">
                Vistorias veiculares digitais com{" "}
                <span className="text-red-600">controle total</span>
              </h1>

              <p className="mt-4 text-slate-600">
                Registre fotos, vídeo, quilometragem e histórico completo das
                inspeções.
              </p>

              <div className="mt-6 space-y-2">
                <p>✔ Fotos direto da câmera</p>
                <p>✔ Vídeo 360 do veículo</p>
                <p>✔ Histórico por veículo</p>
                <p>✔ Controle por motorista</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://www.movicarweb.com.br"
                  className="rounded-xl bg-black px-5 py-3 text-white"
                >
                  Conhecer o MoviCar
                </a>

                <a
                  href="https://wa.me/5511987542171?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20MoviCar"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border px-5 py-3"
                >
                  Falar no WhatsApp
                </a>
              </div>

              <div className="mt-6 flex gap-4 text-sm">
                <a href="https://www.movicarweb.com.br">Página inicial</a>
                <a href="https://www.movicarweb.com.br/#como-funciona">
                  Como funciona
                </a>
                <a href="https://www.movicarweb.com.br/contato">Contato</a>
              </div>
            </div>
          </section>

          {/* LOGIN */}
          <section className="order-1 lg:order-2">
            <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-2xl font-bold">Login MoviCar</h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-green-600 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="mt-6 text-sm">
                <p>Não tem acesso?</p>
                <a
                  href="https://wa.me/5511987542171?text=Quero%20uma%20demo%20do%20MoviCar"
                  className="text-red-600"
                  target="_blank"
                  rel="noreferrer"
                >
                  Solicitar demonstração
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}