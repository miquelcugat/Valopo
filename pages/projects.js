import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { usePlan } from '../lib/usePlan';

export default function Projects() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Plan
  const { isPro, loading: planLoading } = usePlan(user?.id);

  const dailyChartRef = useRef(null);
  const weeklyChartRef = useRef(null);
  const hourlyChartRef = useRef(null);

  // ---------- Helpers ----------
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const formatEUR = (n) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

  const formatHours = (h) => `${(h || 0).toFixed(1)}h`;

  const formatDate = (iso) =>
    new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  const formatDateShort = (d) =>
    new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(d);

  // ---------- Auth & data load ----------
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      if (!mounted) return;
      setUser(data.session.user);
      await loadData(data.session.user.id);
    };
    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (userId) => {
    try {
      const [{ data: projectsData, error: pErr }, { data: sessionsData, error: sErr }] =
        await Promise.all([
          supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .order('start_time', { ascending: false, nullsFirst: false }),
        ]);
      if (pErr) throw pErr;
      if (sErr) throw sErr;

      setProjects(projectsData || []);
      setSessions(sessionsData || []);

      // Pre-select project from URL ?id=... or first project
      const fromQuery = router.query.id;
      if (fromQuery && (projectsData || []).some((p) => p.id === fromQuery)) {
        setSelectedId(fromQuery);
      } else if (projectsData?.length > 0) {
        setSelectedId(projectsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error cargando los datos');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Computed data for selected project ----------
  const selectedProject = projects.find((p) => p.id === selectedId);
  const projectSessions = useMemo(
    () => sessions.filter((s) => s.project_id === selectedId),
    [sessions, selectedId]
  );

  const sessionDate = (s) => new Date(s.start_time || s.created_at);
  const sessionHours = (s) => Math.max(0, (s.duration_seconds || 0) / 3600);
  const sessionEarnings = (s) => Number(s.earned || 0);

  // Totals
  const stats = useMemo(() => {
    const totalHours = projectSessions.reduce((a, s) => a + sessionHours(s), 0);
    const totalEarnings = projectSessions.reduce((a, s) => a + sessionEarnings(s), 0);
    const sessionCount = projectSessions.length;
    const avgSessionMin =
      sessionCount > 0 ? (totalHours * 60) / sessionCount : 0;
    const avgEarningsPerSession =
      sessionCount > 0 ? totalEarnings / sessionCount : 0;
    const effectiveRate = totalHours > 0 ? totalEarnings / totalHours : 0;

    // First and last session
    const sortedByDate = [...projectSessions].sort(
      (a, b) => sessionDate(a) - sessionDate(b)
    );
    const firstSession = sortedByDate[0];
    const lastSession = sortedByDate[sortedByDate.length - 1];

    return {
      totalHours,
      totalEarnings,
      sessionCount,
      avgSessionMin,
      avgEarningsPerSession,
      effectiveRate,
      firstSession,
      lastSession,
    };
  }, [projectSessions]);

  // Daily data — last 30 days
  const dailyData = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({ date: d, hours: 0, earnings: 0 });
    }
    projectSessions.forEach((s) => {
      const d = sessionDate(s);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - d) / 86400000);
      if (diffDays >= 0 && diffDays < 30) {
        const day = days[29 - diffDays];
        day.hours += sessionHours(s);
        day.earnings += sessionEarnings(s);
      }
    });
    return days.map((d) => ({
      label: formatDateShort(d.date),
      hours: Number(d.hours.toFixed(2)),
      earnings: Number(d.earnings.toFixed(2)),
    }));
  }, [projectSessions]);

  // Weekly data — last 12 weeks
  const weeklyData = useMemo(() => {
    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Find Monday of current week
    const dayOfWeek = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);

    for (let i = 11; i >= 0; i--) {
      const start = new Date(monday);
      start.setDate(monday.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      weeks.push({ start, end, hours: 0, earnings: 0 });
    }
    projectSessions.forEach((s) => {
      const d = sessionDate(s);
      weeks.forEach((w) => {
        if (d >= w.start && d < w.end) {
          w.hours += sessionHours(s);
          w.earnings += sessionEarnings(s);
        }
      });
    });
    return weeks.map((w) => ({
      label: formatDateShort(w.start),
      hours: Number(w.hours.toFixed(2)),
      earnings: Number(w.earnings.toFixed(2)),
    }));
  }, [projectSessions]);

  // Hourly distribution — 0..23
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}h`,
      sessions: 0,
      hoursWorked: 0,
    }));
    projectSessions.forEach((s) => {
      const d = sessionDate(s);
      const h = d.getHours();
      hours[h].sessions += 1;
      hours[h].hoursWorked += sessionHours(s);
    });
    return hours.map((h) => ({
      ...h,
      hoursWorked: Number(h.hoursWorked.toFixed(2)),
    }));
  }, [projectSessions]);

  // ---------- Exports ----------
  const exportCSV = () => {
    if (!selectedProject) return;
    const rows = [
      ['Proyecto', selectedProject.name],
      ['Tarifa €/h', selectedProject.rate],
      ['Total horas', stats.totalHours.toFixed(2)],
      ['Total ganado €', stats.totalEarnings.toFixed(2)],
      ['Sesiones', stats.sessionCount],
      [],
      ['Fecha inicio', 'Fecha fin', 'Duración (h)', 'Ganado (€)', 'Notas'],
      ...projectSessions.map((s) => [
        s.start_time ? new Date(s.start_time).toISOString() : '',
        s.end_time ? new Date(s.end_time).toISOString() : '',
        sessionHours(s).toFixed(2),
        sessionEarnings(s).toFixed(2),
        (s.notes || '').replace(/[\r\n,;]+/g, ' '),
      ]),
    ];

    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const str = String(cell ?? '');
            return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timely_${selectedProject.name.replace(/[^a-z0-9]/gi, '_')}_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'CSV exportado');
  };

  const exportPDF = async () => {
    if (!selectedProject) return;
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      // Header
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Timely · Informe de proyecto', margin, 16);
      y = 35;

      // Title
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(22);
      pdf.text(selectedProject.name, margin, y);
      y += 7;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')} · Tarifa: €${selectedProject.rate}/h`,
        margin,
        y
      );
      y += 10;

      // Stats box
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, 'FD');
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');

      const colW = (pageWidth - margin * 2) / 4;
      const statBoxes = [
        ['HORAS TOTALES', `${stats.totalHours.toFixed(1)}h`],
        ['INGRESOS', formatEUR(stats.totalEarnings)],
        ['SESIONES', String(stats.sessionCount)],
        ['MEDIA/SESIÓN', `${stats.avgSessionMin.toFixed(0)} min`],
      ];
      statBoxes.forEach(([label, value], i) => {
        const x = margin + colW * i + 5;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(label, x, y + 10);
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.text(value, x, y + 22);
      });
      y += 45;

      // Charts — capture each ref
      const chartsToCapture = [
        { ref: dailyChartRef, title: 'Horas por día (últimos 30 días)' },
        { ref: weeklyChartRef, title: 'Ingresos por semana (últimas 12 semanas)' },
        { ref: hourlyChartRef, title: 'Distribución por hora del día' },
      ];

      for (const { ref, title } of chartsToCapture) {
        if (!ref.current) continue;
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (y + imgHeight + 15 > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text(title, margin, y);
        y += 5;
        pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      }

      // Sessions table — new page
      pdf.addPage();
      y = margin;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('Detalle de sesiones', margin, y);
      y += 8;

      pdf.setFontSize(8);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fecha', margin + 2, y + 5);
      pdf.text('Duración', margin + 70, y + 5);
      pdf.text('Ganado', margin + 110, y + 5);
      y += 9;

      pdf.setFont('helvetica', 'normal');
      const sortedSessions = [...projectSessions].sort(
        (a, b) => sessionDate(b) - sessionDate(a)
      );
      for (const s of sortedSessions) {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        const dateStr = formatDate(s.start_time || s.created_at);
        const hours = sessionHours(s);
        const dur = `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}min`;
        pdf.text(dateStr, margin + 2, y);
        pdf.text(dur, margin + 70, y);
        pdf.text(formatEUR(sessionEarnings(s)), margin + 110, y);
        y += 5;
      }

      pdf.save(
        `timely_${selectedProject.name.replace(/[^a-z0-9]/gi, '_')}_${
          new Date().toISOString().split('T')[0]
        }.pdf`
      );
      showToast('success', 'PDF exportado');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('error', 'No se pudo exportar el PDF');
    } finally {
      setExporting(false);
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Cargando…</span>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <>
      <Head>
        <title>Mis proyectos · Timely</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">⏱</span>
              </div>
              <span className="font-bold text-xl text-slate-900">Timely</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/dashboard"
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="px-3 sm:px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg font-semibold"
              >
                Mis proyectos
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                Salir
              </button>
            </div>
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Mis proyectos</h1>
            <p className="text-slate-500 mt-1">
              Análisis detallado, estadísticas y exportación de cada proyecto.
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <p className="text-slate-500 mb-4">Aún no tienes proyectos.</p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Crear el primero
              </Link>
            </div>
          ) : (
            <>
              {/* Project selector + actions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="grid lg:grid-cols-[1fr_auto_auto] gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Proyecto a analizar
                    </label>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-slate-900 transition"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · €{p.rate}/h
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={exportCSV}
                    disabled={!selectedProject || projectSessions.length === 0}
                    className="px-5 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    ↓ Exportar CSV
                  </button>
                  <button
                    onClick={exportPDF}
                    disabled={!selectedProject || projectSessions.length === 0 || exporting}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap relative"
                  >
                    {exporting ? 'Generando…' : (
                      <>
                        {!isPro && <span className="mr-1">🔒</span>}
                        ↓ Exportar PDF
                      </>
                    )}
                  </button>
                </div>
              </div>

              {selectedProject && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <StatCard label="Horas totales" value={formatHours(stats.totalHours)} />
                    <StatCard
                      label="Ingresos"
                      value={formatEUR(stats.totalEarnings)}
                      accent="emerald"
                    />
                    <StatCard label="Sesiones" value={String(stats.sessionCount)} />
                    <StatCard
                      label="Media/sesión"
                      value={`${stats.avgSessionMin.toFixed(0)} min`}
                    />
                    <StatCard label="Tarifa" value={`€${selectedProject.rate}/h`} />
                    <StatCard
                      label="Tarifa efectiva"
                      value={`€${stats.effectiveRate.toFixed(2)}/h`}
                    />
                    <StatCard
                      label="Primera sesión"
                      value={
                        stats.firstSession
                          ? new Date(
                              stats.firstSession.start_time || stats.firstSession.created_at
                            ).toLocaleDateString('es-ES')
                          : '—'
                      }
                      small
                    />
                    <StatCard
                      label="Última sesión"
                      value={
                        stats.lastSession
                          ? new Date(
                              stats.lastSession.start_time || stats.lastSession.created_at
                            ).toLocaleDateString('es-ES')
                          : '—'
                      }
                      small
                    />
                  </div>

                  {projectSessions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                      <p className="text-slate-500">
                        Este proyecto aún no tiene sesiones. Empieza el cronómetro desde el
                        Dashboard.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Daily chart */}
                      <ChartCard
                        title="Horas por día"
                        subtitle="Últimos 30 días"
                        chartRef={dailyChartRef}
                      >
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              interval={2}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                              formatter={(v) => [`${v}h`, 'Horas']}
                            />
                            <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      {/* Weekly chart */}
                      <ChartCard
                        title="Ingresos por semana"
                        subtitle="Últimas 12 semanas"
                        chartRef={weeklyChartRef}
                      >
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                              formatter={(v) => [formatEUR(v), 'Ingresos']}
                            />
                            <Line
                              type="monotone"
                              dataKey="earnings"
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={{ fill: '#10b981', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      {/* Hourly chart */}
                      <ChartCard
                        title="Distribución por hora del día"
                        subtitle="Cuándo sueles trabajar"
                        chartRef={hourlyChartRef}
                      >
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                              dataKey="hour"
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              interval={1}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                              formatter={(v) => [`${v}h`, 'Horas trabajadas']}
                            />
                            <Bar
                              dataKey="hoursWorked"
                              fill="#8b5cf6"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      {/* Sessions table */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                          <h2 className="text-xl font-bold text-slate-900">
                            Detalle de sesiones
                          </h2>
                          <p className="text-sm text-slate-500 mt-1">
                            {projectSessions.length} sesiones registradas
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                              <tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Inicio</th>
                                <th className="px-6 py-3">Fin</th>
                                <th className="px-6 py-3 text-right">Duración</th>
                                <th className="px-6 py-3 text-right">Ganado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {[...projectSessions]
                                .sort((a, b) => sessionDate(b) - sessionDate(a))
                                .map((s) => {
                                  const start = s.start_time
                                    ? new Date(s.start_time)
                                    : new Date(s.created_at);
                                  const end = s.end_time ? new Date(s.end_time) : null;
                                  const hours = sessionHours(s);
                                  return (
                                    <tr key={s.id} className="hover:bg-slate-50/50">
                                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                                        {start.toLocaleDateString('es-ES')}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-slate-600 tabular-nums">
                                        {start.toLocaleTimeString('es-ES', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-slate-600 tabular-nums">
                                        {end
                                          ? end.toLocaleTimeString('es-ES', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })
                                          : '—'}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-slate-700 text-right tabular-nums font-semibold">
                                        {Math.floor(hours)}h {Math.round((hours % 1) * 60)}min
                                      </td>
                                      <td className="px-6 py-3 text-sm text-emerald-600 text-right tabular-nums font-bold">
                                        {formatEUR(sessionEarnings(s))}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg font-semibold text-sm ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Upgrade modal */}
        {showUpgradeModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="font-bold text-2xl text-slate-900 mb-2">
                  Exportar PDF es Pro
                </h3>
                <p className="text-sm text-slate-600">
                  Genera informes profesionales con gráficos y tabla detallada de sesiones, listos para enviar a tus clientes.
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  PDF profesional con gráficos
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  Proyectos ilimitados
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  Histórico completo
                </li>
              </ul>

              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-slate-900">14,99 €<span className="text-base font-normal text-slate-500">/mes</span></p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Ahora no
                </button>
                <button
                  onClick={async () => {
                    setShowUpgradeModal(false);
                    try {
                      const { data: sessionData } = await supabase.auth.getSession();
                      const res = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${sessionData.session.access_token}`,
                        },
                      });
                      const json = await res.json();
                      if (json.url) window.location.href = json.url;
                    } catch (e) {
                      showToast('error', 'Error abriendo checkout');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Subcomponents ----------
function StatCard({ label, value, accent, small }) {
  const valueColor =
    accent === 'emerald' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p
        className={`${
          small ? 'text-base' : 'text-2xl'
        } font-bold mt-2 tabular-nums ${valueColor}`}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, subtitle, chartRef, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div ref={chartRef} className="bg-white">
        {children}
      </div>
    </div>
  );
}
