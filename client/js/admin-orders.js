import { api } from "./api.js";
import { requireAuthOrRedirect } from "./auth.js";

requireAuthOrRedirect();

const div = document.getElementById("admin-orders");
const filter = document.getElementById("filter");

function badge(status) {
  return `<span class="status ${status.toLowerCase()}">${status}</span>`;
}

async function loadAdminOrders() {
  try {
    const status = filter.value;
    const orders = await api(
      status ? `/orders/admin/all?status=${status}` : "/orders/admin/all"
    );

    if (orders.length === 0) {
      div.innerHTML = "<p>No orders.</p>";
      return;
    }

    div.innerHTML = orders.map(o => `
      <div class="order-card">
        <div>
          <strong>#${o.id}</strong><br>
          <span class="muted">${o.email}</span><br>
          <span class="muted">${new Date(o.created_at).toLocaleString()}</span>
        </div>

        <div>${badge(o.status)}</div>

        <div>
          <strong>${Number(o.total).toFixed(2)} BGN</strong>
        </div>

        <select data-id="${o.id}">
          ${["CREATED","STOCK_CONFIRMED","PAYMENT_AUTHORIZED","SHIPPING_IN_PROGRESS","COMPLETED"]
            .map(s => `<option ${s===o.status?"selected":""}>${s}</option>`)
            .join("")}
        </select>
      </div>
    `).join("");

    document.querySelectorAll("select[data-id]").forEach(sel => {
      sel.onchange = async () => {
        await api(`/orders/admin/${sel.dataset.id}/status`, {
          method: "POST",
          body: { status: sel.value }
        });
      };
    });

  } catch (err) {
    div.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

filter.onchange = loadAdminOrders;
loadAdminOrders();