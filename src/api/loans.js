import apiClient from './client';

export const getLoans = () =>
  apiClient.get('/loans/').then((res) => res.data);

export const createLoan = (loanData) =>
  apiClient.post('/loans/', loanData).then((res) => res.data);

export const updateLoanStatus = (loanId, status) =>
  apiClient.put(`/loans/${loanId}/status`, { status }).then((res) => res.data);

export const getLoanSummary = (loanId) =>
  apiClient.get(`/loans/${loanId}/summary`).then((res) => res.data);