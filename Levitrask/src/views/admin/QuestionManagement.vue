<template>
  <div> <!-- Root element -->
    <div class="main-header">
      <h2>问题管理</h2>
      <el-button type="primary" @click="openCreateDialog">创建问题</el-button>
    </div>

    <div v-if="isLoading" class="loading-area">加载中...</div>
    <div v-else-if="errorMessage" class="error-area">{{ errorMessage }}</div>
    <el-table v-else :data="tableData" stripe style="width: 100%">
      <el-table-column prop="question_id" label="ID (Slug)" width="250" />
      <el-table-column prop="listTitle" label="标题 (默认语言)" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create/Edit Question Dialog -->
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
        :model="questionForm" 
        :rules="formRules" 
        label-width="120px"
        label-position="top"
      >
        <!-- Non-translatable fields (e.g., Slug) -->
        <el-form-item label="URL Slug (路径 - 创建后不可修改)" prop="question_id">
          <el-input v-model="questionForm.question_id" placeholder="例如: why-levitra-unavailable" :disabled="isEditMode" />
        </el-form-item>

        <!-- Language Tabs for Translatable Fields -->
        <el-tabs 
          v-model="activeLangTab" 
          @click.stop 
        >
          <el-tab-pane
            v-for="lang in supportedLanguages"
            :key="lang.code"
            :label="lang.name"
            :name="lang.code"
          >
            <!-- Ensure translation object exists before accessing -->
            <div v-if="questionForm.translations[lang.code]">
        <!-- Basic Info -->
               <el-form-item
                  :label="`列表标题 (${lang.name})`"
                  :prop="`translations.${lang.code}.list_title`"
                  :rules="lang.code === DEFAULT_LANG ? formRules.defaultListTitle : []" 
                >
                  <el-input v-model="questionForm.translations[lang.code].list_title" />
            </el-form-item>

        <!-- Meta Info -->
              <el-divider>SEO Meta 信息 ({{ lang.name }})</el-divider>
              <el-form-item :label="`Meta 标题 (${lang.name})`" :prop="`translations.${lang.code}.meta_title`">
                <el-input v-model="questionForm.translations[lang.code].meta_title" />
        </el-form-item>
              <el-form-item :label="`Meta 描述 (${lang.name})`" :prop="`translations.${lang.code}.meta_description`">
                <el-input type="textarea" v-model="questionForm.translations[lang.code].meta_description" :rows="2" />
        </el-form-item>
              <el-form-item :label="`Meta 关键词 (${lang.name})`" :prop="`translations.${lang.code}.meta_keywords`">
                <el-input v-model="questionForm.translations[lang.code].meta_keywords" placeholder="请用英文逗号分隔"/>
        </el-form-item>

        <!-- Left Navigation Sections -->
              <el-divider>左侧导航 (Nav Sections - {{ lang.name }})</el-divider>
              <div v-for="(section, index) in questionForm.translations[lang.code].navSections" :key="`${lang.code}-nav-${index}`" class="dynamic-list-item">
                <el-form-item 
                  :label="`导航项 ${index + 1} ID`" 
                  :prop="`translations.${lang.code}.navSections.${index}.id`" 
                  :rules="formRules.navSectionId"
                >
                  <el-input v-model="section.id" placeholder="对应内容 section 标签的 ID" />
                </el-form-item>
                <el-form-item 
                  :label="`导航项 ${index + 1} 标题`" 
                  :prop="`translations.${lang.code}.navSections.${index}.title`" 
                  :rules="formRules.navSectionTitle"
                >
                  <el-input v-model="section.title" placeholder="显示在导航中的文本" />
                </el-form-item>
                <div class="dynamic-list-actions">
                  <el-button type="danger" @click="removeNavSection(index)" :icon="Delete" circle />
                </div>
              </div>
              <el-button @click="addNavSection" type="success" plain :icon="Plus" style="margin-bottom: 10px;">添加导航项 ({{ lang.name }})</el-button>
        <p class="form-hint">提示: 此处的 ID 必须与下方内容中使用的 section 标签的 ID 完全一致。</p>

        <!-- Right Sidebar Data -->
              <el-divider>右侧边栏内容 (Sidebar Data - {{ lang.name }})</el-divider>
              <div v-for="(block, index) in questionForm.translations[lang.code].sidebarData" :key="`${lang.code}-sidebar-${index}`" class="dynamic-list-item sidebar-block-item">
                <h4>区块 {{ index + 1 }}</h4>
                <el-form-item 
                  :label="`区块 ${index + 1} 标题 (可选)`" 
                  :prop="`translations.${lang.code}.sidebarData.${index}.title`" 
                  >
                  <el-input v-model="block.title" placeholder="侧边栏区块的标题" />
                     </el-form-item>
                <el-form-item 
                  :label="`区块 ${index + 1} 内容 (HTML)`" 
                  :prop="`translations.${lang.code}.sidebarData.${index}.content`" 
                  :rules="formRules.sidebarBlockContent"
                >
                  <el-input type="textarea" v-model="block.content" :rows="5" placeholder="输入侧边栏区块的 HTML 内容" />
                     </el-form-item>
                     <div class="dynamic-list-actions">
                  <el-button type="danger" @click="removeSidebarBlock(index)" :icon="Delete" circle />
                     </div>
                 <el-divider v-if="index < questionForm.translations[lang.code].sidebarData.length - 1" style="margin-top: 15px; margin-bottom: 15px;" />
                  </div>
              <el-button @click="addSidebarBlock" type="success" plain :icon="Plus" style="margin-bottom: 10px;">添加侧边栏区块 ({{ lang.name }})</el-button>
               <p class="form-hint">提示: 内容区域支持输入 HTML 代码，用来在自定义侧边栏区块的显示。</p>

        <!-- Main Content -->
              <el-divider>主要内容 (HTML - {{ lang.name }})</el-divider>
               <el-form-item
                 :label="`内容 (Content - HTML Source - ${lang.name})`"
                 :prop="`translations.${lang.code}.content`"
                 :rules="lang.code === DEFAULT_LANG ? formRules.defaultContent : []" 
                >
           <div class="form-hint" style="margin-bottom: 5px;">
             请确保使用 `<section id="..."></section>` 包裹主要内容块，并且 `id` 与上面定义的左侧导航 ID 对应。
           </div>
           <el-input 
             type="textarea" 
                   v-model="questionForm.translations[lang.code].content"
             :rows="20" 
             placeholder="在此处输入或粘贴 HTML 源码"
           />
        </el-form-item>
            </div>
            <div v-else>
                <!-- Optional: Placeholder if somehow translation object is missing -->
                <p>语言 {{ lang.name }} 的数据加载错误。</p>
            </div>
          </el-tab-pane>
        </el-tabs>

      </el-form>
      <template #footer>
         <span class="dialog-footer">
          <!-- <el-button @click="logFormData">记录表单数据</el-button> --> <!-- Removed debug button -->
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
            {{ isEditMode ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div> <!-- Close root element -->
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';

// --- BEGIN API Client Setup (Moved to Top) ---
import axios from 'axios';

// Create a configured Axios instance for this component (Corrected baseURL)
const apiClient = axios.create({
  baseURL: import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || '') : '', // Use correct pattern
  // timeout: 10000, // Optional: Add timeout
});
console.log(`[API Setup QuestionMgmt] Axios configured with baseURL: '${apiClient.defaults.baseURL || '(empty for local proxy)'}'`);

// Add request interceptor for Authentication
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('admin-auth-token'); // Adjust storage key if needed
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("Admin auth token not found in localStorage for API request.");
    // Handle missing token case if needed (e.g., redirect to login)
  }
  return config;
}, error => {
  // Handle request error
  console.error('API Request Error:', error);
  return Promise.reject(error);
});
// --- END API Client Setup ---

