import type { MainDashboardProps } from '../../types'
import { Plus, ArrowUpRight, LogOut } from 'lucide-react';

export default function MainDashboard({ events, setCurrentEvent, newEventTitle, setNewEventTitle, newEventDate, setNewEventDate, initialCount, setInitialCount, newEventLocation, setNewEventLocation, handleCreateEvent, handleLogout }: MainDashboardProps) {
  return (
    <div className="w-full min-h-screen bg-white text-black font-sans flex flex-col selection:bg-black selection:text-white">
      {/* TOPBAR */}
      <header className="w-full border-b border-black px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-sm tracking-widest uppercase font-bold">SYSTEM // EVENT MANAGER</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full flex-1 px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LIST OF EVENTS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border-b border-black pb-4">
            <h1 className="text-3xl font-light tracking-tight">Існуючі події</h1>
            <p className="text-xs font-mono text-neutral-500 mt-1 uppercase">Оберіть подію для переходу до CRM та генерації QR</p>
          </div>

          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="p-8 border border-dashed border-black text-center text-sm font-mono text-neutral-500">
                НЕМАЄ СТВОРЕНИХ ПОДІЙ. СТВОРЬТЕ ПЕРШУ СПРАВУ ЛІВОРУЧ.
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setCurrentEvent(ev)}
                  className="group border border-black p-6 hover:bg-black hover:text-white transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-mono opacity-60 uppercase">ID: {ev.id} // {new Intl.DateTimeFormat('uk-UA').format(new Date(ev.date))}</div>
                    <div className="text-xl font-medium mt-1">{ev.name}</div>
                    <div className="text-xs font-mono mt-2 opacity-85">ЛОКАЦІЯ: {ev.location}</div>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-xs uppercase tracking-wider border border-current px-4 py-2 group-hover:bg-white group-hover:text-black transition">
                    <span>Відкрити CRM</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CREATE EVENT FORM */}
        <div className="lg:col-span-5 border-l border-black pl-0 lg:pl-12 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-black pb-4">
              <h2 className="text-xl font-light tracking-tight">Створити нову подію</h2>
              <p className="text-xs font-mono text-neutral-500 mt-1 uppercase">Ініціалізація бази даних квитків</p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase mb-2">Назва події</label>
                <input
                  type="text"
                  required
                  placeholder="Наприклад: Закритий форум 2026"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full border border-black px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase mb-2">Дата проведення</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full border border-black px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase mb-2">Початкова кількість QR</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={initialCount}
                    onChange={(e) => setInitialCount(Number(e.target.value))}
                    className="w-full border border-black px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-2">Локація / Адреса</label>
                <input
                  type="text"
                  placeholder="Місто, локація"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full border border-black px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-black text-white text-xs font-mono uppercase tracking-widest hover:bg-neutral-800 transition cursor-pointer mt-4 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ініціювати подію та згенерувати базу</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-4 bg-white text-red-600 border border-red-600 text-xs font-mono uppercase tracking-widest hover:bg-red-600 hover:text-white transition cursor-pointer mt-4 flex items-center justify-center space-x-2 "
              >
                <LogOut className="w-4 h-4" />
                <span>ВИЙТИ</span>
              </button>

            </form>
          </div>
        </div>
      </main>
    </div>
  )
}