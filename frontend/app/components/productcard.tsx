"use client";

import { Product } from "../services/products";

type Props = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  canViewFinancial?: boolean;
};

function formatBRL(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  canViewFinancial = false,
}: Props) {
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
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900 leading-tight">
          {product.name}
        </h3>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${stockStyle}`}
        >
          {product.stock === 0 ? "Sem estoque" : `Estoque: ${product.stock}`}
        </span>
      </div>

      {product.description && (
        <p className="text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>
      )}

      {canViewFinancial && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Custo</span>
            <span className="font-semibold text-gray-800">
              {formatBRL(product.cost_price)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2">
            <span className="text-gray-500">Lucro</span>
            <span
              className={`font-bold ${
                (product.profit ?? 0) >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {formatBRL(product.profit)}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xl font-extrabold text-gray-900">
          R$ {product.price.toFixed(2)}
        </span>

        <div className="flex gap-2">
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

export default ProductCard;