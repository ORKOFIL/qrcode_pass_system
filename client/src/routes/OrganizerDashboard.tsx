import { useEffect } from 'react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { EventItem, QrItem, StatusType, TabType } from '../types';
import { api } from '../api/axios'
import { useNavigate } from 'react-router-dom';

import MainDashboard from '../components/OrganizerDashboard/MainDashboard'
import DetailedInfoHeader from '../components/OrganizerDashboard/DetailedInfoHeader'
import DetailedInfo from '../components/OrganizerDashboard/DetailedInfo'
import ModalWindow from '../components/OrganizerDashboard/ModalWindow'
import { setMemoryAccessToken } from '../api/axios';

const statusPriority = {
  created: 2,
  issued: 1,
  activated: 3
};

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [initialCount, setInitialCount] = useState(50);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [qrList, setQrList] = useState<QrItem[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [generateCount, setGenerateCount] = useState<number>(10);

  const [modalItem, setModalItem] = useState<QrItem | null>(null);
  const [tempFullName, setTempFullName] = useState<string>('');

  const [scannersCount, setScannersCount] = useState<number>(1);

  const [scannersList, setScannersList] = useState<any[]>([]);

  const handleCreateScanners = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const res = await api.post(`/event/${currentEvent?.id}/scanners/create`, { count: scannersCount })
      setScannersList([...scannersList, ...res.data.scanners])
    } catch (error) {
      console.error('Помилка при створенні сканувальників:', error);
      alert('Не вдалося створити сканувальників');
    }
  };

  // Функція видалення сканувальника
  const handleDeleteScanner = async (scannerId: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей доступ?')) return;

    try {
      console.log(scannerId)
      await api.post(`/event/scanner/delete/${scannerId}`);
      setScannersList(scannersList.filter(s => s.id !== scannerId));
    } catch (error) {
      console.error('Помилка видалення:', error);
    }
  };

  const currentEventQrList = currentEvent
    ? qrList.filter(q => q.eventId === currentEvent.id)
    : [];

  const stats = {
    totalGenerated: currentEventQrList.length,
    issued: currentEventQrList.filter(q => q.status === 'issued' || q.status === 'activated').length,
    authorized: currentEventQrList.filter(q => q.status === 'activated').length,
    notCame: currentEventQrList.filter(q => q.status === 'issued').length,
  };

  // Генерація додаткових кодів
  const handleGenerateMore = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;

    const newQrs = await api.post('/event/create/qrcodes', { id: currentEvent.id, capacity: generateCount, addon: true })
    setQrList([...qrList, ...newQrs.data.qrcodes]);
  };

  // Зміна статусу QR
  const handleStatusChange = async (id: string, newStatus: StatusType) => {
    if (newStatus === 'issued') {
      const item = qrList.find(q => q.id === id);
      if (item) {
        setModalItem(item);
        setTempFullName(item.userInitials || '');
      }
    } else {
      setQrList(qrList.map(q => q.id === id ? { ...q, status: newStatus, fullName: '', birthDate: '' } : q));
      await api.post(`/change/status/${newStatus.trim()}/${id}`)
    }
  };

  const savePassportData = async () => {
    if (!modalItem) return;
    setQrList(qrList.map(q => q.id === modalItem.id ? {
      ...q,
      status: 'issued',
      userInitials: tempFullName
    } : q));
    setModalItem(null);
    await api.post(`/change/status/issued/${modalItem.id}`, { fullname: tempFullName })
  };

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    const response = await api.post('/event/create', { newEventTitle, newEventDate, newEventLocation, initialCount })
    const info = response.data.data
    const createdEvent: EventItem = {
      id: info.id,
      name: info.name,
      date: info.date,
      location: info.location,
      capacity: info.capacity
    };
    setEvents([...events, createdEvent]);

    const qr_response = await api.post('/event/create/qrcodes', { id: info.id, capacity: info.capacity, addon: false })

    console.log(qr_response.data.qrcodes)

    setQrList([...qrList, ...qr_response.data.qrcodes]);
    setCurrentEvent(createdEvent);

    // Очистка форми
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventLocation('');
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей івент? Усі пов’язані дані та квитки буде видалено.')) {
      return;
    }
    try {
      const res = await api.post(`/event/delete/${currentEvent?.id}`);

      if (res.status === 500) {
        alert('Не вдалось видалити івент');
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error('Помилка при видаленні:', error);
      alert('Не вдалось видалити івент');
    }
  };

  const filteredQrList = currentEventQrList
    .filter((q) => {
      const query = searchQuery.toLowerCase();
      const matchesCode = q.id?.toLowerCase().includes(query);
      const matchesInitials = q.userInitials?.toLowerCase().includes(query);

      return matchesCode || matchesInitials;
    })
    .sort((a, b) => {
      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;

      return priorityA - priorityB;
    });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Помилка при логауті', err);
    } finally {
      setMemoryAccessToken(null);
      navigate('/auth');
    }
  };

  useEffect(() => {
    async function loadData() {
      const response = await api.get('/load/events')
      console.log(response.data.events)
      setEvents([...events, ...response.data.events])
      setQrList([...qrList, ...response.data.tikets])
      setScannersList([...scannersList, ...response.data.staff]);
    }
    loadData()
  }, [])

  // ================= VIEW 1: SELECT OR CREATE EVENT =================
  if (!currentEvent) {
    return (
      <MainDashboard events={events} setCurrentEvent={setCurrentEvent} handleLogout={handleLogout} newEventTitle={newEventTitle} setNewEventTitle={setNewEventTitle} newEventDate={newEventDate} setNewEventDate={setNewEventDate} initialCount={initialCount} setInitialCount={setInitialCount} newEventLocation={newEventLocation} setNewEventLocation={setNewEventLocation} handleCreateEvent={handleCreateEvent} />
    );
  }
  // ================= VIEW 2: EVENT DASHBOARD & QR MANAGER =================
  return (
    <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col">
      {/* HEADER WITH TABS */}
      <DetailedInfoHeader setCurrentEvent={setCurrentEvent} currentEvent={currentEvent} setActiveTab={setActiveTab} activeTab={activeTab} currentEventQrList={currentEventQrList} scannersList={scannersList} />

      {/* MAIN CONTENT */}
      <DetailedInfo activeTab={activeTab} currentEvent={currentEvent} stats={stats} currentEventQrList={currentEventQrList} handleGenerateMore={handleGenerateMore} generateCount={generateCount} setGenerateCount={setGenerateCount} handleDeleteEvent={handleDeleteEvent} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filteredQrList={filteredQrList} handleStatusChange={handleStatusChange} handleCreateScanners={handleCreateScanners} scannersCount={scannersCount} setScannersCount={setScannersCount} scannersList={scannersList} handleDeleteScanner={handleDeleteScanner} />

      {/* MODAL DATA INPUT */}
      {modalItem && (
        <ModalWindow setModalItem={setModalItem} tempFullName={tempFullName} setTempFullName={setTempFullName} savePassportData={savePassportData} modalItem={modalItem} />
      )}
    </div>
  );
}