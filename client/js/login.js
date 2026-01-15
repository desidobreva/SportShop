// client/js/login.js
import { api, setToken, setUser } from "./api.js";

const form = document.getElementById("login-form");
const err = document.getElementById("login-error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  err.textContent = "";

  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    const result = await api("/auth/login", {
      method: "POST",
      body: { email, password }
    });

    setToken(result.token);
    setUser(result.user);

    // ако е ADMIN, прати го в admin
    if (result.user.role === "ADMIN") {
      window.location.href = "admin-orders.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (e) {
    err.textContent = e.message;
  }
});
