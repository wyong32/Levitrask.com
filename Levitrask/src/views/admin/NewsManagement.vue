<template>
  <div> <!-- Root element -->
    <div class="main-header">
      <h2>新闻管理</h2>
      <el-button type="primary" @click="openCreateDialog">创建新闻</el-button>
    </div>

    <div v-if="isLoading" class="loading-area">加载中...</div>
    <div v-else-if="errorMessage" class="error-area">{{ errorMessage }}</div>
    <el-table v-else :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID / Slug" width="200"></el-table-column>
      <el-table-column label="列表图片" width="100">
         <template #default="scope">
            <img
                v-if="scope.row.listImageSrc"
                :src="scope.row.listImageSrc"
                alt="列表图片"
                style="width: 60px; height: auto; object-fit: contain;"
            />
            <span v-else>-</span>
         </template>
      </el-table-column>
      <el-table-column prop="listTitle" label="标题 (默认语言)"></el-table-column>
      <!-- Add more relevant columns later if needed -->
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create/Edit News Dialog -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="newsForm"
        :rules="formRules"
        label-width="120px"
        label-position="top"
      >
        <el-row :gutter="20"> <!-- Use grid for better layout -->
          <el-col :span="12">
             <el-form-item label="编辑语言 (Language)" prop="languageCode">
                 <el-select
                   v-model="selectedLanguage"
                   placeholder="选择语言"
                   style="width: 100%"
                   @change="switchLanguage"
                   :disabled="!isEditMode && supportedLanguages.length <= 1"
                 >
                    <el-option
                      v-for="lang in supportedLanguages"
                      :key="lang.code"
                      :label="lang.name"
                      :value="lang.code"
                    ></el-option>
                 </el-select>
                 <div v-if="!isEditMode" style="font-size: 12px; color: #999; margin-top: 5px;">
                    创建模式下，请先填写一种语言（如英语），其他语言可在保存后继续编辑。
                 </div>
             </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="URL Slug (路径)" prop="slug">
              <el-input v-model="newsForm.slug" placeholder="例如: my-first-news-article" :disabled="isEditMode"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="列表标题 (List Title - 当前语言)" prop="listTitle">
                <el-input v-model="newsForm.listTitle"></el-input>
             </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="列表日期 (List Date)" prop="listDate">
                <el-date-picker
                  v-model="newsForm.listDate"
                  type="date"
                  placeholder="留空则为当天日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :disabled="isEditMode"
                ></el-date-picker>
              </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
           <el-col :span="12">
             <el-form-item label="列表来源 (List Source)" prop="listSource">
                <el-input v-model="newsForm.listSource" :disabled="isEditMode"></el-input>
             </el-form-item>
           </el-col>
           <el-col :span="12">
             <el-form-item label="列表图片 URL (List Image URL)" prop="listImageSrc">
                <el-input v-model="newsForm.listImageSrc" placeholder="请输入图片的完整 URL" :disabled="isEditMode"></el-input>
             </el-form-item>
           </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图片 Alt 文本 (当前语言)" prop="listImageAlt">
               <el-input v-model="newsForm.listImageAlt" placeholder="图片的简短描述 (用于 SEO 和可访问性)"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
             <el-form-item label="列表描述 (List Description - 当前语言)" prop="listDescription">
                <el-input type="textarea" v-model="newsForm.listDescription" :rows="3"></el-input>
             </el-form-item>
          </el-col>
        </el-row>

        <el-divider></el-divider>

        <el-form-item label="Meta 标题 (Meta Title)" prop="metaTitle">
           <el-input v-model="newsForm.metaTitle"></el-input>
        </el-form-item>
        <el-form-item label="Meta 描述 (Meta Description)" prop="metaDescription">
            <el-input type="textarea" v-model="newsForm.metaDescription" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="Meta 关键词 (Meta Keywords)" prop="metaKeywords">
            <el-input v-model="newsForm.metaKeywords" placeholder="请用英文逗号分隔"></el-input>
        </el-form-item>

         <el-divider></el-divider>

        <el-form-item label="内容 (Content - HTML Source)" prop="content">
          <el-input
             type="textarea"
             v-model="newsForm.content"
             :rows="15"
             placeholder="请在此处输入或粘贴 HTML 源码"
          ></el-input>
        </el-form-item>

      </el-form>
      <template #footer>
         <!-- Footer buttons remain the same -->
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
            {{ isEditMode ? '更新新闻 (所有语言)' : '创建新闻' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div> <!-- Close root element -->
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- State ---
const tableData = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isDialogVisible = ref(false);
const isEditMode = ref(false);
const currentEditId = ref(null); // Stores the news_id (slug) being edited
const selectedLanguage = ref('en'); // Default language for the form

// Define supported languages (adjust as needed)
const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ru', name: 'Русский' }, // <-- Added Russian
];

// --- Form Initial State (Now includes all fields) ---
const getInitialFormState = () => ({
  slug: '',
  listTitle: '',
  listDate: null, // Non-translatable
  listSource: '', // Non-translatable
  listImageSrc: '', // Non-translatable
  listImageAlt: '',
  listDescription: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  content: ''
});

// --- Form Data (Holds data for the CURRENTLY selected language) ---
const newsForm = reactive(getInitialFormState());

// --- Data Storage for ALL Languages ---
const allLanguageData = reactive({});

// --- Form Validation Rules ---
const formRules = reactive({
  slug: [
      { required: true, message: '请输入 URL Slug', trigger: 'blur' },
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符 (-)', trigger: 'blur' }
  ],
  listTitle: [{ required: true, message: '请输入列表标题', trigger: 'blur' }],
  listImageSrc: [ { required: true, message: '请输入列表图片 URL', trigger: 'blur' } ], // Non-translatable field validation
  listImageAlt: [{ required: true, message: '请输入列表图片 Alt 文本', trigger: 'blur' }],
  listDescription: [{ required: true, message: '请输入列表描述', trigger: 'blur' }],
  metaTitle: [{ required: true, message: '请输入 Meta 标题', trigger: 'blur' }],
  metaDescription: [{ required: true, message: '请输入 Meta 描述', trigger: 'blur' }],
  metaKeywords: [{ required: true, message: '请输入 Meta 关键词', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
});
const formRef = ref(null);

// --- Computed ---
const dialogTitle = computed(() => {
    const langName = supportedLanguages.find(l => l.code === selectedLanguage.value)?.name || selectedLanguage.value;
    // Simplified title
    return `${isEditMode.value ? '编辑' : '创建'}新闻` + (isEditMode.value ? ` - ${langName}` : '');
});

// --- API Base URL & Instance (Corrected) ---
const baseUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || '') : ''; 
const api = axios.create({ baseURL: baseUrl });
console.log(`[API Setup NewsMgmt] Axios configured with baseURL: '${baseUrl || '(empty for local proxy)'}'`);

// Add interceptor for token (if not already globally configured)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('Admin auth token not found for API request in NewsManagement.');
    // Optionally handle missing token, e.g., redirect or throw error
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Methods ---
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    // Fetch english for the main table list - Use api instance and add /api prefix
    const response = await api.get(`/api/news?lang=en`); 
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      tableData.value = Object.values(response.data).map(item => ({
        ...item,
        listImageSrc: item.listImage?.src || item.listImageSrc || ''
      }));
    } else if (Array.isArray(response.data)) {
        tableData.value = response.data.map(item => ({
          ...item,
          listImageSrc: item.listImage?.src || item.listImageSrc || ''
        }));
    } else {
        console.warn('Unexpected API response format for news list:', response.data);
        tableData.value = [];
    }
  } catch (error) {
    console.error('Error fetching news list:', error);
    errorMessage.value = `获取新闻列表失败: ${error.response?.data?.message || error.message}`;
  } finally {
    isLoading.value = false;
  }
};

