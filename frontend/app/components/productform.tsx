"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  updateProduct,
  Product,
  ProductPayload,
} from "../services/products";

type Props = {
  onCreated?: () => void;
  onUpdated?: () => void;
  initialProduct?: Product | null;
  nextCode?: string;
};

function splitProductName(value: string) {
  const match = value.trim().match(/^(\d{1,})\s+(.+)$/);
  if (!match) return { code: "", name: value.trim() };
  return { code: match[1].padStart(5, "0"), name: match[2].trim() };
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function sanitizeMoneyInput(value: string) {
  const cleaned = value.replace(",", ".").replace(/[^\d.]/g, "");

  const parts = cleaned.split(".");
  if (parts.length <= 2) return cleaned;

  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function normalizeMoneyForSubmit(value: string) {
  const sanitized = sanitizeMoneyInput(value).replace(/^0+(?=\d)/, "");
  const parsed = Number(sanitized || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeIntegerForSubmit(value: string) {
  const cleaned = value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  const parsed = Number(cleaned || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ProductForm({ onCreated, onUpdated, initialProduct, nextCode = "00001" }: Props) {
  const isEdit = !!initialProduct;

  const [name, setName] = useState("");
  const [code, setCode] = useState(nextCode);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [pricingMode, setPricingMode] = useState<"margin" | "manual">("margin");
  const [marginPercent, setMarginPercent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      const parsed = splitProductName(initialProduct.name ?? "");
      setCode(parsed.code || String(initialProduct.id).padStart(5, "0"));
      setName(parsed.name);
      setDescription(initialProduct.description ?? "");
      setPrice(
        initialProduct.price !== undefined && initialProduct.price !== null
          ? String(initialProduct.price)
          : ""
      );
      setStock(
        initialProduct.stock !== undefined && initialProduct.stock !== null
          ? String(initialProduct.stock)
          : ""
      );
      setCostPrice(
        initialProduct.cost_price !== undefined && initialProduct.cost_price !== null
          ? String(initialProduct.cost_price)
          : ""
      );
      const cost = Number(initialProduct.cost_price ?? 0);
      const sale = Number(initialProduct.price ?? 0);
      setMarginPercent(cost > 0 ? String(Number((((sale - cost) / cost) * 100).toFixed(2))) : "");
      setPricingMode("manual");
    } else {
      setCode(nextCode);
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setCostPrice("");
      setMarginPercent("");
      setPricingMode("margin");
    }

    setError(null);
    setSuccess(null);
  }, [initialProduct, nextCode]);

  const priceNumber = useMemo(() => normalizeMoneyForSubmit(price), [price]);
  const costPriceNumber = useMemo(() => normalizeMoneyForSubmit(costPrice), [costPrice]);
  const stockNumber = useMemo(() => normalizeIntegerForSubmit(stock), [stock]);

  const profitPreview = useMemo(() => {
    return priceNumber - costPriceNumber;
  }, [priceNumber, costPriceNumber]);

  useEffect(() => {
    if (pricingMode !== "margin") return;
    const margin = normalizeMoneyForSubmit(marginPercent);
    if (!costPrice.trim() || !marginPercent.trim()) {
      setPrice("");
      return;
    }
    setPrice((costPriceNumber * (1 + margin / 100)).toFixed(2));
  }, [pricingMode, marginPercent, costPrice, costPriceNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) return setError("Nome é obrigatório.");
    if (!code.trim()) return setError("Código é obrigatório.");
    if (!price.trim()) return setError("Preço de venda é obrigatório.");
    if (!stock.trim()) return setError("Estoque é obrigatório.");
    if (!costPrice.trim()) return setError("Custo é obrigatório.");

    if (priceNumber < 0) return setError("Preço de venda não pode ser negativo.");
    if (stockNumber < 0) return setError("Estoque não pode ser negativo.");
    if (costPriceNumber < 0) return setError("Custo não pode ser negativo.");

    const payload: ProductPayload = {
      name: `${code.replace(/\D/g, "").padStart(5, "0")} ${name.trim().toUpperCase()}`,
      description: description.trim().toUpperCase() || null,
      price: priceNumber,
      stock: stockNumber,
      cost_price: costPriceNumber,
    };

    setLoading(true);
    try {
      if (isEdit && initialProduct) {
        await updateProduct(initialProduct.id, payload);
        setSuccess("Produto atualizado com sucesso!");
        onUpdated?.();
      } else {
        await createProduct(payload);
        setSuccess("Produto cadastrado com sucesso!");
        setName("");
        setCode(String(Number(code) + 1).padStart(5, "0"));
        setDescription("");
        setPrice("");
        setStock("");
        setCostPrice("");
        setMarginPercent("");
        onCreated?.();
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((item: any) => item?.msg || JSON.stringify(item)).join(" | "));
      } else {
        setError("Falha ao salvar. Verifique o backend e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isEdit ? "Editar Produto" : "Novo Produto"}
        </h2>
        {loading && <span className="text-sm text-gray-500">Salvando...</span>}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div>
          <label className="text-sm font-medium text-gray-700">Código</label>
          <input
            inputMode="numeric"
            maxLength={8}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono font-bold tracking-wider focus:outline-none focus:ring"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="00001"
          />
          {!isEdit && <p className="mt-1 text-xs text-gray-500">Próximo código sugerido</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Nome do produto</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="Ex: Vestido Guipir Nude"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600">Descrição</label>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
          value={description}
          onChange={(e) => setDescription(e.target.value.toUpperCase())}
          placeholder="Ex: Algodão premium"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-gray-600">Custo</label>
          <input
            type="text"
            inputMode="decimal"
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
            value={costPrice}
            onChange={(e) => setCostPrice(sanitizeMoneyInput(e.target.value))}
            placeholder="Ex: 45,00"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Estoque</label>
          <input
            type="text"
            inputMode="numeric"
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
            value={stock}
            onChange={(e) => setStock(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Ex: 10"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#e7dfd2] bg-[#fbf8f3] p-4 space-y-4">
        <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setPricingMode("margin")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${pricingMode === "margin" ? "bg-[#171512] text-white" : "text-gray-500"}`}>Calcular por margem</button>
          <button type="button" onClick={() => setPricingMode("manual")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${pricingMode === "manual" ? "bg-[#171512] text-white" : "text-gray-500"}`}>Informar valor</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {pricingMode === "margin" && (
            <div>
              <label className="text-sm text-gray-600">Margem sobre o custo (%)</label>
              <input inputMode="decimal" className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" value={marginPercent} onChange={(e) => setMarginPercent(sanitizeMoneyInput(e.target.value))} placeholder="Ex: 50" />
            </div>
          )}
          <div className={pricingMode === "manual" ? "sm:col-span-2" : ""}>
            <label className="text-sm text-gray-600">Preço de venda</label>
            <input type="text" inputMode="decimal" readOnly={pricingMode === "margin"} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring read-only:bg-gray-100" value={price} onChange={(e) => setPrice(sanitizeMoneyInput(e.target.value))} placeholder="Ex: 99,90" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-sm text-gray-600">Lucro estimado</div>
        <div
          className={`mt-1 text-lg font-bold ${
            profitPreview >= 0 ? "text-green-700" : "text-red-700"
          }`}
        >
          {formatBRL(profitPreview)}
        </div>
      </div>

      <button
        disabled={loading}
        className="w-full bg-black text-white px-4 py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        type="submit"
      >
        {isEdit ? "Salvar Produto" : "Cadastrar Produto"}
      </button>
    </form>
  );
}
