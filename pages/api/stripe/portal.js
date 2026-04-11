import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const accessToken = authHeader.substring(7);

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return res
        .status(400)
        .json({ error: 'No subscription found. Please subscribe first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
