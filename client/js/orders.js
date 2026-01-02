import { api } from "./api.js";
import { requireAuthOrRedirect } from "./auth.js";

requireAuthOrRedirect();

const ordersDiv = document.getElementById("orders");

function statusBadge(status) {
  return `<span class="status ${status.toLowerCase()}">${status}</span>`;
}

async function loadOrders() {
  try {
    const orders = await api("/orders/my");

    if (orders.length === 0) {
      ordersDiv.innerHTML = "<p>You have no orders yet.</p>";
      return;
    }

    ordersDiv.innerHTML = orders.map(o => `
    <div class="order-card">

        <div class="order-main">
        <div>
            <strong>Order #${o.id}</strong>
            <div class="muted">${new Date(o.created_at).toLocaleString()}</div>
        </div>

        <div class="order-total">
            ${Number(o.total).toFixed(2)} BGN
        </div>

        <div>
            <span class="status ${o.status.toLowerCase()}">
                ${mapUserStatus(o.status)}
            </span>
        </div>
        </div>

        

        <button
        class="btn ghost details-btn"
        data-id="${o.id}"
        data-open="false"
        >
        Details
        </button>

        <div class="order-items" id="items-${o.id}" hidden></div>
    </div>
    `).join("");


    document.querySelectorAll(".details-btn").forEach(btn => {
      btn.onclick = () => toggleDetails(btn);
    });

  } catch (err) {
    ordersDiv.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function mapUserStatus(status) {
  if (status === "COMPLETED") return "Completed";
  if (status === "SHIPPING_IN_PROGRESS") return "Shipped";
  if (status === "PAYMENT_FAILED" || status === "FAILED_NO_STOCK") return "Failed";
  return "Processing";
}


function renderPipeline(current) {
  const steps = [
    "CREATED",
    "STOCK_CONFIRMED",
    "PAYMENT_AUTHORIZED",
    "SHIPPING_IN_PROGRESS",
    "COMPLETED"
  ];

  let reached = true;

  return steps.map(s => {
    let cls = "pipe";
    if (s === current) cls += " current";
    else if (reached) cls += " done";
    if (s === current) reached = false;

    return `<span class="${cls}">${s.replaceAll("_", " ")}</span>`;
  }).join("");
}

async function toggleDetails(btn) {
  const orderId = btn.dataset.id;
  const container = document.getElementById(`items-${orderId}`);
  const isOpen = btn.dataset.open === "true";

  if (isOpen) {
    container.style.display = "none";
    btn.textContent = "Details";
    btn.dataset.open = "false";
    return;
  }

  if (container.innerHTML.trim() === "") {
    const items = await api(`/orders/${orderId}/items`);

    container.innerHTML = items.map(i => `
      <div class="order-item">
        <strong>${i.name_snapshot}</strong><br>
        Quantity: ${i.quantity}<br>
        Price: ${Number(i.price_snapshot).toFixed(2)} BGN
      </div>
    `).join("");
  }

  container.style.display = "block";
  btn.textContent = "Hide details";
  btn.dataset.open = "true";
}

loadOrders();
