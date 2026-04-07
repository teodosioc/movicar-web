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
            <a
              href="#como-funciona"
              className="text-sm font-medium text-zinc-600 transition hover:text-red-600"
            >
              Como funciona
            </a>
            <a
              href="#beneficios"
              className="text-sm font-medium text-zinc-600 transition hover:text-red-600"
            >
              Benefícios
            </a>
            <a
              href="#para-quem"
              className="text-sm font-medium text-zinc-600 transition hover:text-red-600"
            >
              Para quem é
            </a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Acessar sistema
            </Link>

            <a
              href="https://wa.me/5511987542171?text=Olá!%20Quero%20conhecer%20o%20MoviCar."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Solicitar demonstração
            </a>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 text-zinc-700 transition hover:bg-zinc-50 lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-zinc-200 bg-white lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
              <a
                href="#como-funciona"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-red-600"
              >
                Como funciona
              </a>
              <a
                href="#beneficios"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-red-600"
              >
                Benefícios
              </a>
              <a
                href="#para-quem"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-red-600"
              >
                Para quem é
              </a>

              <div className="mt-2 grid gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Acessar sistema
                </Link>

                <a
                  href="https://wa.me/5511987542171?text=Olá!%20Quero%20conhecer%20o%20MoviCar."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Solicitar demonstração
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-zinc-50">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50 to-zinc-100" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-20">
          <div className="order-2 lg:order-1">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 sm:text-sm">
              <ShieldCheck size={16} />
              Mais evidência e controle nas vistorias
            </span>

            <p className="mb-4 text-xs font-medium tracking-wide text-zinc-500 sm:text-sm">
              www.movicarweb.com.br
            </p>

            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
              Chega de dúvidas sobre avarias.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Tenha evidência de cada vistoria.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              Fotos, vídeo 360, checklist, quilometragem e histórico em um único
              fluxo simples, padronizado e rastreável.
            </p>

            <p className="mt-4 text-sm text-zinc-600">
              Antes de começar, veja nosso{" "}
              <Link
                href="/checklist-vistoria-veicular"
                className="font-semibold text-red-600 underline"
              >
                checklist completo de vistoria veicular
              </Link>{" "}
              e evite prejuízos.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Acessar sistema
                <ArrowRight size={18} />
              </Link>

              <a
                href="https://wa.me/5511987542171?text=Olá!%20Quero%20solicitar%20uma%20demonstração%20do%20MoviCar."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-zinc-300 px-6 py-3 text-base font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Solicitar demonstração
              </a>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard title="Fotos" text="Evidências padronizadas por etapa" />
              <MetricCard title="Vídeo 360" text="Mais contexto visual da vistoria" />
              <MetricCard title="Histórico" text="Registro centralizado e rastreável" />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-xl rounded-[28px] border border-zinc-200 bg-white p-3 shadow-2xl shadow-zinc-200/70 sm:rounded-[32px] sm:p-4">
              <div className="rounded-[22px] bg-zinc-950 p-2.5 sm:rounded-[28px] sm:p-3">
                <div className="overflow-hidden rounded-[18px] bg-zinc-50 sm:rounded-[24px]">
                  <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-3 sm:px-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <MoviCarIconOnly className="h-6 w-6 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-zinc-900">
                          Nova vistoria
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          Renault Logan - ABC1D23
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold text-red-700 sm:text-xs">
                      3/6
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="mb-4 rounded-2xl bg-zinc-200 p-2">
                      <div className="mx-auto w-full max-w-[250px] overflow-hidden rounded-xl bg-white sm:max-w-[270px]">
                        <div className="aspect-[4/5]">
                          <img
                            src="/examples/lateral-direita.png"
                            alt="Foto lateral direita do veículo"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-2xl bg-zinc-100 p-4">
                        <p className="text-sm font-semibold text-zinc-800">
                          Checklist da etapa
                        </p>

                        <div className="mt-3 space-y-2">
                          <MockLine text="Foto capturada" />
                          <MockLine text="Envio automático" />
                          <MockLine text="Registro salvo com evidência" />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white"
                      >
                        Próximo passo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniFeature
                  icon={<Camera size={18} className="text-red-600" />}
                  text="Fotos guiadas"
                />
                <MiniFeature
                  icon={<Video size={18} className="text-red-600" />}
                  text="Vídeo curto"
                />
                <MiniFeature
                  icon={<MapPin size={18} className="text-red-600" />}
                  text="Localização"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 sm:text-sm">
              Benefícios do MoviCar
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
              Mais padrão, mais evidência e mais controle operacional
            </h2>
            <p className="mt-4 text-base text-zinc-600 sm:text-lg">
              O MoviCar foi pensado para simplificar a vistoria em campo e dar
              visibilidade para a gestão.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={<Camera size={22} />}
              title="Evidência padronizada"
              description="Fotos organizadas por etapa para reduzir falhas e melhorar a qualidade do registro."
            />
            <FeatureCard
              icon={<Video size={22} />}
              title="Vídeo 360"
              description="Registro complementar em vídeo para dar mais contexto sobre o estado geral do veículo."
            />
            <FeatureCard
              icon={<ClipboardList size={22} />}
              title="Checklist estruturado"
              description="Fluxo guiado para o usuário seguir a sequência correta e concluir a vistoria com mais segurança."
            />
            <FeatureCard
              icon={<Clock3 size={22} />}
              title="Mais agilidade"
              description="Processo digital, simples e rastreável, reduzindo retrabalho e perda de informação."
            />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 sm:text-sm">
              Como funciona
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
              Um fluxo simples para registrar a vistoria com padrão e rastreabilidade
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StepCard
              step="01"
              title="Selecione o veículo"
              description="O usuário inicia a vistoria escolhendo o veículo que será inspecionado."
            />
            <StepCard
              step="02"
              title="Capture as evidências"
              description="O sistema conduz a coleta de fotos e vídeo de forma organizada."
            />
            <StepCard
              step="03"
              title="Registre os dados"
              description="Quilometragem, checklist e demais informações ficam centralizados na vistoria."
            />
            <StepCard
              step="04"
              title="Finalize e acompanhe"
              description="Tudo fica salvo para consulta, auditoria e análise posterior."
            />
          </div>
        </div>
      </section>

      <section id="para-quem" className="bg-zinc-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="rounded-full bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 sm:text-sm">
              Para quem é
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
              Uma solução pensada para operações que precisam de mais controle
              sobre seus veículos
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              O MoviCar pode ser utilizado em diferentes cenários onde a vistoria
              é importante para reduzir risco, registrar avarias e manter histórico.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <AudienceCard
                title="Locadoras"
                description="Mais controle de retirada, devolução e estado dos veículos."
              />
              <AudienceCard
                title="Frotistas"
                description="Padronização de inspeções e histórico para gestão operacional."
              />
              <AudienceCard
                title="Oficinas"
                description="Registro visual do veículo na entrada e saída do serviço."
              />
              <AudienceCard
                title="Empresas em geral"
                description="Mais segurança para veículos de uso interno ou compartilhado."
              />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-zinc-900">
              O que o MoviCar ajuda a evitar
            </h3>

            <div className="mt-6 space-y-4">
              <BenefitLine text="Discussões sobre avarias sem evidência organizada" />
              <BenefitLine text="Perda de fotos e vídeos em conversas ou galerias pessoais" />
              <BenefitLine text="Fluxos diferentes para cada colaborador" />
              <BenefitLine text="Falta de rastreabilidade sobre quem fez a vistoria" />
              <BenefitLine text="Retrabalho para localizar histórico de inspeções" />
            </div>

            <div className="mt-8 rounded-2xl bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <FileCheck className="mt-0.5 shrink-0 text-red-600" size={22} />
                <div>
                  <p className="font-semibold text-zinc-900">
                    Centralização e evidência
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    O objetivo do MoviCar é transformar uma vistoria solta e
                    informal em um processo digital, padronizado e mais confiável.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <HighlightCard
              icon={<Smartphone size={22} />}
              title="Experiência mobile"
              description="Fluxo pensado para uso prático no celular, no momento da vistoria."
            />
            <HighlightCard
              icon={<MapPin size={22} />}
              title="Contexto da operação"
              description="Registro de localização para complementar a rastreabilidade da inspeção."
            />
            <HighlightCard
              icon={<ShieldCheck size={22} />}
              title="Mais confiança"
              description="Informações organizadas para apoiar gestão, conferência e tomada de decisão."
            />
          </div>
        </div>
      </section>

      <section className="bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Leve mais controle e padronização para as vistorias da sua operação
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">
            O MoviCar ajuda sua empresa a registrar evidências com mais organização,
            reduzir retrabalho e melhorar a gestão do processo.
          </p>

          <div className="mt-8 grid gap-3 sm:flex sm:justify-center">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-red-700"
            >
              Acessar sistema
              <ArrowRight size={18} />
            </Link>

            <a
              href="https://wa.me/5511987542171?text=Olá!%20Quero%20conhecer%20o%20MoviCar."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-zinc-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-zinc-900"
            >
              Solicitar demonstração
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-zinc-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <MoviCarLogo dark />

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/login" className="transition hover:text-red-400">
              Login
            </Link>
            <a
              href="https://wa.me/5511987542171?text=Olá!%20Quero%20conhecer%20o%20MoviCar."
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-red-400"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function MoviCarLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <MoviCarIconOnly className="h-10 w-10 shrink-0" />
      <span
        className={`text-2xl font-extrabold tracking-tight ${
          dark ? "text-white" : "text-zinc-950"
        }`}
      >
        MoviCar
      </span>
    </div>
  );
}

