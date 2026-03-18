"use client";

import { Product } from "../services/products";

type Props = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
};

export function ProductCard({ product, onEdit, onDelete }: Props) {
  const stockStyle =
    product.stock === 0
      ? "bg-red-100 text-red-700"
      : product.stock < 5
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <div
      className="
        group bg-white rounded-2xl
        border border-gray-200
        shadow-md transition
        hover:shadow-xl hover:-translate-y-1
        p-5 flex flex-col gap-3
      "
    >
      {/* Topo */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900 leading-tight">
          {product.name}
        </h3>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${stockStyle}`}
        >
          {product.stock === 0
            ? "Sem estoque"
            : `Estoque: ${product.stock}`}
        </span>
      </div>

      {/* Descrição */}
      {product.description && (
        <p className="text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {/* Preço */}
        <span className="text-xl font-extrabold text-gray-900">
          R$ {product.price.toFixed(2)}
        </span>

        {/* Ações */}
        <div className="flex gap-2">
          {/* Editar */}
          <button
            onClick={() => onEdit(product)}
            className="
              rounded-xl border border-gray-300
              px-3 py-2 text-sm font-medium
              text-gray-700
              hover:bg-gray-100 transition
            "
          >
            Editar
          </button>

          {/* Excluir */}
          <button
            onClick={() => onDelete(product.id)}
            className="
              rounded-xl bg-red-600
              px-3 py-2 text-sm font-medium text-white
              hover:bg-red-700 transition
            "
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
