import { api, setToken } from "./api.js";

export async function register(email, password) {
  return api("/auth/register", { method: "POST", body: { email, password } });
}

export async function login(email, password) {
  const data = await api("/auth/login", { method: "POST", body: { email, password } });
  setToken(data.token);
  localStorage.setItem("currentUser", JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
}

export function requireAuthOrRedirect() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "login.html";
}

export function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}
