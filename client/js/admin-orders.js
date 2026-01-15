import { api } from "./api.js";
import { requireAuthOrRedirect, getCurrentUser } from "./auth.js";

requireAuthOrRedirect();

const user = getCurrentUser();
if (!user || user.role !== "ADMIN") {
  // ако не е админ → обратно към login
  localStorage.clear();
  window.location.href = "login.html";
}

const filter = document.getElementById("filter");
const container = document.getElementById("admin-orders");

function orderCard(o) {
  return `
    <div class="order-card">
      <div class="order-main">
        <div>
          <strong>Order #${o.id}</strong>
          <div class="muted">${new Date(o.created_at).toLocaleString()}</div>
          <div class="muted">User: ${o.email}</div>
        </div>

        <div class="order-total">${Number(o.total).toFixed(2)} BGN</div>

        <div>
          <span class="status ${String(o.status).toLowerCase()}">${o.status}</span>
        </div>
      </div>
    </div>
  `;
}

async function load() {
  container.innerHTML = `<p class="muted">Loading...</p>`;
  try {
    const status = filter.value;
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    const orders = await api(`/orders/admin/all${qs}`);
    if (!orders.length) {
      container.innerHTML = `<p>No orders.</p>`;
      return;
    }
    container.innerHTML = orders.map(orderCard).join("");
  } catch (e) {
    container.innerHTML = `<p class="error">${e.message}</p>`;
  }
}

filter.addEventListener("change", load);
load();