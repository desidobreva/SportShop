// client/js/make-admin.js
import { api } from "./api.js";

const form = document.getElementById("make-form");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const email = form.email.value.trim();
  const secret = form.secret.value.trim();

  try {
    const result = await api("/auth/make-admin", {
      method: "POST",
      body: { email, secret }
    });
    msg.textContent = result.message;
  } catch (e) {
    msg.textContent = e.message;
  }
});
