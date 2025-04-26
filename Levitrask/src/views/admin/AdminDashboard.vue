<template>
  <el-container class="admin-layout">
    <!-- Header -->
    <el-header class="admin-header">
      <div class="header-content">
        <span>Levitrask 后台管理系统</span>
        <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>

    <el-container>
      <!-- Sidebar -->
      <el-aside width="200px" class="admin-aside">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical-demo"
          router
        >
          <!-- 1. 首页管理 -->
          <el-menu-item index="/admin/dashboard/homepage">
            <el-icon><HomeFilled /></el-icon>
            <span>首页管理</span>
          </el-menu-item>

          <!-- 2. 药物管理 (之前是 Drug 页面管理) -->
          <el-menu-item index="/admin/dashboard/drug-page-management">
            <el-icon><FirstAidKit /></el-icon>
            <span>药物管理</span>
          </el-menu-item>

          <!-- 3. 对比管理 (之前是 对比页面管理) -->
          <el-menu-item index="/admin/dashboard/manage-comparisons">
            <el-icon><ScaleToOriginal /></el-icon>
            <span>对比管理</span>
          </el-menu-item>

          <!-- 4. 新闻管理 -->
          <el-menu-item index="/admin/dashboard/news">
            <el-icon><Document /></el-icon>
            <span>新闻管理</span>
          </el-menu-item>

          <!-- 5. 博客管理 -->
          <el-menu-item index="/admin/dashboard/blogs">
            <el-icon><Notebook /></el-icon>
            <span>博客管理</span>
          </el-menu-item>

          <!-- 6. 药物在线 (新增顶级菜单项) -->
          <el-menu-item index="/admin/dashboard/buy-online-management">
            <el-icon><ShoppingCart /></el-icon>
            <span>药物在线</span>
          </el-menu-item>

          <!-- 7. 问题管理 -->
          <el-menu-item index="/admin/dashboard/questions">
            <el-icon><QuestionFilled /></el-icon>
            <span>问题管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- Main Content Area - Renders child routes -->
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>

  </el-container>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Document,
  Notebook,
  QuestionFilled,
  HomeFilled,
  FirstAidKit,
  ScaleToOriginal,
  ShoppingCart
} from '@element-plus/icons-vue'

const router = useRouter();
const route = useRoute();

const activeMenu = ref('');

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
  },
  { immediate: true }
);

const handleLogout = () => {
  localStorage.removeItem('admin-auth-token');
  router.push('/admin/login');
};
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.admin-header {
  background-color: #409EFF;
  color: #fff;
  line-height: 60px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
}

.admin-aside {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  overflow-y: auto;
}

.el-menu {
    border-right: none;
}

.el-menu-item .el-icon,
.el-sub-menu__title .el-icon {
  vertical-align: middle;
  margin-right: 5px;
}

.admin-main {
  padding: 20px;
  background-color: #f4f4f5;
  overflow-y: auto;
}
</style> 