import { ElMessage, ElMessageBox, ElTabs, ElTabPane, ElForm, ElFormItem, ElInput, ElButton, ElTable, ElTableColumn, ElDialog, ElRow, ElCol, ElIcon, ElCheckbox, ElDivider } from 'element-plus';
import { Plus, Delete, Check, Edit } from '@element-plus/icons-vue';
import { cloneDeep } from 'lodash-es';

// --- Language Configuration ---
const supportedLanguages = ref([
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
]);
const DEFAULT_LANG = 'en';

// --- State --- 
const tableData = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isDialogVisible = ref(false);
const isEditMode = ref(false); 
const currentEditDbId = ref(null); // Numeric DB ID
const isLoadingDetails = ref(false); // Added for loading state in dialog

// --- Form Initial State & Data ---
const getInitialTranslationState = (langCode = '') => ({ // Added langCode for potential defaults
  language_code: langCode,
  list_title: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  // Ensure navSections is always initialized as an array
  navSections: [],
  // CHANGE: sidebarData is now an array of blocks
  sidebarData: [],
  content: ''
});

const getInitialFormState = () => {
    const initialState = {
        id: null, // Numeric DB ID
        question_id: '', // Text slug
        // Add other non-translatable fields from levitrask_questions here if any
        // category: '',
        // is_active: true,
        translations: {} // Structure to hold data per language
    };
    supportedLanguages.value.forEach(lang => {
        // Initialize each language, ensuring structure exists
        initialState.translations[lang.code] = getInitialTranslationState(lang.code);
    });
    return initialState;
};

