import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export interface LocalPublishFile {
  name: string;
  content: string;
  encoding: 'base64' | 'utf8';
}

export interface LocalPublishPayload {
  folderName: string;
  files: LocalPublishFile[];
}

export function localPublishPlugin(): Plugin {
  return {
    name: 'vite-plugin-local-publish',
    
    config() {
      return {
        define: {
          __LOCAL_PUBLISH_AVAILABLE__: JSON.stringify(true)
        }
      };
    },
    
    configureServer(server) {
      // 保留原来的 websocket 处理以兼容小文件或普通 JSON（不影响向后兼容）
      server.ws.on('local-publish:write', (payload: LocalPublishPayload, client) => {
        try {
          const { folderName, files } = payload;
          
          if (!folderName || folderName.includes('..') || folderName.startsWith('/')) {
            client.send('local-publish:result', { 
              success: false, 
              error: 'Invalid folderName. Must be a relative path.' 
            });
            return;
          }

          const publicDir = server.config.publicDir || path.resolve(server.config.root, 'public');
          const targetDir = path.resolve(publicDir, folderName);
          
          if (!targetDir.startsWith(publicDir)) {
            client.send('local-publish:result', { 
              success: false, 
              error: 'Forbidden path. Target directory is outside public/ folder.' 
            });
            return;
          }

          fs.mkdirSync(targetDir, { recursive: true });

          for (const file of files) {
            if (file.name.includes('..') || file.name.startsWith('/')) {
              continue; // Skip invalid filenames for safety
            }
            
            const filePath = path.resolve(targetDir, file.name);
            
            if (!filePath.startsWith(targetDir)) {
              continue;
            }

            fs.mkdirSync(path.dirname(filePath), { recursive: true });

            if (file.encoding === 'base64') {
              fs.writeFileSync(filePath, Buffer.from(file.content, 'base64'));
            } else {
              fs.writeFileSync(filePath, file.content, 'utf8');
            }
          }

          client.send('local-publish:result', { 
            success: true, 
            path: `/${folderName}`
          });
        } catch (error: any) {
          console.error('Local publish error:', error);
          client.send('local-publish:result', { 
            success: false, 
            error: error.message || String(error)
          });
        }
      });

      // 新增 HTTP 接口，用于处理超大文件的流式上传，避免 WebSocket 内存溢出
      server.middlewares.use('/__local_publish/upload', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        try {
          const rawFolder = req.headers['x-folder-name'] as string;
          const rawFile = req.headers['x-file-name'] as string;
          
          if (!rawFolder || !rawFile) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Missing headers' }));
            return;
          }

          const folderName = decodeURIComponent(rawFolder);
          const fileName = decodeURIComponent(rawFile);

          if (folderName.includes('..') || folderName.startsWith('/')) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Invalid folder name' }));
            return;
          }

          if (fileName.includes('..') || fileName.startsWith('/')) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Invalid file name' }));
            return;
          }

          // Use path.resolve on everything to ensure native OS separators (e.g. backslashes on Windows)
          // because Vite's publicDir might use forward slashes.
          const publicDir = path.resolve(server.config.publicDir || path.resolve(server.config.root, 'public'));
          const targetDir = path.resolve(publicDir, folderName);
          const filePath = path.resolve(targetDir, fileName);

          if (!targetDir.startsWith(publicDir) || !filePath.startsWith(targetDir)) {
            res.statusCode = 403;
            res.end(JSON.stringify({ success: false, error: `Forbidden path: targetDir=${targetDir}, publicDir=${publicDir}` }));
            return;
          }

          fs.mkdirSync(path.dirname(filePath), { recursive: true });

          const writeStream = fs.createWriteStream(filePath);
          req.pipe(writeStream);

          writeStream.on('finish', () => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, path: `/${folderName}/${fileName}` }));
          });

          writeStream.on('error', (err) => {
            console.error('Local publish stream error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          });

        } catch (error: any) {
          console.error('Local publish upload error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || String(error) }));
        }
      });
    }
  };
}
