import React from 'react';
import { useState} from 'react';
import type { FormEvent } from 'react';
import { 
  QrCode, 
  LayoutDashboard, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Search, 
  Plus, 
  ArrowLeft, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

// Типи
type StatusType = 'створено' | 'видано' | 'використано';
type TabType = 'dashboard' | 'qr-manager';

interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  totalGenerated: number;
}

interface QrItem {
  id: string;
  eventId: string;
  code: string;
  status: StatusType;
  fullName: string;
  birthDate: string;
  createdAt: string;
}

export default function OrganizerDashboard() {
  // Список івентів та поточний вибраний івент (null якщо на головній виборі подій)
  const [events, setEvents] = useState<EventItem[]>([
    { id: 'ev_1', title: 'Tech Conference Lviv 2026', date: '2026-11-15', location: 'Lviv Arena', totalGenerated: 150 }
  ]);
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null);

  // Форма створення нового івенту
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [initialCount, setInitialCount] = useState(50);

  // Навігація всередині івенту
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Список QR-кодів для всіх івентів
  const [qrList, setQrList] = useState<QrItem[]>([
    { 
      id: 'qr_1', 
      eventId: 'ev_1',
      code: 'EVT-2026-001', 
      status: 'видано', 
      fullName: 'Наконечний Орест Андрійович', 
      birthDate: '14.05.2004',
      createdAt: '2026-10-11 10:00'
    },
    { 
      id: 'qr_2', 
      eventId: 'ev_1',
      code: 'EVT-2026-002', 
      status: 'використано', 
      fullName: 'Шевченко Тарас Григорович', 
      birthDate: '09.03.1814',
      createdAt: '2026-10-11 10:05'
    },
    { 
      id: 'qr_3', 
      eventId: 'ev_1',
      code: 'EVT-2026-003', 
      status: 'створено', 
      fullName: '', 
      birthDate: '',
      createdAt: '2026-10-11 10:10'
    },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [generateCount, setGenerateCount] = useState<number>(10);

  // Модальне вікно паспортних даних
  const [modalItem, setModalItem] = useState<QrItem | null>(null);
  const [tempFullName, setTempFullName] = useState<string>('');
  const [tempBirthDate, setTempBirthDate] = useState<string>('');

  // Створення нового івенту (POST /api/events)
  const handleCreateEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    const newId = 'ev_' + Date.now();
    const createdEvent: EventItem = {
      id: newId,
      title: newEventTitle,
      date: newEventDate || '2026-12-01',
      location: newEventLocation || 'Main Hall',
      totalGenerated: initialCount
    };

    setEvents([...events, createdEvent]);
    
    // Генеруємо початкові QR коди для цього івенту
    const generatedQrs: QrItem[] = Array.from({ length: initialCount }, (_, index) => ({
      id: 'qr_' + Date.now() + '_' + index,
      eventId: newId,
      code: `EVT-${newId.slice(-4)}-${String(index + 1).padStart(3, '0')}`,
      status: 'створено',
      fullName: '',
      birthDate: '',
      createdAt: new Date().toISOString()
    }));

    setQrList([...qrList, ...generatedQrs]);
    setCurrentEvent(createdEvent);

    // Очистка форми
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventLocation('');
  };

  // Фільтрація QR кодів для поточного івенту
  const currentEventQrList = currentEvent 
    ? qrList.filter(q => q.eventId === currentEvent.id)
    : [];

  // Статистика для поточного івенту
  const stats = {
    totalGenerated: currentEventQrList.length,
    issued: currentEventQrList.filter(q => q.status === 'видано' || q.status === 'використано').length,
    authorized: currentEventQrList.filter(q => q.status === 'використано').length,
    notCame: currentEventQrList.filter(q => q.status === 'видано').length, // видані, але ще не використані на вході
  };

  // Генерація додаткових кодів
  const handleGenerateMore = (e: FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;

    const newQrs: QrItem[] = Array.from({ length: generateCount }, (_, index) => ({
      id: 'qr_' + Date.now() + '_' + index,
      eventId: currentEvent.id,
      code: `EVT-${currentEvent.id.slice(-4)}-${Date.now().toString().slice(-4)}_${index}`,
      status: 'створено',
      fullName: '',
      birthDate: '',
      createdAt: new Date().toISOString()
    }));

    setQrList([...qrList, ...newQrs]);
    alert(`Згенеровано ${generateCount} нових QR-кодів для івенту "${currentEvent.title}".`);
  };

  // Зміна статусу QR
  const handleStatusChange = (id: string, newStatus: StatusType) => {
    if (newStatus === 'видано') {
      const item = qrList.find(q => q.id === id);
      if (item) {
        setModalItem(item);
        setTempFullName(item.fullName || '');
        setTempBirthDate(item.birthDate || '');
      }
    } else {
      setQrList(qrList.map(q => q.id === id ? { ...q, status: newStatus, fullName: '', birthDate: '' } : q));
    }
  };

  // Збереження паспортних даних
  const savePassportData = () => {
    if (!modalItem) return;
    setQrList(qrList.map(q => q.id === modalItem.id ? { 
      ...q, 
      status: 'видано', 
      fullName: tempFullName, 
      birthDate: tempBirthDate 
    } : q));
    setModalItem(null);
  };

  const filteredQrList = currentEventQrList.filter(q => 
    q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ================= VIEW 1: SELECT OR CREATE EVENT =================
  if (!currentEvent) {
    return (
      <div className="w-full min-h-screen bg-white text-black font-sans flex flex-col selection:bg-black selection:text-white">
        {/* TOPBAR */}
        <header className="w-full border-b border-black px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm tracking-widest uppercase font-bold">SYSTEM // EVENT MANAGER</span>
          </div>
          <div className="text-xs font-mono tracking-wider uppercase border border-black px-3 py-1">
            ДЕРЖАВНИЙ КОНТРОЛЬ ДОСТУПУ
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
                      <div className="text-xs font-mono opacity-60 uppercase">ID: {ev.id} // {ev.date}</div>
                      <div className="text-xl font-medium mt-1">{ev.title}</div>
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
                      max={5000}
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
              </form>
            </div>

            <div className="mt-8 border-t border-black pt-4 text-xs font-mono text-neutral-500">
              Ексклюзивна система контролю. Усі дані пишуться локально в базу даних Express.
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ================= VIEW 2: EVENT DASHBOARD & QR MANAGER =================
  return (
    <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col">
      {/* HEADER WITH TABS */}
      <header className="w-full border-b border-black bg-white sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setCurrentEvent(null)}
            className="flex items-center space-x-2 border border-black px-3 py-1.5 text-xs font-mono uppercase hover:bg-black hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Всі події</span>
          </button>

          <div className="flex items-center space-x-3 border-l border-black pl-6">
            <span className="font-mono text-xs uppercase bg-black text-white px-2 py-1">АКТИВНИЙ ІВЕНТ</span>
            <span className="font-medium text-sm">{currentEvent.title}</span>
          </div>

          <nav className="flex space-x-1 border-l border-black pl-6">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all flex items-center space-x-2 font-mono ${activeTab === 'dashboard' ? 'bg-black text-white' : 'border border-transparent hover:border-black'}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>CRM Аналітика</span>
            </button>
            <button 
              onClick={() => setActiveTab('qr-manager')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all flex items-center space-x-2 font-mono ${activeTab === 'qr-manager' ? 'bg-black text-white' : 'border border-transparent hover:border-black'}`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Реєстр QR ({currentEventQrList.length})</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <span className="uppercase">БАЗА: ONLINE</span>
          <span className="w-2.5 h-2.5 bg-black rounded-full"></span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full flex-1 p-8">
        {activeTab === 'dashboard' ? (
          /* CRM DASHBOARD */
          <div className="space-y-8">
            <div className="border-b border-black pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-light tracking-tight">Операційна аналітика</h1>
                <p className="text-xs font-mono text-neutral-500 mt-1 uppercase">МОНІТОРИНГ АВТОРИЗАЦІЙ ТА ВІДВІДУВАНОСТІ В РЕАЛЬНОМУ ЧАСІ</p>
              </div>
              <div className="text-xs font-mono border border-black px-4 py-2 bg-neutral-50">
                ЛОКАЦІЯ: {currentEvent.location} // ДАТА: {currentEvent.date}
              </div>
            </div>

            {/* METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-black p-6 bg-white relative">
                <div className="text-xs font-mono uppercase text-neutral-500">Всього згенеровано</div>
                <div className="text-5xl font-light mt-4 font-mono">{stats.totalGenerated}</div>
                <div className="mt-4 text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-3 flex justify-between">
                  <span>Статус ліміту</span>
                  <span className="text-black font-bold">100%</span>
                </div>
              </div>

              <div className="border border-black p-6 bg-white relative">
                <div className="text-xs font-mono uppercase text-neutral-500">Видано квитків (з паспортом)</div>
                <div className="text-5xl font-light mt-4 font-mono">{stats.issued}</div>
                <div className="mt-4 text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-3 flex justify-between">
                  <span>Частка від загальних</span>
                  <span className="text-black font-bold">{stats.totalGenerated ? Math.round((stats.issued / stats.totalGenerated) * 100) : 0}%</span>
                </div>
              </div>

              <div className="border border-black p-6 bg-white relative">
                <div className="text-xs font-mono uppercase text-black font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Авторизовано (Прийшли)</span>
                </div>
                <div className="text-5xl font-light mt-4 font-mono">{stats.authorized}</div>
                <div className="mt-4 text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-3 flex justify-between">
                  <span>Явка від виданих</span>
                  <span className="text-black font-bold">{stats.issued ? Math.round((stats.authorized / stats.issued) * 100) : 0}%</span>
                </div>
              </div>

              <div className="border border-black p-6 bg-white relative">
                <div className="text-xs font-mono uppercase text-neutral-600 flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>Не прийшли (Пропуск)</span>
                </div>
                <div className="text-5xl font-light mt-4 font-mono">{stats.notCame}</div>
                <div className="mt-4 text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-3 flex justify-between">
                  <span>Очікується / Не з'явились</span>
                  <span className="text-black font-bold">{stats.notCame} осіб</span>
                </div>
              </div>
            </div>

            {/* LOWER SECTION: LOGS & QUICK GENERATOR */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              <div className="lg:col-span-2 border border-black p-6 bg-white">
                <h3 className="text-sm font-mono uppercase tracking-wider mb-4 border-b border-black pb-2">Останні успішні авторизації на вході</h3>
                <div className="space-y-3 font-mono text-xs">
                  {currentEventQrList.filter(q => q.status === 'використано').length === 0 ? (
                    <div className="text-neutral-500 py-4 italic">Ще жоден код не було використано на контролі.</div>
                  ) : (
                    currentEventQrList.filter(q => q.status === 'використано').map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-neutral-300 bg-neutral-50">
                        <div className="flex items-center space-x-4">
                          <span className="font-bold">{item.code}</span>
                          <span className="text-neutral-700">{item.fullName} ({item.birthDate})</span>
                        </div>
                        <span className="border border-black px-2 py-0.5 text-[10px] uppercase bg-black text-white">Успішно пройдено</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-black p-6 bg-white flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider mb-2 border-b border-black pb-2">Додати квитки</h3>
                  <p className="text-xs font-mono text-neutral-500 mb-4">Згенерувати додаткову партію кодів для цього івенту.</p>
                </div>
                <form onSubmit={handleGenerateMore} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase mb-1">Кількість нових QR</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={500}
                      value={generateCount}
                      onChange={(e) => setGenerateCount(Number(e.target.value))}
                      className="w-full border border-black px-3 py-2 text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-neutral-800 transition cursor-pointer">
                    Згенерувати в базу
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* QR MANAGER */
          <div className="space-y-6">
            <div className="border-b border-black pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-light tracking-tight">Реєстр QR-кодів івенту</h1>
                <p className="text-xs font-mono text-neutral-500 mt-1 uppercase">КЕРУВАННЯ СТАТУСАМИ ТА ПАСПОРТНИМИ ДАНИМИ</p>
              </div>
              
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="Пошук по коду або ПІБ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-black pl-9 pr-4 py-2 text-xs font-mono w-72 focus:outline-none"
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="border border-black overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-black bg-neutral-100 uppercase text-neutral-600">
                      <th className="p-4">Унікальний код</th>
                      <th className="p-4">Статус</th>
                      <th className="p-4">ПІБ (як в паспорті)</th>
                      <th className="p-4">Дата народження</th>
                      <th className="p-4 text-right">Зміна статусу / Дані</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredQrList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-500">Нічого не знайдено за запитом.</td>
                      </tr>
                    ) : (
                      filteredQrList.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-50 transition">
                          <td className="p-4 font-bold text-black">{item.code}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 text-[10px] uppercase tracking-wider border ${
                              item.status === 'створено' ? 'border-neutral-400 text-neutral-600 bg-white' :
                              item.status === 'видано' ? 'border-black text-black bg-neutral-100 font-bold' :
                              'border-black text-white bg-black font-bold'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 text-neutral-800">
                            {item.fullName || <span className="text-neutral-400 italic">не вказано</span>}
                          </td>
                          <td className="p-4 text-neutral-800">
                            {item.birthDate || <span className="text-neutral-400 italic">-</span>}
                          </td>
                          <td className="p-4 text-right">
                            <select 
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value as StatusType)}
                              className="border border-black px-3 py-1.5 text-xs font-mono bg-white cursor-pointer focus:outline-none"
                            >
                              <option value="створено">створено</option>
                              <option value="видано">видано (ввести ПІБ)</option>
                              <option value="використано">використано (прийшов)</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PASSPORT DATA MODAL */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black pb-4">
              <h3 className="text-sm font-mono uppercase tracking-wider flex items-center space-x-2 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Паспортні дані відвідувача</span>
              </h3>
              <button onClick={() => setModalItem(null)} className="text-xs font-mono uppercase border border-black px-2 py-1 hover:bg-black hover:text-white transition cursor-pointer">
                [Х]
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <p className="text-neutral-600">
                Код квитка: <span className="text-black font-bold">{modalItem.code}</span>. Введіть дані суворо за документами:
              </p>
              <div>
                <label className="block uppercase mb-1 font-bold">ПІБ (Повне ім'я)</label>
                <input 
                  type="text" 
                  placeholder="Наприклад: Наконечний Орест Андрійович"
                  value={tempFullName}
                  onChange={(e) => setTempFullName(e.target.value)}
                  className="w-full border border-black px-3 py-2.5 text-xs font-sans focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase mb-1 font-bold">Дата народження</label>
                <input 
                  type="text" 
                  placeholder="ДД.ММ.РРРР (наприклад: 14.05.2004)"
                  value={tempBirthDate}
                  onChange={(e) => setTempBirthDate(e.target.value)}
                  className="w-full border border-black px-3 py-2.5 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-black">
              <button 
                onClick={() => setModalItem(null)}
                className="px-4 py-2 border border-black text-xs uppercase font-mono hover:bg-neutral-100 transition cursor-pointer"
              >
                Скасувати
              </button>
              <button 
                onClick={savePassportData}
                className="px-5 py-2 bg-black text-white text-xs uppercase font-mono tracking-wider hover:bg-neutral-800 transition cursor-pointer font-bold"
              >
                Зберегти в БД
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}