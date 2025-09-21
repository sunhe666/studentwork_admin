<template>
  <el-card class="conversion-card">
    <div class="card-header">
      <h2>文件格式转换工具</h2>
      <p>支持多种格式之间的转换，目前支持: DOCX→PDF, 图片格式互转, HTML→PDF</p>
    </div>

    <div class="upload-area">
      <el-upload
        ref="upload"
        class="upload-demo"
        action=""
        :on-change="handleFileChange"
        :auto-upload="false"
        :multiple="true"
        :show-file-list="false"
      >
        <el-button type="primary" icon="UploadFilled">选择文件</el-button>
      </el-upload>

      <div class="format-selection">
        <el-select v-model="targetFormat" placeholder="选择目标格式">
          <el-option label="PDF" value="pdf"></el-option>
          <el-option label="PNG" value="png"></el-option>
          <el-option label="JPG" value="jpg"></el-option>
          <el-option label="HTML" value="html"></el-option>
        </el-select>
      </div>

      <el-button
        type="success"
        icon="Refresh"
        class="convert-btn"
        @click="convertFiles"
        :disabled="!selectedFiles.length || !targetFormat"
      >
        开始转换
      </el-button>
    </div>

    <div v-if="selectedFiles.length" class="selected-files">
      <h3>已选择文件 ({{ selectedFiles.length }})</h3>
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
            ></el-button>
          </div>
        </el-list-item>
      </el-list>
    </div>

    <div v-if="conversionProgress > 0 && conversionProgress < 99" class="progress-area">
      <el-progress :percentage="conversionProgress" status="active"></el-progress>
      <p class="progress-text">{{ progressText }}</p>
    </div>

    <div v-if="conversionResults.length && conversionProgress === 100" class="results-area">
      <h3 style="margin-top: 20px">转换完成</h3>
      <el-list>
        <el-list-item v-for="(result, index) in conversionResults" :key="index">
          <div class="result-item">
            <span class="result-name">{{ result.originalName }} → {{ result.convertedName }}</span>
            <el-button
              type="primary"
              icon="Download"
              class="download-btn"
              @click="downloadFile(result.url, result.convertedName)"
            ></el-button>
          </div>
        </el-list-item>
      </el-list>
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElProgress, ElButton, ElIcon, ElSelect, ElOption, ElUpload, ElCard } from 'element-plus';
import { UploadFilled, Document, Delete, Refresh, Download } from '@element-plus/icons-vue';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';

// 状态管理
const selectedFiles = ref([]);
const targetFormat = ref('');
const conversionProgress = ref(0);
const progressText = ref('');
const conversionResults = ref([]);

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

// 文件选择处理
const handleFileChange = (file) => {
  // 检查文件是否已存在
  const exists = selectedFiles.value.some(f => f.name === file.name && f.size === file.size);
  if (!exists) {
    selectedFiles.value.push(file.raw);
    ElMessage.success(`已添加: ${file.name}`);
  } else {
    ElMessage.warning(`文件 ${file.name} 已存在`);
  }
};

// 转换所有文件
const convertFiles = async () => {
  if (!selectedFiles.value.length || !targetFormat.value) return;
  conversionProgress.value = 0;
  conversionResults.value = [];
  progressText.value = '准备转换...';

  try {
    const conversionPromises = selectedFiles.value.map(file => convertFile(file, targetFormat.value));
    await Promise.all(conversionPromises);
    conversionProgress.value = 100;
    progressText.value = '所有文件转换完成!';
    ElMessage.success('全部文件转换成功');
  } catch (error) {
    ElMessage.error(`转换失败: ${error.message}`);
  }
};

// 单个文件转换
const convertFile = async (file, targetFormat) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  progressText.value = `正在转换: ${file.name}`;

  try {
    let convertedBlob, convertedName;

    switch (true) {
      case fileExtension === 'docx' && targetFormat === 'pdf':
        convertedBlob = await convertDocxToPdf(file);
        convertedName = `${file.name.replace('.docx', '')}.pdf`;
        break;
      case ['png', 'jpg', 'jpeg'].includes(fileExtension) && ['png', 'jpg'].includes(targetFormat):
        convertedBlob = await convertImageFormat(file, targetFormat);
        convertedName = `${file.name.replace(/\.[^/.]+$/, '')}.${targetFormat}`;
        break;
      case fileExtension === 'html' && targetFormat === 'pdf':
        convertedBlob = await convertHtmlToPdf(file);
        convertedName = `${file.name.replace('.html', '')}.pdf`;
        break;
      default:
        throw new Error(`不支持的转换: ${fileExtension} → ${targetFormat}`);
    }

    const url = URL.createObjectURL(convertedBlob);
    conversionResults.value.push({ originalName: file.name, convertedName, url });
    conversionProgress.value = Math.min(99, (conversionResults.value.length / selectedFiles.value.length) * 100);
  } catch (error) {
    ElMessage.error(`转换 ${file.name} 失败: ${error.message}`);
    throw error;
  }
};

