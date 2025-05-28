import { createI18n } from 'vue-i18n'

// 导入语言文件 (假设文件名不变，但内容可能代表 zh-CN)
import en from './locales/en.json'
import zh_CN from './locales/zh.json' // 重命名导入以清晰
import ru from './locales/ru.json' // 1. 导入俄语文件 (你需要创建这个文件)

// 支持的语言列表
const supportedLocales = ['en', 'zh-CN', 'ru'];

// 获取初始语言：优先 localStorage，否则默认英文
function getStartingLocale() {
  // console.log('[Debug i18n] Entering getStartingLocale...');

  // 在服务端渲染或初始化阶段，localStorage 可能不可用
  let savedLocale = null;
  try {
    savedLocale = localStorage.getItem('user-locale');
  } catch (e) {
    console.warn('[Debug i18n] localStorage not available:', e);
  }

  // console.log('[Debug i18n] localStorage locale:', savedLocale);

  let localeToReturn = 'en'; // Default to 'en'
  if (savedLocale && supportedLocales.includes(savedLocale)) {
    // console.log(`[i18n] Using saved locale: ${savedLocale}`);
    localeToReturn = savedLocale;
  } else {
    // 否则，无论浏览器设置如何，都默认使用英文
    // console.log('[i18n] No valid saved locale found or unsupported, defaulting to en.');
    localeToReturn = 'en';
  }
  // console.log('[Debug i18n] getStartingLocale determined:', localeToReturn);
  return localeToReturn;
}

const messages = {
  'en': en,
  'zh-CN': zh_CN, // 使用 'zh-CN' 作为键
  'ru': ru, // 2. 添加俄语到 messages
};

// console.log('[Debug i18n] Messages object for i18n:', messages);

let i18n;
try {
  // console.log('[Debug i18n] Attempting to create i18n instance...');
  i18n = createI18n({
    legacy: false, // 使用 Composition API 模式
    locale: getStartingLocale(), // 设置初始语言 (现在会严格默认 en)
    fallbackLocale: 'en', // 回退语言
    messages,
    // 其他选项...
    // missingWarn: false, // 可选：禁用缺少翻译的警告
    // fallbackWarn: false, // 可选：禁用回退翻译的警告
  });
  // console.log('[Debug i18n] i18n instance created successfully.');
} catch (e) {
  console.error('[Debug i18n] Error creating i18n instance:', e);
  // Provide a fallback minimal i18n instance if creation fails?
  // Or handle error appropriately
}

export default i18n;
export { supportedLocales };