const questionForm = reactive(getInitialFormState());
const formRef = ref(null); 
const activeLangTab = ref(DEFAULT_LANG);

// --- Form Validation Rules ---
const formRules = reactive({
  question_id: [
      { required: true, message: '请输入 URL Slug (路径)', trigger: 'blur' },
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符 (-)', trigger: 'blur' }
  ],
  // Use a function for dynamic validation message based on active tab? Or apply required only to default lang.
  defaultListTitle: [{ required: true, message: `请输入 ${DEFAULT_LANG} 列表标题`, trigger: 'blur' }],
  defaultContent: [{ required: true, message: `请输入 ${DEFAULT_LANG} 内容`, trigger: 'blur' }],
  navSectionId: [
      { required: true, message: '请输入导航项 ID', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_-]+$/, message: 'ID 只能包含字母、数字、下划线或连字符', trigger: 'blur' }
  ],
  navSectionTitle: [{ required: true, message: '请输入导航项标题', trigger: 'blur' }],
  // REMOVE: old sidebar link rules
  // sidebarLinkText: [{ required: true, message: '请输入链接文本', trigger: 'blur' }],
  // sidebarLinkTo: [{ required: true, message: '请输入链接路径', trigger: 'blur' }],
  // ADD: new rule for sidebar block content
  sidebarBlockContent: [{ required: true, message: '请输入侧边栏区块内容', trigger: 'blur' }],
});

// --- Computed --- 
const dialogTitle = computed(() => isEditMode.value ? '编辑问题' : '创建问题');

// --- API Calls ---
const fetchQuestions = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    // Use the admin endpoint to get the full list
    const response = await apiClient.get('/api/admin/questions');
    // Map the response data to include db_id
    if (Array.isArray(response.data)) {
        tableData.value = response.data.map(item => {
            const defaultTranslation = item.translations?.find(t => t.language_code === DEFAULT_LANG) || {};
             return {
                db_id: item.id, // <-- Map backend 'id' to frontend 'db_id'
                id: item.id, // Keep original id if needed elsewhere
                question_id: item.question_id,
                // Extract default language title for display in the table
                listTitle: defaultTranslation.list_title || `[No Title - ${item.question_id}]`,
                // Include other fields if needed by the table or edit/delete
                // fullData: item // Optional: Store the full original item
            };
        });
    } else {
        console.warn('Unexpected response format for questions list:', response.data);
        tableData.value = [];
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    errorMessage.value = '加载问题列表失败。 ' + (error.response?.data?.message || error.message);
  } finally {
    isLoading.value = false;
  }
};

