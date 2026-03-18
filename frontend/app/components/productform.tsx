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

export function ProductForm({ onCreated, onUpdated, initialProduct }: Props) {
  const isEdit = !!initialProduct;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name ?? "");
      setDescription(initialProduct.description ?? "");
      setPrice(initialProduct.price ?? 0);
      setStock(initialProduct.stock ?? 0);
      setCostPrice(initialProduct.cost_price ?? 0);
    } else {
      setName("");
      setDescription("");
      setPrice(0);
      setStock(0);
      setCostPrice(0);
    }
    setError(null);
    setSuccess(null);
  }, [initialProduct]);

  const profitPreview = useMemo(() => {
    return price - costPrice;
  }, [price, costPrice]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) return setError("Nome é obrigatório.");
    if (price < 0) return setError("Preço de venda não pode ser negativo.");
    if (stock < 0) return setError("Estoque não pode ser negativo.");
    if (costPrice < 0) return setError("Custo não pode ser negativo.");

    const payload: ProductPayload = {
      name: name.trim(),
      description: description.trim() || null,
      price,
      stock,
      cost_price: costPrice,
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
        setPrice(0);
        setStock(0);
        setCostPrice(0);
        onCreated?.();
      }
    } catch {
      setError("Falha ao salvar. Verifique o backend e tente novamente.");
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
            type="number"
            step="0.01"
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Estoque</label>
          <input
            type="number"
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600">Custo</label>
        <input
          type="number"
          step="0.01"
          className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
          value={costPrice}
          onChange={(e) => setCostPrice(Number(e.target.value))}
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
        {isEdit ? "Salvar Alterações" : "Cadastrar Produto"}
      </button>
    </form>
  );
}