export type TicketStatus = 'created' | 'issued' | 'activated';

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  totalTickets?: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  status: TicketStatus;
  fullName?: string | null;
  dob?: string | null;
}