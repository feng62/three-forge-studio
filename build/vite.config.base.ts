import { defineConfig, PluginOption, UserConfig } from 'vite';
import { execSync } from 'child_process';
import path from 'path';

export function monorepoWatchPlugin(watchPackages: string[]): PluginOption {
  return {
    name: 'monorepo-watch-plugin',
    configureServer(server) {
      console.log('\n======================================');
      console.log('👀 [Monorepo Watcher] 插件已成功加载！');

      watchPackages.forEach(pkg => {
        // 由于配置被抽取到了 build-config 包，或者是直接在 apps/demo 里调用
        // 我们统一基于 process.cwd()（通常是 apps/demo）向上两级找 packages 目录
        const targetDir = path.resolve(process.cwd(), '../../packages', pkg);
        const pkgSrcPath = path.resolve(targetDir, 'src');

        server.watcher.add(pkgSrcPath);
        console.log(`🔗 正在监听目录: ${pkgSrcPath}`);
      });
      console.log('======================================\n');

      server.watcher.on('change', (file) => {
        const normalizedFile = file.replace(/\\/g, '/');
        const matchedPkg = watchPackages.find(pkg => normalizedFile.includes(`packages/${pkg}/src`));

        if (matchedPkg) {
          console.log(`\n📦 [Monorepo] 检测到 ${matchedPkg} 源码发生改变!`);
          console.log(`🚀 正在执行构建...\n`);

          try {
            const targetDir = path.resolve(process.cwd(), '../../packages', matchedPkg);
            execSync(`pnpm run build`, {
              cwd: targetDir,
              stdio: 'inherit'
            });

            console.log(`\n✅ [Monorepo] ${matchedPkg} 构建完成，刷新页面...\n`);
            server.ws.send({ type: 'full-reload' });
          } catch (error: any) {
            console.error(`\n❌ [Monorepo] ${matchedPkg} 构建失败:`, error.message);
          }
        }
      });
    }
  };
}

export function defineAppConfig(appConfig: UserConfig = {}, watchPackages: string[] = []) {
  return defineConfig({
    ...appConfig,
    server: {
      ...appConfig.server,
      fs: {
        strict: false,
        allow: ['../..']
      }
    },
    plugins: [
      ...(appConfig.plugins || []),
      monorepoWatchPlugin(watchPackages)
    ]
  });
}