function MoviCarIconOnly({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MoviCar logo"
      role="img"
    >
      <path
        d="M32 5C23 5 14.5 6.2 9 8.2V27.5C9 43.5 19.7 54.5 32 59C44.3 54.5 55 43.5 55 27.5V8.2C49.5 6.2 41 5 32 5Z"
        fill="#DC2626"
      />
      <path
        d="M44.7 11.5L27.2 31.8L20.1 24.9L14.6 30.4L27.8 43.6L50.5 17.2L44.7 11.5Z"
        fill="white"
      />
      <path
        d="M55 8.2V27.5C55 43.5 44.3 54.5 32 59V5C41 5 49.5 6.2 55 8.2Z"
        fill="url(#movicarShade)"
        fillOpacity="0.16"
      />
      <defs>
        <linearGradient
          id="movicarShade"
          x1="32"
          y1="5"
          x2="55"
          y2="59"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#000000" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MetricCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xl font-bold text-zinc-900 sm:text-2xl">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{text}</p>
    </div>
  );
}

function MockLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600">
      <CheckCircle2 size={16} className="shrink-0 text-red-600" />
      <span>{text}</span>
    </div>
  );
}

function MiniFeature({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-2 text-[11px] font-medium text-zinc-700 sm:text-xs">
        {text}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
      <div className="text-sm font-extrabold tracking-widest text-red-600">
        {step}
      </div>
      <h3 className="mt-3 text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

function AudienceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

function BenefitLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-red-600" />
      <p className="text-sm leading-6 text-zinc-700">{text}</p>
    </div>
  );
}

function HighlightCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}