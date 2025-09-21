<template>
  <div class="carousel-page">
    <h2>轮播图管理</h2>
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="openAddDialog">新增轮播图</el-button>
      </div>
      <el-table :data="bannerList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="图片" width="120">
          <template #default="scope">
            <el-image :src="scope.row.image_url" style="width: 80px; height: 40px; object-fit:cover" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="180" />
        <el-table-column prop="link" label="跳转链接" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" @change="val => updateStatus(scope.row, val)" />
          </template>
        </el-table-column>
        <el-table-column label="排序" width="120">
          <template #default="scope">
            <el-button size="small" @click="moveUp(scope.$index)" :disabled="scope.$index === 0">上移</el-button>
            <el-button size="small" @click="moveDown(scope.$index)" :disabled="scope.$index === bannerList.length - 1">下移</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-popconfirm title="确定删除该轮播图吗？" @confirm="deleteBanner(scope.row.id)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="editMode ? '编辑轮播图' : '新增轮播图'" v-model="dialogVisible" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="图片" prop="image_url">
          <el-upload
            class="upload-demo"
            action="/api/upload/single"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            :data="{}"
            name="file"
          >
            <el-button type="primary">上传图片</el-button>
          </el-upload>
          <el-image v-if="form.image_url" :src="form.image_url" style="width: 100px; height: 50px; margin-left: 10px; object-fit:cover" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="跳转链接" prop="link">
          <el-input v-model="form.link" placeholder="请输入跳转链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">{{ editMode ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import service from '../axios';

const bannerList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);
const form = reactive({ id: null, image_url: '', title: '', link: '' });
const formRef = ref(null);
const rules = {
  image_url: [{ required: true, message: '请上传图片', trigger: 'blur' }],
  title: [{ required: false }],
  link: [{ required: false }]
};

const uploadHeaders = {
  Authorization: 'Bearer ' + localStorage.getItem('token')
};

function fetchList() {
  loading.value = true;
  service.get('/banner/list').then(res => {
    // 兼容后端返回格式
    bannerList.value = Array.isArray(res) ? res : [];
  }).catch(() => {
    ElMessage.error('获取轮播图列表失败');
  }).finally(() => {
    loading.value = false;
  });
}

function openAddDialog() {
  editMode.value = false;
  Object.assign(form, { id: null, image_url: '', title: '', link: '' });
  dialogVisible.value = true;
}

function openEditDialog(row) {
  editMode.value = true;
  Object.assign(form, row);
  dialogVisible.value = true;
}

function handleUploadSuccess(res) {
  if (res.url) {
    form.image_url = res.url;
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error('图片上传失败');
  }
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件');
  }
  return isImage;
}

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) return;
    try {
      if (editMode.value) {
        await service.put(`/banner/edit/${form.id}`, form);
        ElMessage.success('编辑成功');
      } else {
        await service.post('/banner/add', form);
        ElMessage.success('添加成功');
      }
      dialogVisible.value = false;
      fetchList();
    } catch (e) {
      ElMessage.error('操作失败');
    }
  });
}

async function deleteBanner(id) {
  try {
    await service.delete(`/banner/delete/${id}`);
    ElMessage.success('删除成功');
    fetchList();
  } catch (e) {
    ElMessage.error('删除失败');
  }
}

async function updateStatus(row, val) {
  try {
    await service.put(`/banner/status/${row.id}`, { status: val });
    ElMessage.success('状态更新成功');
  } catch (e) {
    ElMessage.error('状态更新失败');
    row.status = val === 1 ? 0 : 1; // 回滚
  }
}

function moveUp(index) {
  if (index === 0) return;
  const temp = bannerList.value[index];
  bannerList.value[index] = bannerList.value[index - 1];
  bannerList.value[index - 1] = temp;
  updateSort();
}

function moveDown(index) {
  if (index === bannerList.value.length - 1) return;
  const temp = bannerList.value[index];
  bannerList.value[index] = bannerList.value[index + 1];
  bannerList.value[index + 1] = temp;
  updateSort();
}

function updateSort() {
  // 生成排序数组
  const sortList = bannerList.value.map((item, idx) => ({ id: item.id, sort: idx + 1 }));
  service.put('/banner/sort', { sortList }).then(() => {
    ElMessage.success('排序更新成功');
    fetchList();
  }).catch(() => {
    ElMessage.error('排序更新失败');
  });
}

onMounted(fetchList);
</script>

<style scoped>
.carousel-page {
  padding: 16px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>