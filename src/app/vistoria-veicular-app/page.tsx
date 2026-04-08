import Link from "next/link";

export const metadata = {
  title: "Vistoria Veicular por App: Como Fazer Pelo Celular | MoviCar",
  description:
    "Entenda como fazer vistoria veicular pelo celular com fotos, vídeo e checklist. Veja como um app pode padronizar e agilizar o processo.",
};

export default function VistoriaVeicularAppPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Vistoria veicular por app: como fazer pelo celular
        </h1>

        <p className="mt-4 text-lg text-zinc-600">
          Fazer vistoria veicular pelo celular é uma forma prática de registrar
          fotos, vídeo, checklist e informações importantes do veículo em um só
          lugar. Esse modelo reduz falhas, melhora a organização e ajuda a
          evitar prejuízos.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">
          O que é uma vistoria veicular por app?
        </h2>

        <p className="mt-3 text-zinc-600">
          A vistoria veicular por app é a digitalização do processo de inspeção
          de veículos. Em vez de depender de fotos soltas, mensagens e anotações
          desconectadas, o usuário segue um fluxo orientado no celular para
          registrar as evidências da vistoria.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">
          Quais são as vantagens de fazer vistoria pelo celular?
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>✔️ Mais agilidade no processo</li>
          <li>✔️ Fotos organizadas por etapa</li>
          <li>✔️ Registro de vídeo do veículo</li>
          <li>✔️ Checklist padronizado</li>
          <li>✔️ Histórico centralizado</li>
          <li>✔️ Menor risco de perda de informação</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">
          Como fazer uma vistoria veicular pelo celular
        </h2>

        <ol className="mt-4 space-y-3 text-zinc-700">
          <li>1. Selecione o veículo que será inspecionado.</li>
          <li>2. Capture fotos das partes obrigatórias.</li>
          <li>3. Registre a quilometragem.</li>
          <li>4. Grave um vídeo curto do veículo.</li>
          <li>5. Finalize a vistoria e salve o histórico.</li>
        </ol>

        <h2 className="mt-10 text-2xl font-semibold">
          Quando vale a pena usar um app de vistoria?
        </h2>

        <p className="mt-3 text-zinc-600">
          O uso de um app de vistoria é especialmente útil para locadoras,
          frotistas, oficinas e empresas.
        </p>

        {/* 🔥 LINK FROTA */}
        <p className="mt-4 text-zinc-600">
          Para empresas, veja também como fazer{" "}
          <Link
            href="/vistoria-veicular-frota"
            className="text-red-600 underline font-semibold"
          >
            vistoria veicular para frotas
          </Link>{" "}
          e melhorar o controle operacional.
        </p>

        {/* 🔥 LINK LOCAÇÃO */}
        <p className="mt-4 text-zinc-600">
          Em operações de aluguel, veja também como fazer{" "}
          <Link
            href="/vistoria-veicular-locacao"
            className="text-red-600 underline font-semibold"
          >
            vistoria veicular para locação
          </Link>{" "}
          e evitar prejuízos.
        </p>

        {/* 🔥 NOVO LINK UBER */}
        <p className="mt-4 text-zinc-600">
          Motoristas de aplicativo também podem aplicar esse processo. Veja como fazer{" "}
          <Link
            href="/vistoria-veicular-uber"
            className="text-red-600 underline font-semibold"
          >
            vistoria veicular para Uber
          </Link>{" "}
          de forma simples e segura.
        </p>

        <div className="mt-8 rounded-2xl border bg-zinc-50 p-6">
          <h3 className="text-lg font-semibold">
            Como o MoviCar ajuda nesse processo
          </h3>

          <ul className="mt-3 space-y-2 text-zinc-700">
            <li>📸 Captura de fotos guiadas</li>
            <li>🎥 Vídeo 360</li>
            <li>📋 Checklist estruturado</li>
            <li>📍 Localização</li>
            <li>🗂️ Histórico</li>
          </ul>

          <div className="mt-5 flex gap-3">
            <Link
              href="/login"
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Acessar sistema
            </Link>

            <Link
              href="/checklist-vistoria-veicular"
              className="border px-6 py-3 rounded-xl font-semibold"
            >
              Ver checklist
            </Link>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold">Conclusão</h2>

        <p className="mt-3 text-zinc-600">
          A vistoria veicular pelo celular traz mais organização e segurança.
        </p>
      </div>
    </main>
  );
}