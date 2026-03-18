"use client";

import { useState } from "react";

type Props = {
  onSubmit: (password: string) => Promise<void>;
};

export default function PasswordForm({ onSubmit }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rules = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordValid =
    rules.length &&
    rules.upper &&
    rules.lower &&
    rules.number &&
    rules.special;

  async function handleSubmit() {
    setError(null);

    if (!passwordValid)
      return setError("A senha não atende aos requisitos.");

    if (password !== confirm)
      return setError("As senhas não coincidem.");

    setLoading(true);

    try {
      await onSubmit(password);
    } catch {
      setError("Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md w-[400px] space-y-4">
      <h1 className="text-xl font-bold text-center">
        Criar nova senha
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SENHA */}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 pr-12"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-2 text-sm text-gray-500"
        >
          {show ? "Ocultar" : "Ver"}
        </button>
      </div>

      <div className="bg-gray-50 border rounded-xl p-3 space-y-1 text-xs">
        <p className={rules.length ? "text-green-600" : ""}>• 6 caracteres</p>
        <p className={rules.upper ? "text-green-600" : ""}>• Letra maiúscula</p>
        <p className={rules.lower ? "text-green-600" : ""}>• Letra minúscula</p>
        <p className={rules.number ? "text-green-600" : ""}>• Número</p>
        <p className={rules.special ? "text-green-600" : ""}>• Caractere especial</p>
      </div>

      <input
        type={show ? "text" : "password"}
        placeholder="Confirmar senha"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full border rounded-xl px-3 py-2"
      />

      <button
        onClick={handleSubmit}
        disabled={!passwordValid || loading}
        className={`w-full py-2 rounded-xl text-white ${
          passwordValid ? "bg-black" : "bg-gray-400"
        }`}
      >
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>
    </div>
  );
}