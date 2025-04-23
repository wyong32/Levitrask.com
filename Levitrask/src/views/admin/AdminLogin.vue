<template>
  <div class="admin-login-container">
    <h2>后台管理系统登录</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">用户名:</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div class="form-group">
        <label for="password">密码:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '登录中...' : '登录' }}
      </button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios'; // 确保已安装 axios: npm install axios
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const router = useRouter();

// 从环境变量获取 API 基础 URL，本地开发时回退到 localhost:3000
// 需要在前端项目的根目录创建 .env 文件并添加 VITE_API_BASE_URL=http://localhost:3000
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await axios.post(`${apiBaseUrl}/api/auth/login`, {
      username: username.value,
      password: password.value,
    });

    if (response.data && response.data.token) {
      // 登录成功
      console.log('登录成功，收到 Token:', response.data.token);
      // 将 Token 存储在 localStorage 中
      localStorage.setItem('admin-auth-token', response.data.token);
      // 跳转到后台管理主页
      router.push('/admin/dashboard'); // 假设后台主页路由为 /admin/dashboard
    } else {
      // 可能的后端逻辑错误或响应格式不符
       errorMessage.value = '登录失败，响应无效。';
    }
  } catch (error) {
    console.error('登录时发生错误:', error);
    if (error.response) {
      // 请求已发出，但服务器响应状态码不在 2xx 范围内
      errorMessage.value = error.response.data.message || '登录失败，请检查用户名和密码。';
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      errorMessage.value = '无法连接到服务器，请检查网络或联系管理员。';
    } else {
      // 在设置请求时触发了一个错误
      errorMessage.value = '发生未知错误，请稍后重试。';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.admin-login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box; /* Ensures padding doesn't add to width */
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #409EFF; /* Element UI 主题色 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background-color: #66b1ff;
}

.error-message {
  color: red;
  margin-top: 1rem;
  text-align: center;
}
</style> 