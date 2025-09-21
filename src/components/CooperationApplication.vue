<template>
  <div class="cooperation-application-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>合作申请管理</span>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-container">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-select v-model="isContacted" placeholder="联系状态">
              <el-option label="全部" value="-1"></el-option>
              <el-option label="未联系" value="0"></el-option>
              <el-option label="已联系" value="1"></el-option>
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-input
              v-model="searchKeyword"
              placeholder="请输入申请人姓名搜索"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button type="primary" @click="handleSearch">搜索</el-button>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </div>

      <!-- 申请列表 -->
      <el-table v-loading="isLoading" :data="applicationsList" style="width: 100%">
        <el-table-column prop="id" label="申请ID" width="80"></el-table-column>
        <el-table-column prop="name" label="申请人" width="120"></el-table-column>
        <el-table-column prop="phone" label="联系方式" width="150"></el-table-column>
        <el-table-column label="职位" width="150">
          <template #default="scope">
            {{ positionMap[scope.row.position] || scope.row.position }}
          </template>
        </el-table-column>
        <el-table-column prop="application_time" label="申请日期" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.application_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="is_contacted" label="联系状态" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.is_contacted === 0 ? 'warning' : 'success'"
            >
              {{ scope.row.is_contacted === 0 ? '未联系' : '已联系' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleView(scope.row)">查看详情</el-button>
            <el-button
              :type="scope.row.is_contacted === 0 ? 'success' : 'danger'"
              size="small"
              @click="handleUpdateStatus(scope.row)">
              {{ scope.row.is_contacted === 0 ? '标记为已联系' : '标记为未联系' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 申请详情弹窗 -->
    <el-dialog v-model="dialogVisible" title="合作申请详情" width="600px">
      <div v-if="currentApplication" class="application-detail">
        <el-descriptions title="基本信息" :column="1">
          <el-descriptions-item label="申请ID">{{ currentApplication.id }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentApplication.name }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ currentApplication.phone }}</el-descriptions-item>
          <el-descriptions-item label="职位">{{ positionMap[currentApplication.position] || currentApplication.position }}</el-descriptions-item>
          <el-descriptions-item label="申请日期">{{ formatDateTime(currentApplication.application_time) }}</el-descriptions-item>
          <el-descriptions-item label="联系状态">{{ currentApplication.is_contacted === 0 ? '未联系' : '已联系' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>


  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { ElMessageBox,ElMessage } from 'element-plus';
  import axios from '../axios';

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
  
  // 状态定义
  const positionMap = {
    developer: '地推专员',
    advisor: '学术顾问',
    editor: '客服专员'
  };
  const applicationsList = ref([]);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const isLoading = ref(false);
  const searchKeyword = ref('');
  const isContacted = ref('-1'); // -1: 全部, 0: 未联系, 1: 已联系
  const dialogVisible = ref(false);
  const currentApplication = ref({});
  
  // 生命周期钩子
  onMounted(() => {
    getApplicationsList();
  });

// 获取申请列表
const getApplicationsList = () => {
  isLoading.value = true;
  const params = {
    page: currentPage.value,
    limit: pageSize.value
  };

  // 添加搜索参数
  if (searchKeyword.value) {
    params.name = searchKeyword.value;
  }

  if (isContacted.value !== '-1') {
    params.is_contacted = parseInt(isContacted.value);
  }

  axios.get('/cooperation/list', { params })
    .then(response => {
      applicationsList.value = response.list;
      total.value = response.total;
    })
    .catch(error => {
      console.error('获取合作申请列表失败:', error);
      ElMessage.error('获取合作申请列表失败');
    })
    .finally(() => {
      isLoading.value = false;
    });
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  getApplicationsList();
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  getApplicationsList();
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
  getApplicationsList();
};

// 查看详情
const handleView = (application) => {
  currentApplication.value = { ...application };
  dialogVisible.value = true;
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

// 更新联系状态
const handleUpdateStatus = (application) => {
  const newStatus = application.is_contacted === 0 ? 1 : 0;
  const confirmMessage = newStatus === 1 ? '确定要标记为已联系吗？' : '确定要标记为未联系吗？';

  ElMessageBox.confirm(confirmMessage, '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const currentUser = getUserInfo();
      axios.put(`/cooperation/update/${application.id}`, {
        is_contacted: newStatus,
        update_by: currentUser.id,
        update_name: currentUser.username
      }).then(() => {
      ElMessage.success('更新状态成功');
      getApplicationsList();
    }).catch(error => {
      console.error('更新状态失败:', error);
      ElMessage.error('更新状态失败');
    });
  }).catch(() => {
    // 用户取消操作
  });
};

</script>

<style scoped>
.cooperation-application-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.application-detail {
  padding: 10px 0;
}
</style>