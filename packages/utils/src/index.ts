/**
 * @forge/utils
 * 存放业务无关、视图无关的公共基础方法库
 */

export const generateUUID = () => {
  return crypto.randomUUID();
};
