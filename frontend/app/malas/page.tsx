"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/dashboardshell";
import Modal from "../components/modal";
import { getProducts, Product } from "../services/products";
import { createBag, getBags, returnBag, Bag } from "../services/bag";

type PaymentMethod = "pix" | "credito" | "debito" | "dinheiro";

type DraftBagItem = {
  product_id: number;
  quantity: number;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

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

export default function MalasPage() {
  const [bags, setBags] = useState<Bag[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [role, setRole] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);

  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");

  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [draftItems, setDraftItems] = useState<DraftBagItem[]>([]);

  const [returnPayment, setReturnPayment] = useState<PaymentMethod>("pix");
  const [returnSeller, setReturnSeller] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [returnItems, setReturnItems] = useState<
    Array<{
      product_id: number;
      quantity_sold: number;
      quantity_returned: number;
    }>
  >([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [bagsData, productsData] = await Promise.all([getBags(), getProducts()]);
    setBags(bagsData);
    setProducts(productsData);
  }

  useEffect(() => {
    setRole(getRole());
    loadAll().catch(() => setError("Erro ao carregar dados."));
  }, []);

  const subtitle = useMemo(() => {
    const total = bags.length;
    const open = bags.filter((b) => b.status === "open").length;
    const returned = bags.filter((b) => b.status === "returned").length;
    return `${total} malas • ${open} em aberto • ${returned} finalizadas`;
  }, [bags]);

  function resetCreateForm() {
    setCustomerName("");
    setCustomerPhone("");
    setNote("");
    setSelectedProductId("");
    setSelectedQty(1);
    setDraftItems([]);
  }

  function openCreateModal() {
    setError(null);
    resetCreateForm();
    setOpenCreate(true);
  }

  function addDraftItem() {
    setError(null);

    if (!selectedProductId) {
      setError("Selecione um produto.");
      return;
    }

    if (selectedQty <= 0) {
      setError("Quantidade inválida.");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      setError("Produto inválido.");
      return;
    }

    if (selectedQty > product.stock) {
      setError(`Estoque insuficiente para ${product.name}.`);
      return;
    }

    const exists = draftItems.find((i) => i.product_id === selectedProductId);
    if (exists) {
      setError("Esse produto já foi adicionado à mala.");
      return;
    }

    setDraftItems((prev) => [
      ...prev,
      {
        product_id: selectedProductId,
        quantity: selectedQty,
      },
    ]);

    setSelectedProductId("");
    setSelectedQty(1);
  }

  function removeDraftItem(productId: number) {
    setDraftItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  async function handleCreateBag() {
    setError(null);

    if (!customerName.trim()) {
      setError("Nome do cliente é obrigatório.");
      return;
    }

    if (draftItems.length === 0) {
      setError("Adicione pelo menos 1 item na mala.");
      return;
    }

    setSaving(true);
    try {
      await createBag({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        note: note.trim() || null,
        items: draftItems,
      });

      setOpenCreate(false);
      resetCreateForm();
      await loadAll();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Erro ao criar mala.");
    } finally {
      setSaving(false);
    }
  }

  function openReturnModal(bag: Bag) {
    setError(null);
    setSelectedBag(bag);
    setReturnPayment("pix");
    setReturnSeller("");
    setReturnNote("");
    setReturnItems(
      bag.items.map((item) => ({
        product_id: item.product_id,
        quantity_sold: 0,
        quantity_returned: item.quantity_sent,
      }))
    );
    setOpenReturn(true);
  }

  function updateReturnItem(
    productId: number,
    field: "quantity_sold" | "quantity_returned",
    value: number
  ) {
    if (!selectedBag) return;

    const bagItem = selectedBag.items.find((i) => i.product_id === productId);
    if (!bagItem) return;

    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;

        let nextSold = item.quantity_sold;
        let nextReturned = item.quantity_returned;

        if (field === "quantity_sold") {
          nextSold = value;
          nextReturned = bagItem.quantity_sent - value;
        } else {
          nextReturned = value;
          nextSold = bagItem.quantity_sent - value;
        }

        if (nextSold < 0) nextSold = 0;
        if (nextReturned < 0) nextReturned = 0;
        if (nextSold > bagItem.quantity_sent) nextSold = bagItem.quantity_sent;
        if (nextReturned > bagItem.quantity_sent) nextReturned = bagItem.quantity_sent;

        return {
          ...item,
          quantity_sold: nextSold,
          quantity_returned: nextReturned,
        };
      })
    );
  }

  async function handleReturnBag() {
    if (!selectedBag) return;

    setSaving(true);
    setError(null);

    try {
      await returnBag(selectedBag.id, {
        payment: returnPayment,
        seller: returnSeller.trim() || null,
        note: returnNote.trim() || null,
        items: returnItems,
      });

      setOpenReturn(false);
      setSelectedBag(null);
      await loadAll();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Erro ao finalizar mala.");
    } finally {
      setSaving(false);
    }
  }

  if (role === "seller" || role === "vendedora") {
    return (
      <DashboardShell
        title="Malas"
        subtitle="Área restrita"
      >
        <main className="p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            Você não tem permissão para acessar essa área.
          </div>
        </main>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Malas"
      subtitle={subtitle}
      right={
        <button
          onClick={openCreateModal}
          className="rounded-2xl bg-black px-5 py-3 text-white font-medium shadow-sm hover:opacity-90"
        >
          + Nova Mala
        </button>
      }
    >
      <main className="p-6 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {bags.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md text-gray-600">
              Nenhuma mala cadastrada ainda.
            </div>
          ) : (
            bags.map((bag) => (
              <div
                key={bag.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {bag.customer_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Telefone: {bag.customer_phone || "Não informado"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status:{" "}
                      <span className={bag.status === "open" ? "text-yellow-700 font-semibold" : "text-green-700 font-semibold"}>
                        {bag.status === "open" ? "Em aberto" : "Finalizada"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Saída: {bag.date_out ? new Date(bag.date_out).toLocaleString("pt-BR") : "-"}
                    </p>
                    {bag.returned_at && (
                      <p className="text-sm text-gray-500">
                        Retorno: {new Date(bag.returned_at).toLocaleString("pt-BR")}
                      </p>
                    )}
                    {bag.note && (
                      <p className="mt-2 text-sm text-gray-700">{bag.note}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total vendido</div>
                    <div className="text-xl font-extrabold text-gray-900">
                      {formatBRL(bag.total_sold_amount || 0)}
                    </div>

                    {bag.status === "open" && (
                      <button
                        onClick={() => openReturnModal(bag)}
                        className="mt-4 rounded-2xl bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
                      >
                        Finalizar retorno
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {bag.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="font-semibold text-gray-900">
                        {item.product_name || `Produto #${item.product_id}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        Enviado: {item.quantity_sent}
                      </div>
                      <div className="text-sm text-gray-600">
                        Vendido: {item.quantity_sold}
                      </div>
                      <div className="text-sm text-gray-600">
                        Devolvido: {item.quantity_returned}
                      </div>
                      <div className="text-sm font-semibold text-gray-800 mt-2">
                        Valor unitário: {formatBRL(item.unit_price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nova mala">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600">Cliente</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                placeholder="Nome do cliente"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Telefone</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                placeholder="Telefone"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Observação</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-2 w-full min-h-[90px] rounded-xl border border-gray-200 px-3 py-2"
                placeholder="Observações da mala"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <select
                  value={selectedProductId}
                  onChange={(e) =>
                    setSelectedProductId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Selecione um produto…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Estoque: {p.stock}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Number(e.target.value))}
                  className="rounded-xl border border-gray-200 px-3 py-2"
                />

                <button
                  onClick={addDraftItem}
                  className="rounded-xl bg-black px-4 py-2 text-white"
                >
                  Adicionar
                </button>
              </div>

              <div className="space-y-2">
                {draftItems.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Nenhum item adicionado ainda.
                  </div>
                ) : (
                  draftItems.map((item) => {
                    const product = products.find((p) => p.id === item.product_id);
                    return (
                      <div
                        key={item.product_id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 p-3"
                      >
                        <div>
                          <div className="font-semibold text-gray-900">
                            {product?.name || `Produto #${item.product_id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Quantidade: {item.quantity}
                          </div>
                        </div>

                        <button
                          onClick={() => removeDraftItem(item.product_id)}
                          className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white"
                        >
                          Remover
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenCreate(false)}
                className="rounded-2xl border px-4 py-2"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreateBag}
                disabled={saving}
                className="rounded-2xl bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Criar mala"}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          open={openReturn}
          onClose={() => setOpenReturn(false)}
          title="Finalizar retorno da mala"
        >
          <div className="space-y-4">
            {selectedBag && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Pagamento</label>
                  <select
                    value={returnPayment}
                    onChange={(e) => setReturnPayment(e.target.value as PaymentMethod)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <option value="pix">PIX</option>
                    <option value="credito">Crédito</option>
                    <option value="debito">Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Vendedora</label>
                  <input
                    value={returnSeller}
                    onChange={(e) => setReturnSeller(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                    placeholder="Nome da vendedora"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Observação</label>
                  <textarea
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    className="mt-2 w-full min-h-[90px] rounded-xl border border-gray-200 px-3 py-2"
                    placeholder="Observações do retorno"
                  />
                </div>

                <div className="space-y-3">
                  {selectedBag.items.map((item) => {
                    const current = returnItems.find((i) => i.product_id === item.product_id);

                    return (
                      <div
                        key={item.product_id}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="font-semibold text-gray-900">
                          {item.product_name}
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          Quantidade enviada: {item.quantity_sent}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-600">
                              Vendida
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={item.quantity_sent}
                              value={current?.quantity_sold ?? 0}
                              onChange={(e) =>
                                updateReturnItem(
                                  item.product_id,
                                  "quantity_sold",
                                  Number(e.target.value)
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-600">
                              Devolvida
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={item.quantity_sent}
                              value={current?.quantity_returned ?? 0}
                              onChange={(e) =>
                                updateReturnItem(
                                  item.product_id,
                                  "quantity_returned",
                                  Number(e.target.value)
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setOpenReturn(false)}
                    className="rounded-2xl border px-4 py-2"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleReturnBag}
                    disabled={saving}
                    className="rounded-2xl bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {saving ? "Finalizando..." : "Finalizar retorno"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </main>
    </DashboardShell>
  );
}