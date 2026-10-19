import type { Dispatch, SetStateAction } from 'react';
import type { FormEvent } from 'react';

export type TicketStatus = 'created' | 'issued' | 'activated';
export type StatusType = 'created' | 'issued' | 'activated';
export type TabType = 'dashboard' | 'qr-manager' | 'scanners-manager';
export type setCurrentEvent = Dispatch<SetStateAction<EventItem | null>>;

export interface Ticket {
  id: string;
  eventId: string;
  status: TicketStatus;
  fullName?: string | null;
  dob?: string | null;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  capacity: number;
}

export interface QrItem {
  id: string;
  eventId: string;
  userInitials: string;
  status: StatusType;
}

export interface MainDashboardProps {
  events: EventItem[];
  setCurrentEvent: setCurrentEvent
  newEventTitle: string;
  setNewEventTitle: Dispatch<SetStateAction<string>>;
  newEventDate: string;
  setNewEventDate: Dispatch<SetStateAction<string>>;
  initialCount: number;
  setInitialCount: Dispatch<SetStateAction<number>>;
  newEventLocation: string;
  setNewEventLocation: Dispatch<SetStateAction<string>>;
  handleCreateEvent: (e: FormEvent) => Promise<void>;
  handleLogout: ()=>Promise<void>;
}

export interface DetailedInfoHeaderProps {
  setCurrentEvent: setCurrentEvent;
  currentEvent: EventItem;
  setActiveTab: Dispatch<SetStateAction<TabType>>;
  activeTab: TabType;
  currentEventQrList: QrItem[];
  scannersList: any[];
}

export interface DetailedInfoProps {
  activeTab: TabType;
  currentEvent: EventItem;
  stats: {
    totalGenerated: number;
    issued: number;
    authorized: number;
    notCame: number;
  };
  currentEventQrList: QrItem[];
  handleGenerateMore: (e: FormEvent) => Promise<void>;
  generateCount: number;
  setGenerateCount: Dispatch<SetStateAction<number>>;
  handleDeleteEvent: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  filteredQrList: QrItem[];
  handleStatusChange: (id: string, newStatus: StatusType) => Promise<void>;
  handleCreateScanners: (e: FormEvent) => Promise<void>;
  scannersCount: number;
  setScannersCount: Dispatch<SetStateAction<number>>;
  scannersList: any[];
  handleDeleteScanner: (scannerId: string) => Promise<void>;
}
export interface ModalWindowProps {
  setModalItem: Dispatch<SetStateAction<QrItem | null>>;
  tempFullName: string;
  setTempFullName: Dispatch<SetStateAction<string>>;
  savePassportData: () => Promise<void>;
  modalItem: QrItem;
}