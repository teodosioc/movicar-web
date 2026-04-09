import { supabase } from "@/app/lib/supabaseClient";

/** Linha em `public.users` (id alinhado com `auth.users.id`). */
export type MoviCarUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  active?: boolean | null;
};

export async function fetchMoviCarProfileByUserId(userId: string): Promise<{
  profile: MoviCarUserRow | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, active")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: new Error(error.message) };
  }

  return { profile: data as MoviCarUserRow | null, error: null };
}
