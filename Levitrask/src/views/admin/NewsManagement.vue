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

// --- API Base URL ---
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'; // Use relative path or env variable

// --- Methods ---
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    // Fetch english for the main table list
    const response = await axios.get(`${apiBaseUrl}/news?lang=en`); // Adjusted path
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
                 const response = await axios.get(`${apiBaseUrl}/news/${currentEditId.value}?lang=${lang.code}`); // Adjusted path
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


const handleDelete = (row) => {
  if (!row || !row.id) {
      ElMessage.error('无法删除：缺少新闻 ID (Slug)。');
      return;
  }
  ElMessageBox.confirm(
    `确定要删除新闻 "${row.listTitle || row.id}" 吗？此操作将删除所有语言的翻译且无法撤销。`,
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    isSubmitting.value = true;
    try {
      await axios.delete(`${apiBaseUrl}/news/${row.id}`); // Adjusted path
      ElMessage.success('新闻删除成功');
      await fetchData();
    } catch (error) {
      console.error('Error deleting news:', error);
      ElMessage.error(`删除失败: ${error.response?.data?.message || error.message}`);
    } finally {
      isSubmitting.value = false;
    }
  }).catch(() => {
    ElMessage.info('删除已取消');
  });
};

// --- Submit Handler ---
const handleSubmit = async () => {
  if (!formRef.value) return;

  // 1. Save current form state back to storage for the selected language
  if (allLanguageData[selectedLanguage.value]) {
     const currentData = allLanguageData[selectedLanguage.value];
     // Save translatable fields
     currentData.listTitle = newsForm.listTitle;
     currentData.listImageAlt = newsForm.listImageAlt;
     currentData.listDescription = newsForm.listDescription;
     currentData.metaTitle = newsForm.metaTitle;
     currentData.metaDescription = newsForm.metaDescription;
     currentData.metaKeywords = newsForm.metaKeywords;
     currentData.content = newsForm.content;
     // Save non-translatable fields (important for create mode)
     currentData.slug = newsForm.slug;
     currentData.listDate = newsForm.listDate;
     currentData.listSource = newsForm.listSource;
     currentData.listImageSrc = newsForm.listImageSrc;
     console.log(`Saved final form data for ${selectedLanguage.value}`);
  } else {
     console.error(`Cannot save form data: Storage for language ${selectedLanguage.value} is missing.`);
     ElMessage.error(`内部错误：无法保存当前语言 (${selectedLanguage.value}) 的数据。`);
     return;
  }

  // 2. Validate the first language's required fields for basic check
  const baseLangCode = supportedLanguages[0]?.code || 'en';
  const baseLangData = allLanguageData[baseLangCode];
  if (!baseLangData || !baseLangData.slug || !baseLangData.listTitle || !baseLangData.listImageSrc || !baseLangData.listImageAlt || !baseLangData.content) {
       ElMessage.error(`请确保基础语言 (${baseLangCode}) 的 Slug, 标题, 图片URL, 图片Alt, 内容 字段已填写。`);
       // Optionally switch back to base language tab
       // switchLanguage(baseLangCode);
       return;
  }
   // Minimal validation on the current form (might miss errors in other langs)
   formRef.value.validate(async (valid) => {
    if (valid) {
        isSubmitting.value = true;
        try {
            if (isEditMode.value) {
                // --- UPDATE ---
                console.log('Updating news item:', currentEditId.value);
                const updatePromises = supportedLanguages.map(lang => {
                    const langData = allLanguageData[lang.code];
                    if (!langData) { // Should not happen
                        console.warn(`Skipping update for ${lang.code}: No data in storage.`);
                        return Promise.resolve();
                    }
                    // Only send update if essential translatable fields are present
                    if (!langData.listTitle && !langData.listImageAlt && !langData.content) {
                        console.warn(`Skipping update for ${lang.code}: Essential translatable fields are empty.`);
                        return Promise.resolve();
                    }

                    const payload = {
                        languageCode: lang.code,
                        // Send all fields; backend PUT handles UPSERT/update logic
                        listDate: langData.listDate, // Send non-translatable from base lang data
                        listSource: langData.listSource,
                        listImageSrc: langData.listImageSrc,
                        listTitle: langData.listTitle,
                        listImageAlt: langData.listImageAlt,
                        listDescription: langData.listDescription,
                        metaTitle: langData.metaTitle,
                        metaDescription: langData.metaDescription,
                        metaKeywords: langData.metaKeywords,
                        content: langData.content
                    };
                    console.log(`Sending PUT for ${lang.code}:`, payload);
                    return axios.put(`${apiBaseUrl}/news/${currentEditId.value}`, payload); // Adjusted path
                });
                await Promise.all(updatePromises);
                ElMessage.success('新闻更新成功 (所有语言)');

            } else {
                // --- CREATE ---
                console.log('Creating new news item...');
                const firstLangDataToPost = allLanguageData[baseLangCode]; // Use base lang for POST

                const postPayload = {
                    languageCode: baseLangCode,
                    slug: firstLangDataToPost.slug,
                    listDate: firstLangDataToPost.listDate,
                    listSource: firstLangDataToPost.listSource,
                    listImageSrc: firstLangDataToPost.listImageSrc,
                    listTitle: firstLangDataToPost.listTitle,
                    listImageAlt: firstLangDataToPost.listImageAlt,
                    listDescription: firstLangDataToPost.listDescription,
                    metaTitle: firstLangDataToPost.metaTitle,
                    metaDescription: firstLangDataToPost.metaDescription,
                    metaKeywords: firstLangDataToPost.metaKeywords,
                    content: firstLangDataToPost.content
                };
                console.log(`Sending POST for ${baseLangCode}:`, postPayload);
                const postResponse = await axios.post(`${apiBaseUrl}/news`, postPayload); // Adjusted path
                const createdNewsSlug = postResponse.data?.newsItem?.news_id;

                if (!createdNewsSlug) {
                    throw new Error('创建新闻后未能从响应中获取 news_id (slug)。');
                }
                console.log(`News created with slug: ${createdNewsSlug}`);

                // PUT other languages if they have content
                const putPromises = supportedLanguages.filter(l => l.code !== baseLangCode).map(lang => {
                    const langData = allLanguageData[lang.code];
                    if (!langData || (!langData.listTitle && !langData.listImageAlt && !langData.content)) {
                        console.warn(`Skipping PUT for ${lang.code} during create: No essential data.`);
                        return Promise.resolve();
                    }
                    const putPayload = {
                        languageCode: lang.code,
                        // Only send translatable fields for PUT after create
                        listTitle: langData.listTitle,
                        listImageAlt: langData.listImageAlt,
                        listDescription: langData.listDescription,
                        metaTitle: langData.metaTitle,
                        metaDescription: langData.metaDescription,
                        metaKeywords: langData.metaKeywords,
                        content: langData.content
                        // Non-translatable fields are set by POST
                    };
                    console.log(`Sending PUT for ${lang.code} (creation flow):`, putPayload);
                    return axios.put(`${apiBaseUrl}/news/${createdNewsSlug}`, putPayload); // Adjusted path
                });
                await Promise.all(putPromises);
                ElMessage.success('新闻创建成功 (所有语言)');
            }

            closeDialog();
            await fetchData(); // Refresh table

        } catch (error) {
            console.error('Error submitting news:', error);
            ElMessage.error(`提交失败: ${error.response?.data?.message || error.message}`);
        } finally {
            isSubmitting.value = false;
        }
    } else {
        console.log('Form validation failed');
        ElMessage.warn('请检查当前语言的表单字段是否都有效。切换到其他语言选项卡检查。');
        return false;
    }
  }); // End validate callback
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