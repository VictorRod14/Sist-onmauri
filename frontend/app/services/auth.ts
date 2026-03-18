import {api} from "./api";

export type LoginResponse = {
  token: string;
  role: "admin" | "gerente" | "seller" | string;
  must_change_password: boolean;

  // ✅ opcionais (backend pode não mandar hoje)
  name?: string;
  user_name?: string;
  user?: {
    name?: string;
  };
};

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  // backend atual espera query params
  const { data } = await api.post("/auth/login", null, {
    params: { email, password },
  });

  return data;
}

export async function logout(): Promise<{ message: string }> {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignora
  }

  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_name");

  return { message: "Logout realizado" };
}