import { createI18n } from 'vue-i18n'

// 导入语言文件 (假设文件名不变，但内容可能代表 zh-CN)
import en from './locales/en.json'
import zh_CN from './locales/zh.json' // 重命名导入以清晰
import ru from './locales/ru.json' // 1. 导入俄语文件 (你需要创建这个文件)

// 获取初始语言：优先 URL 路径，其次 localStorage，最后默认英文
function getStartingLocale() {
  const supportedLocales = ['en', 'zh-CN', 'ru']; 
  const pathLang = window.location.pathname.split('/')[1]; // 尝试从路径获取语言 (例如 /en/xxx -> en)

  // 1. 检查路径中的语言是否有效
  if (pathLang && supportedLocales.includes(pathLang)) {
    console.log(`[i18n] Using locale from initial path: ${pathLang}`);
    localStorage.setItem('user-locale', pathLang); // 将从 URL 获取的有效语言存回 localStorage
    return pathLang;
  }

  // 2. 如果路径无效，检查 localStorage
  const savedLocale = localStorage.getItem('user-locale');
  if (savedLocale && supportedLocales.includes(savedLocale)) { 
    console.log(`[i18n] Using saved locale: ${savedLocale}`);
    return savedLocale;
  }

  // 3. 如果两者都无效，默认 'en'
  console.log('[i18n] No valid locale found in path or storage, defaulting to en.');
  return 'en'; 
}

const messages = {
  'en': en,
  'zh-CN': zh_CN, // 使用 'zh-CN' 作为键
  'ru': ru, // 2. 添加俄语到 messages
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