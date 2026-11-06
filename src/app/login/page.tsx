import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Showcase, ShowcaseBanner } from "./Showcase";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, expired } = await searchParams;
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-[1.15fr_1fr]">
      <Showcase />
      <section className="relative flex flex-col px-5 py-6 sm:px-10 sm:py-8 lg:px-16 lg:py-10 xl:px-24">
        <div className="animate-rise lg:hidden"><Logo /></div>
        <ShowcaseBanner />
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10 lg:py-12">
          <p className="eyebrow animate-rise text-brass-ink [animation-delay:120ms]">Studio admin</p>
          <h1 className="display mt-4 animate-rise text-[2.5rem] text-ink [animation-delay:200ms] sm:text-5xl">
            Welcome <span className="accent text-walnut">back.</span>
          </h1>
          <p className="mt-4 animate-rise text-[0.9375rem] leading-relaxed text-muted [animation-delay:280ms]">
            Sign in to add homes, upload photographs and choose what appears on homekarigar.in.
          </p>
          {expired && (
            <p className="mt-6 animate-rise rounded-xl bg-walnut-tint px-4 py-3 text-sm text-walnut [animation-delay:320ms]">
              Your session ended. Sign in again to continue.
            </p>
          )}
          <div className="mt-10 animate-rise [animation-delay:360ms]">
            <LoginForm next={typeof next === "string" ? next : ""} />
          </div>
        </div>
        <p className="animate-rise text-center text-xs text-muted [animation-delay:500ms]">
          © {new Date().getFullYear()} Home Karigar · Private area, not indexed
        </p>
      </section>
    </main>
  );
}
