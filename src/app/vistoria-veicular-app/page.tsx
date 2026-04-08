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
          frotistas, oficinas, empresas com veículos operacionais e qualquer
          operação que precise de mais controle, padrão e rastreabilidade.
        </p>

        <div className="mt-8 rounded-2xl border bg-zinc-50 p-6">
          <h3 className="text-lg font-semibold">
            Como o MoviCar ajuda nesse processo
          </h3>

          <ul className="mt-3 space-y-2 text-zinc-700">
            <li>📸 Captura de fotos guiadas</li>
            <li>🎥 Vídeo 360 do veículo</li>
            <li>📋 Fluxo estruturado de vistoria</li>
            <li>📍 Registro de localização</li>
            <li>🗂️ Histórico centralizado das inspeções</li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Acessar sistema
            </Link>

            <Link
              href="/checklist-vistoria-veicular"
              className="inline-flex rounded-xl border border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Ver checklist completo
            </Link>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold">
          Conclusão
        </h2>

        <p className="mt-3 text-zinc-600">
          A vistoria veicular pelo celular traz mais organização, rapidez e
          segurança para a operação. Com um app adequado, o processo fica mais
          simples de executar e muito mais confiável para consulta futura.
        </p>
      </div>
    </main>
  );
}