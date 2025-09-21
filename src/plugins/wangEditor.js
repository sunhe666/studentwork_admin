import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { createEditor, createToolbar } from '@wangeditor/editor'

// 创建编辑器配置
const editorConfig = {
  placeholder: '请输入内容...',
  scroll: true,
  hoverbarKeys: {
    image: {
      menuKeys: ['imageWidth30', 'imageWidth50', 'imageWidth100', '|', 'imageAlignLeft', 'imageAlignCenter', 'imageAlignRight', '|', 'imageDelete'],
    },
  },
  MENU_CONF: {
    uploadImage: {
      // 根据用户接口要求配置单张图片上传
      server: '/upload/single',
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxNumberOfFiles: 1, // 单张图片上传
      // 移除手动设置的 Content-Type，让浏览器自动处理
        // 包含 boundary 信息的 Content-Type 会由浏览器自动生成
        headers: {
          // 可以添加其他需要的头部信息
        },
      // 上传超时时间，默认为 10 秒
      timeout: 10 * 1000,
      // 自定义插入图片逻辑
      customInsert: (res, insertFn) => {
        // 从响应中获取图片 URL
        const { url } = res
        if (url) {
          insertFn(url)
        }
      },
    },
  },
}

export default function initializeWangEditor() {
  // 这里可以放置全局初始化代码，如果需要的话
  console.log('WangEditor initialized')
}

export { Editor, Toolbar, editorConfig }