<template>
  <div class="content-page">
    <h2>内容管理</h2>
    <el-card>
      <div class="toolbar">
      <el-select v-model="category" placeholder="请选择分类" style="margin-right: 10px;" @change="fetchList">
        <el-option label="全部" value=""></el-option>
        <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.name"></el-option>
      </el-select>
        <el-button type="primary" @click="openAddDialog">新增内容</el-button>
      </div>
      <el-table :data="contentList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="publisher" label="发布人" width="120" />
        <el-table-column label="封面图" width="120">
          <template #default="scope">
            <el-image 
              v-if="scope.row.cover" 
              :src="scope.row.cover" 
              style="width: 80px; height: 40px;" 
            />
            <span v-else>无封面</span>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="创建时间" width="180" />
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column prop="views" label="浏览量" width="100" />

        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="primary" @click="previewContent(scope.row)">预览</el-button>
            <el-button size="small" type="info" @click="openCommentDialog(scope.row.id)">看评论</el-button>
            <el-popconfirm title="确定删除该内容吗？" @confirm="deleteContent(scope.row.id)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog 
  :title="editMode ? '编辑内容' : '新增内容'"
  v-model="dialogVisible"
  :loading="editLoading"
  width="800px"
>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="发布人" prop="publisher">
          <el-input v-model="form.publisher" :disabled="true" placeholder="发布人" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="封面图" prop="cover">
          <el-upload
            class="upload-demo"
            :action="getUploadUrl()"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            name="file"
            :with-credentials="false"
          >
            <el-button type="primary">上传封面</el-button>
          </el-upload>
          <el-image 
            v-if="form.cover" 
            :src="form.cover" 
            style="width: 100px; height: 50px; margin-left: 10px; object-fit:cover" 
          />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input v-model="form.amount" placeholder="请输入金额" type="number" />
        </el-form-item>
        <el-form-item label="时间" prop="time">
          <el-date-picker v-model="form.time" type="datetime" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ssZ" placeholder="请选择时间" />
        </el-form-item>
        <el-form-item label="功能特点" prop="features">
          <el-input v-model="form.features" type="textarea" :rows="3" placeholder="请输入功能特点" />
        </el-form-item>
        <el-form-item label="论文文件" prop="thesis_file">
          <el-upload
            class="upload-demo"
            :action="getUploadUrl()"
            :headers="uploadHeaders"
            :show-file-list="true"
            :on-success="handleThesisUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeThesisUpload"
            name="file"
            :with-credentials="false"
          >
            <el-button type="primary">上传论文文件</el-button>
          </el-upload>
          <div v-if="form.thesis_file" class="uploaded-file">
            {{ form.thesis_file.split('/').pop() }}
            <el-text @click="form.thesis_file = ''" style="margin-left:10px;cursor:pointer;color:#f56c6c;">删除</el-text>
          </div>
        </el-form-item>
        <el-form-item label="项目文件" prop="project_file">
          <el-upload
            class="upload-demo"
            :action="getUploadUrl()"
            :headers="uploadHeaders"
            :show-file-list="true"
            :on-success="handleProjectUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeProjectUpload"
            name="file"
            :with-credentials="false"
          >
            <el-button type="primary">上传项目文件</el-button>
          </el-upload>
          <div v-if="form.project_file" class="uploaded-file">
            {{ form.project_file.split('/').pop() }}
            <el-text @click="form.project_file = ''" style="margin-left:10px;cursor:pointer;color:#f56c6c;">删除</el-text>
          </div>
        </el-form-item>
        <el-form-item label="技术栈" prop="technologies">
          <el-input v-model="form.technologies" placeholder="请输入技术栈，用逗号分隔" />
        </el-form-item>
        <el-form-item label="截图上传" prop="screenshots">
          <el-upload
            class="upload-demo"
            :action="getUploadUrl()"
            :headers="uploadHeaders"
            :show-file-list="true"
            :on-success="handleScreenshotUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeImageUpload"
            name="file"
            multiple
            :with-credentials="false"
          >
            <el-button type="primary">上传多张截图</el-button>
          </el-upload>
          <div class="screenshot-preview">
            <div v-for="(url, index) in form.screenshots" :key="index" class="screenshot-item">
              <el-image :src="url" style="width: 100px; height: 100px; object-fit: cover;" />
              <el-text @click="removeScreenshot(index)" style="position:absolute;top:5px;right:5px;color:#f56c6c;">删除</el-text>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="form.content" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">{{ editMode ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog title="内容预览" v-model="previewVisible" width="800px" :fullscreen="false" :loading="previewLoading.value">
      <div class="preview-detail">
        <h3>{{ previewData.title }}</h3>
        <p class="preview-meta">
          分类：{{ previewData.category }} | 
          发布人：{{ previewData.publisher }} | 
          创建时间：{{ previewData.time }} | 
          金额：{{ previewData.amount }}元 | 
          浏览量：{{ previewData.views || 0 }}
        </p>
        
        <div class="preview-section">
          <h4>封面图片</h4>
          <el-image 
            v-if="previewData.cover" 
            :src="previewData.cover" 
            style="width: 100%; max-height: 400px; object-fit: contain; margin: 10px 0;" 
            :preview-src-list="[previewData.cover]"
          />
        </div>

        <div class="preview-section">
          <h4>项目内容</h4>
          <p class="preview-content">{{ previewData.content }}</p>
        </div>

        <div class="preview-section">
          <h4>技术栈</h4>
          <p>{{ previewData.technologies || '未指定' }}</p>
        </div>

        <div class="preview-section">
          <h4>功能特点</h4>
          <p>{{ previewData.features || '无' }}</p>
        </div>

        <div class="preview-section">
          <h4>相关文件</h4>
          <div v-if="previewData.thesis_file" class="file-link">
            <el-link type="primary" @click.prevent="previewDocx(previewData.thesis_file.replace(/^https?:\/\/sunhe197428\.oss-cn-beijing\.aliyuncs\.com/, '/oss-proxy'))">论文文件: {{ previewData.thesis_file.split('/').pop() }}</el-link>
            <span class="text-muted ml-2">(点击在线预览)</span>
          </div>
          <div v-if="previewData.project_file" class="file-link">
            <el-link :href="previewData.project_file" target="_blank">项目文件: {{ previewData.project_file.split('/').pop() }}</el-link>
          </div>
          <div v-if="!previewData.thesis_file && !previewData.project_file">无相关文件</div>
        </div>

        <div class="preview-section">
          <h4>项目截图</h4>
          <div class="screenshot-grid" v-if="previewData.screenshots && previewData.screenshots.length > 0">
            <el-image 
              v-for="(url, index) in previewData.screenshots" 
              :key="index" 
              :src="url" 
              style="width: 200px; height: 150px; object-fit: cover; margin: 10px; cursor: pointer;" 
              :preview-src-list="previewData.screenshots"
            />
          </div>
          <div v-else>无截图</div>
        </div>
      </div>
    </el-dialog>

    <!-- DOCX预览弹窗 -->
    <el-dialog
      title="论文文件预览"
      v-model="docxPreviewVisible"
      width="90%"
      :fullscreen="true"
      :loading="docxLoading.value"
    >
      <div class="docx-container" ref="docxContainer" style="min-height: 600px; padding: 20px;"></div>
      <template #footer>
        <el-button @click="docxPreviewVisible.value = false">关闭预览</el-button>
      </template>
    </el-dialog>
    </div>
