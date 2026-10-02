import { api } from "./api";

type OrderItemPayload = { product_id: number; quantity: number };

export type CreateOrderPayload = {
  items: OrderItemPayload[];
  seller: string;
  customer_name?: string | null;
  payment: string;
  discount_type: "none" |"money" | "percent";
  discount_value: number;
  note?: string;
};

export async function createOrder(payload: CreateOrderPayload) {
  const res = await api.post("/orders/", payload);
  return res.data;
}

export type SellerSales = {
  days: number;
  total: number;
  orders: number;
  items: number;
  sales: Array<{
    id: number;
    total: number;
    customer_name?: string | null;
    payment: string;
    items: number;
    created_at?: string | null;
  }>;
};

export async function getMySales(days = 30, dateFrom?: string, dateTo?: string): Promise<SellerSales> {
  const response = await api.get("/orders/mine", { params: { days, date_from: dateFrom || undefined, date_to: dateTo || undefined } });
  return response.data;
}
