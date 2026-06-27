import apiClient from './client';

export const getOutstandingLoans = () =>
  apiClient.get('/reports/outstanding').then((res) => res.data);

export const getOverdueLoans = () =>
  apiClient.get('/reports/overdue').then((res) => res.data);

export const getTodaysRoute = () =>
  apiClient.get('/reports/route-today').then((res) => res.data);

export const getDailyCollection = (date) =>
  apiClient.get('/reports/daily-collection', { params: date ? { report_date: date } : {} })
    .then((res) => res.data);

export const getCashFlow = (startDate, endDate) =>
  apiClient.get('/reports/cash-flow', {
    params: {
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
  }).then((res) => res.data);

export const getCustomerHistory = (customerId) =>
  apiClient.get(`/reports/customers/${customerId}/history`).then((res) => res.data);

export const getRiskSummary = () =>
  apiClient.get('/reports/risk-summary').then((res) => res.data);