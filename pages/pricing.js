import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Pricing() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/checkout');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <>
      <Head>
        <title>Planes - Timely</title>
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⏱</span>
              </div>
              <span className="font-bold text-xl">Timely</span>
            </div>
            {user && (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Dashboard
              </button>
            )}
          </nav>
        </header>

        {/* Pricing Section */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Planes simples y justos</h1>
            <p className="text-xl text-gray-600">Empieza gratis. Paga solo cuando crezca tu negocio.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="border-2 border-gray-200 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Para empezar</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">€0</span>
                <span className="text-gray-600">/mes</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Timer ilimitado</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Hasta 2 proyectos</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Dashboard básico</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Datos de esta semana</span>
                </li>
              </ul>

              <button
                onClick={() => router.push(user ? '/dashboard' : '/login')}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-lg font-bold hover:bg-gray-50"
              >
                Empezar gratis
              </button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-blue-600 rounded-lg p-8 relative bg-blue-50">
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                Popular
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-gray-600 mb-6">Para crecer sin límites</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">€14.99</span>
                <span className="text-gray-600">/mes</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Timer ilimitado</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Proyectos ilimitados</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Dashboard completo</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Histórico completo</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Exportar datos (CSV)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Email semanal</span>
                </li>
              </ul>

              <button
                onClick={handleUpgrade}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                Empezar Pro
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p>© 2024 Timely. Para freelancers que quieren saber cuánto ganan.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
