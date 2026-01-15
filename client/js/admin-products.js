import { api } from "./api.js";
import { requireAuthOrRedirect } from "./auth.js";

requireAuthOrRedirect();

const wrap = document.getElementById("admin-products");
const reloadBtn = document.getElementById("reloadBtn");

const categoryIdEl = document.getElementById("categoryId");
const nameEl = document.getElementById("name");
const brandEl = document.getElementById("brand");
const colorEl = document.getElementById("color");
const sizeLabelEl = document.getElementById("sizeLabel");
const priceEl = document.getElementById("price");
const stockEl = document.getElementById("stock");
const addBtn = document.getElementById("addBtn");
const addMsg = document.getElementById("addMsg");

function esc(s) {
  return String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function rowTemplate(p) {
  return `
  <div class="order-card" style="margin-bottom:10px;">
    <div class="order-main" style="gap:12px; align-items:flex-start;">
      <div style="min-width:70px;"><strong>#${p.id}</strong></div>

      <div style="flex:1; display:grid; gap:8px; grid-template-columns: repeat(3, minmax(0,1fr));">
        <label class="muted">Name
          <input data-f="name" value="${esc(p.name)}" />
        </label>

        <label class="muted">Brand
          <input data-f="brand" value="${esc(p.brand)}" />
        </label>

        <label class="muted">Color
          <input data-f="color" value="${esc(p.color)}" />
        </label>

        <label class="muted">Size
          <input data-f="size_label" value="${esc(p.size_label)}" />
        </label>

        <label class="muted">Price (BGN)
          <input data-f="price" type="number" step="0.01" value="${Number(p.price).toFixed(2)}" />
        </label>

        <label class="muted">Stock
          <input data-f="stock" type="number" value="${Number(p.stock)}" />
        </label>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px; min-width:160px;">
        <button class="btn" data-save="${p.id}">Save</button>
        <button class="btn ghost" data-del="${p.id}">Delete</button>
        <div class="muted" id="msg-${p.id}"></div>
      </div>
    </div>
  </div>
  `;
}

async function loadProducts() {
  wrap.innerHTML = `<p class="muted">Loading...</p>`;
  try {
    const products = await api("/admin/products"); // GET
    if (!products.length) {
      wrap.innerHTML = `<p class="muted">No products.</p>`;
      return;
    }
    wrap.innerHTML = products.map(rowTemplate).join("");

    document.querySelectorAll("[data-save]").forEach(btn => {
      btn.onclick = () => saveProduct(Number(btn.dataset.save));
    });

    document.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = () => deleteProduct(Number(btn.dataset.del));
    });

  } catch (e) {
    wrap.innerHTML = `<p class="error">${e.message}</p>`;
  }
}

async function saveProduct(id) {
  const card = [...wrap.querySelectorAll(`[data-save="${id}"]`)].map(b => b.closest(".order-card"))[0];
  const msg = document.getElementById(`msg-${id}`);

  const data = {};
  card.querySelectorAll("input[data-f]").forEach(inp => {
    data[inp.dataset.f] = inp.value;
  });

  // normalize numeric fields
  data.price = Number(data.price);
  data.stock = Number(data.stock);

  msg.textContent = "Saving...";
  try {
    await api(`/admin/products/${id}`, { method: "PUT", body: data });
    msg.textContent = "Saved ✅";
  } catch (e) {
    msg.textContent = `Error: ${e.message}`;
  }
}

async function deleteProduct(id) {
  const msg = document.getElementById(`msg-${id}`);
  if (!confirm(`Delete product #${id}?`)) return;

  msg.textContent = "Deleting...";
  try {
    await api(`/admin/products/${id}`, { method: "DELETE" });
    await loadProducts();
  } catch (e) {
    msg.textContent = `Error: ${e.message}`;
  }
}

addBtn.onclick = async () => {
  addMsg.textContent = "";

  const payload = {
    categoryId: Number(categoryIdEl.value),
    name: nameEl.value.trim(),
    brand: brandEl.value.trim(),
    color: colorEl.value.trim(),
    sizeLabel: sizeLabelEl.value.trim(),
    price: Number(priceEl.value),
    stock: stockEl.value === "" ? 0 : Number(stockEl.value),
  };

  if (!payload.categoryId || !payload.name || !payload.brand || !payload.color || !payload.sizeLabel || Number.isNaN(payload.price)) {
    addMsg.textContent = "Fill all required fields.";
    return;
  }

  addBtn.disabled = true;
  addMsg.textContent = "Adding...";
  try {
    await api("/admin/products", { method: "POST", body: payload });
    addMsg.textContent = "Added ✅";
    // clear
    nameEl.value = brandEl.value = colorEl.value = sizeLabelEl.value = "";
    priceEl.value = "";
    stockEl.value = "";
    await loadProducts();
  } catch (e) {
    addMsg.textContent = `Error: ${e.message}`;
  } finally {
    addBtn.disabled = false;
  }
};

reloadBtn.onclick = loadProducts;

loadProducts();
