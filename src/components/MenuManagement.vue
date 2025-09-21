<template>
  <div class="menu-management">
    <el-card>
      <div class="card-header">
        <h2>菜单管理</h2>
        <div class="button-group">
          <el-button type="primary" @click="handleAddMenu">添加菜单</el-button>
          <el-button type="success" @click="updateMenuSort">更新排序</el-button>
        </div>
      </div>

      <!-- 菜单树形结构 -->
      <el-tree
        v-loading="loading"
        :data="menuTree"
        :props="defaultProps"
        :expand-on-click-node="false"
        :default-expand-all="true"
        ref="menuTreeRef"
        @node-contextmenu="handleNodeContextMenu"
      >
        <template #default="{ node, data }">
          <div class="tree-node-content">
            <span :class="data.is_show === 0 ? 'node-disabled' : ''">
              <el-icon v-if="data.icon">{{ getIconComponent(data.icon) }}</el-icon>
              {{ data.menu_name }}
            </span>
            <div class="node-actions">
              <el-button
                type="primary"
                size="small"
                icon="Edit"
                @click.stop="handleEditMenu(data)"
              >编辑</el-button>
              <el-button
                type="danger"
                size="small"
                icon="Delete"
                @click.stop="handleDeleteMenu(data.id)"
                :disabled="hasChildren(data)"
              >删除</el-button>
              <el-switch
            v-model="data.is_show"
            :active-value="1"
            :inactive-value="0"
            @change="(value) => handleToggleShow(data.id, value)"
            :disabled="data.id === 1"
          />
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 添加/编辑菜单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜单' : '添加菜单'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="菜单名称" prop="menu_name">
          <el-input v-model="form.menu_name"></el-input>
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component"></el-input>
        </el-form-item>
        <el-form-item label="菜单路径" prop="path">
          <el-input v-model="form.path"></el-input>
        </el-form-item>
        <el-form-item label="菜单图标" prop="icon">
          <el-input v-model="form.icon"></el-input>
          <div class="icon-tip">提示: 使用Element Plus图标名称，如el-icon-s-home</div>
        </el-form-item>
        <el-form-item label="父菜单" prop="parent_id">
          <el-select v-model="form.parent_id" placeholder="选择父菜单">
            <el-option value="0">顶级菜单</el-option>
            <el-option
              v-for="menu in topLevelMenus"
              :key="menu.id"
              :label="menu.menu_name"
              :value="menu.id"
              :disabled="menu.id === currentMenuId"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序号" prop="sort">
          <el-input v-model.number="form.sort" type="number"></el-input>
        </el-form-item>
        <el-form-item label="是否显示" prop="is_show">
          <el-switch
            v-model="form.is_show"
            :active-value="1"
            :inactive-value="0"
          ></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <el-menu
      v-if="contextMenuVisible"
      :show-trigger="['click']"
      :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
      class="context-menu"
      @close="contextMenuVisible = false"
    >
      <el-menu-item @click="handleEditMenu(currentMenu)">编辑</el-menu-item>
      <el-menu-item @click="handleDeleteMenu(currentMenu.id)" :disabled="hasChildren(currentMenu)">删除</el-menu-item>
      <el-menu-item @click="handleAddSubMenu(currentMenu.id)">添加子菜单</el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, h } from 'vue';
import { ElMessage, ElTree, ElIcon } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import service from '../axios';

// 获取当前登录用户信息
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};


// 菜单树数据
const menuTree = ref([]);
const defaultProps = ref({
  children: 'children',
  label: 'name'
});
const menuTreeRef = ref(null);
const loading = ref(false);

// 对话框状态
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentMenuId = ref(null);
const currentMenu = ref(null);

// 表单数据
const form = reactive({
  menu_name: '',
  path: '',
  component: '',
  icon: '',
  parent_id: 0,
  sort: 0,
  is_show: 1
});

// 表单验证
const rules = reactive({
  menu_name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入菜单路径', trigger: 'blur' }]
});

const formRef = ref(null);

// 右键菜单
const contextMenuVisible = ref(false);
const contextMenuLeft = ref(0);
const contextMenuTop = ref(0);

// 顶级菜单（不包含当前编辑的菜单）
const topLevelMenus = computed(() => {
  return menuTree.value.filter(menu => {
    return menu.parent_id === 0 && menu.id !== currentMenuId.value;
  });
});

