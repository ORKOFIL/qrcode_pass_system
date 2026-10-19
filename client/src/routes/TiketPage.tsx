import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  User,
  LogIn
} from 'lucide-react';
import { api } from '../api/axios';

interface TicketData {
  id: string;
  eventName: string;
  eventDate: string;
  userInitials: string;
  status: 'created' | 'issued' | 'activated';
}

export function TicketValidation() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  // 1. Стейти для даних, завантаження та помилок
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Додано відсутній стейт для сповіщень
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2. useEffect для підтягування даних з бази даних при завантаженні
  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) {
        setError('Код квитка не вказано в URL');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        // Запит на бекенд для отримання даних про квиток
        const response = await api.get(`/ticket/${ticketId}`);
        console.log(response.data);
        console.log(response.data.tiketInfo);

        // Встановлюємо дані квитка
        const ticketInfo = response.data.tiketInfo ? response.data.tiketInfo[0] : response.data;
        setTicket(ticketInfo);
      } catch (err: any) {
        console.error('Помилка завантаження квитка:', err);
        setError(err.response?.data?.message || 'Квиток не знайдено або стався збій сервера');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  // 3. Функція для активації квитка
  const handleActivate = async () => {
    if (!ticket || ticket.status === 'activated' || isActivating) return;

    try {
      setIsActivating(true);
      setMessage(null);

      // Запит на активацію
      const res = await api.post(`/ticket/${ticket.id}/activate`);
      if (res.status == 401) {
        setIsActivating(false);
      }
      // Оновлюємо стейт локально та виводимо повідомлення
      setTicket((prev) => prev ? { ...prev, status: 'activated' } : null);
      setMessage({ type: 'success', text: 'Квиток успішно активовано на вході!' });
    } catch (err: any) {
      console.error('Помилка активації:', err);
      const errormessage = err.response?.data?.message.trim() === 'REFRESH TOKEN відсутній' ? 'ВИ НЕ АВТОРИЗОВАНІ' : false
      setMessage({
        type: 'error',
        text: errormessage ? errormessage : err.response?.data?.message || 'Не вдалося активувати квиток'
      });
    } finally {
      setIsActivating(false);
    }
  };

  // Екран завантаження
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center font-mono text-xs uppercase">
        <div className="flex items-center space-x-3 border border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Завантаження даних квитка...</span>
        </div>
      </div>
    );
  }

  // Екран помилки (квиток не знайдено)
  if (error || !ticket) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-black p-8 text-center space-y-4 font-mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-red-600 font-bold text-sm uppercase">ПОМИЛКА ДОСТУПУ</div>
          <div className="text-xs text-neutral-600">{error || 'Квиток відсутній в системі'}</div>
          <button
            onClick={() => window.location.reload()}
            className="w-full border border-black py-2 text-xs uppercase hover:bg-black hover:text-white transition cursor-pointer"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  // Форматування дати івенту безпечно
  const formattedDate = ticket.eventDate
    ? new Intl.DateTimeFormat('uk-UA').format(new Date(ticket.eventDate))
    : 'Дата не вказана';

  // Основний інтерфейс валідації квитка
  return (
    <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col justify-between p-6 sm:p-12">
      {/* TOP HEADER STATUS BAR */}
      <header className="w-full flex items-center justify-between border-b border-black pb-4 font-mono text-xs uppercase tracking-widest">
        <span>SYSTEM // TICKET VALIDATION</span>
        <span className="opacity-50">ID: {ticket.id}</span>
      </header>

      {/* CENTERED CONTENT */}
      <main className="w-full max-w-lg mx-auto my-auto py-8 flex flex-col items-center">
        <div className="w-full border border-black p-8 sm:p-10 bg-white space-y-8 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

          {/* EVENT DETAILS */}
          <div className="text-center space-y-2 border-b border-black pb-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-300 px-2 py-0.5 inline-block">
              ПОДІЯ
            </span>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black">
              {ticket.eventName}
            </h1>
            <div className="flex items-center justify-center space-x-2 text-xs font-mono text-neutral-600 uppercase pt-1">
              <Calendar className="w-3.5 h-3.5 text-black" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* TICKET HOLDER INFO */}
          <div className="text-center space-y-2 py-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              ВЛАСНИК КВИТКА (ПІБ)
            </span>
            <div className="text-lg sm:text-xl font-medium tracking-tight border-b border-dashed border-neutral-300 pb-4 flex items-center justify-center space-x-2">
              <User className="w-4 h-4 text-neutral-400" />
              <span>{ticket.userInitials || 'ПІБ не вказано'}</span>
            </div>
          </div>

          {/* STATUS NOTIFICATION / ALERT */}
          {message && (
            <div
              className={`p-3 font-mono text-xs text-center border uppercase tracking-wider flex items-center justify-center space-x-2 ${message.type === 'success'
                  ? 'border-black bg-black text-white'
                  : 'border-red-600 bg-red-50 text-red-600'
                }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* ACTION BUTTON */}
          <div className="pt-2">
            {ticket.status === 'activated' ? (
              <div className="w-full py-4 border border-black bg-neutral-100 text-black font-mono text-xs uppercase tracking-widest font-bold text-center flex items-center justify-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>КВИТОК ВЖЕ ВИКОРИСТАНО</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                disabled={isActivating}
                className="w-full py-4 bg-black text-white text-xs font-mono uppercase tracking-widest hover:bg-neutral-800 active:translate-y-0.5 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>АКТИВАЦІЯ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>АКТИВУВАТИ</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* SUBTLE FOOTER WITH LOGIN LINK */}
      <footer className="w-full flex justify-center items-center pt-8 border-t border-neutral-200">
        <button
          onClick={() => navigate('/auth/staff')}
          className="text-[11px] font-mono text-neutral-400 hover:text-black transition-colors uppercase tracking-widest flex items-center space-x-1.5 group py-1 cursor-pointer"
        >
          <LogIn className="w-3 h-3 group-hover:text-black" />
          <span>Логін персоналу</span>
        </button>
      </footer>
    </div>
  );
}