import path from 'path';
import react from '@vitejs/plugin-react' // << อย่าลืม import plugin react
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // ✅ เพิ่ม base ตรงนี้
      base: '/DevTaskManagerAI/',

      // ✅ เพิ่ม plugins ตรงนี้
      plugins: [react()],

      // 👇 ของเดิมที่คุณมีอยู่แล้ว
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});