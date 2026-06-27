import apiClient from './client';

export const getCustomers = () =>
  apiClient.get('/customers/').then((res) => res.data);

export const getCustomer = (customerId) =>
  apiClient.get(`/customers/${customerId}`).then((res) => res.data);

export const getCustomerRisk = (customerId) =>
  apiClient.get(`/customers/${customerId}/risk`).then((res) => res.data);

export const createCustomer = (customerData) =>
  apiClient.post('/customers/', customerData).then((res) => res.data);

export const updateCustomer = (customerId, customerData) =>
  apiClient.put(`/customers/${customerId}`, customerData).then((res) => res.data);

export const deleteCustomer = (customerId) =>
  apiClient.delete(`/customers/${customerId}`);