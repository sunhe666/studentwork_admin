<template>
  <div class="role-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAddRole">添加角色</el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-container">
        <el-input
          v-model="searchForm.role_name"
          placeholder="请输入角色名称"
          style="width: 200px; margin-right: 10px;"
        />
        <el-button type="primary" @click="getRoleList">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <!-- 角色列表 -->
      <el-table v-loading="loading" :data="roleList" style="width: 100%">
        <el-table-column prop="id" label="角色ID" width="80" />
        <el-table-column prop="role_name" label="角色名称" width="180" />
        <el-table-column prop="role_desc" label="角色描述" />
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEditRole(row)">编辑</el-button>
            <el-button type="success" size="small" @click="handleAssignMenu(row)">分配权限</el-button>
            <el-button type="danger" size="small" @click="handleDeleteRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑角色对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="roleFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="role_name">
          <el-input v-model="form.role_name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="role_desc">
          <el-input v-model="form.role_desc" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配菜单权限对话框 -->
    <el-dialog v-model="menuDialogVisible" title="分配菜单权限" width="600px">
      <div class="menu-tree-container">
        <el-tree
          v-loading="menuLoading"
          ref="menuTree"
          :data="menuList"
          show-checkbox
          node-key="id"
          :props="menuProps"
        />
      </div>
      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssignMenu">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import service from '../axios'; // 假设已有封装的axios实例

// 获取当前登录用户信息
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

// 表格数据
const roleList = ref([]);
const loading = ref(false);
const menuLoading = ref(false);

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
});

// 搜索表单
const searchForm = reactive({
  role_name: ''
});

// 对话框数据
const dialogVisible = ref(false);
const menuDialogVisible = ref(false);
const dialogTitle = ref('添加角色');
const currentRoleId = ref(0);

// 表单数据
const form = reactive({
  role_name: '',
  role_desc: ''
});

// 表单规则
const rules = {
  role_name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度在 2 到 20 个字符', trigger: 'blur' }
  ]
};

// 表单引用
const roleFormRef = ref(null);
const menuTree = ref(null);

// 菜单树数据
const menuList = ref([]);
const menuProps = {
  label: 'menu_name',
  children: 'children'
};

// 获取角色列表
const getRoleList = async () => {
  loading.value = true;
  try {
    const response = await service.get('/role/list', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        role_name: searchForm.role_name
      }
    });
    roleList.value = response.list;
    pagination.total = response.total;
  } catch (error) {
    ElMessage.error('获取角色列表失败');
    console.error('Failed to get role list:', error);
  } finally {
    loading.value = false;
  }
};

// 添加角色
const handleAddRole = () => {
  dialogTitle.value = '添加角色';
  currentRoleId.value = 0;
  form.role_name = '';
  form.role_desc = '';
  dialogVisible.value = true;
};

// 编辑角色
const handleEditRole = async (row) => {
  dialogTitle.value = '编辑角色';
  currentRoleId.value = row.id;
  try {
    const response = await service.get(`/role/detail/${row.id}`);
    const role = response.role;
    form.role_name = role.role_name;
    form.role_desc = role.role_desc;
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取角色详情失败');
    console.error('Failed to get role detail:', error);
  }
};

// 提交表单
const submitForm = () => {
  // 表单验证
  roleFormRef.value.validate((valid) => {
    if (valid) {
      if (currentRoleId.value === 0) {
        // 添加角色
        // 获取当前登录用户信息
const currentUser = getUserInfo();

service.post('/role/add', {
          role_name: form.role_name,
          role_desc: form.role_desc,
          create_by: currentUser?.id || null,
          create_name: currentUser?.username || null
        }).then(response => {
          ElMessage.success(response.message);
          dialogVisible.value = false;
          getRoleList();
        }).catch(error => {
          const message = error.response?.data?.message || '操作失败';
          ElMessage.error(message);
          console.error('Failed to submit role:', error);
        });
      } else {
        // 更新角色
        // 获取当前登录用户信息
const currentUser = getUserInfo();

service.put(`/role/update/${currentRoleId.value}`, {
          role_name: form.role_name,
          role_desc: form.role_desc,
          update_by: currentUser?.id || null,
          update_name: currentUser?.username || null
        }).then(response => {
          ElMessage.success(response.message);
          dialogVisible.value = false;
          getRoleList();
        }).catch(error => {
          const message = error.response?.data?.message || '操作失败';
          ElMessage.error(message);
          console.error('Failed to submit role:', error);
        });
      }
    }
  });
};

// 删除角色
const handleDeleteRole = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 获取当前登录用户信息
const currentUser = getUserInfo();

const response = await service.delete(`/role/delete/${row.id}`, {
  data: {
    delete_by: currentUser?.id || null,
    delete_name: currentUser?.username || null
  }
});
    ElMessage.success(response.message);
    getRoleList();
  } catch (error) {
    if (error.message !== 'cancel') {
      const message = error.response?.data?.message || '删除角色失败';
      ElMessage.error(message);
      console.error('Failed to delete role:', error);
    }
  }
};

// 分配菜单权限
const handleAssignMenu = async (row) => {
  currentRoleId.value = row.id;
  menuLoading.value = true;
  try {
    // 尝试获取角色菜单权限
    const response = await service.get(`/role/menu/${row.id}`);
     const allMenusResponse = await service.get('/role/allMenus');
    // 检查是否有菜单数据
    if (response.menu_ids && response.menu_ids.length > 0) {
      
      menuList.value = allMenusResponse.list;
      // 设置选中状态
      setTimeout(() => {
        if (menuTree.value && response.menu_ids && response.menu_ids.length > 0) {
          response.menu_ids.forEach(id => {
            menuTree.value.setChecked(id, true, false);
          });
        }
      }, 100);
    } else {
      // 如果没有菜单数据，调用获取所有菜单接口
     
      menuList.value = allMenusResponse.list || [];
    }
    
    menuDialogVisible.value = true;
  } catch (error) {
    try {
      // 出错时，尝试获取所有菜单
      const allMenusResponse = await service.get('/role/allMenus');
      menuList.value = allMenusResponse.menus || [];
      menuDialogVisible.value = true;
    } catch (allMenusError) {
      ElMessage.error('获取菜单失败');
      console.error('Failed to get menus:', allMenusError);
    }
  } finally {
    menuLoading.value = false;
  }
};

// 提交菜单权限分配
const submitAssignMenu = async () => {
  const checkedKeys = menuTree.value.getCheckedKeys();
  try {
    // 获取当前登录用户信息
    const currentUser = getUserInfo();

    const response = await service.post('/role/assignMenu', {
      role_id: currentRoleId.value,
      menu_ids: checkedKeys,
      update_by: currentUser?.id || null,
      update_name: currentUser?.username || null
    });
    ElMessage.success(response.message);
    menuDialogVisible.value = false;
  } catch (error) {
    const message = error.response?.data?.message || '分配权限失败';
    ElMessage.error(message);
    console.error('Failed to assign menu:', error);
  }
};

// 分页处理
const handleSizeChange = (size) => {
  pagination.limit = size;
  getRoleList();
};

const handleCurrentChange = (current) => {
  pagination.page = current;
  getRoleList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.role_name = '';
  getRoleList();
};

// 初始化
onMounted(() => {
  getRoleList();
});
</script>

<style scoped>
.role-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  margin: 16px 0;
  display: flex;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.menu-tree-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}
</style>