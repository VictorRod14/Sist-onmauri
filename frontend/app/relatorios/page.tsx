"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/dashboardshell";
import { getReportSummary, ReportSummary } from "../services/reports";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

type Granularity = "day" | "week" | "month";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toDateKey(iso?: string | null) {
  if (!iso) return null;
  return iso.slice(0, 10); // YYYY-MM-DD
}

function formatDDMM(dateKey: string) {
  // YYYY-MM-DD -> DD/MM
  if (!dateKey || dateKey.length !== 10) return dateKey;
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}`;
}

function startEndLabel(summary?: ReportSummary | null) {
  if (!summary) return "—";
  return `${summary.date_from} → ${summary.date_to}`;
}

// ISO week key: YYYY-W## (simplificado)
function weekKey(dateKey: string) {
  // sem libs: aproxima pelo "ano-semana" usando Date
  const d = new Date(dateKey + "T00:00:00");
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function monthKey(dateKey: string) {
  // YYYY-MM-DD -> YYYY-MM
  return dateKey.slice(0, 7);
}

function tooltipStyle() {
  return {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
  } as const;
}

export default function RelatoriosPage() {
  const [days, setDays] = useState(30);
  const [granularity, setGranularity] = useState<Granularity>("day");

  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getReportSummary(days);
      setData(res);
    } catch {
      setError("Falha ao carregar relatórios. Verifique o endpoint /reports/summary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // ====== BASE: recent_orders ======
  const recentOrders = useMemo(() => data?.recent_orders ?? [], [data]);

  const revenueSeries = useMemo(() => {
    // agrupa receita por dia/semana/mês a partir de recent_orders
    const map = new Map<string, { key: string; revenue: number; orders: number }>();

    for (const o of recentOrders) {
      const dk = toDateKey(o.created_at) ?? "Sem data";
      let key = dk;

      if (granularity === "week" && dk !== "Sem data") key = weekKey(dk);
      if (granularity === "month" && dk !== "Sem data") key = monthKey(dk);

      const cur = map.get(key) ?? { key, revenue: 0, orders: 0 };
      cur.revenue += o.total ?? 0;
      cur.orders += 1;
      map.set(key, cur);
    }

    const arr = Array.from(map.values()).sort((a, b) => (a.key > b.key ? 1 : a.key < b.key ? -1 : 0));

    // label amigável
    return arr.map((x) => ({
      key: x.key,
      label:
        granularity === "day" && x.key !== "Sem data"
          ? formatDDMM(x.key)
          : granularity === "week"
          ? x.key.replace("-", " ").replace("W", "Semana ")
          : granularity === "month"
          ? x.key
          : x.key,
      revenue: Number(x.revenue.toFixed(2)),
      orders: x.orders,
    }));
  }, [recentOrders, granularity]);

  const subtotalPeriod = useMemo(() => data?.revenue ?? 0, [data]);
  const ordersPeriod = useMemo(() => data?.orders ?? 0, [data]);
  const itemsPeriod = useMemo(() => data?.items ?? 0, [data]);

  const ticketMedio = useMemo(() => {
    if (!ordersPeriod) return 0;
    return subtotalPeriod / ordersPeriod;
  }, [subtotalPeriod, ordersPeriod]);

  const avgDaily = useMemo(() => {
    // média diária aproximada pelo período selecionado
    if (!days) return 0;
    return subtotalPeriod / days;
  }, [subtotalPeriod, days]);

  const todayRevenue = useMemo(() => data?.revenue_today ?? 0, [data]);
  const todayOrders = useMemo(() => data?.orders_today ?? 0, [data]);

  const todayVsAvg = useMemo(() => {
    if (avgDaily <= 0) return 0;
    return ((todayRevenue - avgDaily) / avgDaily) * 100;
  }, [todayRevenue, avgDaily]);

  // ====== TOPS ======
  const topSellers = useMemo(() => {
    return (data?.top_sellers ?? []).map((s) => ({
      seller: s.seller || "Sem vendedora",
      revenue: s.revenue ?? 0,
      orders: s.orders ?? 0,
    }));
  }, [data]);

  const topProducts = useMemo(() => {
    return (data?.top_products ?? []).map((p) => ({
      name: p.name,
      revenue: p.revenue ?? 0,
      qty: p.qty ?? 0,
    }));
  }, [data]);

  const subtitle = useMemo(() => `Período: ${startEndLabel(data)}`, [data]);

  return (
    <DashboardShell
      title="Relatórios"
      subtitle={subtitle}
      right={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <span className="text-sm text-gray-500">Período</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-gray-900 outline-none"
            >
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setGranularity("day")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                granularity === "day" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setGranularity("week")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                granularity === "week" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setGranularity("month")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                granularity === "month" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Mês
            </button>
          </div>
        </div>
      }
    >
      <main className="p-6 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* KPIs (premium) */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500">Hoje</div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {todayVsAvg >= 0 ? `+${todayVsAvg.toFixed(0)}%` : `${todayVsAvg.toFixed(0)}%`} vs média
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">{formatBRL(todayRevenue)}</div>
            <div className="mt-1 text-sm text-gray-500">{todayOrders} pedidos</div>
            <div className="mt-4 h-1 w-full rounded-full bg-gray-100">
              <div
                className="h-1 rounded-full bg-emerald-500"
                style={{
                  width: `${Math.max(6, Math.min(100, avgDaily ? (todayRevenue / avgDaily) * 50 : 10))}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-500">Faturamento no período</div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">{formatBRL(subtotalPeriod)}</div>
            <div className="mt-1 text-sm text-gray-500">{startEndLabel(data)}</div>
            <div className="mt-4 rounded-2xl bg-indigo-50 px-4 py-3">
              <div className="text-xs font-semibold text-indigo-700">Média diária</div>
              <div className="text-sm font-extrabold text-indigo-900">{formatBRL(avgDaily)}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-500">Pedidos</div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">{ordersPeriod}</div>
            <div className="mt-1 text-sm text-gray-500">{itemsPeriod} itens vendidos</div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
              <span className="text-xs font-semibold text-amber-700">Ticket médio</span>
              <span className="text-sm font-extrabold text-amber-900">{formatBRL(ticketMedio)}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-500">Status</div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">
              {loading ? "Carregando…" : "OK"}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {data ? `Top produtos: ${topProducts.length} • Top vendedoras: ${topSellers.length}` : "—"}
            </div>
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3">
              <div className="text-xs font-semibold text-rose-700">Última atualização</div>
              <div className="text-sm font-bold text-rose-900">ao abrir a página</div>
            </div>
          </div>
        </div>

        {/* Linha principal */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Gráfico principal */}
          <div className="xl:col-span-2 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Faturamento</h2>
                <p className="text-sm text-gray-500">
                  {granularity === "day"
                    ? "Por dia"
                    : granularity === "week"
                    ? "Agrupado por semana"
                    : "Agrupado por mês"}{" "}
                  • baseado em <span className="font-semibold">recent_orders</span>
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-2 text-sm text-gray-700">
                <span className="font-semibold">Período:</span> {startEndLabel(data)}
              </div>
            </div>

            <div className="mt-5 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$ ${v}`}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle()}
                    formatter={(v: any) => formatBRL(Number(v))}
                    labelFormatter={(l) => String(l)}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#revFill)"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#111827"
                    strokeWidth={0}
                    dot={{ r: 3, fill: "#111827" }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {revenueSeries.length === 0 && (
              <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-gray-600">
                Sem vendas suficientes para montar o gráfico ainda.
              </div>
            )}
          </div>

          {/* Top vendedoras */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Top vendedoras</h2>
                <p className="text-sm text-gray-500">Por faturamento</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {topSellers.length} listas
              </span>
            </div>

            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellers.slice(0, 6)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="seller"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle()}
                    formatter={(v: any) => formatBRL(Number(v))}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              {topSellers.slice(0, 6).map((s) => (
                <div key={s.seller} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-900">{s.seller}</div>
                    <div className="text-xs text-gray-500">{s.orders} vendas</div>
                  </div>
                  <div className="font-extrabold text-gray-900">{formatBRL(s.revenue)}</div>
                </div>
              ))}
              {topSellers.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-gray-600">
                  Ainda não tem dados de vendedoras.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linha de baixo: Top produtos + Últimas vendas */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Top produtos */}
          <div className="xl:col-span-1 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Top produtos</h2>
                <p className="text-sm text-gray-500">Receita e quantidade</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                {topProducts.length} itens
              </span>
            </div>

            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts.slice(0, 8).map((p) => ({ ...p, label: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name }))}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$ ${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle()}
                    formatter={(v: any, name: any) => {
                      if (name === "revenue") return formatBRL(Number(v));
                      return v;
                    }}
                    labelFormatter={() => ""}
                  />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 8, 8]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {topProducts.length === 0 && (
              <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-gray-600">
                Ainda não tem dados de produtos.
              </div>
            )}
          </div>

          {/* Últimas vendas */}
          <div className="xl:col-span-2 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Últimas vendas</h2>
                <p className="text-sm text-gray-500">As mais recentes do período</p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-2 text-sm text-gray-700">
                <span className="font-semibold">Total no período:</span> {formatBRL(subtotalPeriod)}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Vendedora</th>
                    <th className="px-4 py-3">Pagamento</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentOrders.slice(0, 10).map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">#{o.id}</td>
                      <td className="px-4 py-3 text-gray-700">{o.seller || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                          {(o.payment || "—").toString().toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{toDateKey(o.created_at) ? formatDDMM(toDateKey(o.created_at)!) : "—"}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-gray-900">
                        {formatBRL(o.total ?? 0)}
                      </td>
                    </tr>
                  ))}

                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                        Ainda não há vendas para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {loading && <div className="mt-3 text-xs text-gray-500">Carregando…</div>}
          </div>
        </div>
      </main>
    </DashboardShell>
  );
}