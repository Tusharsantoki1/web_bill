import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import InvoiceEntry from './pages/InvoiceEntry';
import PaymentEntry from './pages/PaymentEntry';
import OutstandingReport from './pages/OutstandingReport';
import AgingReport from './pages/AgingReport';
import Followup from './pages/Followup';
import WhatsApp from './pages/WhatsApp';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Backup from './pages/Backup';
import UserManagement from './pages/UserManagement';
import PartyLedger from './pages/PartyLedger';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/invoice-entry" element={<InvoiceEntry />} />
        <Route path="/payment-entry" element={<PaymentEntry />} />
        <Route path="/outstanding" element={<OutstandingReport />} />
        <Route path="/aging" element={<AgingReport />} />
        <Route path="/followups" element={<Followup />} />
        <Route path="/whatsapp" element={<WhatsApp />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/ledger/:partyId" element={<PartyLedger />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
