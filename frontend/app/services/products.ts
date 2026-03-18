import { api } from "./api";

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  active: boolean;
}

export async function getProducts(): Promise<Product[]> {
  const response = await api.get("/products/");
  return response.data;
}

export type ProductPayload = {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
};

export async function createProduct(payload: ProductPayload) {
  const response = await api.post("/products/", payload);
  return response.data;
}

export async function updateProduct(id: number, payload: ProductPayload) {
  const response = await api.put(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(id: number) {
  const response = await api.delete(`/products/${id}`);
  return response.data;
}
