import axios from 'axios';

// 创建axios实例
const service = axios.create({
  baseURL: 'https://sunhe.site', // 可根据需要修改
  // baseURL: 'http://localhost:3000', // 可根据需要修改
  // baseURL: '/api', // 可根据需要修改

  timeout: 10000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 可在此处添加token等操作
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 可在此处统一处理错误
    return Promise.reject(error);
  }
);

export default service; 