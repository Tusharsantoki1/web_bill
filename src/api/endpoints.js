import { api, API_BASE_URL } from './client';

export const AuthAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (payload) => api.post('/auth/register-company', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const CompanyAPI = {
  get: () => api.get('/company').then((r) => r.data),
  update: (payload) => api.patch('/company', payload).then((r) => r.data),
  updateBranding: (payload) => api.put('/company/branding', payload).then((r) => r.data),
  subscription: () => api.get('/company/subscription').then((r) => r.data),
  listStaff: () => api.get('/company/staff').then((r) => r.data),
  addStaff: (payload) => api.post('/company/staff', payload).then((r) => r.data),
  updateStaff: (id, payload) => api.patch(`/company/staff/${id}`, payload).then((r) => r.data),
  setStaffActive: (id, is_active) =>
    api.patch(`/company/staff/${id}/active`, null, { params: { is_active } }).then((r) => r.data),
  backup: () => api.get('/company/backup').then((r) => r.data),
  restore: (data) => api.post('/company/restore', data).then((r) => r.data),
};

export const PartyAPI = {
  list: (search) => api.get('/parties', { params: search ? { search } : {} }).then((r) => r.data),
  get: (id) => api.get(`/parties/${id}`).then((r) => r.data),
  create: (payload) => api.post('/parties', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/parties/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/parties/${id}`).then((r) => r.data),
};

export const ItemAPI = {
  list: (search) => api.get('/items', { params: search ? { search } : {} }).then((r) => r.data),
  get: (id) => api.get(`/items/${id}`).then((r) => r.data),
  create: (payload) => api.post('/items', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/items/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/items/${id}`).then((r) => r.data),
};

export const InvoiceAPI = {
  list: (params) => api.get('/invoices', { params }).then((r) => r.data),
  get: (id) => api.get(`/invoices/${id}`).then((r) => r.data),
  create: (payload) => api.post('/invoices', payload).then((r) => r.data),
  createOutstanding: (payload) => api.post('/invoices/outstanding', payload).then((r) => r.data),
  recordPayment: (id, payload) => api.post(`/invoices/${id}/payment`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/invoices/${id}`).then((r) => r.data),
  pdfUrl: (id) => `${API_BASE_URL}/invoices/${id}/pdf`,
};

export const PaymentAPI = {
  list: (params) => api.get('/payments', { params }).then((r) => r.data),
  create: (payload) => api.post('/payments', payload).then((r) => r.data),
  remove: (id) => api.delete(`/payments/${id}`).then((r) => r.data),
};

export const FollowupAPI = {
  list: (params) => api.get('/followups', { params }).then((r) => r.data),
  due: () => api.get('/followups/due').then((r) => r.data),
  create: (payload) => api.post('/followups', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/followups/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/followups/${id}`).then((r) => r.data),
};

export const ReportAPI = {
  dashboard: () => api.get('/reports/dashboard').then((r) => r.data),
  notifications: () => api.get('/reports/notifications').then((r) => r.data),
  summary: () => api.get('/reports/summary').then((r) => r.data),
  aging: () => api.get('/reports/aging').then((r) => r.data),
  outstanding: () => api.get('/reports/outstanding').then((r) => r.data),
  bills: (overdueOnly = false) =>
    api.get('/reports/bills', { params: { overdue_only: overdueOnly } }).then((r) => r.data),
  overdue: () => api.get('/reports/overdue').then((r) => r.data),
  collection: (params) => api.get('/reports/collection', { params }).then((r) => r.data),
  dailyCollection: (params) =>
    api.get('/reports/daily-collection', { params }).then((r) => r.data),
  ledger: (partyId) => api.get(`/reports/ledger/${partyId}`).then((r) => r.data),
};

export const WhatsAppAPI = {
  reminder: (partyId) => api.get(`/whatsapp/reminder/${partyId}`).then((r) => r.data),
};

export const DashboardAPI = {
  get: () => api.get('/dashboard').then((r) => r.data),
};
