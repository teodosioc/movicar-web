import Link from "next/link";

export const metadata = {
  title: "Vistoria Veicular para Uber: Como Evitar Prejuízos | MoviCar",
  description:
    "Saiba como fazer vistoria veicular para Uber e evitar prejuízos com avarias. Veja checklist, boas práticas e como usar app para controle.",
};

export default function VistoriaUberPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-3xl">

        {/* H1 */}
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Vistoria veicular para Uber: como evitar prejuízos
        </h1>

        {/* INTRO */}
        <p className="mt-4 text-lg text-zinc-600">
          Fazer vistoria veicular para Uber é essencial para garantir que o
          veículo esteja sempre em boas condições e evitar prejuízos com danos,
          desgaste e uso indevido.
        </p>

        {/* H2 */}
        <h2 className="mt-10 text-2xl font-semibold">
          Por que fazer vistoria em carros de Uber?
        </h2>

        <p className="mt-3 text-zinc-600">
          Motoristas de aplicativo utilizam o veículo intensivamente, o que
          aumenta o risco de avarias e desgaste. A vistoria permite identificar
          problemas rapidamente e manter controle do estado do carro.
        </p>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>✔️ Identificação de danos rapidamente</li>
          <li>✔️ Redução de custos com manutenção</li>
          <li>✔️ Controle de uso do veículo</li>
          <li>✔️ Mais segurança para motorista e passageiro</li>
        </ul>

        {/* H2 */}
        <h2 className="mt-10 text-2xl font-semibold">
          Quando fazer a vistoria?
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>📌 Antes de iniciar o dia</li>
          <li>📌 Após finalizar o turno</li>
          <li>📌 Em trocas de motorista</li>
          <li>📌 Após manutenção</li>
        </ul>

        {/* H2 */}
        <h2 className="mt-10 text-2xl font-semibold">
          O que verificar na vistoria?
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>✔️ Lataria e pintura</li>
          <li>✔️ Pneus</li>
          <li>✔️ Faróis e lanternas</li>
          <li>✔️ Interior do veículo</li>
          <li>✔️ Quilometragem</li>
          <li>✔️ Estepe</li>
        </ul>

        {/* 🔗 LINKS SEO */}
        <p className="mt-4 text-zinc-600">
          Para garantir uma vistoria completa, veja o{" "}
          <Link
            href="/checklist-vistoria-veicular"
            className="text-red-600 underline font-semibold"
          >
            checklist de vistoria veicular completo
          </Link>.
        </p>

        <p className="mt-4 text-zinc-600">
          Também é possível fazer todo o processo pelo celular. Veja como usar um{" "}
          <Link
            href="/vistoria-veicular-app"
            className="text-red-600 underline font-semibold"
          >
            app de vistoria veicular
          </Link>.
        </p>

        <p className="mt-4 text-zinc-600">
          Para quem trabalha com vários veículos, veja também como aplicar{" "}
          <Link
            href="/vistoria-veicular-frota"
            className="text-red-600 underline font-semibold"
          >
            vistoria em frotas
          </Link>.
        </p>

        <p className="mt-4 text-zinc-600">
          Se você aluga veículos, veja também como fazer{" "}
          <Link
            href="/vistoria-veicular-locacao"
            className="text-red-600 underline font-semibold"
          >
            vistoria para locação
          </Link>.
        </p>

        {/* BLOCO MOVICAR */}
        <div className="mt-8 rounded-2xl border bg-zinc-50 p-6">
          <h3 className="text-lg font-semibold">
            Como o MoviCar ajuda motoristas de Uber
          </h3>

          <ul className="mt-3 space-y-2 text-zinc-700">
            <li>📸 Registro de fotos obrigatório</li>
            <li>🎥 Vídeo 360 do veículo</li>
            <li>📋 Checklist estruturado</li>
            <li>📍 Registro de localização</li>
            <li>📊 Histórico de vistorias</li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700"
            >
              Acessar sistema
            </Link>

            <Link
              href="/checklist-vistoria-veicular"
              className="border px-6 py-3 rounded-xl font-semibold"
            >
              Ver checklist completo
            </Link>
          </div>
        </div>

        {/* CONCLUSÃO */}
        <h2 className="mt-10 text-2xl font-semibold">
          Conclusão
        </h2>

        <p className="mt-3 text-zinc-600">
          A vistoria veicular para Uber é fundamental para manter o veículo em
          bom estado, reduzir custos e garantir uma operação mais segura e
          controlada.
        </p>

      </div>
    </main>
  );
}