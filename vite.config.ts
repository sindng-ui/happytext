import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'happytext-seed-api',
      configureServer(server) {
        // 워크스페이스 내 묵향 폴더 및 로컬 텍스트 목록 자동 API 제공
        server.middlewares.use('/api/seed-books', (req, res) => {
          try {
            const mukhyangDir = path.resolve(__dirname, '묵향');
            if (fs.existsSync(mukhyangDir)) {
              const files = fs.readdirSync(mukhyangDir)
                .filter(f => f.endsWith('.txt'))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

              const volumes = files.map(filename => {
                const filePath = path.join(mukhyangDir, filename);
                const stats = fs.statSync(filePath);
                return {
                  id: `mukhyang_${filename}`,
                  title: filename.replace(/\.txt$/i, ''),
                  filename,
                  sizeBytes: stats.size,
                  path: `/api/raw-book/묵향/${encodeURIComponent(filename)}`
                };
              });

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                id: 'mukhyang-series',
                title: '묵향',
                totalVolumes: volumes.length,
                volumes
              }));
              return;
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: '묵향 디렉토리를 찾을 수 없습니다.' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });

        // 개별 텍스트 파일 원본 바이너리 스트리밍 (CP949 디코딩 테스트용)
        server.middlewares.use('/api/raw-book', (req, res) => {
          try {
            const decodedUrl = decodeURIComponent(req.url || '');
            const cleanPath = decodedUrl.replace(/^\//, '');
            const targetPath = path.resolve(__dirname, cleanPath);

            if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
              res.setHeader('Content-Type', 'application/octet-stream');
              const stream = fs.createReadStream(targetPath);
              stream.pipe(res);
              return;
            }
            res.statusCode = 404;
            res.end('File Not Found');
          } catch (err: any) {
            res.statusCode = 500;
            res.end(err.message);
          }
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true
  }
});
