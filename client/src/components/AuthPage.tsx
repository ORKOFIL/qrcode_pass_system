import { useState, type FormEvent } from 'react';
import { Shield, ArrowRight, CheckCircle2, Lock, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
    onSuccess?: (token: string, user: { email: string; name?: string }) => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');

    // Поля форми
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [orgName, setOrgName] = useState('');

    // Стейт завантаження та помилок
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const payload = mode === 'login'
            ? { email, password }
            : { email, password, fullName, orgName };

        try {
            /* 
              Приклад реального запиту до твоєї Express БД:
              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || 'Помилка авторизації');
              if (onSuccess) onSuccess(data.token, data.user);
            */

            // Демонстраційна затримка
            await new Promise((resolve) => setTimeout(resolve, 600));

            if (onSuccess) {
                onSuccess('fake_jwt_token_123', { email, name: fullName || email.split('@')[0] });
            } else {
                navigate('/dashboard'); 
            }
        } catch (err: any) {
            setError(err.message || 'Виникла помилка під час запиту');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col justify-between">
            {/* TOPBAR */}
            <header className="w-full border-b border-black px-8 py-5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm tracking-widest uppercase font-bold">
                        SYSTEM // AUTHORIZATION
                    </span>
                </div>
            </header>

            {/* MAIN TWO-COLUMN LAYOUT */}
            <main className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 border-b border-black">
                {/* LEFT BRANDING COLUMN */}
                <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-black p-8 lg:p-16 flex flex-col justify-between bg-neutral-50">
                    <div className="space-y-6">
                        <div className="inline-block border border-black px-3 py-1 font-mono text-xs uppercase bg-white">
                            Вхід для організаторів
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-light tracking-tight leading-tight">
                            Панель адміністрування та генерації QR
                        </h1>
                        <p className="text-sm font-mono text-neutral-600 leading-relaxed">
                            Централізований модуль обліку квитків, контролю відвідуваності та верифікації паспортних даних у режимі реального часу.
                        </p>
                    </div>

                    <div className="mt-12 space-y-4 font-mono text-xs border-t border-black pt-6">
                        <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                            <span>Миттєва генерація масивів QR-кодів</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                            <span>Швидкий облік "створено / видано / використано"</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                            <span>Фіксація ПІБ та дати народження відвідувачів</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT FORM COLUMN */}
                <div className="lg:col-span-7 p-8 lg:p-16 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full space-y-8">
                        {/* SWITCHER TABS */}
                        <div className="flex border border-black font-mono text-xs uppercase">
                            <button
                                type="button"
                                onClick={() => { setMode('login'); setError(null); }}
                                className={`flex-1 py-3 text-center transition cursor-pointer ${mode === 'login' ? 'bg-black text-white font-bold' : 'hover:bg-neutral-100'
                                    }`}
                            >
                                [Вхід у систему]
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode('register'); setError(null); }}
                                className={`flex-1 py-3 text-center transition border-l border-black cursor-pointer ${mode === 'register' ? 'bg-black text-white font-bold' : 'hover:bg-neutral-100'
                                    }`}
                            >
                                [Реєстрація]
                            </button>
                        </div>

                        {/* FORM TITLE */}
                        <div className="border-b border-black pb-4">
                            <h2 className="text-2xl font-light tracking-tight">
                                {mode === 'login' ? 'Авторизація організатора' : 'Створення нового акаунту'}
                            </h2>
                            <p className="text-xs font-mono text-neutral-500 mt-1 uppercase">
                                {mode === 'login' ? 'Введіть облікові дані для доступу' : 'Заповніть форму для реєстрації в БД'}
                            </p>
                        </div>

                        {/* ERROR ALERT */}
                        {error && (
                            <div className="border border-black p-4 font-mono text-xs bg-neutral-100 text-black flex items-center justify-between">
                                <span>ПОМИЛКА: {error}</span>
                                <button onClick={() => setError(null)} className="font-bold cursor-pointer">[Х]</button>
                            </div>
                        )}

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {mode === 'register' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-mono uppercase mb-2 font-bold">
                                            ПІБ Організатора
                                        </label>
                                        <div className="relative">
                                            <User className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" />
                                            <input
                                                type="text"
                                                required
                                                placeholder="Наприклад: Наконечний Орест Андрійович"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full border border-black pl-10 pr-4 py-3 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-black"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase mb-2 font-bold">
                                            Назва організації / Компанії
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Наприклад: Event Management Group"
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            className="w-full border border-black px-4 py-3 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-black"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-mono uppercase mb-2 font-bold">
                                    Робочий Email
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="organizer@domain.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-black pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase mb-2 font-bold">
                                    Пароль
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border border-black pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-black text-white text-xs font-mono uppercase tracking-widest hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center space-x-2 font-bold disabled:opacity-50 mt-6"
                            >
                                <span>{loading ? 'ОБРОБКА...' : mode === 'login' ? 'УВІЙТИ В СИСТЕМУ' : 'ЗАРЕЄСТРУВАТИ В БД'}</span>
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="w-full px-8 py-4 font-mono text-xs text-neutral-500 flex justify-between items-center bg-white">
                <span>SYS.EVENT // AUTH PROTOCOL</span>
                <span>EXPRESS + REACT INTEGRATION</span>
            </footer>
        </div>
    );
}