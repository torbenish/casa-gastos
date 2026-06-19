import { Sidebar } from "@/components/sidebar";

export default function ProdutosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-background">{children}</main>
    </div>
  );
}
