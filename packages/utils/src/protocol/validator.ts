/**
 * 极简版的版本对比工具 (类似于 semver 的简化实现)。
 * 适用于 "1.0", "2.1.3" 这样的版本号字符串比对。
 */
export class ForgeValidator {
  /**
   * 将字符串版本号拆解成 [major, minor, patch]
   */
  private static parseVersion(version: string): [number, number, number] {
    const parts = version.split('.').map(v => parseInt(v, 10));
    return [
      isNaN(parts[0]) ? 1 : parts[0],
      isNaN(parts[1]) ? 0 : parts[1],
      isNaN(parts[2]) ? 0 : parts[2],
    ];
  }

  /**
   * 检查 JSON 文件版本是否可以被当前引擎版本安全打开
   * @param fileVersion JSON 文件里记录的版本
   * @param engineVersion 当前引擎支持的版本
   * @returns status - SUCCESS | WARNING | FATAL 以及对应的诊断消息
   */
  public static checkCompatibility(fileVersion: string, engineVersion: string): { status: 'SUCCESS' | 'WARNING' | 'FATAL', message?: string } {
    const [fileMajor, fileMinor] = this.parseVersion(fileVersion);
    const [engineMajor, engineMinor] = this.parseVersion(engineVersion);

    // 大版本变更：意味着底层结构可能有破坏性改变，拒绝解析
    if (fileMajor > engineMajor) {
      return { 
        status: 'FATAL', 
        message: `文件版本 (${fileVersion}) 高于当前引擎版本 (${engineVersion})，无法解析，请升级编辑器！` 
      };
    }

    // 小版本变更：通常是新增了特性，尝试兼容解析，但给出警告
    if (fileMajor === engineMajor && fileMinor > engineMinor) {
      return { 
        status: 'WARNING', 
        message: `文件版本 (${fileVersion}) 略高于当前引擎版本 (${engineVersion})，可能丢失部分新特性！` 
      };
    }

    // 引擎版本高于文件版本：属于向前兼容的范畴，未来可在这里挂载 Migration 升版脚本
    if (fileMajor < engineMajor || (fileMajor === engineMajor && fileMinor < engineMinor)) {
      return { 
        status: 'WARNING', 
        message: `当前文件是由旧版引擎 (${fileVersion}) 创建的，即将以兼容模式打开！` 
      };
    }

    return { status: 'SUCCESS' };
  }
}
