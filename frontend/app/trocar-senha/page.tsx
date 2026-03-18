"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "../components/dashboardshell";
import { api } from "../services/api";

function getRole(): "admin" | "gerente" | "seller" | "" {
  if (typeof window === "undefined") return "";

  const raw =
    localStorage.getItem("role") ||
    localStorage.getItem("user_role") ||
    localStorage.getItem("perfil") ||
    "";

  const role = raw.trim().toLowerCase();

  if (role === "admin") return "admin";
  if (role === "gerente") return "gerente";
  if (role === "seller") return "seller";

  return "";
}

function hasUpper(s: string) {
  return /[A-Z]/.test(s);
}
function hasLower(s: string) {
  return /[a-z]/.test(s);
}
function hasNumber(s: string) {
  return /\d/.test(s);
}
function hasSpecial(s: string) {
  return /[^A-Za-z0-9]/.test(s);
}

export default function TrocarSenhaPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const checks = useMemo(() => {
    return {
      len: password.length >= 6,
      upper: hasUpper(password),
      lower: hasLower(password),
      number: hasNumber(password),
      special: hasSpecial(password),
    };
  }, [password]);

  const allOk =
    checks.len &&
    checks.upper &&
    checks.lower &&
    checks.number &&
    checks.special;

  // ✅ FUNÇÃO CORRIGIDA
  async function submit() {
    setError(null);

    if (!allOk) {
      setError("Sua senha ainda não atende todos os requisitos.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/change-password", {
        new_password: password,
      });

      // ✅ mantém sessão sincronizada
      if (data?.role) {
        localStorage.setItem("role", data.role);
      }

      if (data?.name) {
        localStorage.setItem("user_name", data.name);
      }

      setOk(true);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(detail || "Erro ao salvar nova senha.");
    } finally {
      setLoading(false);
    }
  }

  function goNext() {
    const role = getRole();

    if (role === "seller") {
      router.push("/vendas");
      return;
    }

    router.push("/relatorios");
  }

  return (
    <DashboardShell
      title="Criar nova senha"
      subtitle="Defina uma senha segura para continuar"
    >
      <main className="p-6">
        <div className="mx-auto max-w-[520px] rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {ok ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                ✅ Senha atualizada com sucesso.
              </div>

              <button
                onClick={goNext}
                className="w-full rounded-2xl bg-black px-5 py-3 text-white font-semibold hover:opacity-90"
              >
                Ir para o sistema
              </button>

              <p className="text-xs text-gray-500">
                Você também pode sair usando o botão <b>Sair</b> na sidebar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* NOVA SENHA */}
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Nova senha
                </label>

                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-12 outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Digite a nova senha"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* REQUISITOS */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  Requisitos da senha
                </div>

                <ul className="space-y-1 text-sm">
                  <li className={checks.len ? "text-green-700" : "text-gray-700"}>
                    {checks.len ? "✓" : "•"} Mínimo de 6 caracteres
                  </li>
                  <li className={checks.upper ? "text-green-700" : "text-gray-700"}>
                    {checks.upper ? "✓" : "•"} Uma letra maiúscula
                  </li>
                  <li className={checks.lower ? "text-green-700" : "text-gray-700"}>
                    {checks.lower ? "✓" : "•"} Uma letra minúscula
                  </li>
                  <li className={checks.number ? "text-green-700" : "text-gray-700"}>
                    {checks.number ? "✓" : "•"} Um número
                  </li>
                  <li className={checks.special ? "text-green-700" : "text-gray-700"}>
                    {checks.special ? "✓" : "•"} Um caractere especial (!@#$%)
                  </li>
                </ul>
              </div>

              {/* CONFIRMAR */}
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Confirmar senha
                </label>

                <div className="relative mt-2">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-12 outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Repita a nova senha"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                onClick={submit}
                disabled={loading}
                className="w-full rounded-2xl bg-black px-5 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </div>
          )}
        </div>
      </main>
    </DashboardShell>
  );
}