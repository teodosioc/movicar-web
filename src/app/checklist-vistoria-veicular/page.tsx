import Link from "next/link";

export const metadata = {
  title: "Checklist de Vistoria Veicular Completo | MoviCar",
  description:
    "Veja o checklist completo de vistoria veicular e aprenda como evitar prejuízos com avarias. Guia prático e profissional.",
};

export default function ChecklistPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-3xl">

        {/* H1 */}
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Checklist de Vistoria Veicular Completo (Passo a Passo)
        </h1>

        {/* INTRO */}
        <p className="mt-4 text-zinc-600 text-lg">
          Fazer uma vistoria veicular correta é essencial para evitar prejuízos,
          identificar avarias e garantir segurança. Neste guia completo, você
          vai aprender o passo a passo para realizar uma vistoria profissional.
        </p>

        {/* H2 */}
        <h2 className="mt-10 text-2xl font-semibold">
          O que é uma vistoria veicular?
        </h2>

        <p className="mt-3 text-zinc-600">
          A vistoria veicular é um processo de inspeção detalhada de um veículo
          para identificar danos, avarias ou irregularidades. Ela é muito
          utilizada por locadoras, frotistas, motoristas de aplicativo e
          empresas que precisam manter controle sobre seus veículos.
        </p>

        {/* CHECKLIST */}
        <h2 className="mt-10 text-2xl font-semibold">
          Checklist de vistoria veicular
        </h2>

        <ul className="mt-4 space-y-2 text-zinc-700">
          <li>✔️ Verificar lataria (riscos, amassados e pintura)</li>
          <li>✔️ Condição dos pneus</li>
          <li>✔️ Faróis e lanternas</li>
          <li>✔️ Vidros e para-brisa</li>
          <li>✔️ Retrovisores</li>
          <li>✔️ Interior do veículo</li>
          <li>✔️ Painel e quilometragem</li>
          <li>✔️ Estepe e macaco</li>
          <li>✔️ Documentação do veículo</li>
        </ul>

        {/* H2 */}
        <h2 className="mt-10 text-2xl font-semibold">
          Como fazer uma vistoria veicular profissional
        </h2>

        <p className="mt-3 text-zinc-600">
          Para garantir uma vistoria eficiente, o ideal é seguir um processo
          padronizado, registrando fotos, vídeos e informações importantes.
          Isso evita discussões futuras e aumenta a confiabilidade do processo.
        </p>

        <p className="mt-3 text-zinc-600">
          Hoje, muitas empresas utilizam aplicativos de vistoria veicular para
          organizar esse processo e manter um histórico completo.
        </p>

        {/* 🔥 LINK FROTA (já existia) */}
        <p className="mt-4 text-zinc-600">
          Para empresas, veja como aplicar esse processo em{" "}
          <Link
            href="/vistoria-veicular-frota"
            className="text-red-600 underline font-semibold"
          >
            frotas de veículos
          </Link>{" "}
          e melhorar o controle da operação.
        </p>

        {/* 🔥 NOVO LINK SEO PARA UBER */}
        <p className="mt-4 text-zinc-600">
          Se você é motorista de aplicativo, veja como fazer{" "}
          <Link
            href="/vistoria-veicular-uber"
            className="text-red-600 underline font-semibold"
          >
            vistoria veicular para Uber
          </Link>{" "}
          de forma simples e segura.
        </p>

        {/* BLOCO MOVICAR */}
        <div className="mt-8 rounded-2xl bg-zinc-50 p-6 border">
          <h3 className="text-lg font-semibold">
            Como o MoviCar ajuda na vistoria
          </h3>

          <ul className="mt-3 space-y-2 text-zinc-700">
            <li>📸 Fotos padronizadas por etapa</li>
            <li>🎥 Vídeo 360 do veículo</li>
            <li>📋 Checklist estruturado</li>
            <li>📍 Registro de localização</li>
            <li>📊 Histórico completo de vistorias</li>
          </ul>
          <p className="mt-4 text-zinc-600">
            Para entender melhor o processo, veja{" "}
            <Link
              href="/vistoria-veicular-app"
              className="text-red-600 underline font-semibold"
            >
              como fazer vistoria veicular pelo celular
            </Link>{" "}
            de forma prática e padronizada.
          </p>
          <Link
            href="/login"
            className="inline-block mt-5 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700"
          >
            Fazer vistoria com o MoviCar
          </Link>
        </div>

        {/* CONCLUSÃO */}
        <h2 className="mt-10 text-2xl font-semibold">
          Conclusão
        </h2>

        <p className="mt-3 text-zinc-600">
          Seguir um checklist de vistoria veicular reduz riscos, evita prejuízos
          e melhora a gestão de veículos. Com o uso de tecnologia, esse processo
          se torna ainda mais eficiente e confiável.
        </p>

      </div>
    </main>
  );
}