import { api } from "./api";

export type ReportSummary = {
  date_from: string;
  date_to: string;

  revenue: number;
  orders: number;
  items: number;

  revenue_today: number;
  orders_today: number;

  top_products: { product_id: number; name: string; qty: number; revenue: number }[];
  top_sellers: { seller: string; orders: number; revenue: number }[];

  recent_orders: {
    id: number;
    total: number;
    seller?: string | null;
    payment?: string | null;
    created_at?: string | null;
  }[];
};

export async function getReportSummary(days = 30): Promise<ReportSummary> {
  const res = await api.get(`/reports/summary?days=${days}`);
  return res.data;
}