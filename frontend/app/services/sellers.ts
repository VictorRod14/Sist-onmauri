import { api } from "./api";

export type Seller = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

export async function getSellers(): Promise<Seller[]> {
  const { data } = await api.get("/sellers/");
  return data;
}

export async function createSeller(name: string, email: string) {
  const { data } = await api.post("/sellers/", { name, email });
  return data;
}

export async function updateSeller(id: number, payload: Partial<Seller>) {
  const { data } = await api.put(`/sellers/${id}/`, payload);
  return data;
}

export async function deleteSeller(id: number) {
  await api.delete(`/sellers/${id}/`);
}