const fetchQuestionDetails = async (dbId) => {
  isLoadingDetails.value = true;
  try {
    console.log(`Fetching details for question DB ID: ${dbId}`);
    // **ASSUMPTION:** Backend provides GET /admin/questions/:id endpoint
    // This endpoint should return the main data + ALL translations, similar to the list endpoint but for one item.
    // Add /api prefix and correct path
    const response = await apiClient.get(`/api/admin/questions/${dbId}`);
    const questionData = response.data;
    console.log(`Fetched details:`, questionData);
    // --- 添加日志 1: 打印完整后端响应 ---
    console.log('--- DEBUG: Raw questionData from API ---');
    console.log(JSON.stringify(questionData, null, 2));
    // --- 结束日志 1 ---

    // Reset form to initial state first to clear previous data
    resetForm();
    isEditMode.value = true; // Set edit mode AFTER resetForm but before loading
    currentEditDbId.value = dbId;

    // --- 强制重新初始化 translations 对象 --- 
    questionForm.translations = {}; // 清空旧引用
    supportedLanguages.value.forEach(lang => {
        questionForm.translations[lang.code] = getInitialTranslationState(lang.code);
    });
    console.log('--- DEBUG: questionForm.translations after explicit re-initialization ---');
    console.log(JSON.stringify(questionForm.translations, null, 2));
    // --- 结束强制初始化 ---

    // Populate non-translatable fields
    questionForm.id = questionData.id;
    questionForm.question_id = questionData.question_id;
    // Populate other non-translatable fields from questionData if they exist in the form state
    // questionForm.category = questionData.category;
    // questionForm.is_active = questionData.is_active;

    // Populate translations
    supportedLanguages.value.forEach(lang => {
      const translation = questionData.translations?.find(t => t.language_code === lang.code);
      // --- 添加日志 2: 打印找到的翻译对象 (针对默认语言) ---
      if (lang.code === DEFAULT_LANG) {
          console.log(`--- DEBUG: Found translation object for default lang (${DEFAULT_LANG}) ---`);
          console.log(JSON.stringify(translation, null, 2));
      }
      // --- 结束日志 2 ---
      if (translation) {
        // Ensure nested structures exist before assigning
        questionForm.translations[lang.code] = {
          ...getInitialTranslationState(lang.code), // Start with defaults
          // Assign basic fields directly from translation object
          list_title: translation.list_title || '',
          meta_title: translation.meta_title || '',
          meta_description: translation.meta_description || '',
          meta_keywords: translation.meta_keywords || '',
          content: translation.content || '',
          // CHANGE: Access snake_case from API response for JSON fields
          navSections: cloneDeep(translation.nav_sections || []),
          sidebarData: cloneDeep(translation.sidebar_data || []) // Expecting array, default to []
        };
      } else {
        // If a translation for a supported language is missing, initialize it
        questionForm.translations[lang.code] = getInitialTranslationState(lang.code);
        console.warn(`No translation found for ${lang.code}, initialized.`);
      }
    });

    // --- 添加日志 3: 打印填充后的默认语言表单状态 ---
    console.log(`--- DEBUG: questionForm.translations[${DEFAULT_LANG}] AFTER population ---`);
    console.log(JSON.stringify(questionForm.translations[DEFAULT_LANG], null, 2));
    // --- 结束日志 3 ---

    activeLangTab.value = DEFAULT_LANG; // Reset tab to default
    isDialogVisible.value = true;

  } catch (error) {
    console.error(`Error fetching question details for DB ID ${dbId}:`, error);
    ElMessage.error('加载问题详情失败。 ' + (error.response?.data?.message || error.message));
  } finally {
    isLoadingDetails.value = false;
  }
};

