<template>
  <div class="paper-management">
    <el-card>
      <div class="card-header">
        <h2>论文管理</h2>
        <div class="search-container">
          <el-select v-model="searchType" placeholder="搜索类型" style="width: 120px; margin-right: 10px;">
            <el-option label="分类" value="category"></el-option>
            <el-option label="标题" value="title"></el-option>
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="输入搜索内容"
            style="width: 200px; margin-right: 10px;"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button type="primary" @click="handleCreate" style="margin-left: 10px;">新建论文</el-button>
        </div>
      </div>
      
      <el-table :data="paperList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="标题" width="200"></el-table-column>
        <el-table-column prop="publisher" label="发布人" width="150"></el-table-column>
        <el-table-column prop="category_name" label="分类" width="150"></el-table-column>
        <el-table-column label="发表时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.publish_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="views" label="浏览量" width="100"></el-table-column>
        <el-table-column prop="likes" label="点赞数" width="100"></el-table-column>
        <el-table-column prop="favorites" label="收藏数" width="100"></el-table-column>
        <el-table-column label="论文文件" width="150">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleViewFile(scope.row.thesis_file)" v-if="scope.row.thesis_file">查看文件</el-button>
            <span v-else>无文件</span>
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
          :total="totalPapers"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑论文对话框 -->
    <el-dialog v-model="dialogVisible" :title="isCreate ? '新建论文' : '编辑论文'">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title"></el-input>
        </el-form-item>
        <el-form-item label="发布人" prop="publisher">
          <el-input v-model="form.publisher" :disabled="true"></el-input>
        </el-form-item>
        <el-form-item label="分类名称" prop="category_name">
          <el-select v-model="form.category_name" placeholder="请选择分类">
            <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="论文文件" prop="thesis_file">
          <el-upload
            class="upload-demo"
            :action="getUploadUrl()"
            :on-success="handleFileUploadSuccess"
            :before-upload="beforeUpload"
            :file-list="fileList"
            :auto-upload="true"
            :with-credentials="false"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                仅支持PDF格式文件
              </div>
            </template>
          </el-upload>
          <div v-if="form.thesis_file" class="file-preview">
            <a :href="form.thesis_file" target="_blank">已上传: {{ getFileName(form.thesis_file) }}</a>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%">
      <span>确定要删除此论文吗？</span>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定</el-button>
      </template>
    </el-dialog>

    <!-- 文件预览对话框 -->
    <el-dialog v-model="filePreviewVisible" title="论文预览" width="80%" :fullscreen="false">
      <div class="file-preview-container">
        <!-- 加载指示器 -->
        <div v-if="fileLoading && !fileLoadError" class="loading-container">
          <el-icon class="rotating">
            <Loading />
          </el-icon>
          <p>正在加载文件...</p>
        </div>

        <!-- 使用vue-pdf-embed组件预览PDF -->
        <vue-pdf-embed
          v-if="currentFileUrl && !fileLoadError && !fileLoading"
          :source="currentFileUrl"
          class="pdf-embed"
          @load="handlePdfLoad"
          @error="handlePdfError"
        />
        
        <!-- 错误信息显示 -->
        <div v-if="fileLoadError" class="error-message">
          <el-icon class="warning-icon">
            <Warning />
          </el-icon>
          <p>{{ fileLoadErrorMessage }}</p>
          <div class="error-actions">
            <el-button type="primary" size="small" @click="reloadFilePreview">重新加载</el-button>
            <el-button size="small" @click="downloadFile">尝试下载</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="filePreviewVisible = false">关闭</el-button>
        <el-button v-if="currentFileUrl && !fileLoadError" type="primary" @click="downloadFile">下载文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElIcon } from 'element-plus';
import { Warning, Loading } from '@element-plus/icons-vue';
import VuePdfEmbed from 'vue-pdf-embed';
import service from '../axios';

// 动态获取上传URL
const getUploadUrl = () => {
  // 从axios配置中获取baseURL，如果没有则使用默认值
  const baseURL = service.defaults.baseURL || 'http://localhost:3000';
  return `${baseURL}/api/upload/single`;
};


// 获取当前登录用户信息
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      return {
        id: parsed.id || parsed.user_id || '',
        username: parsed.username || parsed.name || 'admin',
        real_name: parsed.real_name || '管理员'
      };
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
  return { id: '', username: 'admin' };
};

// 表格数据和分页
const paperList = ref([]);
const totalPapers = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchType = ref('category'); // 默认为分类搜索
const searchKeyword = ref('');

