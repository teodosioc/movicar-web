"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  Camera,
  Video,
  ClipboardList,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  MapPin,
  Smartphone,
} from "lucide-react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <MoviCarLogo />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#como-funciona" className="text-sm font-medium text-zinc-600 hover:text-red-600">
              Como funciona
            </a>
            <a href="#beneficios" className="text-sm font-medium text-zinc-600 hover:text-red-600">
              Benefícios
            </a>
            <a href="#para-quem" className="text-sm font-medium text-zinc-600 hover:text-red-600">
              Para quem é
            </a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="rounded-xl border px-4 py-2 text-sm font-semibold">
              Acessar sistema
            </Link>

            <a
              href="https://wa.me/5511987542171?text=Olá!%20Quero%20conhecer%20o%20MoviCar."
              target="_blank"
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Solicitar demonstração
            </a>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <section className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:grid lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-bold">
              Chega de dúvidas sobre avarias.
            </h1>

            <p className="mt-5 text-lg text-zinc-600">
              Fotos, vídeo 360, checklist, quilometragem e histórico em um único fluxo simples.
            </p>

            {/* 🔥 SEO LINK INSERIDO AQUI */}
            <p className="mt-4 text-sm text-zinc-600">
              Antes de começar, veja nosso{" "}
              <Link
                href="/checklist-vistoria-veicular"
                className="text-red-600 font-semibold underline"
              >
                checklist completo de vistoria veicular
              </Link>{" "}
              e evite prejuízos.
            </p>

            <div className="mt-6 flex gap-3">
              <Link href="/login" className="bg-red-600 text-white px-6 py-3 rounded-xl">
                Acessar sistema
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* COMPONENTES */

function MoviCarLogo() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-xl">MoviCar</span>
    </div>
  );
}