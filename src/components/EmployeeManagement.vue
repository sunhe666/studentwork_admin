<template>
  <div class="employee-management">
    <el-card>
      <div class="card-header">
        <h2>员工管理</h2>
        <el-button type="primary" @click="handleAddEmployee">添加员工</el-button>
      </div>

      <!-- 搜索和筛选 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="用户名">
            <el-input v-model="searchForm.username" placeholder="请输入用户名"></el-input>
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="searchForm.role_id" placeholder="请选择角色">
              <el-option value="">全部角色</el-option>
              <el-option v-for="role in roles" :key="role.id" :label="role.role_name" :value="role.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态">
              <el-option value="">全部状态</el-option>
              <el-option label="启用" value="1"></el-option>
              <el-option label="禁用" value="0"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getEmployeeList">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 员工列表 -->
      <el-table v-loading="loading" :data="employeeList" style="width: 100%">
        <el-table-column prop="id" label="员工ID" width="80"></el-table-column>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column prop="real_name" label="姓名"></el-table-column>
        <el-table-column prop="role_name" label="角色"></el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" @change="(value) => handleStatusChange(scope.row.id, value)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="创建时间">
          <template #default="scope">
            {{ formatDateTime(scope.row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEditEmployee(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteEmployee(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 添加/编辑员工对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑员工' : '添加员工'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit"></el-input>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password"></el-input>
        </el-form-item>
        <el-form-item v-if="isEdit" label="密码(选填)" prop="password">
          <el-input v-model="form.password" type="password" placeholder="不填则不修改密码"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="real_name">
          <el-input v-model="form.real_name"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select v-model="form.role_id" placeholder="请选择角色">
            <el-option v-for="role in roles" :key="role.id" :label="role.role_name" :value="role.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import service from '../axios';

// 获取当前登录用户信息
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

// 格式化日期时间为YYYY-MM-DDTHH:MM:SS格式
const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// 员工列表数据
const employeeList = ref([]);
const loading = ref(false);

// 搜索表单
const searchForm = reactive({
  username: '',
  role_id: '',
  status: ''
});

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 对话框状态
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentEmployeeId = ref(null);

// 表单数据
const form = reactive({
  username: '',
  password: '',
  real_name: '',
  role_id: '',
  status: 1
});

// 角色列表
const roles = ref([]);

// 表单验证
const rules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: !isEdit, message: '请输入密码', trigger: 'blur' }],
  real_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role_id: [{ required: true, message: '请选择角色', trigger: 'change' }]
});

const formRef = ref(null);

// 获取员工列表
const getEmployeeList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      limit: pagination.pageSize,
      username: searchForm.username
    };

    // 只有当role_id有值时才添加到params
    if (searchForm.role_id) {
      params.role_id = searchForm.role_id;
    }

    // 只有当status有值时才添加到params
    if (searchForm.status) {
      params.status = searchForm.status;
    }

    const response = await service.get('/employee/list', { params });
    employeeList.value = response.list || [];
    pagination.total = response.total || 0;
  } catch (error) {
    ElMessage.error('获取员工列表失败');
    console.error('获取员工列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取角色列表
const getRoles = async () => {
  try {
    // 假设角色列表接口为/role/list
    const response = await service.get('/role/list');
    roles.value = response.list || [];
  } catch (error) {
    ElMessage.error('获取角色列表失败');
    console.error('获取角色列表失败:', error);
  }
};

// 添加员工
const handleAddEmployee = () => {
  isEdit.value = false;
  currentEmployeeId.value = null;
  form.username = '';
  form.password = '';
  form.real_name = '';
  form.role_id = '';
  form.status = 1;
  dialogVisible.value = true;
};

// 编辑员工
const handleEditEmployee = async (employee) => {
  isEdit.value = true;
  currentEmployeeId.value = employee.id;
  try {
    const response = await service.get(`/employee/detail/${employee.id}`);
    const employeeDetail = response.employee || {};
    form.username = employeeDetail.username || '';
    form.password = ''; // 编辑时密码为空
    form.real_name = employeeDetail.real_name || '';
    form.role_id = employeeDetail.role_id || '';
    form.status = employeeDetail.status || 1;
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取员工详情失败');
    console.error('获取员工详情失败:', error);
  }
};

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();
    if (isEdit.value) {
      // 更新员工
      const data = {
        username: form.username,
        real_name: form.real_name,
        role_id: form.role_id,
        status: form.status
      };

      // 如果填写了密码，则更新密码
      if (form.password) {
        data.password = form.password;
      }

      // 获取当前登录用户信息
const currentUser = getUserInfo();

data.update_by = currentUser?.id || null;
data.update_name = currentUser?.username || null;

await service.put(`/employee/update/${currentEmployeeId.value}`, data);
      ElMessage.success('更新员工信息成功');
    } else {
      // 添加员工
      // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.post('/employee/add', {
        username: form.username,
        password: form.password,
        real_name: form.real_name,
        role_id: form.role_id,
        status: form.status,
        create_by: currentUser?.id || null,
        create_name: currentUser?.username || null
      });
      ElMessage.success('添加员工成功');
    }
    dialogVisible.value = false;
    getEmployeeList();
  } catch (error) {
    // 处理错误信息
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error(isEdit.value ? '更新员工信息失败' : '添加员工失败');
    }
    console.error('提交表单失败:', error);
  }
};

// 删除员工
const handleDeleteEmployee = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该员工吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.delete(`/employee/delete/${id}`, {
  data: {
    delete_by: currentUser?.id || null,
    delete_name: currentUser?.username || null
  }
});
    ElMessage.success('删除员工成功');
    getEmployeeList();
  } catch (error) {
    if (error === 'cancel') return;
    // 处理错误信息
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('删除员工失败');
    }
    console.error('删除员工失败:', error);
  }
};

// 更新员工状态
const handleStatusChange = async (id, status) => {
  try {
    // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.put(`/employee/status/${id}`, {
      status: status,
      update_by: currentUser?.id || null,
      update_name: currentUser?.username || null
    });
    ElMessage.success('更新员工状态成功');
  } catch (error) {
    // 恢复原来的状态
    const employee = employeeList.value.find(item => item.id === id);
    if (employee) {
      employee.status = status === 1 ? 0 : 1;
    }

    // 处理错误信息
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('更新员工状态失败');
    }
    console.error('更新员工状态失败:', error);
  }
};

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  getEmployeeList();
};

const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  getEmployeeList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.username = '';
  searchForm.role_id = '';
  searchForm.status = '';
  getEmployeeList();
};

onMounted(() => {
  getRoles();
  getEmployeeList();
});
</script>

<style scoped>
.employee-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>