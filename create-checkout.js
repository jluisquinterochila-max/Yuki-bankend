 const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC,
  pro:   process.env.STRIPE_PRICE_PRO,
  ultra: process.env.STRIPE_PRICE_ULTRA,
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { plan, successUrl, cancelUrl } = req.body;

  if (!PRICE_IDS[plan]) {
    return res.status(400).json({ error: "Plan inválido" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: successUrl || `${process.env.FRONTEND_URL}?success=true&plan=${plan}`,
      cancel_url:  cancelUrl  || `${process.env.FRONTEND_URL}?canceled=true`,
      metadata: { plan },
    });
    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
