import { api } from "./api";
import type { AuthUser } from "@/types/roles";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const loginRequest = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
};
