<template>
  <div class="file-compression">
    <el-card>
      <h2>文件压缩工具</h2>
      
      <!-- 文件选择区域 -->
      <div 
        class="drop-area" 
        :class="{ active: isDragging }"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <p>拖放文件到此处或</p>
        <el-button type="primary" @click="selectFiles">选择文件</el-button>
        <input type="file" ref="fileInput" multiple @change="handleFileChange" class="file-input" webkitdirectory directory />
      </div>
      
      <!-- 选中文件列表 -->
      <div class="file-list" v-if="selectedFiles.length > 0">
        <h3>选中文件 ({{ selectedFiles.length }})</h3>
        <el-list>
          <el-list-item v-for="(file, index) in selectedFiles" :key="index">
            <div class="file-info">
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <el-button 
                type="text" 
                icon="Delete" 
                class="delete-btn" 
                @click="removeFile(index)"
              >x</el-button>
            </div>
          </el-list-item>
        </el-list>
        
        <div class="compression-controls">
          <el-input 
            v-model="zipName" 
            placeholder="压缩包名称" 
            prefix-icon="Document"
            class="zip-name-input"
          ></el-input>
          <el-button 
            type="primary" 
            @click="compressFiles" 
            :loading="isCompressing"
            :disabled="!selectedFiles.length || isCompressing"
          >
            <el-icon v-if="!isCompressing"><Upload /></el-icon>
            <el-icon v-if="isCompressing"><Loading /></el-icon>
            {{ isCompressing ? '压缩中...' : '开始压缩' }}
          </el-button>
        </div>
      </div>
      
      <!-- 压缩进度 -->
      <div class="progress-container" v-if="showProgress">
        <h3>压缩进度</h3>
        <el-progress :percentage="compressionProgress" :status="progressStatus"></el-progress>
        <p class="progress-text">{{ progressText }}</p>
      </div>
      
      <!-- 压缩结果 -->
      <div class="compression-result" v-if="compressionResult">
        <el-alert 
          :title="compressionResult.success ? '压缩成功' : '压缩失败'" 
          :type="compressionResult.success ? 'success' : 'error'"
          show-icon
        >
       
         
         
        </el-alert>
           <div class="result-content" v-if="compressionResult.success">
              <div class="result-info">
                <p class="size-text">压缩包大小: {{ compressionResult.size ? formatFileSize(compressionResult.size) : '未知大小' }}</p>
              </div>
              <el-button 
                type="primary" 
                icon="Download" 
                @click="downloadZip"
                class="download-btn"
              >
                下载压缩包
              </el-button>
            </div>
            <p class="error-message" v-else>{{ compressionResult.message }}</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElProgress, ElAlert } from 'element-plus';
import { UploadFilled, Document, Delete, Upload, Loading, Download } from '@element-plus/icons-vue';
import JSZip from 'jszip';

// 文件选择相关
const fileInput = ref(null);
const selectedFiles = ref([]);
const isDragging = ref(false);
const zipName = ref('compressed_files');

// 压缩相关
const isCompressing = ref(false);
const compressionProgress = ref(0);
const progressText = ref('');
const progressStatus = ref('');
const showProgress = ref(false);
const compressionResult = ref(null);
const zipBlob = ref(null);

// 拖放事件处理
const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragEnter = () => {
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  // 检查是否所有拖动元素都已离开
  if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false;
  }
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = e.dataTransfer.files;
  if (files.length) {
    handleFiles(files);
  }
};

// 文件选择处理
const selectFiles = () => {
  fileInput.value.click();
};

const handleFileChange = (e) => {
  const files = e.target.files;
  if (files.length) {
    handleFiles(files);
    // 重置input值，以便可以重复选择相同的文件
    fileInput.value.value = '';
  }
};

// 处理选中的文件
const handleFiles = (files) => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = file.webkitRelativePath || file.name;
    // 检查文件是否已存在（考虑相对路径）
    const exists = selectedFiles.value.some(f => 
      (f.webkitRelativePath || f.name) === relativePath && f.size === file.size
    );
    
    if (!exists) {
      selectedFiles.value.push(file);
    } else {
      ElMessage.warning(`文件 "${relativePath}" 已存在`);
    }
  }
};