// 对话框状态
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const filePreviewVisible = ref(false);
const currentPaperId = ref(null);
const currentFileUrl = ref('');
const originalFileUrl = ref(''); // 保存原始URL用于下载
const isCreate = ref(true);

// 文件预览状态
const fileLoadError = ref(false);
const fileLoadErrorMessage = ref('');
const fileLoading = ref(false);

// 文件上传相关
const fileList = ref([]);

// 导入专业分类数据
const categories = ref([]);

// 获取分类列表
const getCategories = async () => {
  try {
    const response = await service.get('/category/list');
    categories.value = response || [];
  } catch (error) {
    ElMessage.error('获取分类列表失败');
    console.error('获取分类列表失败:', error);
  }
};

// 表单数据
const form = reactive({
  title: '',
  publisher: '',
  category_name: '',
  thesis_file: ''
});

// 表单验证
const rules = reactive({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  publisher: [{ required: true, message: '请输入发布人', trigger: 'blur' }],
  thesis_file: [{ required: true, message: '请上传论文文件', trigger: 'change' }]
});

const formRef = ref(null);

// 格式化日期为YYYY-MM-DDTHH:MM:SS格式
const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// 获取文件名
const getFileName = (url) => {
  if (!url) return '';
  return url.split('/').pop().split('?')[0];
};

// 文件上传前检查
const beforeUpload = (file) => {
  const isPDF = file.type === 'application/pdf';
  if (!isPDF) {
    ElMessage.error('只能上传PDF格式的文件');
  }
  return isPDF;
};

// 文件上传成功处理
const handleFileUploadSuccess = (response, file) => {
    if (response && response.url) {
      form.thesis_file = response.url;
      
      // 如果标题为空，自动设置为文件名（去掉扩展名）
      if (!form.title.trim()) {
        const fileName = file.name;
        // 去掉文件扩展名
        const titleFromFile = fileName.replace(/\.[^/.]+$/, "");
        form.title = titleFromFile;
      }
      
      ElMessage.success('文件上传成功');
    } else {
      ElMessage.error('文件上传失败，请重试');
    }
  };

// 获取论文列表
const getPaperList = async () => {
  
    try {
      const currentUser = getUserInfo();
      const params = {
        page: currentPage.value,
        limit: pageSize.value,
        publisher:currentUser.real_name
      };

      // 根据搜索类型设置不同的参数
      if (searchType.value === 'category') {
        params.category_name = searchKeyword.value || undefined;
      } else if (searchType.value === 'title') {
        params.title = searchKeyword.value || undefined;
      }

      const response = await service.get('/thesis/list', {
        params: params
      });
      paperList.value = response.list || [];
      
      totalPapers.value = response.total || 0;
    } catch (error) {
      ElMessage.error('获取论文列表失败');
      console.error('获取论文列表失败:', error);
    }
  };

// 搜索论文
const handleSearch = () => {
  currentPage.value = 1;
  getPaperList();
};

// 新建论文
const handleCreate = () => {
  isCreate.value = true;
  currentPaperId.value = null;
  const currentUser = getUserInfo();
  form.title = '';
  form.publisher = currentUser.real_name || currentUser.username;
  form.category_name = '';
  form.thesis_file = '';
  fileList.value = [];
  dialogVisible.value = true;
};

// 编辑论文
const handleEdit = async (id) => {
    isCreate.value = false;
    currentPaperId.value = id;
    try {
      const response = await service.get(`/thesis/${id}`);
      if (response.data) {
        const paper = response.data;
        form.title = paper.title || '';
        form.publisher = paper.publisher || '';
        form.category_name = paper.category_name || '';
        form.thesis_file = paper.thesis_file || '';
        fileList.value = form.thesis_file ? [{ name: getFileName(form.thesis_file), url: form.thesis_file }] : [];
        dialogVisible.value = true;
      }
    } catch (error) {
      ElMessage.error('获取论文信息失败');
      console.error('编辑论文失败:', error);
    }
  };

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();
    if (isCreate.value) {
      const currentUser = getUserInfo();
      const response = await service.post('/thesis/add', {
        title: form.title,
        publisher: form.publisher,
        category_name: form.category_name || undefined,
        thesis_file: form.thesis_file,
        create_by: currentUser.id,
        create_name: currentUser.username
      });
      ElMessage.success('创建论文成功');
    } else {
      const currentUser = getUserInfo();
      await service.put(`/thesis/edit/${currentPaperId.value}`, {
        title: form.title,
        publisher: form.publisher,
        category_name: form.category_name || undefined,
        thesis_file: form.thesis_file,
        update_by: currentUser.id,
        update_name: currentUser.username
      });
      ElMessage.success('更新论文成功');
    }
    dialogVisible.value = false;
    getPaperList();
  } catch (error) {
    ElMessage.error(isCreate ? '创建论文失败' : '更新论文失败');
    console.error('提交表单失败:', error);
  }
};

