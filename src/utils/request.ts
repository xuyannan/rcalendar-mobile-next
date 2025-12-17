import axios from 'axios';
import { Toast } from 'antd-mobile';
import { STORAGE_USER_TOKEN } from '../constants';

const service = axios.create({
  timeout: 10000,
});

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_USER_TOKEN);
    if (token) {
      config.headers['Authorization'] = `JWT ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    if (response && response.data && response.data.message) {
        Toast.show({
            content: response.data.message,
            icon: 'fail'
        })
    } else {
        Toast.show({
            content: 'Network Error',
            icon: 'fail'
        })
    }
    return Promise.reject(error);
  }
);

export default service;