// 移除文件
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 压缩文件
const compressFiles = async () => {
  if (!selectedFiles.value.length) {
    ElMessage.warning('请先选择文件');
    return;
  }
  
  // 重置状态
  isCompressing.value = true;
  showProgress.value = true;
  compressionProgress.value = 0;
  progressText.value = '准备压缩...';
  progressStatus.value = 'processing';
  compressionResult.value = null;
  
  try {
    const zip = new JSZip();
    let totalFiles = selectedFiles.value.length;
    let processedFiles = 0;
    
    // 添加文件到压缩包并跟踪进度
    for (const file of selectedFiles.value) {
          processedFiles++;
          
          // 更新进度
          const progress = Math.round((processedFiles / totalFiles) * 100);
          compressionProgress.value = progress;
          progressText.value = `正在压缩: ${file.name} (${processedFiles}/${totalFiles})`;
          
          // 将文件添加到压缩包（保留目录结构）
          const relativePath = file.webkitRelativePath || file.name;
          const fileContent = await readFileAsArrayBuffer(file);
          zip.file(relativePath, fileContent);
          
          // 短暂延迟以允许UI更新
          await new Promise(resolve => setTimeout(resolve, 50));
        }
    
    // 生成压缩包
    progressText.value = '正在生成压缩包...';
    const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      // 更新总体进度（包括压缩过程）
      const overallProgress = Math.round(metadata.percent);
      compressionProgress.value = overallProgress;
      progressText.value = `压缩中: ${overallProgress}%`;
    });
    
    zipBlob.value = content;
    
    // 压缩完成
    compressionProgress.value = 100;
    progressStatus.value = 'success';
    progressText.value = '压缩完成!';
    
    // 保存压缩结果
    compressionResult.value = {
      success: true,
      size: content.size,
      name: `${zipName.value}.zip`
    };
    console.log('压缩成功结果对象:', compressionResult.value);
    showProgress.value = false;
    
    ElMessage.success('文件压缩成功');
  } catch (error) {
    console.error('压缩失败:', error);
    progressStatus.value = 'exception';
    progressText.value = '压缩失败';
    compressionResult.value = {
      success: false,
      message: error.message || '文件压缩过程中发生错误'
    };
    showProgress.value = false;
    ElMessage.error('文件压缩失败: ' + (error.message || '未知错误'));
  } finally {
    isCompressing.value = false;
  }
};

// 读取文件内容
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

// 下载压缩包
const downloadZip = () => {
  if (!zipBlob.value || !compressionResult.value) return;
  
  const url = URL.createObjectURL(zipBlob.value);
  const a = document.createElement('a');
  a.href = url;
  a.download = compressionResult.value.name;
  document.body.appendChild(a);
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

onMounted(() => {
  // 检查JSZip是否加载成功
  if (typeof JSZip === 'undefined') {
    ElMessage.error('JSZip库加载失败，请安装依赖: npm install jszip');
  }
});
</script>

<style scoped>
.file-compression {
  padding: 20px;
}

div.drop-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

div.drop-area.active {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
}
p {
  margin: 0;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.file-input {
  display: none;
}

.file-list {
  margin-top: 20px;
  margin-bottom: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.file-name {
  flex: 1;
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  margin-left: 16px;
  color: #606266;
  font-size: 12px;
  white-space: nowrap;
}

.delete-btn {
  color: #f56c6c;
}

.compression-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.zip-name-input {
  width: 250px;
}

.progress-container {
  margin: 20px 0;
}

.progress-text {
  margin-top: 8px;
  text-align: center;
  color: #606266;
}

.compression-result {
  margin-top: 20px;
}

.result-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #f0f9eb;
  border-radius: 8px;
  border: 1px solid #e1f3d8;
  margin-top: 10px;
}

.result-info {
  flex: 1;
}

.size-text {
  color: #1f6f4a;
  font-size: 14px;
  margin: 0;
}

.download-btn {
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-message {
  color: #e53e3e;
  padding: 16px;
  background-color: #fff5f5;
  border-radius: 8px;
  border: 1px solid #ffe3e3;
  margin: 0;
  font-size: 14px;
}
</style>