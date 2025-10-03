<template>
  <div class="original-file-viewer">
    <el-card>
      <div class="card-header">
        <div class="file-info">
          <h2>原始文件查看器</h2>
          <div v-if="fileInfo" class="file-details">
            <el-tag type="info" size="large">{{ fileInfo.original_filename }}</el-tag>
            <span class="file-size">{{ formatFileSize(fileInfo.file_size) }}</span>
            <span class="upload-time">上传于 {{ formatDateTime(fileInfo.created_at) }}</span>
          </div>
        </div>
        <div class="action-buttons">
          <el-button @click="goBack">返回</el-button>
          <el-button 
            v-if="fileInfo?.original_oss_path" 
            type="primary" 
            @click="downloadOriginalFile"
          >
            下载原始文件
          </el-button>
          <el-button 
            v-if="fileInfo?.reduced_oss_path && fileInfo?.status === 'completed'" 
            type="success" 
            @click="downloadReducedFile"
          >
            下载降重后文件
          </el-button>
        </div>
      </div>

      <!-- 文件预览区域 -->
      <div class="file-preview-container">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 原始文件预览 -->
          <el-tab-pane label="原始文件" name="original">
            <div class="preview-content">
              <div v-if="loadingOriginal" class="loading-container">
                <el-loading-spinner size="large" />
                <p>正在加载原始文件内容...</p>
              </div>
              <div v-else-if="originalContent" class="file-content">
                <div class="content-header">
                  <el-tag type="primary">原始内容</el-tag>
                  <span class="word-count">字数: {{ originalContent.length.toLocaleString() }}</span>
                  <div class="view-controls" v-if="originalContentType === 'html' && originalHtmlContent">
                    <el-radio-group v-model="originalViewMode" size="small">
                      <el-radio-button label="rich">富文本视图</el-radio-button>
                      <el-radio-button label="text">纯文本视图</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
                <div v-if="originalViewMode === 'rich' && originalHtmlContent" 
                     class="html-content" 
                     v-html="originalHtmlContent">
                </div>
                <div v-else class="text-content">
                  {{ originalContent }}
                </div>
              </div>
              <div v-else class="empty-content">
                <el-empty description="无法加载原始文件内容" />
              </div>
            </div>
          </el-tab-pane>

          <!-- 降重后文件预览 -->
          <el-tab-pane 
            v-if="fileInfo?.status === 'completed'" 
            label="降重后文件" 
            name="reduced"
          >
            <div class="preview-content">
              <div v-if="loadingReduced" class="loading-container">
                <el-loading-spinner size="large" />
                <p>正在加载降重后文件内容...</p>
              </div>
              <div v-else-if="reducedContent" class="file-content">
                <div class="content-header">
                  <el-tag type="success">降重后内容</el-tag>
                  <span class="word-count">字数: {{ reducedContent.length.toLocaleString() }}</span>
                  <el-tag v-if="fileInfo?.reduction_rate" type="warning">
                    降重率: {{ fileInfo.reduction_rate }}%
                  </el-tag>
                  <div class="view-controls" v-if="reducedContentType === 'html' && reducedHtmlContent">
                    <el-radio-group v-model="reducedViewMode" size="small">
                      <el-radio-button label="rich">富文本视图</el-radio-button>
                      <el-radio-button label="text">纯文本视图</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
                <div v-if="reducedViewMode === 'rich' && reducedHtmlContent" 
                     class="html-content" 
                     v-html="reducedHtmlContent">
                </div>
                <div v-else class="text-content">
                  {{ reducedContent }}
                </div>
              </div>
              <div v-else class="empty-content">
                <el-empty description="无法加载降重后文件内容" />
              </div>
            </div>
          </el-tab-pane>

          <!-- 对比视图 -->
          <el-tab-pane 
            v-if="fileInfo?.status === 'completed' && originalContent && reducedContent" 
            label="对比视图" 
            name="compare"
          >
            <div class="compare-view">
              <div class="compare-header">
                <h3>内容对比</h3>
                <div class="compare-controls" v-if="(originalContentType === 'html' && originalHtmlContent) || (reducedContentType === 'html' && reducedHtmlContent)">
                  <el-radio-group v-model="compareViewMode" size="small">
                    <el-radio-button label="rich">富文本对比</el-radio-button>
                    <el-radio-button label="text">纯文本对比</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="compare-panel">
                    <div class="content-header">
                      <el-tag type="primary">原始内容</el-tag>
                      <span class="word-count">{{ originalContent.length.toLocaleString() }}字</span>
                    </div>
                    <div v-if="compareViewMode === 'rich' && originalHtmlContent" 
                         class="html-content compare-content" 
                         v-html="originalHtmlContent">
                    </div>
                    <div v-else class="text-content compare-content">
                      {{ originalContent }}
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="compare-panel">
                    <div class="content-header">
                      <el-tag type="success">降重后内容</el-tag>
                      <span class="word-count">{{ reducedContent.length.toLocaleString() }}字</span>
                    </div>
                    <div v-if="compareViewMode === 'rich' && reducedHtmlContent" 
                         class="html-content compare-content" 
                         v-html="reducedHtmlContent">
                    </div>
                    <div v-else class="text-content compare-content">
                      {{ reducedContent }}
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 文件信息 -->
          <el-tab-pane label="详细信息" name="info">
            <div class="file-info-panel">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="记录ID">{{ fileInfo?.id }}</el-descriptions-item>
                <el-descriptions-item label="用户ID">{{ fileInfo?.user_id }}</el-descriptions-item>
                <el-descriptions-item label="原始文件名" :span="2">{{ fileInfo?.original_filename }}</el-descriptions-item>
                <el-descriptions-item label="降重后文件名" :span="2">{{ fileInfo?.reduced_filename || '-' }}</el-descriptions-item>
                <el-descriptions-item label="降重强度">
                  <el-tag :type="getReductionLevelType(fileInfo?.reduction_level)">
                    {{ getReductionLevelText(fileInfo?.reduction_level) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="处理状态">
                  <el-tag :type="getStatusType(fileInfo?.status)">
                    {{ getStatusText(fileInfo?.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="文件大小">{{ formatFileSize(fileInfo?.file_size) }}</el-descriptions-item>
                <el-descriptions-item label="处理时长">{{ fileInfo?.processing_time ? fileInfo.processing_time + 's' : '-' }}</el-descriptions-item>
                <el-descriptions-item label="原文字数">{{ fileInfo?.original_length?.toLocaleString() || 0 }}</el-descriptions-item>
                <el-descriptions-item label="降重后字数">{{ fileInfo?.reduced_length?.toLocaleString() || 0 }}</el-descriptions-item>
                <el-descriptions-item label="降重率">{{ fileInfo?.reduction_rate || 0 }}%</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDateTime(fileInfo?.created_at) }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ formatDateTime(fileInfo?.updated_at) }}</el-descriptions-item>
                <el-descriptions-item label="原始文件OSS路径" :span="2">
                  <div v-if="fileInfo?.original_oss_path" class="oss-path-container">
                    <el-text class="oss-path">{{ fileInfo.original_oss_path }}</el-text>
                    <el-button 
                      size="small" 
                      type="primary" 
                      plain 
                      @click="copyToClipboard(fileInfo.original_oss_path)"
                    >
                      复制
                    </el-button>
                  </div>
                  <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item label="降重后文件OSS路径" :span="2">
                  <div v-if="fileInfo?.reduced_oss_path" class="oss-path-container">
                    <el-text class="oss-path">{{ fileInfo.reduced_oss_path }}</el-text>
                    <el-button 
                      size="small" 
                      type="primary" 
                      plain 
                      @click="copyToClipboard(fileInfo.reduced_oss_path)"
                    >
                      复制
                    </el-button>
                  </div>
                  <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item v-if="fileInfo?.error_message" label="错误信息" :span="2">
                  <el-text type="danger">{{ fileInfo.error_message }}</el-text>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from '../axios.js';

const route = useRoute();
const router = useRouter();

// 响应式数据
const fileInfo = ref(null);
const originalContent = ref('');
const reducedContent = ref('');
const originalHtmlContent = ref('');
const reducedHtmlContent = ref('');
const originalContentType = ref('text');
const reducedContentType = ref('text');
const loadingOriginal = ref(false);
const loadingReduced = ref(false);
const activeTab = ref('original');
const originalViewMode = ref('rich');
const reducedViewMode = ref('rich');
const compareViewMode = ref('rich');

// 获取文件信息
const loadFileInfo = async () => {
  try {
    const recordId = route.params.id;
    if (!recordId) {
      ElMessage.error('缺少记录ID参数');
      return;
    }

    const response = await axios.get(`/ai/admin/reduction-history-detail/${recordId}`);
    
    // 根据axios拦截器设置，response已经是data部分
    fileInfo.value = response;
    
    if (!fileInfo.value) {
      ElMessage.error('未获取到文件信息');
      return;
    }
    
    // 自动加载原始文件内容
    loadOriginalContent();
    
    // 如果有降重后文件，加载降重后内容
    if (fileInfo.value && fileInfo.value.status === 'completed' && fileInfo.value.reduced_oss_path) {
      loadReducedContent();
    }
    
  } catch (error) {
    console.error('加载文件信息失败:', error);
    ElMessage.error('加载文件信息失败');
  }
};

// 加载原始文件内容
const loadOriginalContent = async () => {
  if (!fileInfo.value?.original_oss_path) return;
  
  loadingOriginal.value = true;
  try {
    const response = await axios.get(`/ai/admin/file-content/${fileInfo.value.id}/original`);
    originalContent.value = response.content || '';
    originalHtmlContent.value = response.htmlContent || '';
    originalContentType.value = response.contentType || 'text';
  } catch (error) {
    console.error('加载原始文件内容失败:', error);
    ElMessage.error('加载原始文件内容失败');
  } finally {
    loadingOriginal.value = false;
  }
};

// 加载降重后文件内容
const loadReducedContent = async () => {
  if (!fileInfo.value?.reduced_oss_path) return;
  
  loadingReduced.value = true;
  try {
    const response = await axios.get(`/ai/admin/file-content/${fileInfo.value.id}/reduced`);
    reducedContent.value = response.content || '';
    reducedHtmlContent.value = response.htmlContent || '';
    reducedContentType.value = response.contentType || 'text';
  } catch (error) {
    console.error('加载降重后文件内容失败:', error);
    ElMessage.error('加载降重后文件内容失败');
  } finally {
    loadingReduced.value = false;
  }
};

// 下载原始文件
const downloadOriginalFile = async () => {
  try {
    if (!fileInfo.value?.original_oss_path) {
      ElMessage.error('原始文件不存在');
      console.error('原始文件OSS路径不存在:', fileInfo.value);
      return;
    }
    
    console.log('请求原始文件下载链接:', `/ai/admin/download-url/${fileInfo.value.id}/original`);
    console.log('文件信息:', {
      id: fileInfo.value.id,
      original_oss_path: fileInfo.value.original_oss_path,
      original_filename: fileInfo.value.original_filename
    });
    
    const response = await axios.get(`/ai/admin/download-url/${fileInfo.value.id}/original`);
    console.log('获取到的下载链接:', response);
    
    window.open(response.downloadUrl, '_blank');
    ElMessage.success(`开始下载原始文件: ${fileInfo.value.original_filename}`);
  } catch (error) {
    console.error('获取原始文件下载链接失败:', error);
    ElMessage.error('下载失败: ' + (error.message || '未知错误'));
  }
};

// 下载降重后文件
const downloadReducedFile = async () => {
  try {
    const response = await axios.get(`/ai/admin/download-url/${fileInfo.value.id}/reduced`);
    window.open(response.downloadUrl, '_blank');
    ElMessage.success('开始下载降重后文件');
  } catch (error) {
    console.error('获取下载链接失败:', error);
    ElMessage.error('下载失败');
  }
};

// 返回
const goBack = () => {
  router.back();
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

// 页面加载时初始化
onMounted(() => {
  loadFileInfo();
});
</script>

<style scoped>
.original-file-viewer {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.file-info h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.file-size {
  color: #909399;
  font-size: 14px;
}

.upload-time {
  color: #909399;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.file-preview-container {
  margin-top: 20px;
}

.preview-content {
  min-height: 400px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.file-content {
  padding: 20px;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;
}

.view-controls {
  margin-left: auto;
}

.word-count {
  color: #909399;
  font-size: 14px;
}

.text-content {
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
  line-height: 1.8;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 600px;
  overflow-y: auto;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.compare-content {
  max-height: 500px;
}

.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.compare-view {
  padding: 20px;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ebeef5;
}

.compare-header h3 {
  margin: 0;
  color: #303133;
}

.compare-controls {
  display: flex;
  align-items: center;
}

.compare-panel {
  height: 100%;
}

.html-content {
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
  line-height: 1.8;
  font-size: 14px;
  max-height: 600px;
  overflow-y: auto;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 富文本内容样式 */
.html-content h1, .html-content h2, .html-content h3, 
.html-content h4, .html-content h5, .html-content h6 {
  color: #303133;
  margin: 15px 0 10px 0;
  font-weight: bold;
}

.html-content h1 {
  font-size: 20px;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 5px;
}

.html-content h2 {
  font-size: 18px;
  border-bottom: 1px solid #67C23A;
  padding-bottom: 3px;
}

.html-content h3 {
  font-size: 16px;
  color: #409EFF;
}

.html-content p {
  margin: 8px 0;
  text-indent: 2em;
  line-height: 1.8;
}

.html-content img {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.html-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.html-content table th {
  background-color: #409EFF;
  color: white;
  padding: 12px 8px;
  text-align: left;
  font-weight: bold;
}

.html-content table td {
  padding: 10px 8px;
  border-bottom: 1px solid #ebeef5;
}

.html-content table tbody tr:hover {
  background-color: #f5f7fa;
}

.html-content table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.html-content ul, .html-content ol {
  margin: 10px 0;
  padding-left: 25px;
}

.html-content li {
  margin: 5px 0;
  line-height: 1.6;
}

.html-content blockquote {
  margin: 15px 0;
  padding: 10px 15px;
  background-color: #f4f4f5;
  border-left: 4px solid #409EFF;
  font-style: italic;
}

.html-content code {
  background-color: #f1f2f3;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.html-content pre {
  background-color: #282c34;
  color: #abb2bf;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 15px 0;
}

.html-content pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.file-info-panel {
  padding: 20px;
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

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .file-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .action-buttons {
    justify-content: stretch;
  }

  .action-buttons .el-button {
    flex: 1;
  }

  .compare-view .el-row {
    flex-direction: column;
  }

  .text-content {
    font-size: 13px;
    padding: 15px;
  }
}
</style>
