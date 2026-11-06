import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EMAIL_COOKIE, TOKEN_COOKIE } from "./session";

/** The signed-in admin, or a redirect to sign in. The API checks the token itself on every call. */
export async function requireSession() {
  const jar = await cookies();
  if (!jar.get(TOKEN_COOKIE)) redirect("/login");
  return { email: jar.get(EMAIL_COOKIE)?.value ?? "admin" };
}
