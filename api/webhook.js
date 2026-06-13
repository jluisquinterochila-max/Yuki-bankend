const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("No permitido");

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log(`✅ Pago completado — Plan: ${session.metadata?.plan}`);
      break;
    case "customer.subscription.deleted":
      console.log(`❌ Suscripción cancelada`);
      break;
    case "invoice.payment_failed":
      console.log(`⚠️ Pago fallido`);
      break;
  }

  return res.status(200).json({ received: true });
};
