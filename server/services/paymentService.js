import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function authorizePayment({ amountBGN, currency = "eur" }) {
  const amount = Math.round(Number(amountBGN) * 100);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method_types: ["card"]
  });

  return {
    provider: "STRIPE",
    providerRef: intent.id,
    status: "AUTHORIZED",
    currency
  };
}
