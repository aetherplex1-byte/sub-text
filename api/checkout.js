// api/checkout.js  -  Crea una sesion de Stripe Checkout y devuelve la URL de pago.
// Usa la libreria oficial de Stripe (se instala sola en Vercel por el package.json).
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo no permitido" });

  const SECRET = process.env.STRIPE_SECRET_KEY;
  const PRICE_MES = process.env.STRIPE_PRICE_MES;   // id del precio mensual (price_...)
  const PRICE_ANO = process.env.STRIPE_PRICE_ANO;   // id del precio anual  (price_...)
  if (!SECRET) return res.status(500).json({ error: "Falta STRIPE_SECRET_KEY" });

  try {
    const stripe = new Stripe(SECRET);
    const { plan } = req.body || {};
    const price = plan === "ano" ? PRICE_ANO : PRICE_MES;
    if (!price) return res.status(500).json({ error: "Falta el id de precio (STRIPE_PRICE_*)" });

    // La direccion base de tu sitio (Vercel la entrega en estas cabeceras).
    const proto = (req.headers["x-forwarded-proto"] || "https");
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const base = proto + "://" + host;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      // Al pagar, Stripe devuelve al usuario aqui con el id de la sesion:
      success_url: base + "/?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: base + "/",
      allow_promotion_codes: true
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("Error de Stripe (checkout):", e.message);
    return res.status(500).json({ error: "No se pudo crear el pago." });
  }
}
