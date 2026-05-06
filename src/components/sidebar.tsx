"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  BarChart3,
  LogOut,
  Home,
  Settings,
} from "lucide-react";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/mercados", label: "Mercados", icon: ShoppingCart },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen border-r bg-card px-4 py-6">
      {/* Logo + Theme */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="bg-violet-600 p-2 rounded-xl">
            <Home className="text-white w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">Casa Gastos</span>
        </div>

        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-600 text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex items-center justify-between px-2 pt-4 border-t">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
