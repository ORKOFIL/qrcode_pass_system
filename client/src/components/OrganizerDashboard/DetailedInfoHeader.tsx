import type { DetailedInfoHeaderProps } from '../../types'
import { QrCode, LayoutDashboard, ArrowLeft, Users } from 'lucide-react';

export default function DetailedInfoHeader({ setCurrentEvent, currentEvent, setActiveTab, activeTab, currentEventQrList, scannersList }: DetailedInfoHeaderProps) {
  return (
    <header className="w-full border-b border-black bg-white sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <button
          onClick={() => setCurrentEvent(null)}
          className="flex items-center space-x-2 border border-black px-3 py-1.5 text-xs font-mono uppercase hover:bg-black hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Всі івенти</span>
        </button>

        <div className="flex items-center space-x-3 border-l  border-black pl-6 ">
          <span className="font-medium text-sm">{currentEvent.name}</span>
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
          {/* НОВА ВКЛАДКА ДЛЯ СКАНУВАЛЬНИКІВ */}
          <button
            onClick={() => setActiveTab('scanners-manager')}
            className={`px-4 py-2 text-xs uppercase tracking-wider transition-all flex items-center space-x-2 font-mono ${activeTab === 'scanners-manager' ? 'bg-black text-white' : 'border border-transparent hover:border-black'}`}
          >
            {/* Можете використати іконку Users з lucide-react */}
            <Users className="w-3.5 h-3.5" />
            <span>Сканери ({scannersList.filter(q => q.eventId === currentEvent.id).length})</span>
          </button>
        </nav>
      </div>
    </header>
  )
}