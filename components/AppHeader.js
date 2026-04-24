import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import ValopoLogo from './ValopoLogo';
import { usePlan } from '../lib/usePlan';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Mis proyectos' },
  { href: '/clients', label: 'Mis clientes' },
  { href: '/invoices', label: 'Facturas' },
  { href: '/account', label: 'Mi cuenta' },
];

export default function AppHeader({ showRunningIndicator = false }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const { isPro } = usePlan(userId);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        setUserEmail(session.user.email);
        setUserId(session.user.id);
      }
    });
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const isActive = (href) => router.pathname === href;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo + badge */}
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
          <ValopoLogo size={40} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              Valopo
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isPro
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isPro ? 'PRO' : 'FREE'}
            </span>
            {showRunningIndicator && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                EN CURSO
              </span>
            )}
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 lg:px-4 py-2 text-sm rounded-lg transition font-medium ${
                isActive(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="px-3 lg:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium ml-2"
          >
            Salir
          </button>
        </div>

        {/* Mobile: sign out only */}
        <button
          onClick={signOut}
          className="md:hidden px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
        >
          Salir
        </button>
      </nav>
    </header>
  );
}
