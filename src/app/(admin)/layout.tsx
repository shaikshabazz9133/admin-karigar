import { requireSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { TabGuard } from "@/components/TabGuard";
import { Toaster } from "@/components/Toaster";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <TabGuard>
      <Toaster>
        <Sidebar email={session.email} siteUrl={process.env.SITE_ORIGIN ?? "https://redesign-home-karigar.vercel.app"} />
        <main className="min-h-dvh xl:pl-72">
          <div className="mx-auto max-w-[88rem] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</div>
        </main>
      </Toaster>
    </TabGuard>
  );
}
