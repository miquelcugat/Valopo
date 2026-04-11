import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
      loadData(data.session.user.id);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const loadData = async (userId) => {
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setProjects(projectsData || []);
      setSessions(sessionsData || []);
      if (projectsData?.length > 0) {
        setActiveProject(projectsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startSession = async () => {
    if (!activeProject) {
      alert('Selecciona un proyecto primero');
      return;
    }
    setIsRunning(true);
  };

  const stopSession = async () => {
    if (!isRunning) return;
    setIsRunning(false);

    try {
      await supabase.from('sessions').insert([
        {
          user_id: user.id,
          project_id: activeProject,
          start_time: Math.floor(Date.now() / 1000) - timerSeconds,
          end_time: Math.floor(Date.now() / 1000),
        }
      ]);
      setTimerSeconds(0);
      loadData(user.id);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const addProject = async () => {
    if (!newProjectName || !newProjectRate) return;

    try {
      const { data } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name: newProjectName,
            rate: parseFloat(newProjectRate),
          }
        ])
        .select();

      if (data?.[0]) {
        setActiveProject(data[0].id);
      }
      setNewProjectName('');
      setNewProjectRate('');
      loadData(user.id);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  // Calcular estadísticas
  const weekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });

  const weekHours = weekSessions.reduce((sum, s) => sum + (s.end_time - s.start_time) / 3600, 0);
  const weekEarnings = weekSessions.reduce((sum, s) => {
    const project = projects.find(p => p.id === s.project_id);
    const duration = (s.end_time - s.start_time) / 3600;
    return sum + duration * (project?.rate || 0);
  }, 0);

  const currentProject = projects.find(p => p.id === activeProject);
  const currentEarnings = (timerSeconds / 3600) * (currentProject?.rate || 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <>
      <Head>
        <title>Dashboard - Timely</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⏱</span>
              </div>
              <span className="font-bold text-xl">Timely</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  router.push('/');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Salir
              </button>
            </div>
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          {/* Timer Card */}
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {/* Timer Section */}
            <div className="md:col-span-2">
              <div className="bg-blue-50 p-12 rounded-xl">
                {/* Timer Grande */}
                <div className="text-center mb-8">
                  <div className="text-7xl font-bold text-blue-600 font-mono mb-6">
                    {formatTime(timerSeconds)}
                  </div>

                  {/* Selector de Proyecto */}
                  <select
                    value={activeProject || ''}
                    onChange={(e) => setActiveProject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 mb-6 text-center font-semibold"
                  >
                    <option value="">Selecciona proyecto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (€{p.rate}/h)</option>
                    ))}
                  </select>

                  {/* Botones */}
                  {!isRunning ? (
                    <button
                      onClick={startSession}
                      className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition"
                    >
                      ▶ Empezar
                    </button>
                  ) : (
                    <button
                      onClick={stopSession}
                      className="w-full px-6 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition"
                    >
                      ⏹ Parar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-blue-50 p-8 rounded-xl text-center">
              <p className="text-gray-600 text-sm mb-3">En esta sesión ganarás aproximadamente:</p>
              <p className="text-5xl font-bold text-blue-600 mb-6">€{currentEarnings.toFixed(2)}</p>

              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Esta semana: Horas</p>
                  <p className="text-2xl font-bold text-gray-900">{weekHours.toFixed(1)}h</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Esta semana: Ganado</p>
                  <p className="text-2xl font-bold text-green-600">€{weekEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-gray-500 text-xs">Tarifa promedio</p>
                  <p className="text-2xl font-bold text-blue-600">€{weekHours > 0 ? (weekEarnings / weekHours).toFixed(0) : 0}/h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gestiona tus proyectos */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestiona tus proyectos</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <input
                type="text"
                placeholder="Nombre del proyecto"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Tarifa €/hora"
                  value={newProjectRate}
                  onChange={(e) => setNewProjectRate(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
                <button
                  onClick={addProject}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Proyectos List */}
            {projects.map(project => {
              const projectSessions = sessions.filter(s => s.project_id === project.id);
              const hours = projectSessions.reduce((sum, s) => sum + (s.end_time - s.start_time) / 3600, 0);
              const earnings = hours * project.rate;

              return (
                <div key={project.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">{project.name}</h3>
                    <p className="text-gray-600 text-sm">€{project.rate}/h • {hours.toFixed(1)}h • €{earnings.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('¿Borrar este proyecto?')) {
                        supabase.from('projects').delete().eq('id', project.id);
                        loadData(user.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    Borrar
                  </button>
                </div>
              );
            })}
          </div>

          {/* CTA for Premium */}
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Upgrade a Pro</h3>
            <p className="mb-4">€14.99/mes - Proyectos ilimitados, histórico completo</p>
            <button
              onClick={() => router.push('/pricing')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Ver planes
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
