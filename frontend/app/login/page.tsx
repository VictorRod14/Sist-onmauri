"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../services/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await login(email, password);

      // sessão
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      // nome do usuário (necessário p/ vendedor)
      const fallbackName = (email || "").split("@")[0] || "";

      const nameFromApi =
        (data?.name && String(data.name).trim()) ||
        (data?.user_name && String(data.user_name).trim()) ||
        (data?.user?.name && String(data.user.name).trim()) ||
        "";

      localStorage.setItem("user_name", nameFromApi || fallbackName);

      // troca obrigatória
      if (data.must_change_password) {
        router.push("/trocar-senha");
        return;
      }

      // redirecionamento por perfil
      if (data.role === "seller" || data.role === "vendedora") {
        router.push("/vendas");
        return;
      }

      router.push("/relatorios");
    } catch {
      setError("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#151310] p-4">
      <div className="absolute -left-28 top-[-10%] h-96 w-96 rounded-full bg-[#b8955b]/20 blur-3xl" />
      <div className="absolute -bottom-40 right-[-8%] h-[520px] w-[520px] rounded-full bg-[#806945]/20 blur-3xl" />
      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-[410px] rounded-[30px] border border-white/70 bg-[#fffdf9] p-8 shadow-[0_35px_90px_rgba(0,0,0,.45),inset_0_1px_0_white] sm:p-10"
      >
        <div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#e1c99e] to-[#aa844b] font-serif text-lg font-bold text-[#211c15] shadow-lg">OM</div><h1 className="font-serif text-3xl font-bold tracking-tight text-[#1c1915]">OnMauri</h1><p className="mt-1 text-xs font-semibold tracking-[.18em] text-[#9b8057]">GESTÃO DE BOUTIQUE</p></div>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded-xl border border-[#e4ddd3] bg-white p-3.5 shadow-sm outline-none focus:border-[#b8955b] focus:ring-4 focus:ring-[#b8955b]/10"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* SENHA */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            className="w-full rounded-xl border border-[#e4ddd3] bg-white p-3.5 pr-12 shadow-sm outline-none focus:border-[#b8955b] focus:ring-4 focus:ring-[#b8955b]/10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* BOTÃO OLHO */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
          >
            {showPassword ? (
              // olho fechado
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0112 19c-5 0-9.27-3.11-11-7 1.02-2.36 2.78-4.29 4.97-5.46M9.9 4.24A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a10.98 10.98 0 01-4.24 5.06M1 1l22 22" />
              </svg>
            ) : (
              // olho aberto
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-3">{error}</p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#201d19] to-[#0e0d0b] py-3.5 font-semibold text-white shadow-[0_12px_25px_rgba(20,17,13,.25)] hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
