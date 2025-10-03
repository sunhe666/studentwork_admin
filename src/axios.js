import axios from 'axios';

// 创建axios实例
const service = axios.create({
  // baseURL: 'https://bishe.asia', // 更新为新的后端API地址
  baseURL: 'http://localhost:3000', // 本地开发地址
  // baseURL: '/api', // 相对路径

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