// --- Dialog Control ---
const openCreateDialog = () => {
  isEditMode.value = false;
  currentEditId.value = null;
  selectedLanguage.value = supportedLanguages[0]?.code || 'en'; // Default to first supported lang
  // Reset the form and the multi-language storage
  Object.assign(newsForm, getInitialFormState());
  Object.keys(allLanguageData).forEach(key => delete allLanguageData[key]);
  supportedLanguages.forEach(lang => {
      // Initialize storage for all languages
      allLanguageData[lang.code] = getInitialFormState();
  });
  // Ensure the form initially reflects the default language's (empty) state
  Object.assign(newsForm, allLanguageData[selectedLanguage.value]);

  isDialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const closeDialog = () => {
  isDialogVisible.value = false;
  // resetForm is called by the dialog's @close event
};

const resetForm = () => {
   Object.assign(newsForm, getInitialFormState());
   Object.keys(allLanguageData).forEach(key => delete allLanguageData[key]);
   currentEditId.value = null;
   selectedLanguage.value = supportedLanguages[0]?.code || 'en';
   isEditMode.value = false;
   isSubmitting.value = false;
   if (formRef.value) {
      formRef.value.resetFields();
   }
};

// --- Edit/Delete ---
const handleEdit = async (row) => {
    if (!row || !row.id) {
        ElMessage.error('无法编辑：缺少新闻 ID (Slug)。');
        return;
    }

    isEditMode.value = true;
    currentEditId.value = row.id; // Store the news_id/slug
    isDialogVisible.value = true;
    isLoading.value = true;
    errorMessage.value = '';
    const initialLang = supportedLanguages[0]?.code || 'en';
    selectedLanguage.value = initialLang;

    // Clear previous multi-language data
    Object.keys(allLanguageData).forEach(key => delete allLanguageData[key]);

    try {
        // Fetch data for all languages concurrently
        const fetchPromises = supportedLanguages.map(async (lang) => {
            try {
                 const response = await api.get(`/api/news/${currentEditId.value}?lang=${lang.code}`); // Adjusted path
                 if (response.data) {
                      allLanguageData[lang.code] = {
                          slug: currentEditId.value, // Use the current slug
                          listTitle: response.data.listTitle || '',
                          listDate: response.data.listDate || null,
                          listSource: response.data.listSource || '',
                          listImageSrc: response.data.listImage?.src || '',
                          listImageAlt: response.data.listImage?.alt || '',
                          listDescription: response.data.listDescription || '',
                          metaTitle: response.data.metaTitle || '',
                          metaDescription: response.data.metaDescription || '',
                          metaKeywords: response.data.metaKeywords || '',
                          content: response.data.content || ''
                      };
                 } else {
                      // Should not happen if API returns data, but initialize defensively
                      allLanguageData[lang.code] = { ...getInitialFormState(), slug: currentEditId.value };
                 }
            } catch (fetchError) {
                 if (fetchError.response && fetchError.response.status === 404) {
                     console.warn(`No translation found for ${lang.code}, initializing form.`);
                     // Initialize with empty translatable fields but keep slug and potentially non-translatable fields from the first successful fetch (if any)
                      allLanguageData[lang.code] = {
                          ...(allLanguageData[initialLang] || getInitialFormState()), // Use base lang data if fetched, else initial
                           slug: currentEditId.value,
                           // Clear translatable fields
                           listTitle: '', listImageAlt: '', listDescription: '', metaTitle: '', metaDescription: '', metaKeywords: '', content: ''
                      };

                 } else {
                     console.error(`Error fetching translation for ${lang.code}:`, fetchError);
                     throw fetchError;
                 }
            }
        });

        await Promise.all(fetchPromises);

        // Load the initial language's data into the form
        if (allLanguageData[initialLang]) {
            Object.assign(newsForm, allLanguageData[initialLang]);
        } else {
            // Fallback if even initial lang failed (unlikely)
            Object.assign(newsForm, getInitialFormState());
             newsForm.slug = currentEditId.value; // Ensure slug is set
        }
         // Ensure non-translatable fields in the form reflect the base language data
         newsForm.listDate = allLanguageData[initialLang]?.listDate || null;
         newsForm.listSource = allLanguageData[initialLang]?.listSource || '';
         newsForm.listImageSrc = allLanguageData[initialLang]?.listImageSrc || '';


    } catch (error) {
        console.error('Error fetching news details for editing:', error);
        errorMessage.value = `加载编辑数据失败: ${error.response?.data?.message || error.message}`;
        closeDialog();
        ElMessage.error(errorMessage.value);
    } finally {
        isLoading.value = false;
    }
};


// --- Switch Language in Form ---
const switchLanguage = (newLangCode) => {
    if (selectedLanguage.value === newLangCode) return; // No change

    // 1. Save current form state back to storage for the *previous* language
    // Important: Only save translatable fields back. Non-translatable are fixed.
    if (allLanguageData[selectedLanguage.value]) {
       const currentData = allLanguageData[selectedLanguage.value];
       currentData.listTitle = newsForm.listTitle;
       currentData.listImageAlt = newsForm.listImageAlt;
       currentData.listDescription = newsForm.listDescription;
       currentData.metaTitle = newsForm.metaTitle;
       currentData.metaDescription = newsForm.metaDescription;
       currentData.metaKeywords = newsForm.metaKeywords;
       currentData.content = newsForm.content;
       console.log(`Saved form data for ${selectedLanguage.value}`);
    }

    // 2. Load new language data into the form
    if (allLanguageData[newLangCode]) {
        const newData = allLanguageData[newLangCode];
        // Load only translatable fields into the form
        newsForm.listTitle = newData.listTitle;
        newsForm.listImageAlt = newData.listImageAlt;
        newsForm.listDescription = newData.listDescription;
        newsForm.metaTitle = newData.metaTitle;
        newsForm.metaDescription = newData.metaDescription;
        newsForm.metaKeywords = newData.metaKeywords;
        newsForm.content = newData.content;
        // Keep non-translatable fields (slug, date, source, imageSrc) from the initial load
        const baseLang = supportedLanguages[0]?.code || 'en';
        newsForm.slug = allLanguageData[baseLang]?.slug || currentEditId.value || ''; // Ensure slug is correct
        newsForm.listDate = allLanguageData[baseLang]?.listDate || null;
        newsForm.listSource = allLanguageData[baseLang]?.listSource || '';
        newsForm.listImageSrc = allLanguageData[baseLang]?.listImageSrc || '';

        console.log(`Loaded form data for ${newLangCode}`);
    } else {
        // This case should ideally not happen if initialization is correct
        console.warn(`Data for language ${newLangCode} not found in storage. Resetting translatable fields.`);
        newsForm.listTitle = '';
        newsForm.listImageAlt = '';
        newsForm.listDescription = '';
        newsForm.metaTitle = '';
        newsForm.metaDescription = '';
        newsForm.metaKeywords = '';
        newsForm.content = '';
        // Initialize storage entry if it was missing
        allLanguageData[newLangCode] = { ...newsForm };
    }

    // 3. Update the selected language state
    selectedLanguage.value = newLangCode;

    // Clear validation messages when switching languages
    nextTick(() => {
      formRef.value?.clearValidate(['listTitle', 'listImageAlt', 'listDescription', 'metaTitle', 'metaDescription', 'metaKeywords', 'content']); // Only clear translatable field validation
    });
};


const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除新闻 "${row.listTitle}" (ID: ${row.id}) 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    // User confirmed deletion
    try {
      // Add /api prefix
      await api.delete(`/api/news/${row.id}`);
      ElMessage.success('新闻删除成功！');
      await fetchData(); // Refresh list
    } catch (error) {
      console.error(`Error deleting news item ${row.id}:`, error);
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  } catch (e) {
    // User cancelled
    console.log('Deletion cancelled');
  }
};

