import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/balloon/',  // ← GitHub 저장소 이름으로 바꿔주세요
  plugins: [react()],
});
