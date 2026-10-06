import { request } from "@/lib/api-client";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
};

export function getCurrentUser(): Promise<AuthUser | null> {
  return request<AuthUser | null>("/api/auth/me");
}

export function signIn(
  identifier: string,
  password: string,
): Promise<AuthUser> {
  return request<AuthUser>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
}

export function createAccount(
  username: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  return request<AuthUser>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
}

export function signOut(): Promise<{ logged_out: boolean }> {
  return request<{ logged_out: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}
