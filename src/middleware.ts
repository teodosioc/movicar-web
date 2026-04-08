import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Host that should land on login instead of the marketing homepage. Override via APP_ENTRY_HOST for previews/staging. */
const APP_ENTRY_HOST = (
  process.env.APP_ENTRY_HOST ?? "app.movicarweb.com.br"
).toLowerCase();

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host === APP_ENTRY_HOST && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