const createQuestion = async (payload) => {
  // **ASSUMPTION:** Backend provides POST /admin/questions
  console.log('Creating new question with payload:', payload);
  const response = await apiClient.post('/api/admin/questions', payload);
  return response.data; // Expecting the newly created question data back
};

const updateQuestion = async (dbId, formState) => {
  // **ASSUMPTION:** Backend provides PUT /admin/questions/:id for non-translatable fields
  // **ASSUMPTION:** Backend provides PUT /admin/questions/:id/translations/:lang for translations

  console.log(`Updating question DB ID: ${dbId}`);
  let updatedData = null;

  // 1. Update non-translatable fields (IF NEEDED - slug is disabled in edit mode usually)
  // Only include fields that are actually part of the main table and potentially changed
  const nonTranslatablePayload = {
     question_id: formState.question_id, // Slug is usually fixed after creation
     // Add other non-translatable fields if they exist and are editable
     // category: formState.category,
     // is_active: formState.is_active,
  };
  // Check if non-translatable fields actually need updating (optional, depends on backend robustness)
  // For now, let's assume we *might* update the main table (e.g., if slug *was* editable)
  // If slug is ALWAYS disabled in edit, this PUT might be skippable unless other fields exist.
  try {
     console.log('Updating non-translatable fields:', nonTranslatablePayload);
     // Use PUT /:id for non-translatable updates
     const mainUpdateResponse = await apiClient.put(`/api/admin/questions/${dbId}`, nonTranslatablePayload);
     updatedData = mainUpdateResponse.data; // Get potentially updated base data
     console.log('Non-translatable fields updated successfully.');
  } catch (error) {
      console.error('Error updating non-translatable fields:', error);
      // If slug conflict (409) or other error, re-throw to stop the process
       if (error.response && error.response.status === 409) {
          throw new Error(`Slug "${nonTranslatablePayload.question_id}" already exists.`);
       }
       throw new Error('Failed to update base question details.');
  }


  // 2. Update translations for each language
  const translationPromises = supportedLanguages.value.map(lang => {
    const langCode = lang.code;
    const translationPayload = formState.translations[langCode];
    if (!translationPayload) {
        console.warn(`No translation data found in form state for ${langCode}, skipping update.`);
        return Promise.resolve(); // Skip if no data somehow
    }
    // Ensure payload structure matches backend expectations
    const cleanedPayload = {
        list_title: translationPayload.list_title || null,
        meta_title: translationPayload.meta_title || null,
        meta_description: translationPayload.meta_description || null,
        meta_keywords: translationPayload.meta_keywords || null,
        navSections: translationPayload.navSections || [],
        // CHANGE: Send sidebarData as an array
        sidebarData: translationPayload.sidebarData || [], // Send array
        content: translationPayload.content || null,
    };
    console.log(`Updating translation for ${langCode}:`, cleanedPayload);
    // **ASSUMPTION:** Use PUT /:id/translations/:lang for each translation
    return apiClient.put(`/api/admin/questions/${dbId}/translations/${langCode}`, cleanedPayload);
  });

  // Wait for all translation updates
  await Promise.all(translationPromises);
  console.log('All translations updated successfully.');

  // Optionally, fetch the final state again to ensure consistency, or trust the last API response
  // For simplicity, we might just rely on the data returned from the main PUT or assume success
  // If the main PUT didn't run (e.g., only translations updated), we need to fetch the final state.
   if (!updatedData) {
       console.log("Fetching final state after translation-only update...");
       const finalStateResponse = await apiClient.get(`/api/admin/questions/${dbId}`);
       updatedData = finalStateResponse.data;
   }

  return updatedData; // Return the potentially updated question data
};


const deleteQuestion = async (dbId) => {
   // **ASSUMPTION:** Backend provides DELETE /admin/questions/:id
   console.log(`Deleting question DB ID: ${dbId}`);
   await apiClient.delete(`/api/admin/questions/${dbId}`);
   console.log(`Question DB ID: ${dbId} deleted successfully.`);
};


