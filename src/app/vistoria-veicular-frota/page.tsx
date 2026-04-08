import Link from "next/link";

export const metadata = {
  title: "Vistoria Veicular para Frotas: Como Controlar Veículos | MoviCar",
  description:
    "Veja como fazer vistoria veicular para frotas, reduzir prejuízos e manter controle dos veículos com um processo padronizado.",
};

export default function VistoriaFrotaPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl font-bold sm:text-4xl">
          Vistoria veicular para frotas: como ter controle total dos veículos
        </h1>

        <p className="mt-4 text-lg text-zinc-600">
          A vistoria veicular para frotas é essencial para empresas que precisam
          controlar o estado dos veículos, reduzir custos com avarias e manter
          um histórico confiável das inspeções.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">
          Por que a vistoria é importante para frotas?
        </h2>

        <p className="mt-3 text-zinc-600">
          Sem um processo estruturado, empresas perdem controle sobre o estado
          dos veículos, gerando prejuízos, retrabalho e falta de rastreabilidade.
        </p>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>✔️ Redução de custos com manutenção</li>
          <li>✔️ Identificação rápida de avarias</li>
          <li>✔️ Controle de uso dos veículos</li>
          <li>✔️ Histórico completo das inspeções</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">
          Quando fazer vistoria em frotas?
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>📌 Início do turno</li>
          <li>📌 Final do turno</li>
          <li>📌 Troca de motorista</li>
          <li>📌 Após manutenção</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">
          Problemas comuns sem controle de vistoria
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>❌ Falta de histórico</li>
          <li>❌ Custos elevados com manutenção</li>
          <li>❌ Uso indevido do veículo</li>
          <li>❌ Dificuldade em identificar responsáveis por danos</li>
        </ul>

        {/* 🔥 LINKS SEO */}
        <p className="mt-4 text-zinc-600">
          Para estruturar melhor seu processo, veja o{" "}
          <Link
            href="/checklist-vistoria-veicular"
            className="text-red-600 underline font-semibold"
          >
            checklist completo de vistoria veicular
          </Link>{" "}
          e padronize suas inspeções.
        </p>

        <p className="mt-4 text-zinc-600">
          Também é possível fazer tudo pelo celular. Veja como utilizar um{" "}
          <Link
            href="/vistoria-veicular-app"
            className="text-red-600 underline font-semibold"
          >
            app de vistoria veicular
          </Link>{" "}
          para ganhar agilidade.
        </p>

        {/* 🔥 NOVO LINK UBER */}
        <p className="mt-4 text-zinc-600">
          Empresas com motoristas de aplicativo devem aplicar{" "}
          <Link
            href="/vistoria-veicular-uber"
            className="text-red-600 underline font-semibold"
          >
            vistoria veicular para Uber
          </Link>{" "}
          de forma padronizada e segura.
        </p>

        <div className="mt-8 rounded-2xl border bg-zinc-50 p-6">
          <h3 className="text-lg font-semibold">
            Como o MoviCar ajuda na gestão de frotas
          </h3>

          <ul className="mt-3 space-y-2 text-zinc-700">
            <li>📸 Registro padronizado com fotos</li>
            <li>🎥 Vídeo 360 do veículo</li>
            <li>📋 Checklist estruturado</li>
            <li>📊 Histórico completo</li>
            <li>📍 Registro de localização</li>
          </ul>

          <div className="mt-5 flex gap-3">
            <Link
              href="/login"
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Acessar sistema
            </Link>

            <Link
              href="/vistoria-veicular-locacao"
              className="border px-6 py-3 rounded-xl font-semibold"
            >
              Ver vistoria para locação
            </Link>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold">
          Conclusão
        </h2>

        <p className="mt-3 text-zinc-600">
          A vistoria veicular em frotas é fundamental para reduzir custos,
          melhorar a operação e garantir controle total sobre os veículos.
        </p>

      </div>
    </main>
  );
}