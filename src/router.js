import { createRouter, createWebHistory } from 'vue-router';
import FileCompression from './components/FileCompression.vue';
import FileConversion from './components/FileConversion.vue';
import Login from './components/Login.vue';
import Home from './components/Home.vue';
import Carousel from './components/Carousel.vue';
import Content from './components/Content.vue';
import Category from './components/Category.vue';
import User from './components/User.vue';
import Notice from './components/Notice.vue';
import Paper from './components/Paper.vue';
import CooperationApplication from './components/CooperationApplication.vue';
import MenuManagement from './components/MenuManagement.vue';
import RoleManagement from './components/RoleManagement.vue';
import EmployeeManagement from './components/EmployeeManagement.vue';
import LogManagement from './components/LogManagement.vue';
import Dashboard from './components/Dashboard.vue';
import RecruitmentManagement from './components/RecruitmentManagement.vue';
import ReductionManagement from './components/ReductionManagement.vue';
import OriginalFileViewer from './components/OriginalFileViewer.vue';


const Settings = { template: '<div>系统设置内容</div>' };

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
      path: '/',
      name: 'Home',
      component: Home,
      redirect: '/dashboard',
      children: [
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: Dashboard,
          meta: {
            title: '系统仪表盘'
          }
        },
      {
        path: '/user',
        name: 'user',
        component: User,
    meta: { title: '用户管理' }
      },
      {
        path: '/settings',
        name: 'settings',
        component: Settings
      },
      {
        path: '/carousel',
        name: 'carousel',
        component: Carousel
      },
      {
      path: '/content',
      name: 'Content',
      component: Content,
      meta: { title: '内容管理' }
    },
    {      path: '/category',      name: 'Category',      component: Category,      meta: { title: '分类管理' }    },    {      path: '/notice',      name: 'Notice',      component: Notice,      meta: { title: '公告管理' }    },
    {      path: '/paper',      name: 'Paper',      component: Paper,      meta: { title: '论文管理' }    },
    {      path: '/cooperation-application',      name: 'CooperationApplication',      component: CooperationApplication,      meta: { title: '合作申请管理' }    },
    {
      path: '/menu-management',
      name: 'MenuManagement',
      component: MenuManagement,
      meta: { title: '菜单管理' }
    },
    {
      path: '/role',
      name: 'role',
      component: RoleManagement,
      meta: { title: '角色管理' }
    },
     {      path: '/employee',      name: 'employee',      component: EmployeeManagement,      meta: { title: '员工管理' }    },
          { path: '/position', name: 'PositionManagement', component: RecruitmentManagement, meta: { title: '招聘管理' } },
    {      path: '/log',      name: 'LogManagement',      component: LogManagement,      meta: { title: '日志管理' }    },
    {      path: '/reduction-management',      name: 'ReductionManagement',      component: ReductionManagement,      meta: { title: '降重记录管理' }    },
    {      path: '/original-file-viewer/:id',      name: 'OriginalFileViewer',      component: OriginalFileViewer,      meta: { title: '原始文件查看' }    },
      {    path: '/compression',    name: 'FileCompression',    component: FileCompression  },
      {    path: '/conversion',    name: 'FileConversion',    component: FileConversion, meta: { title: '文件格式转换' }  },
 
]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;