
import { ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios'
import { setMemoryAccessToken } from '../api/axios';

export function StaffSuccessPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.error('Помилка при логауті', err);
      } finally {
        setMemoryAccessToken(null);
        navigate('/auth/staff');
      }
    };

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col justify-between p-6 sm:p-12">
      {/* TOP HEADER STATUS BAR */}
      <header className="w-full flex items-center justify-between border-b border-black pb-4 font-mono text-xs uppercase tracking-widest">
        <span>SYSTEM // STAFF DASHBOARD</span>
        <span className="opacity-50">STATUS: ONLINE</span>
      </header>

      {/* CENTERED CONTENT */}
      <main className="w-full max-w-lg mx-auto my-auto py-8 flex flex-col items-center">
        <div className="w-full border border-black p-8 sm:p-10 bg-white space-y-8 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">

          {/* SUCCESS ICON & BADGE */}
          <div className="space-y-4">
            <div className="w-16 h-16 bg-black text-white mx-auto flex items-center justify-center border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-300 px-2.5 py-1 inline-block">
              ДОСТУП НАДАНО
            </span>
          </div>

          {/* MAIN MESSAGE */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black uppercase">
              Успішно авторизовано!
            </h1>
            <p className="text-xs sm:text-sm font-mono text-neutral-600 uppercase tracking-wide leading-relaxed">
              Можете переходити до сканування квитків та перевірки на вході.
            </p>
          </div>
        </div>
      </main>

      {/* SUBTLE FOOTER WITH LOGOUT */}
      <footer className="w-full flex justify-between items-center pt-8 border-t border-neutral-200 font-mono text-xs uppercase tracking-widest text-neutral-400">
        <span>EVENT MANAGEMENT SYSTEM</span>
        <button
          onClick={handleLogout}
          className="hover:text-black transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Вийти</span>
        </button>
      </footer>
    </div>
  );
}