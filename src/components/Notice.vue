<template>
  <div class="notice-management">
    <el-card>
      <div class="card-header">
        <h2>公告管理</h2>
        <el-button type="primary" @click="handleCreate">新建公告</el-button>
      </div>
      
      <el-table :data="noticeList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="标题" width="200"></el-table-column>
        <el-table-column prop="content" label="内容" width="400">
          <template #default="scope">
            <div class="content-preview" :title="scope.row.content">{{ scope.row.content.slice(0, 30) }}{{ scope.row.content.length > 30 ? '...' : '' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.updated_at) }}
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
          :total="totalNotices"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑公告对话框 -->
    <el-dialog v-model="dialogVisible" :title="isCreate ? '新建公告' : '编辑公告'">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <div class="editor-container">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="editorConfig"
              mode="default"
            />
            <Editor
              v-model="form.content"
              :defaultConfig="editorConfig"
              :editorId="'editor'"
              mode="default"
              @onCreated="handleCreated"
            />
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
      <span>确定要删除此公告吗？</span>
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
import { Editor, Toolbar, editorConfig } from '../plugins/wangEditor';

// 表格数据和分页
const noticeList = ref([]);
const totalNotices = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 对话框状态
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentNoticeId = ref(null);
const isCreate = ref(true);

// 编辑器引用
const editorRef = ref(null)

// 处理编辑器创建完成事件
const handleCreated = (editor) => {
  editorRef.value = editor // 存储 editor 实例
}

// 表单数据
const form = reactive({
  title: '',
  content: ''
});

// 表单验证
const rules = reactive({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
});

const formRef = ref(null);

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

// 获取公告列表
const getNoticeList = async () => {
  try {
    const response = await service.get('/announcement/list', {
      params: {
        page: currentPage.value,
        limit: pageSize.value
      }
    });
    console.log(response)
    noticeList.value = response.data;
    totalNotices.value = response.total;
  } catch (error) {
    ElMessage.error('获取公告列表失败');
    console.error(error);
  }
};

// 新建公告
const handleCreate = () => {
  isCreate.value = true;
  form.title = '';
  form.content = '';
  dialogVisible.value = true;
};

// 编辑公告
const handleEdit = async (id) => {
  isCreate.value = false;
  currentNoticeId.value = id;
  try {
    const response = await service.get(`/announcement/${id}`);
    // 确保从response.data中获取公告数据
    const notice = response.data;
    form.title = notice.title || '';
    // 设置富文本内容
    form.content = notice.content || '';
    dialogVisible.value = true;
    // 延迟设置富文本内容，确保编辑器已初始化
    setTimeout(() => {
      if (editorRef.value) {
        editorRef.value.setHtml(notice.content || '');
      }
    }, 100);
  } catch (error) {
    ElMessage.error('获取公告信息失败');
    console.error('编辑公告失败:', error);
  }
};

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();
    if (isCreate.value) {
      await service.post('/announcement/add', {
        title: form.title,
        content: form.content
      });
      ElMessage.success('创建公告成功');
    } else {
      await service.put(`/announcement/edit/${currentNoticeId.value}`, {
        title: form.title,
        content: form.content
      });
      ElMessage.success('更新公告成功');
    }
    dialogVisible.value = false;
    getNoticeList();
  } catch (error) {
    ElMessage.error(isCreate ? '创建公告失败' : '更新公告失败');
    console.error(error);
  }
};

// 删除公告
const handleDelete = (id) => {
  currentNoticeId.value = id;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  try {
    await service.delete(`/announcement/delete/${currentNoticeId.value}`);
    ElMessage.success('删除公告成功');
    deleteDialogVisible.value = false;
    getNoticeList();
  } catch (error) {
    ElMessage.error('删除公告失败');
    console.error(error);
  }
};

// 分页事件
const handleSizeChange = (val) => {
  pageSize.value = val;
  getNoticeList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  getNoticeList();
};

onMounted(() => {
  getNoticeList();
});
</script>

<style scoped>
.notice-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.content-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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