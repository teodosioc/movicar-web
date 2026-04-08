"use client";

import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

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
        setLoading(false);
        return;
      }

      const savedUser = localStorage.getItem("movicar_user");
      const savedToken = localStorage.getItem("movicar_token");

      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser);

        if (parsedUser?.role === "admin") {
          router.push("/dashboard");
          return;
        }

        if (parsedUser?.role === "motorista") {
          router.push("/driver");
          return;
        }
      }

      // fallback temporário (não quebra seu fluxo)
      const fakeRole = normalizedEmail.includes("admin") ? "admin" : "motorista";

      localStorage.setItem("movicar_token", "mock-token");
      localStorage.setItem(
        "movicar_user",
        JSON.stringify({
          email: normalizedEmail,
          role: fakeRole,
          name: fakeRole === "admin" ? "Administrador" : "Motorista",
        })
      );

      if (fakeRole === "admin") {
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
                Registre fotos, vídeo, quilometragem e histórico completo das inspeções.
              </p>

              <div className="mt-6 space-y-2">
                <p>✔ Fotos direto da câmera</p>
                <p>✔ Vídeo 360 do veículo</p>
                <p>✔ Histórico por veículo</p>
                <p>✔ Controle por motorista</p>
              </div>

              <div className="mt-6 flex gap-3 flex-wrap">
                <a
                  href="https://www.movicarweb.com.br"
                  className="bg-black text-white px-5 py-3 rounded-xl"
                >
                  Conhecer o MoviCar
                </a>

                <a
                  href="https://wa.me/5511987542171?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20MoviCar"
                  target="_blank"
                  className="border px-5 py-3 rounded-xl"
                >
                  Falar no WhatsApp
                </a>
              </div>

              <div className="mt-6 flex gap-4 text-sm">
                <a href="https://www.movicarweb.com.br">Página inicial</a>
                <a href="https://www.movicarweb.com.br/#como-funciona">Como funciona</a>
                <a href="https://www.movicarweb.com.br/contato">Contato</a>
              </div>

            </div>
          </section>

          {/* LOGIN */}
          <section className="order-1 lg:order-2">
            <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow">

              <h2 className="text-2xl font-bold mb-4">Login MoviCar</h2>

              <form onSubmit={handleLogin} className="space-y-4">

                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border px-4 py-3 rounded-xl"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border px-4 py-3 rounded-xl"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button className="w-full bg-green-600 text-white py-3 rounded-xl">
                  {loading ? "Entrando..." : "Entrar"}
                </button>

              </form>

              <div className="mt-6 text-sm">
                <p>Não tem acesso?</p>
                <a
                  href="https://wa.me/5511987542171?text=Quero%20uma%20demo%20do%20MoviCar"
                  className="text-red-600"
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