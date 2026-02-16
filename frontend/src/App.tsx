// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BotsPage from './pages/BotsPage';
import BotSettingsPage from './pages/BotSettingsPage';
import UsersPage from './pages/UsersPage';
import BroadcastPage from './pages/BroadcastPage';
import StatsPage from './pages/StatsPage';
import AppLayout from './components/Layout';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // You might want a loading spinner here
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DashboardPage />} />
                    <Route path="bots" element={<BotsPage />} />
                    <Route path="bots/:id" element={<BotSettingsPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="broadcasts" element={<BroadcastPage />} />
                    <Route path="stats" element={<StatsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;
