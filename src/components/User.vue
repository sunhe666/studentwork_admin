<template>
  <div class="user-management">
    <el-card>
      <div class="card-header">
        <h2>用户管理</h2>
      </div>
      
      <el-table :data="userList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="username" label="用户名" width="180"></el-table-column>
        <el-table-column prop="email" label="邮箱" width="250"></el-table-column>
        <el-table-column label="创建时间" width="200">
  <template #default="scope">
    {{ formatDate(scope.row.created_at) }}
  </template>
</el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row.id)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalUsers"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑用户">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%">
      <span>确定要删除此用户吗？</span>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import service from '../axios';

// 获取当前登录用户信息
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

// 表格数据和分页
defineProps({
  userList: { type: Array, default: () => [] },
  totalUsers: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 }
});

const userList = ref([]);
const totalUsers = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 对话框状态
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentUserId = ref(null);

// 表单数据
const form = reactive({
  username: '',
  email: ''
});

// 表单验证
const rules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
});

const formRef = ref(null);

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

// 获取用户列表
const getUserList = async () => {
  try {
    const response = await service.get('/user/list', {
      params: {
        page: currentPage.value,
        size: pageSize.value
      }
    });
    console.log(response)
    userList.value = response.users;
    totalUsers.value = response.total;
  } catch (error) {
    ElMessage.error('获取用户列表失败');
    console.error(error);
  }
};

// 编辑用户
const handleEdit = async (id) => {
  currentUserId.value = id;
  try {
    const response = await service.get(`/user/${id}`);
    const user = response.user;
    form.username = user.username;
    form.email = user.email;
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取用户信息失败');
    console.error(error);
  }
};

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();
    // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.put(`/user/${currentUserId.value}`, {
      username: form.username,
      email: form.email,
      update_by: currentUser?.id || null,
      update_name: currentUser?.username || null
    });
    ElMessage.success('更新用户成功');
    dialogVisible.value = false;
    getUserList();
  } catch (error) {
    ElMessage.error('更新用户失败');
    console.error(error);
  }
};

// 删除用户
const handleDelete = (id) => {
  currentUserId.value = id;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  try {
    // 获取当前登录用户信息
const currentUser = getUserInfo();

await service.delete(`/user/${currentUserId.value}`, {
  data: {
    delete_by: currentUser?.id || null,
    delete_name: currentUser?.username || null
  }
});
    ElMessage.success('删除用户成功');
    deleteDialogVisible.value = false;
    getUserList();
  } catch (error) {
    ElMessage.error('删除用户失败');
    console.error(error);
  }
};

// 分页事件
const handleSizeChange = (val) => {
  pageSize.value = val;
  getUserList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  getUserList();
};

// 取消回复
const cancelDelete = () => {
  deleteDialogVisible.value = false;
};

onMounted(() => {
  getUserList();
});
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>