import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ValopoLogo from '../components/ValopoLogo';
import {
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  FileText,
  Shield,
  Sparkles,
  ChevronRight,
  Check,
  Smartphone,
  ArrowDown,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Valopo — ¿Estás cobrando lo que vales?</title>
        <meta
          name="description"
          content="Valopo te dice si estás ganando lo que mereces como freelance. Cronómetro, insights de rentabilidad y asesor IA. Gratis para empezar."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ValopoLogo size={40} />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Valopo</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition"
              >
                Entrar
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
              >
                Empieza gratis
              </button>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 sm:pt-20 pb-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-5xl sm:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              ¿Estás cobrando
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">lo que vales?</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              La mayoría de freelancers no sabe su €/hora real.
              Valopo te lo dice, proyecto a proyecto, y te recomienda qué hacer.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-sm inline-flex items-center justify-center gap-2"
              >
                Ver cuánto gano de verdad
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <p className="text-sm text-slate-400">
              Gratis. 2 proyectos. Sin compromiso.
            </p>
          </div>

          {/* Dashboard preview - simulated */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-950 rounded-2xl p-3 sm:p-4 shadow-2xl">
              {/* Browser bar */}
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 bg-slate-800 rounded-md px-3 py-1 ml-2">
                  <span className="text-xs text-slate-400">valopo.com/dashboard</span>
                </div>
              </div>
              {/* Simulated dashboard content */}
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <div className="p-4 sm:p-6">
                  {/* Goal bar */}
                  <div className="grid sm:grid-cols-3 gap-3 mb-4">
                    <div className="sm:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <Target className="w-5 h-5 text-blue-600 flex-shrink-0" strokeWidth={2.25} />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tu objetivo del mes</p>
                          <div className="flex items-baseline justify-between mt-1">
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                              2.847 €
                              <span className="text-sm font-normal text-slate-400"> / 4.000 €</span>
                            </p>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-900">71%</p>
                              <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Por encima del ritmo
                              </p>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: '71%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" strokeWidth={2.25} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tu €/h real</p>
                          <p className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums mt-1">
                            52,40 <span className="text-sm font-normal">€/h</span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Objetivo: 45 €/h</p>
                          <p className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            +16% sobre tu objetivo
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* IA Advisor banner */}
                  <div className="bg-slate-900 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" strokeWidth={2.25} />
                      <div>
                        <p className="text-white font-bold text-xs sm:text-sm">Analiza tu rentabilidad con IA</p>
                        <p className="text-slate-400 text-[10px] sm:text-xs">Descubre qué proyectos te compensan y cuáles no.</p>
                      </div>
                    </div>
                    <span className="text-slate-400 text-xs font-semibold whitespace-nowrap">Analizar →</span>
                  </div>
                  {/* Projects with badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                    {[
                      { label: 'Hoy', value: '285 €', sub: '5.4h' },
                      { label: 'Esta semana', value: '1.420 €', sub: '27.1h' },
                      { label: 'Este mes', value: '2.847 €', sub: '54.3h' },
                      { label: 'Total', value: '12.340 €', sub: '235.2h' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-3">
                        <p className="text-[10px] font-medium text-slate-400 uppercase">{s.label}</p>
                        <p className="text-sm sm:text-lg font-bold text-emerald-600 tabular-nums mt-1">{s.value}</p>
                        <p className="text-[10px] text-slate-400">{s.sub} trabajadas</p>
                      </div>
                    ))}
                  </div>
                  {/* Project list preview */}
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">App Redesign</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          Excelente
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">65€/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Web Corporativa</span>
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          Margen ajustado
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">38€/h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Caption */}
            <p className="text-center text-sm text-slate-400 mt-4">
              Tu dashboard te dice la verdad sobre tu negocio. Cada día.
            </p>
          </div>
        </section>

        {/* Social proof placeholder */}
        <section className="py-16 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wide mb-8">
              Para freelancers que quieren datos, no suposiciones
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { icon: Clock, text: 'Cronómetro en vivo' },
                { icon: TrendingUp, text: 'Insights de rentabilidad' },
                { icon: Sparkles, text: 'Asesor IA' },
                { icon: FileText, text: 'Facturas profesionales' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-2">
                  <Icon className="w-6 h-6 text-blue-600" strokeWidth={2} />
                  <p className="text-sm font-semibold text-slate-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Todo lo que necesitas, nada que sobre
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Diseñado para freelancers que quieren una herramienta profesional
                sin la complejidad de un ERP.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  Icon: Clock,
                  title: 'Cronómetro en vivo',
                  desc: 'Un click para empezar, otro para parar. Sin complicaciones.',
                },
                {
                  Icon: TrendingUp,
                  title: 'Insights de rentabilidad',
                  desc: 'Sabes al instante si un proyecto te compensa o te está costando dinero.',
                },
                {
                  Icon: Sparkles,
                  title: 'Asesor IA',
                  desc: 'Analiza tus datos reales y te dice qué hacer hoy para ganar más.',
                },
                {
                  Icon: BarChart3,
                  title: 'Análisis por proyecto',
                  desc: 'Gráficos de horas diarias, ingresos semanales y distribución horaria.',
                },
                {
                  Icon: FileText,
                  title: 'Facturas profesionales',
                  desc: 'Genera facturas con tus datos fiscales, logo, y líneas de detalle.',
                },
                {
                  Icon: Shield,
                  title: 'Privado y seguro',
                  desc: 'Tus datos son tuyos. Sin publicidad. Sin venta de datos.',
                },
              ].map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition group"
                >
                  <Icon
                    className="w-6 h-6 text-blue-600 mb-4 group-hover:scale-110 transition-transform"
                    strokeWidth={2.25}
                  />
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Planes simples, sin sorpresas
              </h2>
              <p className="text-lg text-slate-500">
                Empieza gratis. Sube a Pro cuando quieras.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <h3 className="font-bold text-xl text-slate-900 mb-1">Free</h3>
                <p className="text-sm text-slate-500 mb-6">Para empezar y probar</p>
                <p className="text-4xl font-bold text-slate-900 mb-6">
                  0 €<span className="text-base font-normal text-slate-500">/mes</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Hasta 2 proyectos',
                    'Cronómetro en vivo',
                    'Dashboard con estadísticas',
                    'Gestión de clientes',
                    'Objetivos de ingresos',
                    'Insight IA (1 al día)',
                    'Exportar CSV',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-6 py-3 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Empieza gratis
                </button>
              </div>

              {/* Pro */}
              <div className="bg-white rounded-2xl border-2 border-blue-600 p-8 relative shadow-sm">
                <div className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Recomendado
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-1">Pro</h3>
                <p className="text-sm text-slate-500 mb-6">Para freelancers serios</p>
                <p className="text-4xl font-bold text-slate-900 mb-6">
                  14,99 €<span className="text-base font-normal text-slate-500">/mes</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Proyectos ilimitados',
                    'Todo lo de Free',
                    'Historial completo (sin límite)',
                    'Exportar PDF con gráficos',
                    'Facturas profesionales con logo',
                    'Insights de rentabilidad avanzados',
                    'Insight IA ilimitado',
                    'Soporte prioritario',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Empieza con Pro
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: '¿Es realmente gratis?',
                  a: 'Sí. La versión Free incluye hasta 2 proyectos, cronómetro, dashboard y exportación CSV. Sin límite de tiempo.',
                },
                {
                  q: '¿Puedo cambiar de plan cuando quiera?',
                  a: 'Por supuesto. Puedes subir a Pro o cancelar en cualquier momento desde tu cuenta. Sin permanencia ni penalizaciones.',
                },
                {
                  q: '¿Mis datos son privados?',
                  a: 'Tus datos están encriptados y nunca se comparten con terceros. Sin publicidad, sin venta de datos.',
                },
                {
                  q: '¿Necesito instalar algo?',
                  a: 'No. Valopo funciona 100% en el navegador. Solo necesitas una conexión a internet.',
                },
              ].map(({ q, a }) => (
                <div
                  key={q}
                  className="p-5 bg-white rounded-xl border border-slate-200"
                >
                  <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-slate-900 py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tu tiempo tiene un precio.
              <br />
              <span className="text-blue-400">Asegúrate de que sea justo.</span>
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Empieza gratis con 2 proyectos. Configura tu objetivo y empieza a
              entender cuánto vale tu trabajo.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-500 transition shadow-lg inline-flex items-center gap-2"
            >
              Ver cuánto gano de verdad
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ValopoLogo size={32} />
                  <span className="font-bold text-white">Valopo</span>
                </div>
                <p className="text-sm text-slate-500">
                  Para freelancers que quieren saber cuánto vale su tiempo.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Producto</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li>
                    <button onClick={() => router.push('/login')} className="hover:text-white transition">
                      Empieza gratis
                    </button>
                  </li>
                  <li>
                    <button onClick={() => router.push('/login')} className="hover:text-white transition">
                      Entrar
                    </button>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:text-white transition">
                      Precios
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li>
                    <Link href="/terminos" className="hover:text-white transition">
                      Términos y condiciones
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidad" className="hover:text-white transition">
                      Política de privacidad
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="hover:text-white transition">
                      Política de cookies
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Contacto</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li>
                    <a href="mailto:info@valopo.com" className="hover:text-white transition">
                      info@valopo.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8">
              <p className="text-center text-sm text-slate-600">
                © {new Date().getFullYear()} Valopo. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