<!-- 评论弹窗 -->
<el-dialog title="评论管理" v-model="commentDialogVisible" width="600px" :loading="commentLoading">
  <div class="comment-list">
    <div v-if="!comments.length && !commentLoading" class="empty-comments">暂无评论</div>
    <div v-for="comment in comments" :key="comment.id" class="comment-item">
      <div class="comment-header">
        <span class="user-name">{{ comment.user_name }}</span>
        <span class="comment-time">{{ comment.time }}</span>
        <el-switch
          v-model="comment.status"
          :active-value="1"
          :inactive-value="0"
          @change="(val) => updateCommentStatus(comment.id, val)"
          style="margin-left: 10px;"
        />
        <el-button size="mini" type="text" @click="deleteComment(comment.id)" style="margin-left: auto;">删除</el-button>
      </div>
      <div class="comment-content">{{ comment.content }}</div>
      <div class="comment-actions">
        <el-button size="mini" type="text" @click="replyComment(comment.id)">回复 ({{ comment.reply_count }})</el-button>
        <el-form v-if="replyCommentId === comment.id" :model="replyForm" @submit.prevent="submitReply">
          <el-input v-model="replyForm.content" placeholder="请输入回复内容" size="small" style="width: 300px; display: inline-block; margin-right: 10px;"></el-input>
          <el-button type="primary" size="small" @click="submitReply(comment.id)">发送</el-button>
          <el-button size="small" @click="cancelReply">取消</el-button>
        </el-form>
      </div>
      <div class="replies" v-if="comment.replies && comment.replies.length">
        <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
          <div class="reply-header">
            <span class="user-name">{{ reply.user_name }}</span>
            <span class="comment-time">{{ reply.time }}</span>
            <el-button size="mini" type="text" @click="deleteComment(reply.id)" style="margin-left: auto;">删除</el-button>
          </div>
          <div class="reply-content">{{ reply.content }}</div>
        </div>
      </div>
    </div>
  </div>
  <template #footer>
    <el-button @click="commentDialogVisible = false">关闭</el-button>
  </template>
