import Link from "next/link";

export const metadata = {
  title: "Vistoria Veicular para Locação: Como Evitar Prejuízos | MoviCar",
  description:
    "Aprenda como fazer vistoria veicular em locação e evitar prejuízos com avarias. Veja o passo a passo e como padronizar o processo.",
};

export default function VistoriaLocacaoPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl font-bold sm:text-4xl">
          Vistoria veicular para locação: como evitar prejuízos
        </h1>

        <p className="mt-4 text-lg text-zinc-600">
          A vistoria veicular na locação é essencial para garantir que o veículo
          seja entregue e devolvido nas condições corretas, evitando prejuízos,
          discussões e falta de evidências.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">
          Por que a vistoria é tão importante na locação?
        </h2>

        <p className="mt-3 text-zinc-600">
          Sem um processo estruturado, é comum surgirem conflitos sobre avarias,
          riscos ou danos no veículo. A vistoria garante registro claro do estado
          do carro antes e depois do uso.
        </p>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>✔️ Evita discussões com o motorista</li>
          <li>✔️ Garante evidência de avarias</li>
          <li>✔️ Protege o proprietário do veículo</li>
          <li>✔️ Organiza o processo de entrega e devolução</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">
          Quando fazer a vistoria na locação?
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>📌 Antes da entrega do veículo</li>
          <li>📌 Na devolução</li>
          <li>📌 Em trocas de motorista</li>
          <li>📌 Após manutenção</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">
          O que verificar na vistoria?
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>✔️ Lataria (riscos e amassados)</li>
          <li>✔️ Pneus</li>
          <li>✔️ Faróis</li>
          <li>✔️ Interior</li>
          <li>✔️ Quilometragem</li>
          <li>✔️ Estepe</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">
          Problemas comuns sem vistoria
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>❌ Falta de prova de danos</li>
          <li>❌ Prejuízo com avarias não identificadas</li>
          <li>❌ Conflitos com motoristas</li>
          <li>❌ Perda de histórico</li>
        </ul>

        <div className="mt-8 rounded-2xl border bg-zinc-50 p-6">
          <h3 className="text-lg font-semibold">
            Como o MoviCar resolve isso
          </h3>

          <ul className="mt-3 space-y-2 text-zinc-700">
            <li>📸 Fotos obrigatórias por etapa</li>
            <li>🎥 Vídeo 360 do veículo</li>
            <li>📋 Checklist padronizado</li>
            <li>📊 Histórico completo de vistorias</li>
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
              href="/checklist-vistoria-veicular"
              className="border px-6 py-3 rounded-xl font-semibold"
            >
              Ver checklist completo
            </Link>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold">
          Conclusão
        </h2>

        <p className="mt-3 text-zinc-600">
          A vistoria veicular na locação não é opcional — é uma necessidade para
          qualquer operação que queira reduzir riscos e ter controle real sobre
          seus veículos.
        </p>

      </div>
    </main>
  );
}