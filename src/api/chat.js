import apiClient from './client';

export const sendMessage = (question, history) =>
  apiClient.post('/chat/', { question, history }).then((res) => res.data);