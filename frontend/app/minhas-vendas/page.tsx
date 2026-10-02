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
  const [period, setPeriod] = useState<"week" | "month" | "custom">("month");
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today.slice(0, 8) + "01");
  const [dateTo, setDateTo] = useState(today);
  const [data, setData] = useState<SellerSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const now = new Date();
    let from = dateFrom; let to = dateTo;
    if (period === "week") {
      const monday = new Date(now); const day = (now.getDay() + 6) % 7; monday.setDate(now.getDate() - day);
      from = monday.toISOString().slice(0,10); to = today;
    } else if (period === "month") { from = today.slice(0,8) + "01"; to = today; }
    getMySales(30, from, to)
      .then(setData)
      .catch((err) => {
        const detail = err?.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Não foi possível carregar suas vendas.");
      })
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo, today]);

  return (
    <DashboardShell
      title="Minhas vendas"
      subtitle="Acompanhe somente as vendas vinculadas ao seu perfil"
      right={
        <div className="rounded-2xl border border-[#e6ded2] bg-white px-4 py-2 shadow-sm">
          <label className="mr-2 text-sm text-gray-500">Visualizar</label>
          <select value={period} onChange={(event) => setPeriod(event.target.value as "week"|"month"|"custom")} className="bg-transparent font-semibold outline-none">
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="custom">Período personalizado</option>
          </select>
        </div>
      }
    >
      <main className="space-y-6">
        {period === "custom" && <div className="premium-card flex flex-col gap-4 p-4 sm:flex-row sm:items-end"><label className="flex-1 text-xs font-semibold text-gray-500">DATA INICIAL<input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800"/></label><label className="flex-1 text-xs font-semibold text-gray-500">DATA FINAL<input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="mt-2 block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800"/></label></div>}
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="premium-card metric-card p-5">
            <div className="text-sm font-medium text-gray-500">Total vendido</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{loading ? "…" : formatBRL(data?.total ?? 0)}</div>
            <div className="mt-2 text-xs text-gray-400">Período selecionado</div>
          </div>
          <div className="premium-card metric-card p-5">
            <div className="text-sm font-medium text-gray-500">Vendas realizadas</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{loading ? "…" : data?.orders ?? 0}</div>
            <div className="mt-2 text-xs text-gray-400">Pedidos concluídos</div>
          </div>
          <div className="premium-card metric-card p-5">
            <div className="text-sm font-medium text-gray-500">Peças vendidas</div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{loading ? "…" : data?.items ?? 0}</div>
            <div className="mt-2 text-xs text-gray-400">Quantidade total de itens</div>
          </div>
        </div>

        <section className="premium-card overflow-hidden">
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
