import Sidebar from "@/components/Sidebar";

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-page)]">
      <Sidebar />
      <main className="flex-1 pb-20 md:ml-[240px] md:pb-0 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