// 下载文件
const downloadFile = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// DOCX转PDF - 优化格式和样式保留
const convertDocxToPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        // 使用mammoth转换DOCX为HTML，并保留样式
        const result = await mammoth.convertToHtml({
          arrayBuffer
        }, {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
            "p[style-name='Quote'] => blockquote:fresh",
            "p[style-name='Code'] => pre:fresh > code"
          ]
        });
        const html = result.value;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const tempDiv = document.createElement('div');
        
        // 为临时div添加基础样式和字体设置
        tempDiv.innerHTML = `
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Noto Sans SC', sans-serif; line-height: 1.6; color: #333; }
            h1, h2, h3, h4, h5, h6 { margin: 1em 0 0.5em; font-weight: bold; }
            p { margin-bottom: 1em; }
            ul, ol { margin: 1em 0 1em 2em; }
            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            img { max-width: 100%; height: auto; }
            pre { background: #f5f5f5; padding: 1em; overflow-x: auto; margin: 1em 0; }
            code { font-family: monospace; }
          </style>
          ${html}
        `;
        
        // 设置div尺寸和位置
        tempDiv.style.width = '210mm';
        tempDiv.style.padding = '10mm';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.backgroundColor = 'white';
        document.body.appendChild(tempDiv);

        // 等待字体加载和样式应用
        await new Promise(resolve => setTimeout(resolve, 500));

        // 计算内容总高度和页面高度
        const totalHeight = tempDiv.scrollHeight;
        const pageHeight = 297; // A4纸高度(mm)
        const scale = 2; // 提高缩放以获得更高质量
        const dpiRatio = 72 / 25.4; // 72dpi转换为mm
        const pageHeightPx = pageHeight * dpiRatio * scale;

        // 计算页数
        const pageCount = Math.ceil(totalHeight / pageHeightPx);

        for (let page = 0; page < pageCount; page++) {
          // 设置当前页的偏移量
          tempDiv.style.top = `-${page * pageHeightPx / scale}px`;

          // 优化html2canvas配置
          const canvas = await html2canvas(tempDiv, {
            scale: scale,
            useCORS: true,
            windowWidth: 210 * dpiRatio * scale,
            windowHeight: pageHeight * dpiRatio * scale,
            x: 0,
            y: page * pageHeightPx,
            logging: false,
            letterRendering: true,
            imageTimeout: 15000
          });

          // 添加到PDF
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (page > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }

        const pdfBlob = pdf.output('blob');
        document.body.removeChild(tempDiv);
        resolve(pdfBlob);
      } catch (error) {
        console.error('DOCX转PDF错误:', error);
        reject(new Error(`转换失败: ${error.message || '未知错误'}`));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

// 图片格式转换
const convertImageFormat = async (file, targetFormat) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            resolve(blob);
          },
          targetFormat === 'png' ? 'image/png' : 'image/jpeg',
          0.92
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败'));
    };
    img.src = objectUrl;
  });
};

// HTML转PDF
const convertHtmlToPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const html = e.target.result;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.width = '210mm';
        document.body.appendChild(tempDiv);

        const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        const pdfBlob = pdf.output('blob');
        document.body.removeChild(tempDiv);
        resolve(pdfBlob);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
</script>

<style scoped>
.conversion-card {
  max-width: 800px;
  margin: 20px auto;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.upload-area {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.format-selection {
  flex: 1;
  min-width: 200px;
}

.convert-btn {
  white-space: nowrap;
}

.selected-files, .results-area {
  margin-top: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.file-name {
  margin-left: 10px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  margin-left: 10px;
  color: #606266;
  font-size: 12px;
}

.delete-btn {
  color: #f56c6c;
}

.progress-area {
  margin-top: 20px;
}

.progress-text {
  margin-top: 10px;
  color: #606266;
  text-align: center;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.result-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-btn {
  margin-left: 10px;
}

@media (max-width: 600px) {
  .upload-area {
    flex-direction: column;
  }
  .format-selection, .convert-btn {
    width: 100%;
  }
}
</style>