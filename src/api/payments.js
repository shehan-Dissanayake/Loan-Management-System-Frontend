import apiClient from './client';

export const createPayment = (paymentData) =>
  apiClient.post('/payments/', paymentData).then((res) => res.data);

export const getPaymentsForLoan = (loanId) =>
  apiClient.get(`/loans/${loanId}/payments`).then((res) => res.data);

export const updatePayment = (loanId, paymentId, paymentData) =>
  apiClient.put(`/loans/${loanId}/payments/${paymentId}`, paymentData).then((res) => res.data);

export const deletePayment = (loanId, paymentId) =>
  apiClient.delete(`/loans/${loanId}/payments/${paymentId}`).then((res) => res.data);