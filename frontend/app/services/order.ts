import { api } from "./api";

type OrderItemPayload = { product_id: number; quantity: number };

export type CreateOrderPayload = {
  items: OrderItemPayload[];
  seller: string;
  payment: string;
  discount_type: "none" |"money" | "percent";
  discount_value: number;
  note?: string;
};

export async function createOrder(payload: CreateOrderPayload) {
  const res = await api.post("/orders/", payload);
  return res.data;
}
