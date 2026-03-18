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
      if (data.role === "seller") {
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
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg w-[380px]"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Sistema OnMauri
        </h1>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* SENHA */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            className="w-full border p-3 rounded pr-12"
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
          className="w-full bg-black text-white py-3 rounded hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}