// --- 添加日志点 --- 
console.log('[NewsManagement] Defining saveCurrentLanguageData...');
// --- Function to save current form data ---
const saveCurrentLanguageData = () => {
  console.log('[NewsManagement] saveCurrentLanguageData function executed!'); // <-- 日志点
  const lang = selectedLanguage.value;
  if (allLanguageData[lang]) {
    console.log(`Saving current form data for language: ${lang}`);
    const currentData = allLanguageData[lang];
    // Update only translatable fields
    currentData.listTitle = newsForm.listTitle;
    currentData.listImageAlt = newsForm.listImageAlt;
    currentData.listDescription = newsForm.listDescription;
    currentData.metaTitle = newsForm.metaTitle;
    currentData.metaDescription = newsForm.metaDescription;
    currentData.metaKeywords = newsForm.metaKeywords;
    currentData.content = newsForm.content;
    // Non-translatable fields are assumed consistent
  } else {
    console.warn(`Attempted to save data for language ${lang}, but no entry exists yet.`);
    // Create the entry if it doesn't exist
    allLanguageData[lang] = {
        listTitle: newsForm.listTitle,
        listImageAlt: newsForm.listImageAlt,
        listDescription: newsForm.listDescription,
        metaTitle: newsForm.metaTitle,
        metaDescription: newsForm.metaDescription,
        metaKeywords: newsForm.metaKeywords,
        content: newsForm.content,
        // Copy non-translatable from the form as well
        slug: newsForm.slug,
        listDate: newsForm.listDate,
        listSource: newsForm.listSource,
        listImageSrc: newsForm.listImageSrc
     };
  }
};

