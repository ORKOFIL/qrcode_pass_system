import { AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
    return (
        <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col justify-between p-6 sm:p-12">
            {/* TOP HEADER STATUS BAR */}
            <header className="w-full flex items-center justify-between border-b border-black pb-4 font-mono text-xs uppercase tracking-widest">
                <span>SYSTEM // 404 ERROR</span>
                <span className="opacity-50">STATUS: NOT_FOUND</span>
            </header>

            {/* CENTERED CONTENT */}
            <main className="w-full max-w-lg mx-auto my-auto py-8 flex flex-col items-center">
                <div className="w-full border border-black p-8 sm:p-10 bg-white space-y-8 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">

                    {/* ICON & BADGE */}
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-black text-white mx-auto flex items-center justify-center border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-300 px-2.5 py-1 inline-block">
                            ПОМИЛКА 404
                        </span>
                    </div>

                    {/* MAIN MESSAGE */}
                    <div className="space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black uppercase">
                            Сторінку не знайдено
                        </h1>
                        <p className="text-xs sm:text-sm font-mono text-neutral-600 uppercase tracking-wide leading-relaxed">
                            Запитуваний ресурс не існує, був видалений або шлях введено невірно.
                        </p>
                    </div>
                </div>
            </main>

            {/* SUBTLE FOOTER */}
            <footer className="w-full flex justify-between items-center pt-8 border-t border-neutral-200 font-mono text-xs uppercase tracking-widest text-neutral-400">
                <span>EVENT MANAGEMENT SYSTEM</span>
                <span>404_ERR</span>
            </footer>
        </div>
    );
}