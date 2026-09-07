import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, isValidSession } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
};

export async function middleware(request: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;
  // Sem senha configurada no ambiente, não há como validar — não bloqueia
  // (evita lockout em dev/preview sem a variável setada).
  if (!appPassword) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await isValidSession(cookie, appPassword);

  if (!valid) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
