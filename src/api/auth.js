import apiClient from './client';

export const login = (username, password) => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  return apiClient.post('/auth/login', params).then((res) => res.data);
};