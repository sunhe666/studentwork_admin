<template>
  <div class="recruitment-management">
    <el-card>
      <div class="card-header">
        <h2>招聘管理</h2>
        <el-button type="primary" @click="handleAddRecruitment">添加招聘职位</el-button>
      </div>

      <!-- 搜索和筛选 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="职位名称">
            <el-input v-model="searchForm.position_name" placeholder="请输入职位名称"></el-input>
          </el-form-item>
          <el-form-item label="是否全职">
            <el-select v-model="searchForm.is_full_time" placeholder="请选择">
              <el-option value="">全部</el-option>
              <el-option label="全职" value="1"></el-option>
              <el-option label="兼职" value="0"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="招聘状态">
            <el-select v-model="searchForm.is_closed" placeholder="请选择">
              <el-option value="">全部</el-option>
              <el-option label="招聘中" value="0"></el-option>
              <el-option label="已停止" value="1"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getRecruitmentList">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 招聘职位列表 -->
      <el-table v-loading="loading" :data="recruitmentList" style="width: 100%">
        <el-table-column prop="id" label="职位ID" width="80"></el-table-column>
        <el-table-column prop="position_name" label="职位名称"></el-table-column>
        <el-table-column prop="is_full_time" label="是否全职" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_full_time === 1 ? 'success' : 'info'">
              {{ scope.row.is_full_time === 1 ? '全职' : '兼职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requirements" label="职位要求" width="200">
          <template #default="scope">
            <div v-for="(item, index) in scope.row.requirements" :key="index" class="requirement-item">
              {{ item }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发布人" width="120">
          <template #default="scope">
            {{ scope.row.publisher }}
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="is_closed" label="招聘状态" width="100">
          <template #default="scope">
            <el-switch v-model="scope.row.is_closed" :active-value="1" :inactive-value="0" @change="(value) => handleStatusChange(scope.row.id, value)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleViewDetail(scope.row.id)">查看详情</el-button>
            <el-button type="success" size="small" @click="handleEditRecruitment(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteRecruitment(scope.row.id)">删除</el-button>
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

    <!-- 添加/编辑招聘职位对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑招聘职位' : '添加招聘职位'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="职位名称" prop="position_name">
          <el-input v-model="form.position_name"></el-input>
        </el-form-item>
        <el-form-item label="是否全职" prop="is_full_time">
          <el-select v-model="form.is_full_time" placeholder="请选择">
            <el-option label="全职" value="1"></el-option>
            <el-option label="兼职" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="职位内容" prop="content">
          <el-input v-model="form.content" type="textarea" rows="4"></el-input>
        </el-form-item>
        <el-form-item label="职位要求" prop="requirements">
          <div class="requirements-container">
            <div v-for="(item, index) in form.requirements" :key="index" class="requirement-input-item">
              <el-input v-model="form.requirements[index]" placeholder="请输入要求"></el-input>
              <el-button type="danger" icon="Minus" size="small" @click="removeRequirement(index)"></el-button>
            </div>
            <el-button type="primary" icon="Plus" size="small" @click="addRequirement">添加要求</el-button>
          </div>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="发布人" prop="publisher">
          <el-input v-model="form.publisher"></el-input>
        </el-form-item>
        <el-form-item v-if="isEdit" label="招聘状态" prop="is_closed">
          <el-switch v-model="form.is_closed" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 职位详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="职位详情" width="600px">
      <div v-if="recruitmentDetail" class="detail-container">
        <div class="detail-item">
          <span class="detail-label">职位名称：</span>
          <span class="detail-value">{{ recruitmentDetail.position_name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">是否全职：</span>
          <span class="detail-value">{{ recruitmentDetail.is_full_time === 1 ? '全职' : '兼职' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">职位内容：</span>
          <span class="detail-value">{{ recruitmentDetail.content }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">职位要求：</span>
          <ul class="detail-list">
            <li v-for="(item, index) in recruitmentDetail.requirements" :key="index">{{ item }}</li>
          </ul>
        </div>
        <div class="detail-item">
          <span class="detail-label">发布人：</span>
          <span class="detail-value">{{ recruitmentDetail.publisher }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">创建时间：</span>
          <span class="detail-value">{{ formatDateTime(recruitmentDetail.create_time) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">招聘状态：</span>
          <span class="detail-value">{{ recruitmentDetail.is_closed === 0 ? '招聘中' : '已停止' }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import service from '../axios';

// 招聘职位列表数据
const recruitmentList = ref([]);
const loading = ref(false);

// 搜索表单
const searchForm = reactive({
  position_name: '',
  is_full_time: '',
  is_closed: ''
});

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 对话框状态
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const isEdit = ref(false);
const currentRecruitmentId = ref(null);

// 获取登录用户信息
const loggedInUser = computed(() => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('获取登录用户信息失败:', error);
    return null;
  }
});

// 表单数据
const form = reactive({
  position_name: '',
  is_full_time: 1,
  content: '',
  requirements: [''],
  publisher: loggedInUser.value?.real_name || '',
  is_closed: 0
});

// 招聘职位详情
const recruitmentDetail = ref(null);

// 表单验证
const rules = reactive({
  position_name: [{ required: true, message: '请输入职位名称', trigger: 'blur' }],
  is_full_time: [{ required: true, message: '请选择是否全职', trigger: 'change' }],
  content: [{ required: true, message: '请输入职位内容', trigger: 'blur' }],
  requirements: [{
    required: true,
    validator: (rule, value, callback) => {
      if (value.length === 0 || value.every(item => !item.trim())) {
        callback(new Error('请至少输入一项职位要求'));
      } else {
        callback();
      }
    },
    trigger: 'change'
  }],
  publisher: [{ required: true, message: '请输入发布人', trigger: 'blur' }]
});

const formRef = ref(null);

// 获取招聘职位列表
const getRecruitmentList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      limit: pagination.pageSize
    };

    // 添加搜索参数
    if (searchForm.position_name) {
      params.position_name = searchForm.position_name;
    }
    if (searchForm.is_full_time !== '') {
      params.is_full_time = searchForm.is_full_time;
    }
    if (searchForm.is_closed !== '') {
      params.is_closed = searchForm.is_closed;
    }

    const response = await service.get('/recruitment/list', { params });
    recruitmentList.value = response.list || [];
    pagination.total = response.total || 0;
  } catch (error) {
    ElMessage.error('获取招聘职位列表失败');
    console.error('获取招聘职位列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取招聘职位详情
const getRecruitmentDetail = async (id) => {
  try {
    const response = await service.get(`/recruitment/detail/${id}`);
    recruitmentDetail.value = response.data || {};
  } catch (error) {
    ElMessage.error('获取职位详情失败');
    console.error('获取职位详情失败:', error);
  }
};

// 添加招聘职位
const handleAddRecruitment = () => {
  isEdit.value = false;
  currentRecruitmentId.value = null;
  form.position_name = '';
  form.is_full_time = 1;
  form.content = '';
  form.requirements = [''];
  form.publisher = loggedInUser.value?.name || '';
  dialogVisible.value = true;
};

// 编辑招聘职位
const handleEditRecruitment = async (recruitment) => {
  isEdit.value = true;
  currentRecruitmentId.value = recruitment.id;
  try {
    const response = await service.get(`/recruitment/detail/${recruitment.id}`);
    const data = response.data || {};
    form.position_name = data.position_name || '';
    form.is_full_time = data.is_full_time || 1;
    form.content = data.content || '';
    form.requirements = data.requirements || [''];
    form.publisher = data.publisher || '';
    form.is_closed = data.is_closed || 0;
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取职位详情失败');
    console.error('获取职位详情失败:', error);
  }
};

// 查看详情
const handleViewDetail = async (id) => {
  await getRecruitmentDetail(id);
  detailDialogVisible.value = true;
};

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();
    // 过滤空的要求
    const filteredRequirements = form.requirements.filter(item => item.trim());
    if (filteredRequirements.length === 0) {
      ElMessage.error('请至少输入一项职位要求');
      return;
    }

    if (isEdit.value) {
      // 更新招聘职位
      const data = {
        position_name: form.position_name,
        is_full_time: form.is_full_time,
        content: form.content,
        requirements: filteredRequirements,
        publisher: form.publisher,
        is_closed: form.is_closed
      };

      await service.put(`/recruitment/update/${currentRecruitmentId.value}`, data);
      ElMessage.success('更新职位成功');
    } else {
      // 创建招聘职位
      await service.post('/recruitment/create', {
        position_name: form.position_name,
        is_full_time: form.is_full_time,
        content: form.content,
        requirements: filteredRequirements,
        publisher: form.publisher
      });
      ElMessage.success('创建职位成功');
    }
    dialogVisible.value = false;
    getRecruitmentList();
  } catch (error) {
    // 处理错误信息
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error(isEdit.value ? '更新职位失败' : '创建职位失败');
    }
    console.error('提交表单失败:', error);
  }
};

// 格式化日期时间为YYYY-MM-DDTHH:MM:SS格式
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// 添加要求
const addRequirement = () => {
  form.requirements.push('');
};

// 删除要求
const removeRequirement = (index) => {
  if (form.requirements.length > 1) {
    form.requirements.splice(index, 1);
  } else {
    ElMessage.warning('至少保留一项要求');
  }
};

// 重置搜索
const resetSearch = () => {
  searchForm.position_name = '';
  searchForm.is_full_time = '';
  searchForm.is_closed = '';
  getRecruitmentList();
};

// 处理状态变更
const handleStatusChange = async (id, status) => {
  try {
    await service.put(`/recruitment/toggle/${id}`);
    ElMessage.success('切换招聘状态成功');
    // 不需要重新获取列表，因为switch已经更新了状态
  } catch (error) {
    ElMessage.error('切换招聘状态失败');
    console.error('切换招聘状态失败:', error);
    // 恢复原始状态
    getRecruitmentList();
  }
};

// 处理删除
const handleDeleteRecruitment = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个职位吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await service.delete(`/recruitment/delete/${id}`);
    ElMessage.success('删除职位成功');
    getRecruitmentList();
  } catch (error) {
    if (error === 'cancel') return;
    ElMessage.error('删除职位失败');
    console.error('删除职位失败:', error);
  }
};

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  getRecruitmentList();
};

const handleCurrentChange = (current) => {
  pagination.currentPage = current;
  getRecruitmentList();
};

// 初始化
onMounted(() => {
  getRecruitmentList();
});
</script>

<style scoped>
.recruitment-management {
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

.requirement-item {
  padding: 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.requirements-container {
  width: 100%;
}

.requirement-input-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.requirement-input-item .el-input {
  flex: 1;
  margin-right: 10px;
}

.detail-container {
  padding: 10px 0;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-label {
  font-weight: bold;
  margin-right: 10px;
  display: inline-block;
  width: 100px;
  text-align: right;
  vertical-align: top;
}

.detail-value {
  display: inline-block;
  width: calc(100% - 110px);
}

.detail-list {
  margin: 0;
  padding-left: 20px;
}

.detail-list li {
  margin-bottom: 5px;
}
</style>