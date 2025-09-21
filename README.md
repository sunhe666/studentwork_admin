# 毕业设计项目 - 管理员后台

基于Vue3 + Element Plus构建的毕业设计项目管理员后台系统。

## 功能特性

- 仪表盘数据展示
- 用户管理
- 员工管理
- 角色权限管理
- 菜单管理
- 论文管理
- 分类管理
- 内容管理
- 公告管理
- 招聘管理
- 合作申请管理
- 日志管理
- 文件转换与压缩
- 富文本编辑器
- 数据可视化图表

## 技术栈

- Vue 3
- Element Plus
- Vue Router
- Pinia (状态管理)
- Vite
- Axios
- ECharts (数据可视化)
- WangEditor (富文本编辑器)
- jsPDF (PDF生成)
- html2canvas (截图)
- JSZip (文件压缩)
- docx (Word文档处理)

## 主要组件

- `Dashboard` - 仪表盘
- `User` - 用户管理
- `EmployeeManagement` - 员工管理
- `RoleManagement` - 角色管理
- `MenuManagement` - 菜单管理
- `Paper` - 论文管理
- `Category` - 分类管理
- `Content` - 内容管理
- `Notice` - 公告管理
- `RecruitmentManagement` - 招聘管理
- `CooperationApplication` - 合作申请
- `LogManagement` - 日志管理
- `FileConversion` - 文件转换
- `FileCompression` - 文件压缩

## 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── components/          # 页面组件
├── assets/             # 静态资源
├── plugins/            # 插件配置
├── router.js           # 路由配置
├── axios.js            # HTTP请求配置
└── zhuanye.json        # 专业数据配置
```

## 富文本编辑器

集成了WangEditor富文本编辑器，支持：
- 文本格式化
- 图片上传
- 表格插入
- 代码块
- 链接插入

## 数据可视化

使用ECharts进行数据可视化展示：
- 用户统计图表
- 论文数据分析
- 访问量统计
- 其他业务数据图表

## 部署

本项目已配置Vercel部署，推送到GitHub后可直接在Vercel中导入部署。

## 环境要求

- Node.js >= 16
- npm >= 7