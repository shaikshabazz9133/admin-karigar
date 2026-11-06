"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";
import { EMAIL_COOKIE, TOKEN_COOKIE } from "@/lib/session";

export type LoginState = { error?: string; email?: string; at?: number };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email, at: Date.now() };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "Can't reach the server. Check that the API is running.", email, at: Date.now() };
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = res.status === 422 ? "That email address doesn't look right." : (body.detail ?? "Sign-in failed. Try again.");
    return { error, email, at: Date.now() };
  }

  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    // No maxAge: a session cookie, gone when the browser closes.
    path: "/",
  };
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, body.accessToken, opts);
  jar.set(EMAIL_COOKIE, body.admin.email, opts);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/projects");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
  jar.delete(EMAIL_COOKIE);
  redirect("/login");
}
