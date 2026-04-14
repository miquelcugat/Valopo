import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.substring(7);

    // Verify the user with Supabase
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = userData.user;

    // Check if there's already a subscription row for this user
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    // ========================================================
    // GUARD: If user already has an active/trialing subscription
    // on Stripe, do NOT allow a second checkout. Redirect them
    // to the billing portal to manage the existing one.
    // ========================================================
    if (customerId) {
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      });

      const activeSubs = existingSubscriptions.data.filter(
        (s) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
      );

      if (activeSubs.length > 0) {
        // User already has an active sub. Send them to the billing portal instead.
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
        });
        return res.status(200).json({
          url: portalSession.url,
          alreadySubscribed: true,
        });
      }
    }

    // If the user doesn't have a Stripe customer yet, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      // Save the customer ID immediately so we don't create duplicates
      await supabaseAdmin
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            stripe_customer_id: customerId,
            status: 'free',
            plan: 'free',
          },
          { onConflict: 'user_id' }
        );
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      automatic_tax: { enabled: false },
      // For EU/Spain you should enable automatic_tax later when you set up tax IDs
    });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
}
