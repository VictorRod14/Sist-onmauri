"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/dashboardshell";
import Modal from "../components/modal";
import { getProducts, Product } from "../services/products";
import { SaleSuccessModal } from "../components/salesuccessmodal";
import { createOrder } from "../services/order";
import { getSellers, Seller } from "../services/sellers";

type PaymentMethod = "pix" | "credito" | "debito" | "dinheiro";

type CartItem = {
  product: Product;
  qty: number;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ✅ Lê role de forma robusta (evita "seller ", "Seller", etc.)
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

// ✅ Pega nome do usuário logado (pra seller não precisar selecionar)
function getUserName(): string {
  if (typeof window === "undefined") return "";
  const raw =
    localStorage.getItem("user_name") ||
    localStorage.getItem("name") ||
    localStorage.getItem("username") ||
    localStorage.getItem("user") ||
    "";
  return raw.trim();
}

export default function VendasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // sellers
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);

  // modal adicionar item
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [qty, setQty] = useState(1);

  // carrinho
  const [cart, setCart] = useState<CartItem[]>([]);

  // venda
  const [seller, setSeller] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [discountType, setDiscountType] = useState<"none" | "money" | "percent">(
    "none"
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [note, setNote] = useState("");

  const [error, setError] = useState<string | null>(null);

  // modal de sucesso
  const [openSuccess, setOpenSuccess] = useState(false);
  const [lastSale, setLastSale] = useState({
    total: "",
    items: 0,
    payment: "",
  });

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } finally {
      setLoadingProducts(false);
    }
  }

  // ✅ CHAMA /sellers APENAS PARA admin/gerente
  async function loadSellers() {
    const role = getRole();

    // seller (ou role desconhecida) NÃO chama a API
    if (role !== "admin" && role !== "gerente") {
      setSellers([]);
      setLoadingSellers(false);
      return;
    }

    setLoadingSellers(true);
    try {
      const data = await getSellers();
      setSellers(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError("Você não tem autoridade para acessar essa informação.");
      } else {
        setError("Erro ao carregar vendedoras.");
      }
      setSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadSellers();

    // ✅ se for seller, tenta setar automaticamente a vendedora
    const role = getRole();
    if (role === "seller") {
      const name = getUserName();
      if (name) setSeller(name);
    }
  }, []);

  const subtitle = useMemo(() => {
    return "Carrinho • desconto • pagamento • finalizar";
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === "none") return 0;
    if (discountValue <= 0) return 0;

    if (discountType === "money") {
      return Math.min(discountValue, subtotal);
    }

    const pct = Math.min(Math.max(discountValue, 0), 100);
    return (pct / 100) * subtotal;
  }, [discountType, discountValue, subtotal]);

  const total = useMemo(() => {
    const t = subtotal - discountAmount;
    return t < 0 ? 0 : t;
  }, [subtotal, discountAmount]);

  function stockAvailable(productId: number) {
    const p = products.find((x) => x.id === productId);
    return p?.stock ?? 0;
  }

  function qtyInCart(productId: number) {
    const item = cart.find((c) => c.product.id === productId);
    return item?.qty ?? 0;
  }

  function openAddModal() {
    setError(null);
    setSelectedId("");
    setQty(1);
    setOpenAdd(true);
  }

  function addItem() {
    setError(null);

    if (!selectedId) {
      setError("Selecione um produto.");
      return;
    }

    const product = products.find((p) => p.id === selectedId);
    if (!product) {
      setError("Produto inválido.");
      return;
    }

    const available = product.stock ?? 0;
    const current = qtyInCart(product.id);
    const desired = current + qty;

    if (qty <= 0) {
      setError("Quantidade precisa ser maior que zero.");
      return;
    }

    if (desired > available) {
      setError(
        `Estoque insuficiente. Disponível: ${available}. No carrinho: ${current}.`
      );
      return;
    }

    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { product, qty }];
    });

    setOpenAdd(false);
  }

  function inc(productId: number) {
    setError(null);
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;

        const available = stockAvailable(productId);
        if (i.qty + 1 > available) {
          setError(`Sem estoque para aumentar. Disponível: ${available}.`);
          return i;
        }
        return { ...i, qty: i.qty + 1 };
      })
    );
  }

  function dec(productId: number) {
    setError(null);
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function remove(productId: number) {
    setError(null);
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function clearSale() {
    setCart([]);
    // se for seller, mantém o próprio nome
    const role = getRole();
    if (role === "seller") {
      const name = getUserName();
      setSeller(name || "");
    } else {
      setSeller("");
    }
    setPayment("pix");
    setDiscountType("none");
    setDiscountValue(0);
    setNote("");
    setError(null);
  }

  async function finalize() {
    setError(null);

    if (cart.length === 0) {
      setError("Adicione pelo menos 1 item no carrinho.");
      return;
    }

    if (!seller) {
      // se for seller e não tiver nome salvo, dá instrução clara
      const role = getRole();
      if (role === "seller") {
        setError(
          "Não foi possível identificar a vendedora logada. Saia e entre novamente."
        );
        return;
      }
      setError("Selecione uma vendedora.");
      return;
    }

    for (const item of cart) {
      const available = stockAvailable(item.product.id);
      if (item.qty > available) {
        setError(
          `Estoque insuficiente para "${item.product.name}". Disponível: ${available}.`
        );
        return;
      }
    }

    try {
      const itemsPayload = cart.map((i) => ({
        product_id: i.product.id,
        quantity: i.qty,
      }));

      const payload: any = {
        items: itemsPayload,
        seller,
        payment,
        note: note.trim() ? note : null,
        discount_type: discountType,
        discount_value: discountType === "none" ? 0 : discountValue,
      };

      const created = await createOrder(payload);

      setLastSale({
        total: formatBRL(created.total),
        items: cart.reduce((acc, i) => acc + i.qty, 0),
        payment: payment.toUpperCase(),
      });

      setOpenSuccess(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : detail
          ? JSON.stringify(detail)
          : "Falha ao salvar a venda. Verifique o backend e tente novamente.";
      setError(msg);
    }
  }

  const role = useMemo(() => getRole(), []);

  return (
    <DashboardShell
      title="Vendas"
      subtitle={subtitle}
      right={
        <div className="flex gap-2">
          <button
            onClick={openAddModal}
            className="rounded-2xl bg-black px-5 py-3 text-white font-medium shadow-sm hover:opacity-90"
          >
            + Adicionar item
          </button>
          <button
            onClick={clearSale}
            className="rounded-2xl border border-gray-300 px-5 py-3 text-gray-700 font-medium hover:bg-gray-100"
          >
            Limpar
          </button>
        </div>
      }
    >
      <main className="p-6 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Carrinho */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Carrinho</h2>
              <span className="text-sm text-gray-500">{cart.length} itens</span>
            </div>

            <div className="mt-4 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-gray-600">
                  Nenhum item adicionado ainda.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatBRL(item.product.price)} • Estoque:{" "}
                        {item.product.stock}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dec(item.product.id)}
                          className="h-9 w-9 rounded-xl border border-gray-300 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <div className="min-w-[40px] text-center font-semibold">
                          {item.qty}
                        </div>
                        <button
                          onClick={() => inc(item.product.id)}
                          className="h-9 w-9 rounded-xl border border-gray-300 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-28 text-right font-bold text-gray-900">
                        {formatBRL(item.product.price * item.qty)}
                      </div>

                      <button
                        onClick={() => remove(item.product.id)}
                        className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Resumo</h2>

            {/* Vendedora */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Vendedora
              </label>

              <select
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                disabled={role === "seller"} // ✅ seller não escolhe
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-60"
              >
                <option value="">
                  {role === "seller"
                    ? "Vendedora logada"
                    : loadingSellers
                    ? "Carregando..."
                    : "Selecione..."}
                </option>

                {role !== "seller" &&
                  sellers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </select>

              {role !== "seller" && !loadingSellers && sellers.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Nenhuma vendedora ativa cadastrada. Cadastre em{" "}
                  <span className="font-semibold">/vendedoras</span>.
                </p>
              )}

              {role === "seller" && !seller && (
                <p className="mt-2 text-xs text-red-600">
                  Não foi possível identificar seu nome. Saia e entre novamente.
                </p>
              )}
            </div>

            {/* Pagamento */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Pagamento
              </label>
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value as PaymentMethod)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="pix">PIX</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>

            {/* Desconto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Desconto
                </label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    const v = e.target.value as any;
                    setDiscountType(v);
                    if (v === "none") setDiscountValue(0);
                  }}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="none">Sem</option>
                  <option value="money">R$</option>
                  <option value="percent">%</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Valor
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  disabled={discountType === "none"}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Observação */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Observação
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Cliente pediu embrulho..."
                className="mt-2 w-full min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Totais */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatBRL(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Desconto</span>
                <span className="font-medium text-gray-900">
                  - {formatBRL(discountAmount)}
                </span>
              </div>

              <div className="flex justify-between text-lg font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatBRL(total)}</span>
              </div>
            </div>

            <button
              onClick={finalize}
              disabled={cart.length === 0}
              className="w-full rounded-2xl bg-green-600 px-5 py-3 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              Finalizar venda
            </button>

            {loadingProducts && (
              <div className="text-xs text-gray-500">Carregando produtos…</div>
            )}
          </div>
        </div>

        {/* Modal adicionar item */}
        <Modal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          title="Adicionar item"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Produto
              </label>
              <select
                value={selectedId}
                onChange={(e) =>
                  setSelectedId(e.target.value ? Number(e.target.value) : "")
                }
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="">Selecione…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatBRL(p.price)} (Estoque: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Quantidade
              </label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenAdd(false)}
                className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={addItem}
                className="rounded-2xl bg-black px-4 py-2 text-white font-medium hover:opacity-90"
              >
                Adicionar
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal sucesso */}
        <SaleSuccessModal
          open={openSuccess}
          total={lastSale.total}
          items={lastSale.items}
          payment={lastSale.payment}
          onClose={async () => {
            setOpenSuccess(false);
            clearSale();
            await loadProducts();
          }}
        />
      </main>
    </DashboardShell>
  );
}