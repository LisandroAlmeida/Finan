"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, sessionTokenFor } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword || password !== appPassword) {
    redirect("/login?error=1");
  }

  const token = await sessionTokenFor(appPassword);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}
