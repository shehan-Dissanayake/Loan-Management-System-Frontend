import apiClient from './client';

export const getHolidays = () =>
  apiClient.get('/holidays/').then((res) => res.data);

export const createHoliday = (date, description) =>
  apiClient.post('/holidays/', { date, description }).then((res) => res.data);

export const deleteHoliday = (date) =>
  apiClient.delete(`/holidays/${date}`).then((res) => res.data);