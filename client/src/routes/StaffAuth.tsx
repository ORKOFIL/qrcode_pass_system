import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, KeyRound, User, AlertCircle, ArrowLeft, LogIn } from 'lucide-react';
import { setMemoryAccessToken } from '../api/axios';

export function StaffLogin() {
  const navigate = useNavigate();

  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`http://localhost:3000/auth/staff`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json()
      if (data.status === 400 || data.status === 500) {
        setError('Невірний логін або пароль');
      } else {
        console.log(data.accessToken)
        setMemoryAccessToken(data.accessToken)
        console.log('Успішний вхід:', data);
        navigate('/auth/staff/success')
      }
    } catch (err: any) {
      console.error('Помилка входу:', err);
      setError(err.response?.data?.message || 'Помилка сервера');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col justify-between p-6 sm:p-12">
      {/* TOP HEADER STATUS BAR */}
      <header className="w-full flex items-center justify-between border-b border-black pb-4 font-mono text-xs uppercase tracking-widest">
        <span>SYSTEM // AUTHENTICATION</span>
        <span className="opacity-50">PORTAL: STAFF</span>
      </header>

      {/* CENTERED CONTENT */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="w-full border border-black p-8 sm:p-10 bg-white space-y-8 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

          {/* TITLE & DESCRIPTION */}
          <div className="text-center space-y-2 border-b border-black pb-6">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black">
              Вхід
            </h1>
            <p className="text-xs font-mono text-neutral-500 uppercase pt-1">
              Введіть логін та пароль доступу
            </p>
          </div>

          {/* ERROR NOTIFICATION */}
          {error && (
            <div className="p-3 font-mono text-xs text-center border border-red-600 bg-red-50 text-red-600 uppercase tracking-wider flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* ПОЛЕ ЛОГІНА */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600">
                Логін
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="Введіть логін..."
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full border border-black pl-10 pr-4 py-3 text-sm font-mono tracking-wide focus:outline-none focus:ring-1 focus:ring-black bg-white"
                />
              </div>
            </div>

            {/* ПОЛЕ ПАРОЛЯ */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600">
                Пароль
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 absolute left-3 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="Введіть пароль..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black pl-10 pr-4 py-3 text-sm font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-black bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-black text-white text-xs font-mono uppercase tracking-widest hover:bg-neutral-800 active:translate-y-0.5 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ПЕРЕВІРКА...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>УВІЙТИ В СИСТЕМУ</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* FOOTER WITH BACK NAVIGATION */}
      <footer className="w-full flex justify-center items-center pt-8 border-t border-neutral-200">
        <button
          onClick={() => navigate(-1)}
          className="text-[11px] font-mono text-neutral-400 hover:text-black transition-colors uppercase tracking-widest flex items-center space-x-1.5 group py-1 cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3 group-hover:text-black" />
          <span>Назад до валідації</span>
        </button>
      </footer>
    </div>
  );
}