// --- Event Handlers ---
const openCreateDialog = () => {
    resetForm();
  isEditMode.value = false;
  isDialogVisible.value = true;
  activeLangTab.value = DEFAULT_LANG;
  currentEditDbId.value = null;
};

const handleEdit = async (row) => {
  // Use the numeric db_id stored in the table data
  if (row.db_id === undefined || row.db_id === null) {
      console.error("Row data is missing 'db_id'. Cannot edit.", row);
      ElMessage.error("无法编辑：缺少必要的 ID 信息。");
      return;
  }
  console.log(`Editing row with DB ID: ${row.db_id}`);
  // Fetch full details using the DB ID
  await fetchQuestionDetails(row.db_id);
};

const handleDelete = (row) => {
  if (row.db_id === undefined || row.db_id === null) {
      console.error("Row data is missing 'db_id'. Cannot delete.", row);
      ElMessage.error("无法删除：缺少必要的 ID 信息。");
      return;
  }
   const title = row.listTitle || row.question_id; // Use title or slug for confirmation message
   ElMessageBox.confirm(
     `确定要删除问题 "${title}" (DB ID: ${row.db_id}) 吗？此操作无法撤销。`,
     '确认删除',
     {
       confirmButtonText: '删除',
       cancelButtonText: '取消',
       type: 'warning',
     }
   )
   .then(async () => {
     try {
       await deleteQuestion(row.db_id);
       ElMessage.success('问题删除成功！');
       // Refresh the list after deleting
       await fetchQuestions();
     } catch (error) {
       console.error(`Error deleting question DB ID ${row.db_id}:`, error);
       ElMessage.error('删除失败。 ' + (error.response?.data?.message || error.message));
     }
   })
   .catch(() => {
     // User cancelled
     ElMessage.info('删除已取消');
   });
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  isSubmitting.value = true;
  try {
    // Validate the form (might only validate the currently active tab + base fields)
    // Consider full validation across all languages if necessary before submitting
    await formRef.value.validate();

    // Prepare payload - structure might differ slightly for create vs update
    // Create expects a single object with non-translatable fields + a translations array
    // Update involves separate calls
    
    const formToSend = cloneDeep(questionForm); // Work with a copy

    if (isEditMode.value) {
      // --- Update Logic ---
      if (!currentEditDbId.value) {
         throw new Error("Cannot update: Missing current question DB ID.");
      }
      const updatedQuestion = await updateQuestion(currentEditDbId.value, formToSend);
      ElMessage.success('问题更新成功！');
      // Optionally update the table row data without full refresh
      const index = tableData.value.findIndex(item => item.db_id === currentEditDbId.value);
      if (index !== -1 && updatedQuestion) {
          const defaultTranslation = updatedQuestion.translations?.find(t => t.language_code === DEFAULT_LANG) || {};
          tableData.value[index] = {
             db_id: updatedQuestion.id,
             question_id: updatedQuestion.question_id,
             listTitle: defaultTranslation.list_title || `[No Title - ${updatedQuestion.question_id}]`,
             fullData: updatedQuestion
            };
        } else {
           await fetchQuestions(); // Fallback to full refresh
      }


    } else {
      // --- Create Logic ---
      const createPayload = {
          question_id: formToSend.question_id,
          // Add other non-translatable fields here from formToSend if they exist
          // category: formToSend.category,
          // is_active: formToSend.is_active,
          translations: supportedLanguages.value.map(lang => ({
             ...formToSend.translations[lang.code], // Include all fields
             // CHANGE: Ensure sidebarData is array
             sidebarData: formToSend.translations[lang.code].sidebarData || [],
             language_code: lang.code
          }))
      };
       // Filter out translations that might be completely empty if backend requires at least one field?
       // createPayload.translations = createPayload.translations.filter(t => t.list_title || t.content); // Example filter

      const newQuestion = await createQuestion(createPayload);
      ElMessage.success('问题创建成功！');
      // Add the new question to the table data (or refresh list)
       await fetchQuestions(); // Refresh list is simpler

    }

    closeDialog();

  } catch (error) {
    console.error('Error submitting form:', error);
    // Check if error is just validation failure
    if (error && typeof error === 'object' && !(error instanceof Error)) {
         console.log('Form validation failed:', error);
         // ElMessage automatically handles form validation errors typically
    } else {
        ElMessage.error('提交失败：' + (error.message || '请检查表单并重试。'));
    }
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
    // Reset reactive form state more thoroughly
    const initialState = getInitialFormState();
    questionForm.id = initialState.id;
    questionForm.question_id = initialState.question_id;
    // Explicitly reset the translations object and its nested arrays
    questionForm.translations = {}; // Create a new object reference
    supportedLanguages.value.forEach(lang => {
        questionForm.translations[lang.code] = {
            ...getInitialTranslationState(lang.code), // Get defaults
            navSections: [], // Ensure arrays are reset
            sidebarData: []  // Ensure arrays are reset
        };
    });

    // Reset specific edit mode states
    isEditMode.value = false;
    currentEditDbId.value = null;
    activeLangTab.value = DEFAULT_LANG;
    // Reset validation state
    nextTick(() => {
        if (formRef.value) {
            formRef.value.clearValidate();
            formRef.value.resetFields(); // May reset based on initial props, use Object.assign for safety
        }
    });
};

const closeDialog = () => {
  resetForm();
  isDialogVisible.value = false;
};

// --- Dynamic List Management ---
const addNavSection = () => {
  const currentLang = activeLangTab.value;
  if (!questionForm.translations[currentLang].navSections) {
         questionForm.translations[currentLang].navSections = [];
     }
     questionForm.translations[currentLang].navSections.push({ id: '', title: '' });
};

const removeNavSection = (index) => {
   const currentLang = activeLangTab.value;
  if (questionForm.translations[currentLang].navSections) {
       questionForm.translations[currentLang].navSections.splice(index, 1);
   }
};

const addSidebarBlock = () => {
  const currentLang = activeLangTab.value;
  if (!questionForm.translations[currentLang].sidebarData) {
    questionForm.translations[currentLang].sidebarData = []; // Ensure it's an array
  }
  // Add a new block object
  questionForm.translations[currentLang].sidebarData.push({ title: '', content: '' });
};

const removeSidebarBlock = (index) => {
  const currentLang = activeLangTab.value;
  if (questionForm.translations[currentLang].sidebarData) {
    questionForm.translations[currentLang].sidebarData.splice(index, 1);
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchQuestions();
});

// Optional: Watch active tab change if you need to trigger something specifically
watch(activeLangTab, (newLang, oldLang) => {
  console.log(`Switched language tab from ${oldLang} to ${newLang}`);
  // You might want to re-validate or perform other actions on tab change
});

</script>

<style scoped>
/* Basic styles similar to NewsManagement */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.loading-area,
.error-area {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.error-area {
    color: #F56C6C;
}

/* Styles for the dynamic list items */
.dynamic-list-item {
  background-color: #f9f9f9;
  padding: 15px;
  margin-bottom: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  position: relative; /* Needed for absolute positioning of delete button */
}

.dynamic-list-actions {
  /* Adjust vertical alignment if needed */
  /* display: flex; 
  align-items: center; 
  height: 100%; */ 
  position: absolute; /* Position delete button */
  top: 10px;
  right: 10px;
}

.sidebar-section-editor {
    border: 1px dashed #dcdfe6;
    padding: 15px;
    margin-top: 10px;
    border-radius: 4px;
    background-color: #fafafa;
}

.sidebar-section-editor h4 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1em;
    color: #606266;
}

/* Hint text style */
.form-hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  margin-top: -5px; /* Adjust as needed */
  margin-bottom: 10px;
}
</style> 