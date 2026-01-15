// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export async function authorizePayment({ amountBGN, currency = "eur" }) {
//   const amount = Math.round(Number(amountBGN) * 100);

//   const intent = await stripe.paymentIntents.create({
//     amount,
//     currency,
//     payment_method_types: ["card"]
//   });

//   return {
//     provider: "STRIPE",
//     providerRef: intent.id,
//     status: "AUTHORIZED",
//     currency
//   };
// }

// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export async function authorizePayment({ amountBGN, currency = "eur" }) {
//   const amount = Math.round(Number(amountBGN) * 100);

//   const intent = await stripe.paymentIntents.create({
//     amount,
//     currency,
//     payment_method_types: ["card"],
//   });

//   return {
//     provider: "STRIPE",
//     providerRef: intent.id,
//     clientSecret: intent.client_secret, // ✅ важно за confirm
//     status: intent.status,
//     currency
//   };
// }

// services/paymentService.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 1 EUR = 1.95583 BGN (фиксиран курс)
const BGN_PER_EUR = 1.95583;

export function bgnToEurCents(amountBGN) {
  const bgn = Number(amountBGN);
  if (!Number.isFinite(bgn) || bgn <= 0) throw new Error("Invalid amountBGN");

  const eur = bgn / BGN_PER_EUR;
  return Math.round(eur * 100); // cents
}

export async function authorizePayment({ amountBGN }) {
  const amountEurCents = bgnToEurCents(amountBGN);

  const intent = await stripe.paymentIntents.create({
    amount: amountEurCents,
    currency: "eur",
    payment_method_types: ["card"],
    
    metadata: {
      amount_bgn: String(amountBGN),
      fx_bgn_per_eur: String(BGN_PER_EUR),
    },
  });

  return {
    provider: "STRIPE",
    providerRef: intent.id,
    clientSecret: intent.client_secret,
    status: "REQUIRES_CONFIRMATION",
    currency: "eur",
    amountEurCents,
  };
}