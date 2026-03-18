import { api } from "./api";

export interface BagItem {
  id: number;
  product_id: number;
  product_name?: string | null;
  quantity_sent: number;
  quantity_sold: number;
  quantity_returned: number;
  unit_price: number;
}

export interface Bag {
  id: number;
  customer_name: string;
  customer_phone?: string | null;
  status: string;
  note?: string | null;
  payment?: string | null;
  seller?: string | null;
  total_sold_amount: number;
  order_id?: number | null;
  date_out?: string | null;
  returned_at?: string | null;
  items: BagItem[];
}

export type BagCreatePayload = {
  customer_name: string;
  customer_phone?: string | null;
  note?: string | null;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
};

export type BagReturnPayload = {
  payment: "pix" | "credito" | "debito" | "dinheiro";
  seller?: string | null;
  note?: string | null;
  items: Array<{
    product_id: number;
    quantity_sold: number;
    quantity_returned: number;
  }>;
};

export async function getBags(): Promise<Bag[]> {
  const response = await api.get("/bags/");
  return response.data;
}

export async function getBag(id: number): Promise<Bag> {
  const response = await api.get(`/bags/${id}`);
  return response.data;
}

export async function createBag(payload: BagCreatePayload): Promise<Bag> {
  const response = await api.post("/bags/", payload);
  return response.data;
}

export async function returnBag(id: number, payload: BagReturnPayload): Promise<Bag> {
  const response = await api.post(`/bags/${id}/return`, payload);
  return response.data;
}