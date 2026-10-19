import {
    CheckCircle2,
    XCircle,
    Search,
} from 'lucide-react';

import type { StatusType, DetailedInfoProps } from '../../types'
const handleCopyImage = async (imageUrl: string, e: React.MouseEvent) => {
    e.preventDefault(); // Зупиняємо стандартну поведінку посилання (щоб файл не скачувався)

    try {
        // 1. Завантажуємо зображення як бінарні дані (Blob)
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // 2. Записуємо в буфер обміну за допомогою ClipboardItem
        await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
        ]);
    } catch (error) {
        console.error('Помилка при копіюванні зображення:', error);
        alert('Не вдалося скопіювати зображення в буфер обміну');
    }
};
export default function DetailedInfo({ activeTab, currentEvent, stats, currentEventQrList, handleGenerateMore, generateCount, setGenerateCount, handleDeleteEvent, searchQuery, setSearchQuery, filteredQrList, handleStatusChange, handleCreateScanners, scannersCount, setScannersCount, scannersList, handleDeleteScanner}: DetailedInfoProps) {
    return (
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
                            ЛОКАЦІЯ: {currentEvent.location} // ДАТА: {new Intl.DateTimeFormat('uk-UA').format(new Date(currentEvent.date))}
                        </div>
                    </div>

                    {/* METRICS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="border border-black p-6 bg-white relative">
                            <div className="text-xs font-mono uppercase text-neutral-500">Всього згенеровано</div>
                            <div className="text-5xl font-light mt-4 font-mono">{stats.totalGenerated}</div>
                            <div className="mt-4 text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-3 flex justify-between">
                            </div>
                        </div>

                        <div className="border border-black p-6 bg-white relative">
                            <div className="text-xs font-mono uppercase text-neutral-500">Видано квитків</div>
                            <div className="text-5xl font-light mt-4 font-mono">{stats.issued}</div>
                            <div className="mt-4 text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-3 flex justify-between">
                                <span>Частка від загальних</span>
                                <span className="text-black font-bold">{stats.totalGenerated ? Math.round((stats.issued / stats.totalGenerated) * 100) : 0}%</span>
                            </div>
                        </div>

                        <div className="border border-black p-6 bg-white relative">
                            <div className="text-xs font-mono uppercase text-black font-bold flex items-center space-x-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Авторизовано</span>
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
                                <span>Не прийшли</span>
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
                                {currentEventQrList.filter(q => q.status === 'activated').length === 0 ? (
                                    <div className="text-neutral-500 py-4 italic">Ще жоден код не було використано на контролі.</div>
                                ) : (
                                    currentEventQrList.filter(q => q.status === 'activated').map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border border-neutral-300 bg-neutral-50">
                                            <div className="flex items-center space-x-4">
                                                <span className="font-bold">{item.id}</span>
                                                <span className="text-neutral-700">{item.userInitials}</span>
                                            </div>
                                            <span className="border border-black px-2 py-0.5 text-[10px] uppercase bg-black text-white">Успішно пройдено</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="border border-black p-6 bg-white flex flex-col justify-between space-y-6">
                            <div>
                                <h3 className="text-sm font-mono uppercase tracking-wider mb-2 border-b border-black pb-2">Додати квитки</h3>
                                <p className="text-xs font-mono text-neutral-500 mb-4">Згенерувати додаткову партію кодів для цього івенту.</p>

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

                            {/* Кнопка всередині правої картки */}
                            <div className="pt-4 border-t border-neutral-200">
                                <button
                                    onClick={() => handleDeleteEvent()}
                                    className="w-full py-3 px-4 border border-red-600 text-red-600 font-mono font-bold uppercase tracking-wider text-xs bg-white hover:bg-red-600 hover:text-white transition duration-200 cursor-pointer"
                                >
                                    Видалити івент
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'qr-manager' ? (
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
                                        <th className="p-4">QR-CODE</th>
                                        <th className="p-4">Статус</th>
                                        <th className="p-4">ПІБ</th>
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
                                                <td className="p-4 font-bold text-black">{item.id}</td>

                                                {/* Колонка з QR-кодом та кнопкою завантаження */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-4">
                                                        {/* Клік по фото тепер копіює його в буфер */}
                                                        <a
                                                            href={`http://localhost:3000/qrcodes/${currentEvent.id}/${item.id}.png`}
                                                            onClick={(e) => handleCopyImage(`http://localhost:3000/qrcodes/${currentEvent.id}/${item.id}.png`, e)}
                                                            className="group relative cursor-pointer"
                                                            title="Натисніть, щоб скопіювати в буфер обміну"
                                                        >
                                                            <img
                                                                src={`http://localhost:3000/qrcodes/${currentEvent.id}/${item.id}.png`}
                                                                alt={`QR ${item.id}`}
                                                                className="w-20 h-20 object-contain border border-neutral-300 bg-white p-0.5 group-hover:opacity-80 transition"
                                                            />
                                                        </a>
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <span className={`inline-block px-2.5 py-1 text-[10px] uppercase tracking-wider border ${item.status === 'created' ? 'border-neutral-400 text-neutral-600 bg-white' :
                                                        item.status === 'issued' ? 'border-black text-black bg-neutral-100 font-bold' :
                                                            'border-black text-white bg-black font-bold'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-neutral-800">
                                                    {item.userInitials || <span className="text-neutral-400 italic">не вказано</span>}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => handleStatusChange(item.id, e.target.value as StatusType)}
                                                        className="border border-black px-3 py-1.5 text-xs font-mono bg-white cursor-pointer focus:outline-none"
                                                    >
                                                        <option value="created">створено</option>
                                                        <option value="issued">видано</option>
                                                        <option value="activated">використано</option>
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
            ) : activeTab === 'scanners-manager' ? (
                /* SCANNERS MANAGER */
                <div className="space-y-8">
                    <div className="border-b border-black pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-light tracking-tight">Персонал</h1>
                            <p className="text-xs font-mono text-neutral-500 mt-1 uppercase">ГЕНЕРАЦІЯ ДОСТУПІВ ТА ОБЛІКОВИХ ЗАПИСІВ ДЛЯ КОНТРОЛЮ ВХОДУ</p>
                        </div>
                    </div>

                    {/* ГРИД: ФОРМА СТВОРЕННЯ ЗЛІВА ТА СПИСОК СПРАВА */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Блок форми генерації сканувальників */}
                        <div className="border border-black p-6 bg-white h-fit">
                            <h3 className="text-sm font-mono uppercase tracking-wider mb-2 border-b border-black pb-2">Створити персонал</h3>
                            <p className="text-xs font-mono text-neutral-500 mb-4">
                                Система автоматично згенерує унікальні імена на основі назви події («{currentEvent.name}») та паролі.
                            </p>

                            <form onSubmit={handleCreateScanners} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-mono uppercase mb-1">Кількість персоналу</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={scannersCount}
                                        onChange={(e) => setScannersCount(Number(e.target.value))}
                                        className="w-full border border-black px-3 py-2 text-sm font-mono focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-neutral-800 transition cursor-pointer"
                                >
                                    Згенерувати доступ
                                </button>
                            </form>
                        </div>

                        {/* Таблиця існуючих сканувальників для цього івенту */}
                        <div className="lg:col-span-2 border border-black bg-white">
                            <div className="p-4 border-b border-black bg-neutral-100 uppercase text-xs font-mono text-neutral-600 font-bold">
                                Активний персонал на івенті
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse font-mono text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px]">
                                            <th className="p-4">Логін</th>
                                            <th className="p-4">Пароль</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200">
                                        {scannersList.filter(q => q.eventId === currentEvent.id).length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-neutral-500 italic">
                                                    Для цього івенту ще не створено жодної одиниці персоналу.
                                                </td>
                                            </tr>
                                        ) : (
                                            scannersList.filter(q => q.eventId === currentEvent.id).map((scanner) => (
                                                <tr key={scanner.id} className="hover:bg-neutral-50 transition">
                                                    <td className="p-4 font-bold text-black">{scanner.name}</td>
                                                    <td className="p-4 text-neutral-600 select-all">{scanner.passwordHash}</td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteScanner(scanner.id)}
                                                            className="border border-red-600 text-red-600 px-3 py-1 text-[10px] uppercase font-bold hover:bg-red-600 hover:text-white transition"
                                                        >
                                                            Видалити
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            ) : null}
        </main>
    )
}