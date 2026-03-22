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
};

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

export function ProductForm({ onCreated, onUpdated, initialProduct }: Props) {
  const isEdit = !!initialProduct;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [costPrice, setCostPrice] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name ?? "");
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
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setCostPrice("");
    }

    setError(null);
    setSuccess(null);
  }, [initialProduct]);

  const priceNumber = useMemo(() => normalizeMoneyForSubmit(price), [price]);
  const costPriceNumber = useMemo(() => normalizeMoneyForSubmit(costPrice), [costPrice]);
  const stockNumber = useMemo(() => normalizeIntegerForSubmit(stock), [stock]);

  const profitPreview = useMemo(() => {
    return priceNumber - costPriceNumber;
  }, [priceNumber, costPriceNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) return setError("Nome é obrigatório.");
    if (!price.trim()) return setError("Preço de venda é obrigatório.");
    if (!stock.trim()) return setError("Estoque é obrigatório.");
    if (!costPrice.trim()) return setError("Custo é obrigatório.");

    if (priceNumber < 0) return setError("Preço de venda não pode ser negativo.");
    if (stockNumber < 0) return setError("Estoque não pode ser negativo.");
    if (costPriceNumber < 0) return setError("Custo não pode ser negativo.");

    const payload: ProductPayload = {
      name: name.trim(),
      description: description.trim() || null,
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
        setDescription("");
        setPrice("");
        setStock("");
        setCostPrice("");
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-2 space-y-4">
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

      <div>
        <label className="text-sm text-gray-600">Nome</label>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Camisa OnMauri"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600">Descrição</label>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Algodão premium"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Preço de venda</label>
          <input
            type="text"
            inputMode="decimal"
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
            value={price}
            onChange={(e) => setPrice(sanitizeMoneyInput(e.target.value))}
            placeholder="Ex: 99,90"
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
        {isEdit ? "Salvar TESTE 123" : "Cadastrar TESTE 123"}
      </button>
    </form>
  );
}