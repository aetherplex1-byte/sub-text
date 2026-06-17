// api/verify.js  -  Dos modos:
//  1) ?session_id=...  -> comprueba si una sesion de pago quedo pagada (al volver de Stripe)
//  2) ?email=...       -> comprueba si ese correo tiene una suscripcion ACTIVA (restaurar Pro)
import Stripe from "stripe";

export default async function handler(req, res) {
  const SECRET = process.env.STRIPE_SECRET_KEY;
  if (!SECRET) return res.status(500).json({ error: "Falta STRIPE_SECRET_KEY" });

  try {
    const stripe = new Stripe(SECRET);
    const sid = req.query.session_id;
    const email = req.query.email;

    // --- Modo 1: verificar por sesion (justo despues de pagar) ---
    if (sid) {
      const session = await stripe.checkout.sessions.retrieve(sid);
      const paid = session && (session.payment_status === "paid" || session.status === "complete");
      return res.status(200).json({ paid: !!paid });
    }

    // --- Modo 2: verificar por correo (restaurar Pro en otro dispositivo) ---
    if (email) {
      const clean = String(email).trim().toLowerCase();
      if (!clean || clean.indexOf("@") < 0)
        return res.status(400).json({ pro: false, error: "Correo no valido" });

      // Buscamos el cliente por correo
      const customers = await stripe.customers.list({ email: clean, limit: 1 });
      if (!customers.data.length) return res.status(200).json({ pro: false });

      const customerId = customers.data[0].id;
      // Buscamos si tiene alguna suscripcion activa
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      const pro = subs.data.length > 0;
      return res.status(200).json({ pro });
    }

    return res.status(400).json({ error: "Falta session_id o email" });
  } catch (e) {
    console.error("Error de Stripe (verify):", e.message);
    return res.status(500).json({ error: "No se pudo verificar." });
  }
}