</el-dialog>

</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import service from '../axios';
import { renderAsync } from 'docx-preview';

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
        username: parsed.username || parsed.name || 'admin'
      };
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
  return { id: '', username: 'admin' };
};
const category = ref('');
const categoryOptions = ref([]);

const getCategories = async () => {
  try {
    const response = await service.get('/category/list');

    categoryOptions.value = response
      .filter(cat => cat.status === 1)
      .sort((a, b) => a.sort - b.sort);
  } catch (error) {
    ElMessage.error('获取分类失败: ' + (error.response?.data?.message || error.message));
  }
};

const contentList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const editLoading = ref(false);
const uploadHeaders = reactive({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
});
const rules = reactive({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
});

async function fetchList() {
  loading.value = true;
  try {
    const currentUser = getUserInfo();
    const response = await service.get('/content/list', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        category: category.value,
        publisher: currentUser.username
      }
    });
    console.log(response);
    contentList.value = response
    total.value = response
  } catch (error) {
    ElMessage.error('获取数据失败');
  } finally {
    loading.value = false;
  }
}
const previewVisible = ref(false);
const previewLoading = ref(false);
const docxPreviewVisible = ref(false);
const docxLoading = ref(false);
const docxContainer = ref(null);
const editMode = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
// 评论相关变量
const commentDialogVisible = ref(false);
const comments = ref([]);
const commentLoading = ref(false);
const currentContentId = ref(null);
const replyCommentId = ref(null);
const replyForm = reactive({ content: '' });

const previewData = reactive({
  title: '',
  category: '',
  cover: '',
  content: '',
  time: '',
    amount: '',
  technologies: '',
  thesis_file: '',
  project_file: '',
  screenshots: [],
  features: '',
  publisher: ''
});

const form = reactive({
    id: null,
    title: '',
    category: '',
    cover: '',
    content: '',
    time: '',
    amount: '',
    views: 0,
    features: '',
    thesis_file: '',
    project_file: '',
    technologies: '',
    screenshots: [],
    publisher: ''
  });
 


function openAddDialog() {
  editMode.value = false;
  // 重置表单
  const currentUser = getUserInfo();
  Object.assign(form, {
    id: null,
    title: '',
    category: '',
    cover: '',
    content: '',
    time: '',
    features: '',
    thesis_file: '',
    project_file: '',
    technologies: '',
    screenshots: [],
    publisher: currentUser.username
  });
  dialogVisible.value = true;
}

async function openEditDialog(row) {
  editMode.value = true;
  editLoading.value = true;
  try {
    const response = await service.get(`/content/${row.id}`);
    const detail = response;
    Object.assign(form, {
      ...detail,
      screenshots: Array.isArray(detail.screenshots) ? detail.screenshots : (detail.screenshots ? detail.screenshots.split('\n').map(url => url.trim()) : []),
      publisher: detail.publisher || ''
    });
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取详情失败: ' + error.message);
  } finally {
    editLoading.value = false;
  }
}

