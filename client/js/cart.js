import { api } from "./api.js";
import { requireAuthOrRedirect } from "./auth.js";

requireAuthOrRedirect();

const STRIPE_PUBLIC_KEY = "pk_test_51SkQSAGSkd9XMZ7h3StnqLbeeUx2gHDe1hUKaPwz4s47xSp69PF3SaKDBuydayQ1y4XJ6CTSxrGP4O3nFQkS4Zi600L6pZgrRK";

const cartDiv = document.getElementById("cart-items");
const totalDiv = document.getElementById("total");

const form = document.getElementById("payment-form");
const payBtn = document.getElementById("payBtn");
const paymentError = document.getElementById("payment-error");

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => { el.classList.remove("show"); el.remove(); }, 2200);
}

const stripe = Stripe(STRIPE_PUBLIC_KEY);
const elements = stripe.elements();

const card = elements.create("card", { hidePostalCode: true });
card.mount("#card-element");

// ---------- Cart ----------
let cart = [];

async function fetchCart() {
  cart = await api("/cart");
  renderCart();
}

async function setQty(productId, qty) {
  await api("/cart/set-qty", { method: "POST", body: { productId, quantity: qty } });
  await fetchCart();
}

function renderCart() {
  cartDiv.innerHTML = "";
  let total = 0;

  if (!cart || cart.length === 0) {
    cartDiv.innerHTML = `<p class="muted">Your cart is empty.</p>`;
    totalDiv.textContent = "Total: 0 BGN";
    payBtn.disabled = true;
    return;
  }

  payBtn.disabled = false;

  for (const item of cart) {
    total += Number(item.price) * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-info">
        <div class="cart-name">${item.name}</div>
        <div class="cart-meta">${item.brand} · ${item.color} · ${item.size_label}</div>
        <div class="cart-price">${Number(item.price).toFixed(2)} BGN</div>
      </div>

      <div class="cart-qty">
        <button class="icon-btn" data-minus="${item.id}">−</button>
        <span>${item.quantity}</span>
        <button class="icon-btn" data-plus="${item.id}">+</button>
      </div>

      <button class="btn ghost" data-remove="${item.id}">Remove</button>
    `;
    cartDiv.appendChild(row);
  }

  totalDiv.textContent = `Total: ${total.toFixed(2)} BGN`;

  document.querySelectorAll("[data-plus]").forEach(b => {
    b.onclick = () => {
      const id = Number(b.dataset.plus);
      const it = cart.find(x => x.id === id);
      setQty(id, it.quantity + 1);
    };
  });

  document.querySelectorAll("[data-minus]").forEach(b => {
    b.onclick = () => {
      const id = Number(b.dataset.minus);
      const it = cart.find(x => x.id === id);
      setQty(id, it.quantity - 1);
    };
  });

  document.querySelectorAll("[data-remove]").forEach(b => {
    b.onclick = () => {
      const id = Number(b.dataset.remove);
      setQty(id, 0);
    };
  });
}

// ---------- Payment ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  paymentError.textContent = "";

  if (!cart || cart.length === 0) {
    toast("Cart is empty.");
    return;
  }

  payBtn.disabled = true;

  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: "card",
    card
  });

  if (error) {
    paymentError.textContent = error.message;
    payBtn.disabled = false;
    return;
  }

  try {
    // 1) create order + payment intent
    const result = await api("/orders/checkout", {
      method: "POST",
      body: { paymentMethodId: paymentMethod.id }
    });

    // 2) confirm payment in Stripe (THIS makes it appear as succeeded in Dashboard)
    const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
      result.clientSecret,
      { payment_method: paymentMethod.id }
    );

    if (confirmError) {
      paymentError.textContent = confirmError.message;
      return;
    }

    if (paymentIntent.status !== "succeeded") {
      paymentError.textContent = `Payment status: ${paymentIntent.status}`;
      return;
    }

    // 3) tell backend "it succeeded" (backend re-checks Stripe + sends mailtrap email)
    const confirmed = await api("/orders/confirm", {
      method: "POST",
      body: { orderId: result.orderId, paymentIntentId: paymentIntent.id }
    });

    toast(`Order status: ${confirmed.status}`);

    await fetchCart();
    card.clear();
    window.location.href = "orders.html";

  } catch (err) {
    paymentError.textContent = err.message;
  } finally {
    payBtn.disabled = false;
  }
});

fetchCart();