// 获取菜单列表
const getMenuList = async () => {
  loading.value = true;
  try {
    const response = await service.get('/menu/list');
    menuTree.value = response.list || [];
  } catch (error) {
    ElMessage.error('获取菜单列表失败');
    console.error('获取菜单列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 添加菜单
const handleAddMenu = () => {
  isEdit.value = false;
  currentMenuId.value = null;
  form.menu_name = '';
  form.path = '';
  form.component = '';
  form.icon = '';
  form.parent_id = 0;
  form.sort = 0;
  form.is_show = 1;
  dialogVisible.value = true;
};

// 添加子菜单
const handleAddSubMenu = (parentId) => {
  isEdit.value = false;
  currentMenuId.value = null;
  form.menu_name = '';
  form.path = '';
  form.component = '';
  form.icon = '';
  form.parent_id = parentId;
  form.sort = 0;
  form.is_show = 1;
  dialogVisible.value = true;
};

// 编辑菜单
const handleEditMenu = async (menu) => {
  isEdit.value = true;
  currentMenuId.value = menu.id;
  currentMenu.value = menu;
  try {
    const response = await service.get(`/menu/detail/${menu.id}`);
    const menuDetail = response.menu || {};
    form.menu_name = menuDetail.menu_name || '';
    form.path = menuDetail.path || '';
  form.component = menuDetail.component || '';
    form.icon = menuDetail.icon || '';
    form.parent_id = menuDetail.parent_id || 0;
    form.sort = menuDetail.sort || 0;
    form.is_show = menuDetail.is_show === 1 ? 1 : 0;
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取菜单详情失败');
    console.error('获取菜单详情失败:', error);
  }
};

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();
    if (isEdit.value) {
      // 更新菜单
      // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.put(`/menu/update/${currentMenuId.value}`, {
        menu_name: form.menu_name,
        path: form.path,
        component: form.component,
        icon: form.icon,
        parent_id: form.parent_id,
        sort: form.sort,
        is_show: form.is_show,
        update_by: currentUser?.id || null,
        update_name: currentUser?.username || null
      });
      ElMessage.success('更新菜单成功');
    } else {
      // 添加菜单
      // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.post('/menu/add', {
        menu_name: form.menu_name,
        path: form.path,
        component: form.component,
        icon: form.icon,
        parent_id: form.parent_id,
        sort: form.sort,
        is_show: form.is_show,
        create_by: currentUser?.id || null,
        create_name: currentUser?.username || null
      });
      ElMessage.success('添加菜单成功');
    }
    dialogVisible.value = false;
    getMenuList();
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新菜单失败' : '添加菜单失败');
    console.error('提交表单失败:', error);
  }
};

// 删除菜单
const handleDeleteMenu = async (id) => {
  try {
    // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.delete(`/menu/delete/${id}`, {
  data: {
    delete_by: currentUser?.id || null,
    delete_name: currentUser?.username || null
  }
});
    ElMessage.success('删除菜单成功');
    getMenuList();
  } catch (error) {
    ElMessage.error('删除菜单失败');
    console.error('删除菜单失败:', error);
  }
};

// 更新菜单显示状态
const handleToggleShow = async (id, is_show) => {
  // 添加标志防止循环调用
  if (isRefreshing) return;
  try {
    // 确保传递给后端的是数字类型
  // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.put(`/menu/show/${id}`, {
      is_show: parseInt(is_show),
      update_by: currentUser?.id || null,
      update_name: currentUser?.username || null
    });
    ElMessage.success('更新菜单显示状态成功');
    // 成功后刷新菜单列表
    isRefreshing = true;
    getMenuList().finally(() => {
      isRefreshing = false;
    });
  } catch (error) {
    ElMessage.error('更新菜单显示状态失败');
    console.error('更新菜单显示状态失败:', error);
    // 恢复原来的状态
    isRefreshing = true;
    getMenuList().finally(() => {
      isRefreshing = false;
    });
  }
};

// 刷新标志
let isRefreshing = false;

// 更新菜单排序
const updateMenuSort = async () => {
  try {
    // 获取所有菜单节点
    const nodes = menuTreeRef.value.getNodes();
    // 构建排序列表
    const sortList = nodes.map(node => ({
      id: node.data.id,
      sort: node.data.sort
    }));
    
    // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.post('/menu/sort', {
      sortList: sortList,
      update_by: currentUser?.id || null,
      update_name: currentUser?.username || null
    });
    ElMessage.success('更新菜单排序成功');
    getMenuList();
  } catch (error) {
    ElMessage.error('更新菜单排序失败');
    console.error('更新菜单排序失败:', error);
  }
};

// 处理右键菜单
const handleNodeContextMenu = (event, node, data) => {
  event.preventDefault();
  contextMenuLeft.value = event.clientX;
  contextMenuTop.value = event.clientY;
  currentMenu.value = data;
  contextMenuVisible.value = true;
};

// 检查是否有子菜单
const hasChildren = (menu) => {
  return menu.children && menu.children.length > 0;
};

// 获取图标组件
const getIconComponent = (iconName) => {
  if (!iconName) return null;
  // 处理el-icon-前缀
  const pureIconName = iconName.replace('el-icon-', '');
  // 首字母大写
  const componentName = pureIconName.charAt(0).toUpperCase() + pureIconName.slice(1);
  return ElementPlusIconsVue[componentName] ? h(ElementPlusIconsVue[componentName]) : null;
};

onMounted(() => {
  getMenuList();
});
</script>

<style scoped>
.menu-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.tree-node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.node-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.el-tree-node:hover .node-actions {
  opacity: 1;
}

.node-disabled {
  color: #c0c4cc;
}

.icon-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 120px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 增强按钮样式 */
.el-button {
  transition: all 0.3s;
}

.el-button:hover {
  transform: translateY(-1px);
}

/* 对话框样式优化 */
.el-dialog__title {
  font-weight: bold;
  font-size: 16px;
}

/* 表格头样式 */
.el-table__header th {
  background-color: #f5f7fa;
  font-weight: bold;
}
</style>