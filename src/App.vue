<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // 简单判断本地是否有token，没有则跳转到登录页
  const token = localStorage.getItem('token');
  if (!token && router.currentRoute.value.path !== '/login') {
    router.replace('/login');
  }
});
</script>

<template>
  <router-view />
</template>

<style>
/* 保留原有样式可根据需要调整 */
#app{
  padding:0;
  margin:0
}
</style>
