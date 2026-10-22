import { ArrowRight, QrCode, ScanLine, Ticket, UserCog, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
    {
        icon: QrCode,
        title: 'Генерація QR-квитків',
        text: 'Створюйте масиви унікальних QR-кодів для події одним запитом.',
    },
    {
        icon: Ticket,
        title: 'Облік квитків',
        text: 'Статуси «створено / видано / використано» та ПІБ власника квитка.',
    },
    {
        icon: ScanLine,
        title: 'Перевірка на вході',
        text: 'Квиток можна використати лише раз, а контролер працює тільки зі своєю подією.',
    },
];

export function LandingPage() {
    return (
        <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col justify-between">
            {/* TOPBAR */}
            <header className="w-full border-b border-black px-8 py-5 flex items-center justify-between">
                <span className="font-mono text-sm tracking-widest uppercase font-bold">
                    SYSTEM // EVENT MANAGEMENT
                </span>
                <span className="hidden sm:inline font-mono text-xs uppercase opacity-50">QR PASS SYSTEM</span>
            </header>

            <main className="w-full flex-1 flex flex-col">
                {/* HERO */}
                <section className="border-b border-black bg-neutral-50 px-8 py-16 lg:py-24">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="inline-block border border-black px-3 py-1 font-mono text-xs uppercase bg-white">
                            Система QR-квитків
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-light tracking-tight leading-tight">
                            Квитки на події з перевіркою за QR-кодом
                        </h1>
                        <p className="text-sm lg:text-base font-mono text-neutral-600 leading-relaxed max-w-2xl">
                            Організатор створює подію та генерує QR-квитки, видає їх відвідувачам, а контролери
                            на вході скануванням підтверджують вхід. Кожен квиток діє лише один раз.
                        </p>
                    </div>
                </section>

                {/* LOGIN CHOICE */}
                <section className="grid grid-cols-1 md:grid-cols-2 border-b border-black">
                    <Link
                        to="/auth"
                        className="group p-8 lg:p-16 md:border-r border-b md:border-b-0 border-black flex flex-col justify-between gap-10 hover:bg-black hover:text-white transition"
                    >
                        <div className="space-y-4">
                            <UserCog className="w-8 h-8" />
                            <h2 className="text-2xl font-light tracking-tight">Я організатор</h2>
                            <p className="text-xs font-mono uppercase leading-relaxed opacity-70">
                                Створення подій, генерація та видача квитків, додавання контролерів.
                            </p>
                        </div>
                        <span className="font-mono text-xs uppercase font-bold flex items-center gap-2">
                            [Вхід / реєстрація] <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                        </span>
                    </Link>

                    <Link
                        to="/auth/staff"
                        className="group p-8 lg:p-16 flex flex-col justify-between gap-10 hover:bg-black hover:text-white transition"
                    >
                        <div className="space-y-4">
                            <Users className="w-8 h-8" />
                            <h2 className="text-2xl font-light tracking-tight">Я працівник (контролер)</h2>
                            <p className="text-xs font-mono uppercase leading-relaxed opacity-70">
                                Вхід за логіном і паролем від організатора для перевірки квитків на події.
                            </p>
                        </div>
                        <span className="font-mono text-xs uppercase font-bold flex items-center gap-2">
                            [Вхід працівника] <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                        </span>
                    </Link>
                </section>

                {/* FEATURES */}
                <section className="grid grid-cols-1 md:grid-cols-3">
                    {features.map(({ icon: Icon, title, text }, i) => (
                        <div
                            key={title}
                            className={`p-8 lg:p-10 space-y-3 border-black ${i < features.length - 1 ? 'border-b md:border-b-0 md:border-r' : ''}`}
                        >
                            <Icon className="w-5 h-5" />
                            <h3 className="font-mono text-sm uppercase font-bold">{title}</h3>
                            <p className="text-xs font-mono text-neutral-600 leading-relaxed">{text}</p>
                        </div>
                    ))}
                </section>
            </main>

            <footer className="w-full flex justify-between items-center px-8 py-6 border-t border-black font-mono text-xs uppercase tracking-widest text-neutral-400">
                <span>EVENT MANAGEMENT SYSTEM</span>
                <span>QR PASS</span>
            </footer>
        </div>
    );
}
