<template>
  <div class="login-bg">
    <div class="login-container">
      <el-card class="login-card">
        <div class="login-logo">
          <img src="../assets/logo.svg" alt="logo" />
        </div>
        <h2 class="login-title">管理后台登录</h2>
        <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="60px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" autocomplete="off" prefix-icon="el-icon-user" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="loginForm.password" type="password" autocomplete="off" prefix-icon="el-icon-lock" placeholder="请输入密码" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="login-btn" @click="handleLogin" round block :loading="loading">登录</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import service from '../axios'; // 引入axios服务
import { useRouter } from 'vue-router';

const loginForm = ref({
  username: '',
  password: ''
});
const loginFormRef = ref(null);
const loading = ref(false);
const router = useRouter();

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
};

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // 调用员工登录接口
const response = await service.post('/employee/login', {
          username: loginForm.value.username,
          password: loginForm.value.password
        });

        // 登录成功处理
if (response.message === '登录成功') {
  // 存储token和用户信息
  const token = response.token || 'token_' + Date.now();
  localStorage.setItem('token', token);
  localStorage.setItem('userInfo', JSON.stringify(response.user));

  try {
    // 获取用户角色ID
    const userInfo = response.user;
    const roleId = userInfo.roleId || userInfo.role_id || 1; // 默认角色ID为1

    // 获取角色菜单
    const menuResponse = await service.get(`/role/menu/${roleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // 存储菜单数据
    localStorage.setItem('employeeMenu', JSON.stringify(menuResponse.menus || []));
    ElMessage.success('登录成功，菜单已加载');
    router.replace('/');
  } catch (menuError) {
    console.error('获取菜单失败:', menuError);
    ElMessage.warning('登录成功，但获取菜单失败');
    router.replace('/');
  }
} else {
          // 其他响应处理
          ElMessage.error(response.message || '登录失败');
        }
      } catch (err) {
        // 错误处理
        if (err.response) {
          // 服务器返回错误
          ElMessage.error(err.response.data.message || '登录失败');
        } else if (err.request) {
          // 请求已发送但未收到响应
          ElMessage.error('网络异常，请检查网络连接');
        } else {
          // 设置请求时发生错误
          ElMessage.error('请求错误，请稍后重试');
        }
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}
.login-card {
  width: 380px;
  padding: 40px 32px 32px 32px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
  background: rgba(255, 255, 255, 0.95);
  border: none;
}
.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}
.login-logo img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.login-title {
  text-align: center;
  margin-bottom: 28px;
  font-weight: bold;
  font-size: 1.5rem;
  color: #333;
  letter-spacing: 2px;
}
.login-btn {
  width: 100%;
  font-size: 1.1rem;
  letter-spacing: 1px;
  border-radius: 24px;
}
</style>