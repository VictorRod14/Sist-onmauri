"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "../services/auth";

type Role = "admin" | "gerente" | "seller" | "vendedora" | "";
type IconName = "box" | "sale" | "chart" | "bag" | "users" | "report" | "logout";
type NavItem = { label: string; href: string; icon: IconName };

function readRole(): Role {
  if (typeof window === "undefined") return "";
  const role = (localStorage.getItem("role") || localStorage.getItem("user_role") || localStorage.getItem("perfil") || "").trim().toLowerCase();
  if (role === "admin") return "admin";
  if (role === "gerente" || role === "manager") return "gerente";
  if (role === "seller") return "seller";
  if (role === "vendedora") return "vendedora";
  return "";
}

const paths: Record<IconName, React.ReactNode> = {
  box: <><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="m3 8 9 5v9"/><path d="m21 8-9 5"/></>,
  sale: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  bag: <><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  report: <><path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 15v2M12 11v6M16 7v10"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></>,
};
function Icon({ name }: { name: IconName }) { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{paths[name]}</svg>; }

const navAll: NavItem[] = [
  { label: "Estoque", href: "/estoque", icon: "box" }, { label: "Vendas", href: "/vendas", icon: "sale" },
  { label: "Minhas vendas", href: "/minhas-vendas", icon: "chart" }, { label: "Malas", href: "/malas", icon: "bag" },
  { label: "Vendedoras", href: "/vendedoras", icon: "users" }, { label: "Relatórios", href: "/relatorios", icon: "report" },
];

export function Sidebar() {
  const pathname = usePathname(); const router = useRouter();
  const [role, setRole] = useState<Role>(""); const [name, setName] = useState("");
  useEffect(() => { const sync = () => { setRole(readRole()); setName(localStorage.getItem("user_name") || "Usuário"); }; sync(); window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync); }, [pathname]);
  useEffect(() => { if ((role === "seller" || role === "vendedora") && (pathname.startsWith("/relatorios") || pathname.startsWith("/vendedoras"))) router.replace("/vendas"); }, [role, pathname, router]);
  const nav = useMemo(() => { const seller = role === "seller" || role === "vendedora"; return seller ? navAll.filter(i => ["/estoque", "/vendas", "/minhas-vendas", "/malas"].includes(i.href)) : navAll.filter(i => i.href !== "/minhas-vendas"); }, [role]);
  async function handleLogout() { await logout(); router.push("/login"); }
  return <aside className="premium-sidebar">
    <div className="sidebar-brand"><div className="brand-mark"><Image src="/onmauri-logo.png" alt="Logo OnMauri" width={38} height={54} className="h-[48px] w-auto object-contain" priority /></div><div><div className="brand-name">OnMauri</div><div className="brand-caption">SISTEMA ONMAURI</div></div></div>
    <div className="sidebar-divider" />
    <nav className="sidebar-nav"><span className="sidebar-label">MENU PRINCIPAL</span>{nav.map(item => { const active = pathname === item.href || pathname.startsWith(item.href + "/"); return <Link key={item.href} href={item.href} className={`sidebar-link ${active ? "is-active" : ""}`}><span className="sidebar-icon"><Icon name={item.icon}/></span><span>{item.label}</span>{active && <span className="active-dot"/>}</Link>; })}</nav>
    <div className="sidebar-footer"><div className="sidebar-user"><div className="user-avatar">{name.slice(0,1).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{name}</div><div className="text-[11px] uppercase tracking-wider text-white/45">{role || "perfil"}</div></div></div><button type="button" onClick={handleLogout} className="logout-button"><Icon name="logout"/><span>Sair do sistema</span></button></div>
  </aside>;
}
export default Sidebar;
