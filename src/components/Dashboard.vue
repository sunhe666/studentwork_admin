<template>
  <div class="dashboard-container">
    <el-card class="header-card">
      <div class="card-title">
        <h2>系统仪表盘</h2>
        <div class="date-range">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 系统概览 -->
    <el-card class="stats-card">
      <h3 class="section-title">系统概览</h3>
      <div class="stats-container">
        <div class="stat-item">
          <div class="stat-value">{{ overviewData.total_users || 0 }}</div>
          <div class="stat-label">用户总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ overviewData.active_users || 0 }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ overviewData.total_logs || 0 }}</div>
          <div class="stat-label">日志总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ overviewData.today_logs || 0 }}</div>
          <div class="stat-label">今日新增日志</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ overviewData.total_employees || 0 }}</div>
          <div class="stat-label">员工总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ overviewData.pending_cooperations || 0 }}</div>
          <div class="stat-label">待处理合作申请</div>
        </div>
        <div class="stat-item system-status">
          <div class="stat-value">{{ overviewData.system_status || 'normal' }}</div>
          <div class="stat-label">系统状态</div>
        </div>
      </div>
    </el-card>

    <!-- 操作统计图表 -->
    <el-card class="chart-card">
      <h3 class="section-title">操作统计</h3>
      <div ref="operationChartRef" class="chart-container"></div>
    </el-card>

    <!-- 员工和合作统计 -->
    <div class="grid-container">
      <el-card class="chart-card">
        <h3 class="section-title">员工部门分布</h3>
        <div ref="departmentChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <h3 class="section-title">员工角色分布</h3>
        <div ref="roleChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <h3 class="section-title">合作申请职位分布</h3>
        <div ref="positionChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <h3 class="section-title">合作申请状态分布</h3>
        <div ref="cooperationStatusChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 热门内容 -->
    <el-card class="content-card">
      <div class="card-header">
        <h3 class="section-title">热门内容</h3>
        <div class="filter-controls">
          <el-select v-model="contentType" placeholder="内容类型" @change="fetchPopularContent">
            <el-option label="全部" value="all"></el-option>
            <el-option label="论文" value="thesis"></el-option>
            <el-option label="文章" value="article"></el-option>
          </el-select>
          <el-select v-model="timeRange" placeholder="时间范围" @change="fetchPopularContent">
            <el-option label="今日" value="day"></el-option>
            <el-option label="本周" value="week"></el-option>
            <el-option label="本月" value="month"></el-option>
          </el-select>
        </div>
      </div>
      <el-table :data="popularContentList" style="width: 100%">
        <el-table-column prop="title" label="标题" width="400"></el-table-column>
        <el-table-column prop="type" label="类型" width="100"></el-table-column>
        <el-table-column prop="view_count" label="浏览量" width="100"></el-table-column>
        <el-table-column prop="like_count" label="点赞数" width="100"></el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.publish_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="120"></el-table-column>
      </el-table>
    </el-card>

    <!-- 热门论文 -->
    <el-card class="content-card">
      <div class="card-header">
        <h3 class="section-title">热门论文</h3>
        <div class="filter-controls">
          <el-select v-model="thesisTimeRange" placeholder="时间范围" @change="fetchPopularThesis">
            <el-option label="今日" value="day"></el-option>
            <el-option label="本周" value="week"></el-option>
            <el-option label="本月" value="month"></el-option>
          </el-select>
        </div>
      </div>
      <el-table :data="popularThesisList" style="width: 100%">
        <el-table-column prop="title" label="论文标题" width="400"></el-table-column>
        <el-table-column prop="category" label="分类" width="150"></el-table-column>
        <el-table-column prop="like_count" label="点赞数" width="100"></el-table-column>
        <el-table-column prop="view_count" label="浏览量" width="100"></el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.publish_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="120"></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import service from '../axios';

// 格式化日期时间为YYYY-MM-DDTHH:MM:SS格式
const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// 日期范围
const dateRange = ref([]);

// 概览数据
const overviewData = ref({});

// 员工统计数据
const employeeStats = ref({});

// 合作申请统计数据
const cooperationStats = ref({});

// 热门内容数据
const contentType = ref('all');
const timeRange = ref('week');
const popularContentList = ref([]);

// 热门论文数据
const thesisTimeRange = ref('month');
const popularThesisList = ref([]);

// 图表引用
const operationChartRef = ref(null);
const departmentChartRef = ref(null);
const roleChartRef = ref(null);
const positionChartRef = ref(null);
const cooperationStatusChartRef = ref(null);

// 图表实例
let operationChart = null;
let departmentChart = null;
let roleChart = null;
let positionChart = null;
let cooperationStatusChart = null;

// 获取系统概览数据
const fetchOverviewData = async () => {
  try {
    const response = await service.get('/dashboard/overview');
    overviewData.value = response.data;
    updateOperationChart();
  } catch (error) {
    ElMessage.error('获取系统概览数据失败');
    console.error(error);
  }
};

// 获取员工统计数据
const fetchEmployeeStats = async () => {
  try {
    const params = { time_range: 'month' };
    const response = await service.get('/dashboard/employee/stats', { params });
    employeeStats.value = response.data;
    updateDepartmentChart();
    updateRoleChart();
  } catch (error) {
    ElMessage.error('获取员工统计数据失败');
    console.error(error);
  }
};

