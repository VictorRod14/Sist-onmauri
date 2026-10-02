"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteProduct, getNextProductCode, getProducts, Product } from "../services/products";
import Modal from "../components/modal";
import { ConfirmModal } from "../components/confirmmodal";
import { ProductForm } from "../components/productform";
import ProductCard from "../components/productcard";
import { DashboardShell } from "../components/dashboardshell";

type SortKey = "name" | "price" | "stock";

function getRole(): "admin" | "gerente" | "seller" | "vendedora" | "" {
  if (typeof window === "undefined") return "";
  const raw =
    localStorage.getItem("role") ||
    localStorage.getItem("user_role") ||
    localStorage.getItem("perfil") ||
    "";
  const role = raw.trim().toLowerCase();

  if (role === "admin") return "admin";
  if (role === "gerente" || role === "manager") return "gerente";
  if (role === "seller") return "seller";
  if (role === "vendedora") return "vendedora";
  return "";
}

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [nextProductCode, setNextProductCode] = useState("00001");
  const [role, setRole] = useState<"admin" | "gerente" | "seller" | "vendedora" | "">("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [query, setQuery] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [onlyOutOfStock, setOnlyOutOfStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("name");

  async function loadProducts() {
    const [data, nextCode] = await Promise.all([getProducts(), getNextProductCode()]);
    setProducts(data);
    setNextProductCode(nextCode);
  }

  useEffect(() => {
    loadProducts();
    setRole(getRole());
  }, []);

  const canViewFinancial = useMemo(() => {
    return role === "admin" || role === "gerente";
  }, [role]);

  const stats = useMemo(() => {
    const total = products.length;
    const totalItems = products.reduce((acc, p) => acc + (p.stock ?? 0), 0);
    const out = products.filter((p) => (p.stock ?? 0) === 0).length;
    const low = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5).length;
    const costValue = products.reduce((acc, p) => acc + Number(p.cost_price ?? 0) * Number(p.stock ?? 0), 0);
    const saleValue = products.reduce((acc, p) => acc + Number(p.price ?? 0) * Number(p.stock ?? 0), 0);
    return { total, totalItems, out, low, costValue, saleValue, profitValue: saleValue - costValue };
  }, [products]);

  const subtitle = useMemo(() => {
    return `${stats.total} produtos • ${stats.totalItems} itens • ${stats.out} sem estoque • ${stats.low} baixo estoque`;
  }, [stats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = products.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const desc = (p.description ?? "").toLowerCase();
      const matches = !q || name.includes(q) || desc.includes(q);
      if (!matches) return false;

      const stock = p.stock ?? 0;
      if (onlyOutOfStock && stock !== 0) return false;
      if (onlyLowStock && !(stock > 0 && stock < 5)) return false;

      return true;
    });

    list = list.sort((a, b) => {
      if (sortBy === "name") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sortBy === "price") return (b.price ?? 0) - (a.price ?? 0);
      return (b.stock ?? 0) - (a.stock ?? 0);
    });

    return list;
  }, [products, query, onlyLowStock, onlyOutOfStock, sortBy]);

  function handleEdit(product: Product) {
    setEditing(product);
    setOpenEdit(true);
  }

  function handleDeleteRequest(id: number) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;

    setDeleting(true);
    try {
      await deleteProduct(deleteId);
      await loadProducts();
      setOpenDelete(false);
      setDeleteId(null);
    } catch {
      alert("Falha ao excluir. Verifique o backend e tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardShell
      title="Estoque"
      subtitle={subtitle}
      right={
        <button
          onClick={() => setOpenCreate(true)}
          className="rounded-2xl bg-black px-5 py-3 text-white font-medium shadow-sm hover:opacity-90"
        >
          + Novo Produto
        </button>
      }
    >
      <main className="space-y-6">
        {canViewFinancial && (
          <div className="grid gap-4 md:grid-cols-3">
            {[['Investimento em estoque', stats.costValue, 'Capital aplicado nas peças'], ['Potencial de venda', stats.saleValue, 'Valor total pelo preço de venda'], ['Lucro potencial', stats.profitValue, 'Projeção bruta do estoque']].map(([label,value,caption]) => (
              <div key={String(label)} className="premium-card metric-card p-5">
                <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#8b7554]">{String(label)}</div>
                <div className="mt-3 text-2xl font-bold tracking-tight text-[#1b1814]">{Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
                <div className="mt-2 text-xs text-gray-500">{String(caption)}</div>
              </div>
            ))}
          </div>
        )}
        <div className="premium-card p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <label className="text-xs font-semibold text-gray-600">Buscar</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome ou descrição…"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div className="lg:col-span-1 flex flex-col justify-end gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyOutOfStock}
                  onChange={(e) => {
                    setOnlyOutOfStock(e.target.checked);
                    if (e.target.checked) setOnlyLowStock(false);
                  }}
                  className="h-4 w-4"
                />
                Mostrar somente <span className="font-semibold text-red-600">Sem estoque</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={(e) => {
                    setOnlyLowStock(e.target.checked);
                    if (e.target.checked) setOnlyOutOfStock(false);
                  }}
                  className="h-4 w-4"
                />
                Mostrar somente <span className="font-semibold text-yellow-700">Estoque baixo (&lt; 5)</span>
              </label>
            </div>

            <div className="lg:col-span-1 flex flex-col justify-end">
              <label className="text-xs font-semibold text-gray-600">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="name">Nome (A–Z)</option>
                <option value="price">Preço (maior → menor)</option>
                <option value="stock">Estoque (maior → menor)</option>
              </select>
            </div>
          </div>
        </div>

        <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Cadastrar produto">
          <ProductForm
            nextCode={nextProductCode}
            onCreated={() => {
              loadProducts();
              setOpenCreate(false);
            }}
          />
        </Modal>

        <Modal
          open={openEdit}
          onClose={() => {
            setOpenEdit(false);
            setEditing(null);
          }}
          title="Editar produto"
        >
          <ProductForm
            initialProduct={editing}
            nextCode={nextProductCode}
            onUpdated={() => {
              loadProducts();
              setOpenEdit(false);
              setEditing(null);
            }}
          />
        </Modal>

        <ConfirmModal
          open={openDelete}
          title="Excluir produto"
          message="Tem certeza que deseja excluir este produto? Essa ação não pode ser desfeita."
          loading={deleting}
          onCancel={() => {
            if (deleting) return;
            setOpenDelete(false);
            setDeleteId(null);
          }}
          onConfirm={confirmDelete}
        />

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md text-gray-600">
            Nenhum produto encontrado com esses filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                canViewFinancial={canViewFinancial}
              />
            ))}
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
