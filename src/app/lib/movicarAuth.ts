import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import {
  fetchMoviCarProfileByUserId,
  type MoviCarUserRow,
} from "@/app/lib/movicarUser";

export type MoviCarCachedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

const TOKEN_KEY = "movicar_token";
const USER_KEY = "movicar_user";

/** Grava cache local espelhando o perfil após login ou refresh. */
export function cacheProfileFromSession(
  profile: MoviCarUserRow,
  session: Session,
  emailFallback: string
): MoviCarCachedUser {
  const cached: MoviCarCachedUser = {
    id: profile.id,
    name: profile.name ?? "",
    email: profile.email ?? emailFallback,
    role: String(profile.role ?? "").toLowerCase(),
    active: profile.active !== false,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, session.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(cached));
  }
  return cached;
}

export async function signOutMoviCar() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Sessão Supabase + perfil em `users`, com cache em localStorage.
 * Retorna null se não houver sessão ou se o perfil não existir / estiver inativo.
 */
export async function resolveMoviCarUserFromAuth(): Promise<MoviCarCachedUser | null> {
  if (typeof window === "undefined") return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) return null;

  const uid = session.user.id;

  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as Partial<MoviCarCachedUser>;
      if (cached.id === uid && cached.role) {
        localStorage.setItem(TOKEN_KEY, session.access_token);
        return cached as MoviCarCachedUser;
      }
    }
  } catch {
    /* ignore */
  }

  const { profile, error } = await fetchMoviCarProfileByUserId(uid);
  if (error || !profile) {
    console.error("[resolveMoviCarUserFromAuth]", error);
    return null;
  }

  if (profile.active === false) {
    await signOutMoviCar();
    return null;
  }

  return cacheProfileFromSession(
    profile,
    session,
    session.user.email ?? ""
  );
}
