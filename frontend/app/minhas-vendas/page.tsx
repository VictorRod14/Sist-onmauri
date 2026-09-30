"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "../components/dashboardshell";
import { getMySales, SellerSales } from "../services/order";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}

const paymentLabels: Record<string, string> = {
  pix: "PIX",
  credito: "Crédito",
  debito: "Débito",
  dinheiro: "Dinheiro",
};

export default function MinhasVendasPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<SellerSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMySales(days)
      .then(setData)
      .catch((err) => {
        const detail = err?.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Não foi possível carregar suas vendas.");
      })
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <DashboardShell
      title="Minhas vendas"
      subtitle="Acompanhe somente as vendas vinculadas ao seu perfil"
      right={
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <label className="mr-2 text-sm text-gray-500">Período</label>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="bg-transparent font-semibold outline-none">
            <option value={7}>7 dias</option>
            <option value={15}>15 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>
        </div>
      }
    >
      <main className="space-y-6 p-6">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total vendido</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{loading ? "…" : formatBRL(data?.total ?? 0)}</div>
            <div className="mt-2 text-xs text-gray-400">Últimos {days} dias</div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Vendas realizadas</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{loading ? "…" : data?.orders ?? 0}</div>
            <div className="mt-2 text-xs text-gray-400">Pedidos concluídos</div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Peças vendidas</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{loading ? "…" : data?.items ?? 0}</div>
            <div className="mt-2 text-xs text-gray-400">Quantidade total de itens</div>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">Histórico de vendas</h2>
            <p className="text-sm text-gray-500">Cliente, pagamento, peças e valor de cada venda.</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando suas vendas…</div>
          ) : !data?.sales.length ? (
            <div className="p-8 text-center text-gray-500">Nenhuma venda encontrada nesse período.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.sales.map((sale) => (
                <article key={sale.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="font-semibold text-gray-900">Venda #{sale.id} • {sale.customer_name || "Cliente não informado"}</div>
                    <div className="mt-1 text-sm text-gray-500">{formatDate(sale.created_at)} • {paymentLabels[sale.payment] ?? sale.payment} • {sale.items} peça(s)</div>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-700">{formatBRL(sale.total)}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </DashboardShell>
  );
}
