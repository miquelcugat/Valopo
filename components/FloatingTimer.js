import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Square, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function FloatingTimer() {
  const router = useRouter();
  const [timerData, setTimerData] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [project, setProject] = useState(null);
  const [stopping, setStopping] = useState(false);
  const tickRef = useRef(null);

  // Don't show on dashboard (has its own timer)
  const isDashboard = router.pathname === '/dashboard';

  // Read localStorage + keep checking for changes
  useEffect(() => {
    const readTimer = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('timely_timer') || 'null');
        if (saved && saved.startedAt) {
          setTimerData(saved);
        } else {
          setTimerData(null);
        }
      } catch {
        setTimerData(null);
      }
    };

    readTimer();

    // Poll every second to detect changes from other pages
    const interval = setInterval(readTimer, 1000);
    // Listen for storage events (changes from other tabs)
    window.addEventListener('storage', readTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', readTimer);
    };
  }, []);

  // Tick timer
  useEffect(() => {
    if (!timerData) {
      setSeconds(0);
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }

    const updateSeconds = () => {
      const now = Math.floor(Date.now() / 1000);
      setSeconds(now - timerData.startedAt);
    };
    updateSeconds();
    tickRef.current = setInterval(updateSeconds, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [timerData]);

  // Fetch project info
  useEffect(() => {
    if (!timerData?.projectId) {
      setProject(null);
      return;
    }

    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, rate, billing_type, fixed_price')
        .eq('id', timerData.projectId)
        .maybeSingle();
      if (mounted) setProject(data);
    })();

    return () => { mounted = false; };
  }, [timerData?.projectId]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const stopTimer = async () => {
    if (!timerData || stopping) return;
    setStopping(true);

    try {
      const duration = Math.floor(Date.now() / 1000) - timerData.startedAt;
      if (duration < 1) {
        localStorage.removeItem('timely_timer');
        setTimerData(null);
        setStopping(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStopping(false);
        return;
      }

      const isFixed = project?.billing_type === 'fixed';
      const earned = isFixed ? 0 : (duration / 3600) * (project?.rate || 0);
      const endedAt = Math.floor(Date.now() / 1000);

      await supabase.from('sessions').insert([
        {
          user_id: session.user.id,
          project_id: timerData.projectId,
          duration_seconds: duration,
          earned: Number(earned.toFixed(2)),
          start_time: new Date(timerData.startedAt * 1000).toISOString(),
          end_time: new Date(endedAt * 1000).toISOString(),
          notes: null,
        },
      ]);

      localStorage.removeItem('timely_timer');
      setTimerData(null);

      // Navigate to dashboard to see the saved session
      if (router.pathname !== '/dashboard') {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
    } finally {
      setStopping(false);
    }
  };

  if (!timerData || isDashboard) return null;

  const projectName = project?.name || 'Cargando…';

  return (
    <div className="fixed z-40 bottom-24 right-4 md:bottom-6 md:right-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white border-2 border-blue-600 rounded-2xl shadow-xl p-3 flex items-center gap-3 max-w-xs">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 flex items-center gap-2.5 text-left min-w-0"
          title="Ver dashboard"
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide leading-none mb-1">
              Cronómetro
            </p>
            <p className="text-lg font-bold text-slate-900 tabular-nums leading-none mb-0.5">
              {formatTime(seconds)}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {projectName}
            </p>
          </div>
        </button>
        <button
          onClick={stopTimer}
          disabled={stopping}
          className="flex-shrink-0 w-10 h-10 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl flex items-center justify-center transition disabled:opacity-60"
          title="Parar y guardar"
        >
          <Square className="w-4 h-4" strokeWidth={3} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
