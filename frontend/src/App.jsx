import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';

import HistoryPage from './pages/HistoryPage';

import ClientsPage from './pages/ClientsPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';

import ChatWidget from './components/ChatWidget';

const App = () => {
  return (
    <Router>
      <div className="app-container" style={{ position: 'relative' }}>
        <Routes>
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <ChatWidget />
      </div>
    </Router>
  );
};

export default App;
