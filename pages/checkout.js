import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabaseClient';
import Head from 'next/head';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Checkout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
    };
    checkAuth();
  }, [router]);

  const handleCheckout = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando sesión');
      }

      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        setError(stripeError.message);
      }
    } catch (err) {
      setError(err.message || 'Error en el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Checkout - Timely</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">⏱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Timely Pro</h1>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-700">Plan Pro</span>
              <span className="font-bold text-2xl text-blue-600">€14.99</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">/mes, cancelable en cualquier momento</p>

            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600">✓</span>
                Proyectos ilimitados
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600">✓</span>
                Histórico completo
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600">✓</span>
                Exportar datos
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600">✓</span>
                Email semanal
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? 'Procesando...' : 'Pagar €14.99'}
          </button>

          <button
            onClick={() => router.push('/pricing')}
            disabled={loading}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            Volver
          </button>

          <p className="text-xs text-gray-500 text-center mt-6">
            Pago procesado por Stripe. Tu tarjeta es segura.
          </p>
        </div>
      </div>
    </>
  );
}