// --- Submit Handler ---
const handleSubmit = async () => {
  if (!formRef.value) return;
  formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      errorMessage.value = '';

      // Save the current language data before potentially switching
      saveCurrentLanguageData();

      // --- Prepare payload matching backend expectations --- 
      const currentLang = selectedLanguage.value;
      const currentTranslationData = allLanguageData[currentLang] || {};

      const payload = {
        // Non-translatable fields (use camelCase as expected by backend)
        slug: newsForm.slug,
        listDate: newsForm.listDate, 
        listSource: newsForm.listSource,
        listImageSrc: newsForm.listImageSrc,
        // Translatable fields for the *current* language
        languageCode: currentLang,
        listTitle: currentTranslationData.listTitle || '', // Add fallback for safety
        listImageAlt: currentTranslationData.listImageAlt || '',
        listDescription: currentTranslationData.listDescription || '',
        metaTitle: currentTranslationData.metaTitle || '',
        metaDescription: currentTranslationData.metaDescription || '',
        metaKeywords: currentTranslationData.metaKeywords || '',
        content: currentTranslationData.content || ''
        // Removed the nested 'translations' object
      };

      // --- Validation for frontend before sending ---
      const requiredFields = ['slug', 'languageCode', 'listTitle', 'listImageSrc', 'listImageAlt', 'listDescription', 'metaTitle', 'metaDescription', 'metaKeywords', 'content'];
      const missingFields = requiredFields.filter(field => !payload[field]);

      if (missingFields.length > 0) {
          errorMessage.value = `前端验证失败: 缺少字段 ${missingFields.join(', ')}`;
          ElMessage.error(errorMessage.value);
          isSubmitting.value = false;
          return; // Stop submission
      }
      // --- End Frontend Validation ---

      try {
        let response;
        if (isEditMode.value) {
          console.log(`Updating news item (slug: ${currentEditId.value}) with payload:`, payload);
          // Add /api prefix
          response = await api.put(`/api/news/${currentEditId.value}`, payload);
          ElMessage.success('新闻更新成功！');
        } else {
          console.log('Creating new news item with payload:', payload);
          // Add /api prefix
          response = await api.post('/api/news', payload);
          ElMessage.success('新闻创建成功！');
        }
        closeDialog();
        await fetchData(); // Refresh the table
      } catch (error) {
        console.error('Error submitting news form:', error);
        errorMessage.value = error.response?.data?.message || (isEditMode.value ? '更新失败' : '创建失败');
        ElMessage.error(errorMessage.value);
        // Keep dialog open
      } finally {
        isSubmitting.value = false;
      }
    } else {
      console.log('Form validation failed');
      return false;
    }
  });
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchData();
});

</script>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.loading-area, .error-area {
  padding: 20px;
  text-align: center;
}
.error-area {
  color: red;
}
.dialog-footer {
  text-align: right;
}

/* Add some padding/margins within the dialog form items */
.el-form-item {
    margin-bottom: 18px; /* Adjust spacing between form items */
}
/* Ensure dividers have space */
.el-divider {
    margin-top: 20px;
    margin-bottom: 20px;
}
</style> 