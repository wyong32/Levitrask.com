import { createI18n } from 'vue-i18n'

// 导入语言文件 (假设文件名不变，但内容可能代表 zh-CN)
import en from './locales/en.json'
import zh_CN from './locales/zh.json' // 重命名导入以清晰

// 获取初始语言：优先 localStorage，否则默认英文
function getStartingLocale() {
  const savedLocale = localStorage.getItem('user-locale');
  // 只信任 localStorage 中明确保存的受支持语言代码
  if (savedLocale === 'en' || savedLocale === 'zh-CN') {
    console.log(`[i18n] Using saved locale: ${savedLocale}`);
    return savedLocale;
  }
  // 否则，无论浏览器设置如何，都默认使用英文
  console.log('[i18n] No valid saved locale found, defaulting to en.');
  return 'en'; 
}

const messages = {
  'en': en,
  'zh-CN': zh_CN, // 使用 'zh-CN' 作为键
};

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getStartingLocale(), // 设置初始语言 (现在会严格默认 en)
  fallbackLocale: 'en', // 回退语言
  messages, 
  // 其他选项...
  // missingWarn: false, // 可选：禁用缺少翻译的警告
  // fallbackWarn: false, // 可选：禁用回退翻译的警告
});

export default i18n; 