// 获取合作申请统计数据
const fetchCooperationStats = async () => {
  try {
    const params = { time_range: 'month' };
    const response = await service.get('/dashboard/cooperation/stats', { params });
    cooperationStats.value = response.data;
    updatePositionChart();
    updateCooperationStatusChart();
  } catch (error) {
    ElMessage.error('获取合作申请统计数据失败');
    console.error(error);
  }
};

// 获取热门内容
const fetchPopularContent = async () => {
  try {
    const params = {
      limit: 10,
      time_range: timeRange.value
    };
    if (contentType.value !== 'all') {
      params.type = contentType.value;
    }
    const response = await service.get('/dashboard/popular/content', { params });
    popularContentList.value = response.data;
  } catch (error) {
    ElMessage.error('获取热门内容失败');
    console.error(error);
  }
};

// 获取热门论文
const fetchPopularThesis = async () => {
  try {
    const params = {
      limit: 10,
      time_range: thesisTimeRange.value
    };
    const response = await service.get('/dashboard/popular/thesis', { params });
    popularThesisList.value = response.data;
  } catch (error) {
    ElMessage.error('获取热门论文失败');
    console.error(error);
  }
};

// 处理日期范围变化
const handleDateChange = () => {
  // 这里可以根据需要刷新数据
  fetchOverviewData();
  fetchEmployeeStats();
  fetchCooperationStats();
  fetchPopularContent();
  fetchPopularThesis();
};

// 初始化图表
const initCharts = () => {
  // 操作统计图表
  if (operationChartRef.value) {
    operationChart = echarts.init(operationChartRef.value);
    updateOperationChart();
  }

  // 部门分布图表
  if (departmentChartRef.value) {
    departmentChart = echarts.init(departmentChartRef.value);
    updateDepartmentChart();
  }

  // 角色分布图表
  if (roleChartRef.value) {
    roleChart = echarts.init(roleChartRef.value);
    updateRoleChart();
  }

  // 职位分布图表
  if (positionChartRef.value) {
    positionChart = echarts.init(positionChartRef.value);
    updatePositionChart();
  }

  // 合作状态图表
  if (cooperationStatusChartRef.value) {
    cooperationStatusChart = echarts.init(cooperationStatusChartRef.value);
    updateCooperationStatusChart();
  }

  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    if (operationChart) operationChart.resize();
    if (departmentChart) departmentChart.resize();
    if (roleChart) roleChart.resize();
    if (positionChart) positionChart.resize();
    if (cooperationStatusChart) cooperationStatusChart.resize();
  });
};

// 更新操作统计图表
const updateOperationChart = () => {
  if (!operationChart) return;

  const data = overviewData.value.operation_statistics || {
    login: 0,
    add: 0,
    update: 0,
    delete: 0
  };

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['登录', '添加', '修改', '删除']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [data.login, data.add, data.update, data.delete],
        type: 'bar',
        itemStyle: {
          color: function(params) {
            const colorList = ['#36A2EB', '#4BC0C0', '#FF9F40', '#FF6384'];
            return colorList[params.dataIndex];
          }
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  };

  operationChart.setOption(option);
};

// 更新部门分布图表
const updateDepartmentChart = () => {
  if (!departmentChart) return;

  const data = employeeStats.value.department_distribution || {};
  const categories = Object.keys(data);
  const values = Object.values(data);

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: '部门分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: categories.map((category, index) => ({
          name: category,
          value: values[index]
        }))
      }
    ]
  };

  departmentChart.setOption(option);
};

// 更新角色分布图表
const updateRoleChart = () => {
  if (!roleChart) return;

  const data = employeeStats.value.role_distribution || {};
  const categories = Object.keys(data);
  const values = Object.values(data);

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: '角色分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: categories.map((category, index) => ({
          name: category,
          value: values[index]
        }))
      }
    ]
  };

  roleChart.setOption(option);
};

// 更新职位分布图表
const updatePositionChart = () => {
  if (!positionChart) return;

  const data = cooperationStats.value.position_distribution || {};
  const categories = Object.keys(data);
  const values = Object.values(data);

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: '职位分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: categories.map((category, index) => ({
          name: category,
          value: values[index]
        }))
      }
    ]
  };

  positionChart.setOption(option);
};

// 更新合作状态图表
const updateCooperationStatusChart = () => {
  if (!cooperationStatusChart) return;

  const contactedRate = cooperationStats.value.contacted_rate || 0;
  const pendingRate = cooperationStats.value.pending_rate || 0;

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: '合作状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            name: '已联系',
            value: contactedRate
          },
          {
            name: '待处理',
            value: pendingRate
          }
        ]
      }
    ]
  };

  cooperationStatusChart.setOption(option);
};

// 页面加载时初始化
onMounted(() => {
  fetchOverviewData();
  fetchEmployeeStats();
  fetchCooperationStats();
  fetchPopularContent();
  fetchPopularThesis();

  // 延迟初始化图表，确保DOM已渲染
  setTimeout(() => {
    initCharts();
  }, 100);
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.system-status .stat-value {
  color: #10b981;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48%, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.content-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.date-range {
  width: 300px;
}
</style>