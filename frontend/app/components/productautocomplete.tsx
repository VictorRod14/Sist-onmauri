"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Product } from "../services/products";

type Props = {
  products: Product[];
  selectedId: number | "";
  onSelect: (id: number | "") => void;
  label?: string;
  placeholder?: string;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductAutocomplete({
  products,
  selectedId,
  onSelect,
  label = "Produto",
  placeholder = "Digite o código ou nome do produto",
}: Props) {
  const selected = products.find((product) => product.id === selectedId) ?? null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selectedId, selected?.name]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return products.slice(0, 8);

    return products
      .filter((product) => {
        const haystack = `${product.name} ${product.description ?? ""}`.toLocaleLowerCase("pt-BR");
        return haystack.includes(normalized);
      })
      .slice(0, 8);
  }, [products, query]);

  function choose(product: Product) {
    onSelect(product.id);
    setQuery(product.name);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            onSelect("");
            setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-10 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-black/5"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onSelect("");
              setOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Limpar pesquisa"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl">
          {suggestions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500">Nenhum produto encontrado.</div>
          ) : (
            suggestions.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => choose(product)}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-gray-100"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">{formatBRL(product.price)}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  Estoque: {product.stock}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {selected && (
        <div className="mt-3 grid gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm sm:grid-cols-3">
          <div><span className="text-emerald-700">Selecionado</span><div className="font-semibold text-gray-900">{selected.name}</div></div>
          <div><span className="text-emerald-700">Valor</span><div className="font-semibold text-gray-900">{formatBRL(selected.price)}</div></div>
          <div><span className="text-emerald-700">Disponível</span><div className="font-semibold text-gray-900">{selected.stock} unidade(s)</div></div>
        </div>
      )}
    </div>
  );
}
