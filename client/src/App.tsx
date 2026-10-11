
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import OrganizerDashboard from './components/OrganizerDashboard';
import AuthPage from './components/AuthPage';

export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen text-gray-900">
                <main >
                    <Routes>
                        <Route path="/dashboard" element={<OrganizerDashboard />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="*" element={<h2 className="text-xl text-white font-bold">404 - Сторінку не знайдено</h2>} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}