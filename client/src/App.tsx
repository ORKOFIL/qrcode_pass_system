
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import OrganizerDashboard from './routes/OrganizerDashboard';
import AuthPage from './routes/AuthPage';
import { TicketValidation } from './routes/TiketPage';
import { StaffLogin } from './routes/StaffAuth';
import { StaffSuccessPage } from './routes/SuccessAuth';
import { NotFoundPage } from './routes/NotFoundPage';
import { LandingPage } from './routes/LandingPage';

export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen text-gray-900">
                <main >
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/dashboard" element={<OrganizerDashboard />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/:ticketId" element={<TicketValidation />} />
                        <Route path="/auth/staff" element={<StaffLogin />} />
                        <Route path="/auth/staff/success" element={<StaffSuccessPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}