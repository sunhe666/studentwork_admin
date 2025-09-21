<template>
  <div class="log-management">
    <el-card>
      <div class="card-header">
        <h2>日志管理</h2>
        <el-button type="danger" size="small" @click="handleBatchDelete" :disabled="selectedLogIds.length === 0">批量删除</el-button>
      </div>

      <div class="filter-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input v-model="username" placeholder="操作用户名" clearable />          </el-col>
          <el-col :span="6">
            <el-select v-model="operation" placeholder="操作类型" clearable>
              <el-option label="登录" value="登录"></el-option>
              <el-option label="添加" value="添加"></el-option>
              <el-option label="修改" value="修改"></el-option>
              <el-option label="删除" value="删除"></el-option>
              <el-option label="查询" value="查询"></el-option>
            </el-select>          </el-col>
          <el-col :span="6">
            <el-select v-model="resourceType" placeholder="操作资源类型" clearable>
              <el-option label="管理员" value="管理员"></el-option>
              <el-option label="员工" value="员工"></el-option>
              <el-option label="角色" value="角色"></el-option>
              <el-option label="菜单" value="菜单"></el-option>
              <el-option label="内容" value="内容"></el-option>
            </el-select>          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              clearable
            />          </el-col>
          <el-col :span="2">
            <el-button type="primary" @click="fetchLogList">查询</el-button>          </el-col>
        </el-row>
      </div>

      <el-table :data="logList" style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="username" label="操作用户" width="180"></el-table-column>
        <el-table-column prop="operation" label="操作描述" width="200"></el-table-column>
        <el-table-column prop="resource_type" label="资源类型" width="150"></el-table-column>
        <el-table-column prop="resource_name" label="资源名称" width="150"></el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="180"></el-table-column>
        <el-table-column label="操作时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.operation_time) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleDetail(row.id)">详情</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalLogs"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="日志详情" width="60%">
      <div v-if="currentLog" class="log-detail">
        <el-descriptions title="日志信息" :column="2">
          <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ currentLog.user_id }}</el-descriptions-item>
          <el-descriptions-item label="操作用户">{{ currentLog.username }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ currentLog.operation }}</el-descriptions-item>
          <el-descriptions-item label="资源类型">{{ currentLog.resource_type }}</el-descriptions-item>
          <el-descriptions-item label="资源ID">{{ currentLog.resource_id }}</el-descriptions-item>
          <el-descriptions-item label="资源名称">{{ currentLog.resource_name }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip_address }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatDate(currentLog.operation_time) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentLog.status === 1 ? '成功' : '失败' }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2">{{ currentLog.error_message || '无' }}</el-descriptions-item>
          <el-descriptions-item label="操作详情" :span="2">
            <pre>{{ currentLog.operation_detail ? JSON.stringify(currentLog.operation_detail, null, 2) : '无' }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%">
      <span>{{ deleteDialogType === 'single' ? '确定要删除此日志吗？' : '确定要删除选中的 ' + selectedLogIds.length + ' 条日志吗？' }}</span>
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

// 表格数据和分页
const logList = ref([]);
const totalLogs = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);

// 筛选条件
const username = ref('');
const operation = ref('');
const resourceType = ref('');
const dateRange = ref([]);

// 详情对话框状态
const detailDialogVisible = ref(false);
const currentLog = ref(null);

// 删除对话框状态
const deleteDialogVisible = ref(false);
const deleteDialogType = ref('single'); // 'single' 或 'batch'
const currentDeleteId = ref(null);
const selectedLogIds = ref([]);

// 获取当前登录用户信息
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

// 格式化日期为YYYY-MM-DDTHH:MM:SS格式
const formatDate = (dateString) => {
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

// 获取日志列表
const fetchLogList = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };

    // 添加筛选条件
    if (username.value) params.username = username.value;
    if (operation.value) params.operation = operation.value;
    if (resourceType.value) params.resource_type = resourceType.value;
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_time = dateRange.value[0];
      params.end_time = dateRange.value[1];
    }

    const response = await service.get('/log/list', { params });
    logList.value = response.list;
    totalLogs.value = response.total;
  } catch (error) {
    ElMessage.error('获取日志列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 查看日志详情
const handleDetail = async (id) => {
  try {
    const response = await service.get(`/log/detail/${id}`);
    currentLog.value = response.data;
    detailDialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取日志详情失败');
    console.error(error);
  }
};

// 删除单条日志
const handleDelete = (id) => {
  currentDeleteId.value = id;
  deleteDialogType.value = 'single';
  deleteDialogVisible.value = true;
};

// 批量删除日志
const handleBatchDelete = () => {
  if (selectedLogIds.value.length === 0) {
    ElMessage.warning('请选择要删除的日志');
    return;
  }
  deleteDialogType.value = 'batch';
  deleteDialogVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
  try {
    // 获取当前登录用户信息
    const currentUser = getUserInfo();
    
    if (deleteDialogType.value === 'single') {
      // 将delete_by和delete_name作为查询参数传递
      await service.delete(`/log/delete/${currentDeleteId.value}`, {
        params: {
          delete_by: currentUser?.id || null,
          delete_name: currentUser?.username || null
        }
      });
      ElMessage.success('删除日志成功');
    } else {
      await service.delete('/log/batchDelete', {
        data: {
          ids: selectedLogIds.value,
          delete_by: currentUser?.id || null,
          delete_name: currentUser?.username || null
        }
      });
      ElMessage.success(`批量删除 ${selectedLogIds.value.length} 条日志成功`);
      selectedLogIds.value = [];
    }
    deleteDialogVisible.value = false;
    fetchLogList();
  } catch (error) {
    ElMessage.error('删除日志失败');
    console.error(error);
  }
};

// 处理表格选择事件
const handleSelectionChange = (selection) => {
  selectedLogIds.value = selection.map(item => item.id);
};

// 分页事件
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchLogList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchLogList();
};

onMounted(() => {
  fetchLogList();
});
</script>

<style scoped>
.log-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.log-detail {
  padding: 10px;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.el-table__fixed-right {
  height: 100% !important;
}
</style>