import { api } from "./api.js";
import { isLoggedIn } from "./auth.js";

const catalog = document.getElementById("catalog");
const searchInput = document.getElementById("search");

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => { el.classList.remove("show"); el.remove(); }, 2200);
}

async function addToCart(productId) {
  if (!isLoggedIn()) {
    alert("Please login first to add products to cart.");
    window.location.href = "login.html";
    return;
  }

  try {
    await api("/cart/add", { method: "POST", body: { productId } });
    toast("✅ Added to cart");
  } catch (e) {
    // ако не е логнат → 401 → пращаме към login
    if (e.message.toLowerCase().includes("token") || e.message.toLowerCase().includes("missing")) {
      window.location.href = "login.html";
      return;
    }
    toast("❌ " + e.message);
  }
}

function openRecommendationsModal(list) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>Recommended</h3>
        <button class="icon-btn" id="close">✕</button>
      </div>
      <div class="modal-body">
        ${list.map(p => `
          <div class="rec-row">
            <div>
              <div class="rec-name">${p.name}</div>
              <div class="rec-meta">${p.brand} · ${p.color} · ${p.size_label}</div>
            </div>
            <div class="rec-price">${Number(p.price).toFixed(2)} BGN</div>
          </div>
        `).join("")}
      </div>
      <div class="modal-foot">
        <button class="btn" id="ok">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector("#close").onclick = () => overlay.remove();
  overlay.querySelector("#ok").onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

async function loadAndRender(q = "") {
  const deps = await api(`/catalog${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  catalog.innerHTML = "";

  deps.forEach(dep => {
    const h2 = document.createElement("h2");
    h2.textContent = dep.name;
    catalog.appendChild(h2);

    dep.categories.forEach(cat => {
      const h3 = document.createElement("h3");
      h3.textContent = cat.name;
      catalog.appendChild(h3);

      const grid = document.createElement("div");
      grid.className = "product-grid";

      cat.products.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <h4>${p.name}</h4>
          <p>${p.brand} · ${p.color} · ${p.size_label}</p>
          <p class="price">${Number(p.price).toFixed(2)} BGN</p>
          <div class="card-actions">
            <button class="btn" data-add="${p.id}">Add to cart</button>
            <button class="btn ghost" data-rec="${cat.id}" data-pid="${p.id}">View similar</button>
          </div>
          <p class="stock">Stock: ${p.stock}</p>
        `;
        grid.appendChild(card);
      });

      catalog.appendChild(grid);
    });
  });

  // bind buttons
  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(Number(btn.dataset.add)));
  });

  // recommendations (client-side from currently loaded deps)
  document.querySelectorAll("[data-rec]").forEach(btn => {
    btn.addEventListener("click", () => {
      const catId = Number(btn.dataset.rec);
      const pid = Number(btn.dataset.pid);
      const cat = deps.flatMap(d => d.categories).find(c => c.id === catId);
      const similar = (cat?.products || []).filter(x => x.id !== pid).slice(0, 4);
      openRecommendationsModal(similar);
    });
  });
}

searchInput.addEventListener("input", (e) => loadAndRender(e.target.value.trim()));
loadAndRender();
