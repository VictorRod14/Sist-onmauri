"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "../services/auth";

type NavItem = { label: string; href: string; icon: string };

function readRole(): "admin" | "gerente" | "seller" | "vendedora" | "" {
  if (typeof window === "undefined") return "";
  const raw =
    localStorage.getItem("role") ||
    localStorage.getItem("user_role") ||
    localStorage.getItem("perfil") ||
    "";
  const role = raw.trim().toLowerCase();

  if (role === "admin") return "admin";
  if (role === "gerente" || role === "manager") return "gerente";
  if (role === "seller") return "seller";
  if (role === "vendedora") return "vendedora";
  return "";
}

const navAll: NavItem[] = [
  { label: "Estoque", href: "/estoque", icon: "📦" },
  { label: "Vendas", href: "/vendas", icon: "💰" },
  { label: "Malas", href: "/malas", icon: "🧳" },
  { label: "Vendedoras", href: "/vendedoras", icon: "🧍‍♀️" },
  { label: "Relatórios", href: "/relatorios", icon: "📊" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "gerente" | "seller" | "vendedora" | "">("");

  useEffect(() => {
    setRole(readRole());

    const onStorage = () => setRole(readRole());
    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setRole(readRole());
  }, [pathname]);

  useEffect(() => {
    const isSeller = role === "seller" || role === "vendedora";

    if (isSeller) {
      if (
        pathname.startsWith("/relatorios") ||
        pathname.startsWith("/vendedoras") ||
        pathname.startsWith("/malas")
      ) {
        router.replace("/vendas");
      }
    }
  }, [role, pathname, router]);

  const nav = useMemo(() => {
    const isSeller = role === "seller" || role === "vendedora";

    if (isSeller) {
      return navAll.filter((i) => i.href === "/estoque" || i.href === "/vendas");
    }

    return navAll;
  }, [role]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="w-72 shrink-0 border-r border-gray-200 bg-white p-4 flex flex-col">
      <div className="mb-6">
        <div className="text-xl font-extrabold">OnMauri</div>
        <div className="text-xs text-gray-500">Sistema • Loja de roupas</div>
      </div>

      <nav className="space-y-2 flex-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-medium ${
                active
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 rounded-2xl bg-red-700 px-4 py-3 text-white font-semibold hover:opacity-90"
      >
        🚪 Sair
      </button>
    </aside>
  );
}

export default Sidebar;