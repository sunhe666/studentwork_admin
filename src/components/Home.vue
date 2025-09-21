<template>
  <div class="home-layout">
    <el-container style="height: 100vh">
      <el-aside width="200px" class="menu-aside">
        <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" @select="handleMenuSelect" router
          background-color="#2d3a4b" text-color="#fff" active-text-color="#fff" :collapse-transition="true">
          <template v-for="menu in menus" :key="menu.id">
            <el-menu-item v-if="!menu.children || menu.children.length === 0" :index="menu.path">
              <el-icon v-if="menu.icon"><component :is="ElementPlusIconsVue[menu.icon]" /></el-icon>
              <span>{{ menu.menu_name }}</span>
            </el-menu-item>
            <el-sub-menu v-else :index="menu.path">
              <template #title>
                <el-icon v-if="menu.icon"><component :is="ElementPlusIconsVue[menu.icon]" /></el-icon>
                <span>{{ menu.menu_name }}</span>
              </template>
              <el-menu-item v-for="subMenu in menu.children" :key="subMenu.id" :index="subMenu.path">
                <span>{{ subMenu.menu_name }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="header-bar">
          <div class="header-content">
            <span class="welcome-text">{{ welcomeMessage }}</span>
            <el-button type="primary" size="small" @click="handleLogout" class="logout-btn">退出登录</el-button>
          </div>
        </el-header>
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const activeMenu = ref(route.name === 'Home' ? 'dashboard' : route.name);
const menus = ref([]);
const userInfo = ref(null);
const welcomeMessage = ref('欢迎访问');

// 从localStorage获取用户信息
const getUserInfo = () => {
  try {
    const userData = localStorage.getItem('userInfo');
    if (userData) {
      userInfo.value = JSON.parse(userData);
      welcomeMessage.value = `欢迎，${userInfo.value.real_name || '管理员'}`;
    }
  } catch (error) {
    console.error('解析用户信息失败:', error);
    userInfo.value = null;
  }
};

// 可用的图标列表 - 已修正为Element Plus实际支持的图标名称
const availableIcons = [
  'Home', 'User', 'File', 'Briefcase', 'Menu', 'Setting', 
  'Monitor', 'Message', 'Bell', 'Calendar', 'Search', 'Edit',
  'Delete', 'Plus', 'Check', 'Alert', 'Download', 'Upload',
  'Star', 'Clock', 'Lock', 'Unlock', 'Eye', 'EyeOff',
  'Filter', 'Sort', 'Refresh', 'Export', 'Import', 'Share'
];

// 随机获取一个图标
const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * availableIcons.length);
  return availableIcons[randomIndex];
};

// 为菜单项添加图标
const addIconsToMenus = (menuList) => {
  return menuList.map(menu => {
    // 如果没有图标，添加随机图标
    if (!menu.icon) {
      menu.icon = getRandomIcon();
    }
    // 如果有子菜单，递归添加图标
    if (menu.children && menu.children.length > 0) {
      menu.children = addIconsToMenus(menu.children);
    }
    return menu;
  });
};

// 从localStorage获取菜单数据
onMounted(() => {
  getUserInfo();
  try {
    const menuData = localStorage.getItem('employeeMenu');
    if (menuData) {
      menus.value = JSON.parse(menuData);
      // 添加图标
      menus.value = addIconsToMenus(menus.value);
      console.log('菜单数据已加载并添加图标:', menus.value);
    } else {
      console.warn('未找到菜单数据，使用默认菜单');
      // 如果没有菜单数据，使用一个默认菜单
      menus.value = [
        { id: 1, menu_name: '仪表盘', path: 'dashboard', icon: 'Home' },
        { id: 2, menu_name: '用户管理', path: 'user', icon: 'User' },
        { id: 3, menu_name: '日志管理', path: 'log', icon: 'File' },
        { id: 4, menu_name: '职位管理', path: 'position', icon: 'Briefcase' },
        { id: 5, menu_name: '招聘管理', path: 'recruitment', icon: 'Plus' }
      ];
    }
  } catch (error) {
    console.error('解析菜单数据失败:', error);
    menus.value = [];
  }
});

// 退出登录
const handleLogout = () => {
  // 清除localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('employeeMenu');

  // 跳转到登录页
  router.replace('/login');
  ElMessage.success('退出登录成功');
};

watch(
  () => route.name,
  (newName) => {
    activeMenu.value = newName === 'Home' ? 'dashboard' : newName;
  }
);

const handleMenuSelect = (index) => {
  // 直接根据索引跳转
  router.push(`/${index}`);
};
</script>

<style scoped>
.home-layout {
  width: 100vw;
  height: 100vh;
}
.menu-aside {
  background: #2d3a4b;
  color: #fff;
  min-height: 100vh;
  box-shadow: 2px 0 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}
.el-menu-vertical-demo {
  border-right: none;
  background: transparent;
  transition: all 0.3s ease;
}
.el-menu-vertical-demo .el-menu-item,
.el-sub-menu .el-sub-menu__title {
  color: #fff;
  height: 56px;
  line-height: 56px;
  padding: 0 24px;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  border-radius: 0 4px 4px 0;
  margin: 4px 0;
}
.el-menu-vertical-demo .el-menu-item:hover,
.el-sub-menu .el-sub-menu__title:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}
.el-menu-vertical-demo .el-menu-item.is-active {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.2), rgba(103, 194, 58, 0.2));
  color: #409EFF;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.2);
  position: relative;
}
.el-menu-vertical-demo .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 4px;
  background-color: #409EFF;
  border-radius: 0 4px 4px 0;
}
.el-menu-vertical-demo .el-icon,
.el-sub-menu .el-icon {
  margin-right: 12px;
  font-size: 18px;
  color: #a0a0a0;
  transition: color 0.3s ease;
}
.el-menu-vertical-demo .el-menu-item:hover .el-icon,
.el-sub-menu .el-sub-menu__title:hover .el-icon {
  color: #fff;
}
.el-menu-vertical-demo .el-menu-item.is-active .el-icon {
  color: #409EFF;
}
.el-menu-vertical-demo .el-menu-item span,
.el-sub-menu .el-sub-menu__title span {
  font-size: 14px;
  font-weight: 500;
}
/* 子菜单样式 */
.el-sub-menu .el-menu {
  background-color: rgba(0, 0, 0, 0.1) !important;
  border-radius: 0 0 4px 4px;
}
.el-sub-menu .el-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  padding-left: 48px !important;
  margin: 2px 0;
}
.el-sub-menu .el-menu .el-menu-item.is-active {
  background: rgba(64, 158, 255, 0.15);
  color: #409EFF;
}
.header-bar {
  background: #fff;
  color: #333;
  font-size: 1.2rem;
  font-weight: bold;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.welcome-text {
  font-size: 1rem;
  color: #606266;
  font-weight: 500;
}

.logout-btn {
  height: 36px;
  line-height: 36px;
  padding: 0 16px;
  transition: all 0.3s ease;
}
.logout-btn:hover {
  transform: translateY(-2px);
}
.main-content {
  background: #f5f6fa;
  min-height: calc(100vh - 64px);
  padding: 24px;
}
</style>