// 将OSS URL转换为代理URL
const getProxyUrl = (originalUrl) => {
  if (!originalUrl) return '';
  
  // 如果已经是代理URL，直接返回
  if (originalUrl.includes('/api/upload/proxy?')) {
    return originalUrl;
  }
  
  // 将OSS URL作为查询参数通过代理访问
  const encodedUrl = encodeURIComponent(originalUrl);
  return `/api/upload/proxy?url=${encodedUrl}`;
};

// 查看文件
const handleViewFile = (fileUrl) => {
  console.log('原始文件URL:', fileUrl);
  
  // 保存原始URL用于下载
  originalFileUrl.value = fileUrl;
  
  // 使用代理URL避免CORS问题
  const proxyUrl = getProxyUrl(fileUrl);
  console.log('代理文件URL:', proxyUrl);
  
  currentFileUrl.value = proxyUrl;
  filePreviewVisible.value = true;
  fileLoading.value = true;
  
  // 重置错误状态
  fileLoadError.value = false;
  fileLoadErrorMessage.value = '';
};



// PDF加载成功处理
const handlePdfLoad = () => {
  console.log('PDF加载成功');
  fileLoadError.value = false;
  fileLoading.value = false;
};

// PDF加载错误处理
const handlePdfError = (error) => {
  console.error('PDF加载错误:', error);
  fileLoadError.value = true;
  fileLoading.value = false;
  fileLoadErrorMessage.value = error.message || '文件加载失败，可能是网络问题、文件格式不支持或文件不存在。';
};

// 重新加载文件预览
const reloadFilePreview = () => {
  fileLoadError.value = false;
  fileLoading.value = true;
  
  // 强制重新加载
  const tempUrl = currentFileUrl.value;
  currentFileUrl.value = '';
  setTimeout(() => {
    currentFileUrl.value = tempUrl;
  }, 100);
};

// 下载文件
const downloadFile = () => {
  // 使用原始URL进行下载，如果失败则尝试代理URL
  const downloadUrl = originalFileUrl.value || currentFileUrl.value;
  window.open(downloadUrl, '_blank');
};

// 删除论文
const handleDelete = (id) => {
  currentPaperId.value = id;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  try {
    const currentUser = getUserInfo();
      await service.delete(`/thesis/delete/${currentPaperId.value}`, {
        data: {
          delete_by: currentUser.id,
          delete_name: currentUser.username
        }
      });
    ElMessage.success('删除论文成功');
    deleteDialogVisible.value = false;
    getPaperList();
  } catch (error) {
    ElMessage.error('删除论文失败');
    console.error(error);
  }
};

// 分页事件
const handleSizeChange = (val) => {
  pageSize.value = val;
  getPaperList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  getPaperList();
};

onMounted(() => {
  getPaperList();
  getCategories();
});
</script>

<style scoped>
.paper-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.file-preview {
  margin-top: 10px;
  color: #1890ff;
}

.file-preview-container {
  width: 100%;
  height: calc(100vh - 200px);
  overflow-y: auto;
  position: relative;
}

.pdf-embed {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
}

/* 加载容器样式 */
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  text-align: center;
  z-index: 10;
}

.loading-container .el-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.loading-container p {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

/* 旋转动画 */
.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 错误信息样式 */
.error-message {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  z-index: 10;
  border-radius: 8px;
}

.error-message .warning-icon {
  font-size: 64px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-message p {
  margin-bottom: 24px;
  color: #606266;
  font-size: 16px;
  line-height: 1.6;
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.error-actions .el-button {
  min-width: 100px;
}

/* 增强表格行悬停效果 */
el-table__row:hover {
  background-color: #f5f7fa;
}
  


/* 按钮样式优化 */
el-button {
  margin-right: 8px;
}

/* 对话框标题样式 */
el-dialog__title {
  font-weight: bold;
}

/* 表格头样式 */
el-table__header th {
  background-color: #f5f7fa;
  font-weight: bold;
}
</style>