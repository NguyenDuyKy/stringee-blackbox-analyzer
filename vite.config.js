import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // './' = đường dẫn tương đối -> chạy được trên GitHub Pages (project page)
  // mà không cần biết tên repo.
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    open: true
  }
});
