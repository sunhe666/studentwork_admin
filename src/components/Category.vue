<template>
  <div class="category-container">
    <div class="category-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="openAddDialog">添加分类</el-button>
    </div>

    <div class="category-search">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索分类名称"
        prefix-icon="Search"
        class="search-input"
      />
    </div>

    <el-table :data="filteredCategories" stripe class="category-table">
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column prop="name" label="分类名称" />
      <el-table-column prop="sort" label="排序值" width="200">
        <template #default="scope">
          <el-input-number v-model="scope.row.sort" @change="handleSortChange(scope.row)" :min="0" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-switch v-model="scope.row.status" @change="handleStatusChange(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="category-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="categories.length"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[5, 10, 20]"
      />
    </div>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="categoryForm" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" placeholder="请输入排序值" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formData.status" />
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
import { ref, reactive, computed, onMounted } from 'vue';
import axios from '../axios';
import { ElMessage, ElMessageBox } from 'element-plus';

// 获取当前登录用户信息
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      return {
        id: parsed.id || parsed.user_id || '',
        username: parsed.username || parsed.name || 'admin'
      };
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
  return { id: '', username: 'admin' };
};

// 状态变量
const categories = ref([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const dialogVisible = ref(false);
const dialogTitle = ref('添加分类');
const formData = ref({ id: '', name: '',  status: true,sort:1 });
const categoryForm = ref(null);

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '分类名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' },
    { type: 'number', message: '排序值必须为数字', trigger: 'blur' }
  ]
};

// 过滤分类列表
const filteredCategories = computed(() => {
  return categories.value
    .filter(category => category.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

// 获取分类列表
const getCategories = async () => {
  try {
    const response = await axios.get('/category/list');
    categories.value = response.map(category => ({...category, status: category.status === 1}));
  } catch (error) {
    ElMessage.error('获取分类列表失败: ' + (error.response?.data?.message || error.message));
  }
};

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加分类';
  formData.value = { id: '', name: '', sort: 0, status: true };
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = (row) => {
  dialogTitle.value = '编辑分类';
  formData.value = { ...row };
  dialogVisible.value = true;
};

// 提交表单
const submitForm = async () => {
  console.log(formData.value);
  await categoryForm.value.validate();
  try {
    if (formData.value.id) {
      // 更新分类
      const currentUser = getUserInfo();
      await axios.put(`/category/edit/${formData.value.id}`, {
        name: formData.value.name,
        sort: formData.value.sort,
        update_by: currentUser.id,
        update_name: currentUser.username
      });
      ElMessage.success('分类更新成功');
    } else {
      // 添加分类
      const currentUser = getUserInfo();
      await axios.post('/category/add', {
        name: formData.value.name,
        sort: formData.value.sort,
        create_by: currentUser.id,
        create_name: currentUser.username
      });
      ElMessage.success('分类添加成功');
    }
    dialogVisible.value = false;
    getCategories();
  } catch (error) {
    ElMessage.error('操作失败: ' + (error.response?.data?.message || error.message));
  }
};

// 改变状态
const handleStatusChange = async (row) => {
  console.log('改变状态', row);
  try {
    const currentUser = getUserInfo();
      await axios.put(`/category/status/${row.id}`, {
        status: row.status ? 1 : 0,
        update_by: currentUser.id,
        update_name: currentUser.username
      });
    ElMessage.success('状态更新成功');
  } catch (error) {
    row.status = !row.status; // 回滚状态
    ElMessage.error('状态更新失败: ' + (error.response?.data?.message || error.message));
  }
};

// 处理排序值变化
const handleSortChange = async (row) => {
  try {
    const currentUser = getUserInfo();
      await axios.put('/category/sort', {
        sortList: categories.value.map(item => ({ id: item.id, sort: item.sort })),
        update_by: currentUser.id,
        update_name: currentUser.username
      });
    ElMessage.success('排序更新成功');
  } catch (error) {
    ElMessage.error('排序更新失败: ' + (error.response?.data?.message || error.message));
    getCategories(); // 重新获取列表以恢复原始排序值
  }
};

// 删除分类
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const currentUser = getUserInfo();
      await axios.delete(`/category/delete/${row.id}`, {
        data: {
          delete_by: currentUser.id,
          delete_name: currentUser.username
        }
      });
    ElMessage.success('分类删除成功');
    getCategories();
  } catch (error) {
    if (error.name !== 'Error') {
      ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message));
    }
  }
};

// 页面加载时获取分类列表
onMounted(() => {
  getCategories();
});
</script>

<style scoped>
.category-container {
  padding: 20px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.category-search {
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.category-table {
  margin-bottom: 20px;
}

.category-pagination {
  text-align: right;
}
</style>