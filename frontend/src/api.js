import axios from 'axios';
import API_BASE_URL from './config';

const API = axios.create({ baseURL: `${API_BASE_URL}/api` });

API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});
export default API;