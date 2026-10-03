import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function gitSyncPlugin() {
  return {
    name: 'git-sync-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/git/status' || url === '/api/updates/status') {
          try {
            const { spawn } = await import('child_process');
            const proc = spawn('python3', ['scripts/github_sync.py', 'status'], { cwd: __dirname });
            let output = '';
            proc.stdout.on('data', (d: Buffer) => { output += d.toString(); });
            proc.on('close', () => {
              res.setHeader('Content-Type', 'application/json');
              res.end(output || JSON.stringify({ isGit: true, changedFiles: [], totalChanged: 0 }));
            });
            return;
          } catch (e: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        }

        if (url === '/api/git/preflight') {
          try {
            const { exec } = await import('child_process');
            exec('npx tsc --noEmit', { cwd: __dirname }, (err: any, stdout: string, stderr: string) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                lintPassed: !err,
                output: stdout || stderr || 'Проверка TypeScript пройдена без ошибок (0 ошибок).'
              }));
            });
            return;
          } catch (e: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ lintPassed: false, error: e.message }));
            return;
          }
        }

        if (url === '/api/git/push' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { token, commitMessage } = JSON.parse(body || '{}');
              const { spawn } = await import('child_process');
              const args = ['scripts/github_sync.py', token || ''];
              if (commitMessage) args.push(commitMessage);
              const proc = spawn('python3', args, { cwd: __dirname });
              let output = '';
              let errorOutput = '';
              proc.stdout.on('data', (d: Buffer) => { output += d.toString(); });
              proc.stderr.on('data', (d: Buffer) => { errorOutput += d.toString(); });
              proc.on('close', (code: number) => {
                res.setHeader('Content-Type', 'application/json');
                if (output && output.trim().startsWith('{')) {
                  res.end(output);
                } else {
                  res.end(JSON.stringify({
                    success: code === 0,
                    message: output || 'Команда выполнена',
                    error: code !== 0 ? (errorOutput || output || 'Ошибка выполнения push') : undefined
                  }));
                }
              });
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gitSyncPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
