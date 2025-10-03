<template>
  <div class="reduction-management">
    <el-card>
      <div class="card-header">
        <h2>用户降重记录管理</h2>
        <div class="search-container">
          <el-select v-model="searchType" placeholder="搜索类型" style="width: 120px; margin-right: 10px;">
            <el-option label="用户ID" value="user_id"></el-option>
            <el-option label="文件名" value="filename"></el-option>
            <el-option label="状态" value="status"></el-option>
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="输入搜索内容"
            style="width: 200px; margin-right: 10px;"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch" style="margin-left: 10px;">重置</el-button>
        </div>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ stats.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ stats.processing }}</div>
                <div class="stat-label">处理中</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-value">{{ stats.failed }}</div>
                <div class="stat-label">失败</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选器 -->
      <div class="filter-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select v-model="statusFilter" placeholder="状态筛选" @change="loadReductionList">
              <el-option label="全部状态" value=""></el-option>
              <el-option label="处理中" value="processing"></el-option>
              <el-option label="已完成" value="completed"></el-option>
              <el-option label="失败" value="failed"></el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="levelFilter" placeholder="降重强度" @change="loadReductionList">
              <el-option label="全部强度" value=""></el-option>
              <el-option label="轻度降重" value="light"></el-option>
              <el-option label="中度降重" value="medium"></el-option>
              <el-option label="深度降重" value="heavy"></el-option>
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadReductionList"
              style="width: 100%;"
            />
          </el-col>
        </el-row>
      </div>
      
      <el-table :data="reductionList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="user_id" label="用户ID" width="100"></el-table-column>
        <el-table-column prop="original_filename" label="原始文件名" width="200" show-overflow-tooltip></el-table-column>
        <el-table-column prop="reduced_filename" label="降重后文件名" width="200" show-overflow-tooltip></el-table-column>
        <el-table-column label="降重强度" width="120">
          <template #default="scope">
            <el-tag :type="getReductionLevelType(scope.row.reduction_level)">
              {{ getReductionLevelText(scope.row.reduction_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column label="降重统计" width="180">
          <template #default="scope">
            <div v-if="scope.row.status === 'completed'">
              <div>原文: {{ scope.row.original_length?.toLocaleString() || 0 }}字</div>
              <div>降重后: {{ scope.row.reduced_length?.toLocaleString() || 0 }}字</div>
              <div>降重率: <span class="highlight">{{ scope.row.reduction_rate || 0 }}%</span></div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="处理时长" width="100">
          <template #default="scope">
            {{ scope.row.processing_time ? scope.row.processing_time + 's' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="存储类型" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.original_oss_path || scope.row.reduced_oss_path" type="success" size="small">
              OSS存储
            </el-tag>
            <el-tag v-else-if="scope.row.file_path" type="warning" size="small">
              本地存储
            </el-tag>
            <el-tag v-else type="info" size="small">
              未知
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleViewDetails(row)"
            >
              详情
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              @click="handleViewOriginalFile(row)"
            >
              查看文件
            </el-button>
            <el-button 
              v-if="row.status === 'completed' && row.file_url" 
              type="success" 
              size="small" 
              @click="handleDownload(row)"
            >
              下载
            </el-button>
            <el-button 
              v-if="row.status === 'completed' && row.original_oss_path" 
              type="warning" 
              size="small" 
              @click="handleTransferToThesis(row)"
            >
              传递
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="降重记录详情" width="60%">
      <div v-if="currentRecord" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ currentRecord.id }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ currentRecord.user_id }}</el-descriptions-item>
          <el-descriptions-item label="原始文件名" :span="2">{{ currentRecord.original_filename }}</el-descriptions-item>
          <el-descriptions-item label="降重后文件名" :span="2">{{ currentRecord.reduced_filename || '-' }}</el-descriptions-item>
          <el-descriptions-item label="降重强度">
            <el-tag :type="getReductionLevelType(currentRecord.reduction_level)">
              {{ getReductionLevelText(currentRecord.reduction_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentRecord.status)">
              {{ getStatusText(currentRecord.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(currentRecord.file_size) }}</el-descriptions-item>
          <el-descriptions-item label="处理时长">{{ currentRecord.processing_time ? currentRecord.processing_time + 's' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="原文字数">{{ currentRecord.original_length?.toLocaleString() || 0 }}</el-descriptions-item>
          <el-descriptions-item label="降重后字数">{{ currentRecord.reduced_length?.toLocaleString() || 0 }}</el-descriptions-item>
          <el-descriptions-item label="降重率">{{ currentRecord.reduction_rate || 0 }}%</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentRecord.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(currentRecord.updated_at) }}</el-descriptions-item>
          <el-descriptions-item label="原始文件OSS路径" :span="2">
            <div v-if="currentRecord.original_oss_path" class="oss-path-container">
              <el-text class="oss-path">{{ currentRecord.original_oss_path }}</el-text>
              <el-button 
                size="small" 
                type="primary" 
                plain 
                @click="copyToClipboard(currentRecord.original_oss_path)"
                style="margin-left: 8px;"
              >
                复制
              </el-button>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="降重后文件OSS路径" :span="2">
            <div v-if="currentRecord.reduced_oss_path" class="oss-path-container">
              <el-text class="oss-path">{{ currentRecord.reduced_oss_path }}</el-text>
              <el-button 
                size="small" 
                type="primary" 
                plain 
                @click="copyToClipboard(currentRecord.reduced_oss_path)"
                style="margin-left: 8px;"
              >
                复制
              </el-button>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="本地文件路径" :span="2">
            <el-text v-if="currentRecord.file_path" type="info">{{ currentRecord.file_path }}</el-text>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="下载链接" :span="2">
            <el-link v-if="currentRecord.file_url" :href="currentRecord.file_url" target="_blank" type="primary">
              点击下载文件
            </el-link>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRecord.error_message" label="错误信息" :span="2">
            <el-text type="danger">{{ currentRecord.error_message }}</el-text>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          v-if="currentRecord?.status === 'completed' && currentRecord?.file_url" 
          type="primary" 
          @click="handleDownload(currentRecord)"
        >
          下载文件
        </el-button>
      </template>
    </el-dialog>

    <!-- 传递到论文表对话框 -->
    <el-dialog v-model="transferDialogVisible" title="传递到论文表" width="50%">
      <div v-if="transferRecord" class="transfer-content">
        <el-alert 
          title="传递说明" 
          type="info" 
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <template #default>
            <p>将当前降重记录的<strong>原始文件</strong>传递到论文表中，请填写以下信息：</p>
            <p><strong>原始文件：</strong>{{ transferRecord.original_filename }}</p>
            <p><strong>文件大小：</strong>{{ formatFileSize(transferRecord.file_size) }}</p>
            <p><strong>上传时间：</strong>{{ formatDateTime(transferRecord.created_at) }}</p>
          </template>
        </el-alert>

        <el-form :model="transferForm" label-width="100px" ref="transferFormRef">
          <el-form-item 
            label="论文标题" 
            prop="title"
            :rules="[{ required: true, message: '请输入论文标题', trigger: 'blur' }]"
          >
            <el-input 
              v-model="transferForm.title" 
              placeholder="请输入论文标题"
              maxlength="255"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item 
            label="发布者" 
            prop="publisher"
            :rules="[{ required: true, message: '请输入发布者', trigger: 'blur' }]"
          >
            <el-input 
              v-model="transferForm.publisher" 
              placeholder="请输入发布者姓名"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item 
            label="分类名称" 
            prop="category_name"
            :rules="[{ required: true, message: '请输入分类名称', trigger: 'blur' }]"
          >
            <el-input 
              v-model="transferForm.category_name" 
              placeholder="请输入论文分类名称"
              maxlength="100"
              show-word-limit
            />
            <div class="form-tip">
              <el-text type="info" size="small">
                例如：计算机科学、人工智能、软件工程等
              </el-text>
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTransfer" :loading="transferLoading">
          确认传递
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import axios from '../axios.js';

const router = useRouter();

// 响应式数据
const loading = ref(false);
const reductionList = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 搜索相关
const searchType = ref('filename');
const searchKeyword = ref('');
const statusFilter = ref('');
const levelFilter = ref('');
const dateRange = ref([]);

// 统计数据
const stats = reactive({
  total: 0,
  completed: 0,
  processing: 0,
  failed: 0
});

// 详情对话框
const detailDialogVisible = ref(false);
const currentRecord = ref(null);

// 传递对话框
const transferDialogVisible = ref(false);
const transferForm = ref({
  title: '',
  publisher: '',
  category_name: ''
});
const transferRecord = ref(null);
const transferLoading = ref(false);
const transferFormRef = ref(null);

// 加载降重记录列表
const loadReductionList = async () => {
  loading.value = true;
  
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };
    
    // 添加筛选条件
    if (statusFilter.value) {
      params.status = statusFilter.value;
    }
    if (levelFilter.value) {
      params.reduction_level = levelFilter.value;
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0];
      params.end_date = dateRange.value[1];
    }
    if (searchKeyword.value) {
      params.search_type = searchType.value;
      params.search_keyword = searchKeyword.value;
    }
    
    const response = await axios.get('/ai/admin/reduction-history', { params });
    
    reductionList.value = response.data || [];
    total.value = response.pagination?.total || 0;
    
    // 更新统计数据
    if (response.stats) {
      Object.assign(stats, response.stats);
    }
    
  } catch (error) {
    console.error('加载降重记录失败:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  loadReductionList();
};

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = '';
  statusFilter.value = '';
  levelFilter.value = '';
  dateRange.value = [];
  currentPage.value = 1;
  loadReductionList();
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadReductionList();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadReductionList();
};

// 查看详情
const handleViewDetails = (record) => {
  currentRecord.value = record;
  detailDialogVisible.value = true;
};

// 查看原始文件
const handleViewOriginalFile = (record) => {
  router.push({
    name: 'OriginalFileViewer',
    params: { id: record.id }
  });
};

// 传递到论文表
const handleTransferToThesis = (record) => {
  transferRecord.value = record;
  
  // 预填充表单数据
  transferForm.value = {
    title: record.original_filename.replace(/\.[^/.]+$/, ""), // 移除文件扩展名作为默认标题
    publisher: '',
    category_name: ''
  };
  
  transferDialogVisible.value = true;
};

// 确认传递
const confirmTransfer = async () => {
  if (!transferFormRef.value) return;
  
  try {
    // 验证表单
    await transferFormRef.value.validate();
    
    transferLoading.value = true;
    
    // 调用后端API传递数据
    await axios.post('/ai/admin/transfer-to-thesis', {
      reductionRecordId: transferRecord.value.id,
      title: transferForm.value.title,
      publisher: transferForm.value.publisher,
      category_name: transferForm.value.category_name
    });
    
    ElMessage.success('传递成功！论文已添加到论文表中');
    transferDialogVisible.value = false;
    
    // 重置表单
    transferForm.value = {
      title: '',
      publisher: '',
      category_name: ''
    };
    
  } catch (error) {
    console.error('传递失败:', error);
    if (error.response?.data?.message) {
      ElMessage.error('传递失败: ' + error.response.data.message);
    } else {
      ElMessage.error('传递失败，请重试');
    }
  } finally {
    transferLoading.value = false;
  }
};

// 下载文件
const handleDownload = (record) => {
  if (!record.file_url) {
    ElMessage.error('文件下载链接不存在');
    return;
  }
  
  const downloadUrl = `${axios.defaults.baseURL || ''}${record.file_url}`;
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = record.reduced_filename || record.original_filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  ElMessage.success('开始下载文件');
};

// 删除记录
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条降重记录吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    await axios.delete(`/ai/admin/reduction-history/${id}`);
    ElMessage.success('删除成功');
    
    // 重新加载列表
    loadReductionList();
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除记录失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 工具函数
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getReductionLevelText = (level) => {
  const levelMap = {
    light: '轻度降重',
    medium: '中度降重',
    heavy: '深度降重'
  };
  return levelMap[level] || level;
};

const getReductionLevelType = (level) => {
  const typeMap = {
    light: 'info',
    medium: 'warning',
    heavy: 'danger'
  };
  return typeMap[level] || 'info';
};

const getStatusText = (status) => {
  const statusMap = {
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return statusMap[status] || status;
};

const getStatusType = (status) => {
  const typeMap = {
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  };
  return typeMap[status] || 'info';
};

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      ElMessage.success('已复制到剪贴板');
    } catch (fallbackError) {
      ElMessage.error('复制失败，请手动复制');
    }
    document.body.removeChild(textArea);
  }
};

// 页面加载时初始化
onMounted(() => {
  loadReductionList();
});
</script>

<style scoped>
.reduction-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.search-container {
  display: flex;
  align-items: center;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  padding: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-container {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.highlight {
  color: #67C23A;
  font-weight: bold;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.oss-path-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.oss-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #67C23A;
  background-color: #f0f9ff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e1f5fe;
  word-break: break-all;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

/* 传递弹窗样式 */
.transfer-content {
  padding: 10px 0;
}

.form-tip {
  margin-top: 5px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .search-container {
    flex-direction: column;
    gap: 10px;
  }

  .filter-container .el-row {
    flex-direction: column;
  }

  .filter-container .el-col {
    margin-bottom: 10px;
  }
}
</style>
