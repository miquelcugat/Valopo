import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'Missing userId or userEmail' });
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Timely Pro',
              description: 'Plan mensual de Timely Pro',
            },
            unit_amount: 1499, // €14.99 en centavos
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: userEmail,
      client_reference_id: userId,
      success_url: `${req.headers.origin}/dashboard?success=true`,
      cancel_url: `${req.headers.origin}/pricing?canceled=true`,
      metadata: {
        userId: userId,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
