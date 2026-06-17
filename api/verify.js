// api/verify.js  -  Comprueba en Stripe si una sesion de pago quedo pagada.
// El frontend lo llama al volver de Stripe con ?session_id=...
import Stripe from "stripe";

export default async function handler(req, res) {
  const SECRET = process.env.STRIPE_SECRET_KEY;
  if (!SECRET) return res.status(500).json({ error: "Falta STRIPE_SECRET_KEY" });

  try {
    const stripe = new Stripe(SECRET);
    const sid = req.query.session_id;
    if (!sid) return res.status(400).json({ paid: false, error: "Falta session_id" });

    const session = await stripe.checkout.sessions.retrieve(sid);
    const paid = session && (session.payment_status === "paid" || session.status === "complete");
    return res.status(200).json({ paid: !!paid });
  } catch (e) {
    console.error("Error de Stripe (verify):", e.message);
    return res.status(500).json({ paid: false, error: "No se pudo verificar el pago." });
  }
}
