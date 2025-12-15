// src/api/auth.ts
import { api } from "./http";
import type { User } from "../types";

type AuthApiResponse = {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
};

export async function login(email: string, password: string) {
  const res = await api.post<AuthApiResponse>("/auth/login", {
    email,
    password,
  });
  const { token, user } = res.data.data;
  const normalizedUser: User = {
    _id: user.id,
    name: user.name,
    email: user.email,
  };
  return { token, user: normalizedUser };
}

export async function register(
  name: string,
  email: string,
  password: string
) {
  const res = await api.post<AuthApiResponse>("/auth/register", {
    name,
    email,
    password,
  });
  const { token, user } = res.data.data;
  const normalizedUser: User = {
    _id: user.id,
    name: user.name,
    email: user.email,
  };
  return { token, user: normalizedUser };
}

export async function checkEmail(email: string) {
  const res = await api.post<{
    success: boolean;
    data: { exists: boolean };
  }>("/auth/check-email", {
    email
  });

  return res.data.data.exists;
}