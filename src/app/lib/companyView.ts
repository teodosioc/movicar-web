import { supabase } from "@/app/lib/supabaseClient";

export type CompanyType = "rental" | "vehicle_store";

export type CompanyOption = {
  id: string;
  name: string;
  company_type: CompanyType;
};

export type CompanyView = {
  /** Empresa cujos dados estão sendo exibidos. */
  company: CompanyOption;
  /** Empresas que o usuário pode visualizar (mais de uma só para admin). */
  companies: CompanyOption[];
  /** Admin enxerga todas as empresas e pode trocar de visão. */
  canSwitch: boolean;
};

const VIEW_KEY = "movicar_view_company";

export function clearCompanyViewSelection() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VIEW_KEY);
}

export function saveCompanyViewSelection(companyId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VIEW_KEY, companyId);
}

export function companyViewLabel(company: CompanyOption): string {
  return company.company_type === "vehicle_store"
    ? `Visão Loja — ${company.name}`
    : "Visão Locadora";
}

/**
 * Empresa em exibição para o usuário logado. Lojista e motorista ficam sempre
 * na própria empresa. Admin começa na própria empresa (locadora) e pode
 * escolher outra; a escolha fica guardada até sair ou entrar de novo.
 */
export async function resolveCompanyView(user: {
  id: string;
  role: string;
}): Promise<CompanyView> {
  const [{ data: profile, error: profileError }, { data: rows, error }] =
    await Promise.all([
      supabase.from("users").select("company_id").eq("id", user.id).single(),
      supabase
        .from("companies")
        .select("id, name, company_type")
        .order("created_at", { ascending: true }),
    ]);

  if (profileError) throw profileError;
  if (error) throw error;

  const companies = (rows ?? []) as CompanyOption[];
  const own = companies.find((c) => c.id === profile?.company_id);
  if (!own) {
    throw new Error("Empresa do usuário não encontrada.");
  }

  const canSwitch =
    String(user.role).toLowerCase() === "admin" && companies.length > 1;

  if (!canSwitch) {
    return { company: own, companies: [own], canSwitch: false };
  }

  const storedId =
    typeof window !== "undefined" ? localStorage.getItem(VIEW_KEY) : null;
  const selected = companies.find((c) => c.id === storedId) ?? own;

  return { company: selected, companies, canSwitch: true };
}
