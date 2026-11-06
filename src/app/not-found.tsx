import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="animate-rise">
        <p className="eyebrow text-brass-ink">404</p>
        <h1 className="display mt-4 text-5xl">This page <span className="accent text-walnut">isn&apos;t here.</span></h1>
        <Link href="/projects" className="mt-8 inline-flex h-11 items-center rounded-full bg-espresso px-6 text-sm text-white">Back to homes</Link>
      </div>
    </main>
  );
}
