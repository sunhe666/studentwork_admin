import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { ElMessage } from 'element-plus';
import './plugins/wangEditor.css'
import { defineAsyncComponent } from 'vue'
import initializeWangEditor from './plugins/wangEditor'

// Initialize WangEditor when the app starts
initializeWangEditor()

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.config.globalProperties.$message = ElMessage
app.mount('#app')
