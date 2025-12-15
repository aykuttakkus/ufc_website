// src/utils/auth.ts

const TOKEN_KEY = "auth_token"; // localStorage'da kullanacağımız key

// Token kaydet
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

// Token'i oku
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Token'i sil (logout için)
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Kullanıcı login mi? (boolean)
export function isAuthenticated(): boolean {
  return !!getToken();
}