async function previewDocx(url) {
  docxPreviewVisible.value = true;
  docxLoading.value = true;
  try {
    // 清空容器
    if (docxContainer.value) {
      docxContainer.value.innerHTML = '';
    }
    // 获取文件并渲染
    const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`文档加载失败: HTTP ${response.status} ${response.statusText}\n响应内容: ${errorText.substring(0, 200)}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        throw new Error(`不支持的文件类型: ${contentType || '未知'}`);
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await renderAsync(uint8Array, docxContainer.value, null, {
      className: 'docx-preview',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true
    });
  } catch (error) {
    ElMessage.error('文档预览失败: ' + error.message);
  } finally {
    docxLoading.value = false;
  }
}

// 评论相关方法
async function openCommentDialog(contentId) {
  currentContentId.value = contentId;
  commentDialogVisible.value = true;
  await getComments();
}

async function getComments() {
  commentLoading.value = true;
  try {
    const response = await service.get(`/comment/list/${currentContentId.value}`);
    comments.value = response;
  } catch (error) {
    ElMessage.error('获取评论失败: ' + (error.response?.data?.message || error.message));
  } finally {
    commentLoading.value = false;
  }
}

async function submitReply(parentId) {
  if (!replyForm.content.trim()) {
    ElMessage.warning('请输入回复内容');
    return;
  }
  try {
    const currentUser = getUserInfo();
      await service.post('/comment/reply', {
        create_by: currentUser.id,
        create_name: currentUser.username,
      content_id: currentContentId.value,
      user_name: '管理员',
      content: replyForm.content,
      time: new Date().toISOString(),
      parent_id: parentId
    });
    ElMessage.success('回复成功');
    replyCommentId.value = null;
    replyForm.content = '';
    await getComments();
  } catch (error) {
    ElMessage.error('回复失败: ' + (error.response?.data?.message || error.message));
  }
}

async function deleteComment(commentId) {
  try {
    const currentUser = getUserInfo();
      await service.delete(`/comment/delete/${commentId}`, {
        data: {
          delete_by: currentUser.id,
          delete_name: currentUser.username
        }
      });
    ElMessage.success('删除成功');
    await getComments();
  } catch (error) {
    ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message));
  }
}

async function updateCommentStatus(commentId, status) {
  try {
    const currentUser = getUserInfo();
      await service.put(`/comment/status/${commentId}`, {
        status,
        update_by: currentUser.id,
        update_name: currentUser.username
      });
    ElMessage.success('状态更新成功');
  } catch (error) {
    ElMessage.error('状态更新失败: ' + (error.response?.data?.message || error.message));
    // 失败时恢复原状态
    const comment = comments.value.find(c => c.id === commentId);
    if (comment) comment.status = status === '1' ? '0' : '1';
  }
}

function replyComment(commentId) {
  replyCommentId.value = commentId;
}

function cancelReply() {
  replyCommentId.value = null;
  replyForm.content = '';
}

async function previewContent(row) {
  previewLoading.value = true;
  try {
    const response = await service.get(`/content/${row.id}`);
    const detail = response;
    Object.assign(previewData, {
      ...detail,
      // 确保screenshots是数组格式
      screenshots: Array.isArray(detail.screenshots) ? detail.screenshots : (detail.screenshots ? detail.screenshots.split('\n').map(url => url.trim()) : []),
      publisher: detail.publisher || ''
    });
    previewVisible.value = true;
  } catch (error) {
    ElMessage.error('获取预览详情失败: ' + error.message);
  } finally {
    previewLoading.value = false;
  }
}

function handleThesisUploadSuccess(res, file) {
  console.log('论文文件上传成功:', res, file);
  if (res && res.url) {
    form.thesis_file = res.url;
    ElMessage.success('论文文件上传成功');
  } else {
    ElMessage.error('论文文件上传失败，请重试');
    console.error('上传响应异常:', res);
  }
}

function handleProjectUploadSuccess(res, file) {
  console.log('项目文件上传成功:', res, file);
  if (res && res.url) {
    form.project_file = res.url;
    ElMessage.success('项目文件上传成功');
  } else {
    ElMessage.error('项目文件上传失败，请重试');
    console.error('上传响应异常:', res);
  }
}

function handleScreenshotUploadSuccess(res, file) {
  console.log('截图上传成功:', res, file);
  if (res && res.url) {
    form.screenshots.push(res.url);
    ElMessage.success('截图上传成功');
  } else {
    ElMessage.error('截图上传失败，请重试');
    console.error('上传响应异常:', res);
  }
}

function removeScreenshot(index) {
  form.screenshots.splice(index, 1);
}

function handleUploadSuccess(res, file) {
  console.log('封面上传成功:', res, file);
  if (res && res.url) {
    form.cover = res.url;
    ElMessage.success('封面上传成功');
  } else {
    ElMessage.error('封面上传失败，请重试');
    console.error('上传响应异常:', res);
  }
}

function handleUploadError(err, file) {
  console.error('上传失败:', err, file);
  ElMessage.error('文件上传失败，请检查网络连接或联系管理员');
}

function beforeThesisUpload(file) {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('只能上传PDF或Word文件');
    return false;
  }
  return true;
}

function beforeProjectUpload(file) {
  const allowedTypes = ['application/pdf', 'application/zip', 'application/x-tar', 'application/gzip'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('只能上传PDF或压缩文件');
    return false;
  }
  return true;
}

function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件');
  }
  return isImage;
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件');
  }
  return isImage;
}

async function submitForm() {
  if (!formRef.value) {
    ElMessage.error('表单引用未找到');
    return;
  }
  
  formRef.value.validate(async valid => {
    if (!valid) return;
    // 处理截图数组为字符串
    const screenshotsStr = Array.isArray(form.screenshots) ? form.screenshots.join('\n') : '';
    try {
      if (editMode.value) {
        const currentUser = getUserInfo();
        form.update_by = currentUser.id;
        form.update_name = currentUser.username;
        form.publisher = currentUser.username;
        await service.put(`/content/edit/${form.id}`, form);
        ElMessage.success('编辑成功');
      } else {
        const currentUser = getUserInfo();
        await service.post('/content/add', {
          ...form,
          screenshots: form.screenshots.join('\n'),
          create_by: currentUser.id,
          create_name: currentUser.username,
          publisher: currentUser.username
        });
        ElMessage.success('添加成功');
      }
      dialogVisible.value = false;
      fetchList();
    } catch (e) {
      ElMessage.error('提交失败: ' + e.message);
      console.error('提交表单失败:', e);
    }
  });
}


async function deleteContent(id) {
  try {
    const currentUser = getUserInfo();
      await service.delete(`/content/delete/${id}`, {
        data: {
          delete_by: currentUser.id,
          delete_name: currentUser.username
        }
      });
    ElMessage.success('删除成功');
    fetchList();
  } catch (e) {
    ElMessage.error('删除失败');
  }
}



onMounted(() => { fetchList(); getCategories(); });
</script>

<style scoped>
.content-page {
  padding: 16px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.preview-meta {
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}
.uploaded-file {
  margin-top: 10px;
  padding: 5px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  display: inline-block;
}
.screenshot-preview {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.screenshot-item {
  position: relative;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.preview-detail {
  padding: 20px;
}

.preview-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.text-muted {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.preview-section {
  margin-bottom: 25px;
}

.preview-section h4 {
  font-size: 16px;
  color: #409eff;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.preview-content {
  line-height: 1.8;
  color: #333;
  font-size: 15px;
  text-align: justify;
  white-space: pre-wrap;
}

.file-link {
  margin-bottom: 8px;
}

.file-link a {
  color: #409eff;
  text-decoration: none;
}

.file-link a:hover {
  text-decoration: underline;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.screenshot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
}

.screenshot-item {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    line-height: 1.6;
}


.comment-list { max-height: 400px; overflow-y: auto; padding-right: 10px; }
.empty-comments { text-align: center; padding: 50px 0; color: #999; }
.comment-item { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
.comment-header { display: flex; align-items: center; margin-bottom: 8px; }
.user-name { font-weight: bold; margin-right: 15px; }
.comment-time { color: #666; font-size: 12px; }
.comment-content { margin-bottom: 10px; line-height: 1.5; }
.comment-actions { display: flex; align-items: center; margin-top: 5px; }
.replies { margin-top: 15px; margin-left: 30px; padding-left: 10px; border-left: 2px solid #f0f0f0; }
.reply-item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #f0f0f0; }
.reply-header { display: flex; align-items: center; margin-bottom: 5px; }

</style>