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
              <el-button @click="addNavSection" type="success" plain :icon="Plus">添加导航项 ({{ lang.name }})</el-button>
        <p class="form-hint">提示: 此处的 ID 必须与下方内容中使用的 section 标签的 ID 完全一致。</p>

        <!-- Right Sidebar Data -->
              <el-divider>右侧边栏内容 (Sidebar Data - {{ lang.name }})</el-divider>
              <el-checkbox v-model="questionForm.translations[lang.code].sidebarData.includeRelatedResources" label="包含相关资源链接" size="large" />
              <div v-if="questionForm.translations[lang.code].sidebarData.includeRelatedResources" class="sidebar-section-editor">
            <h4>相关资源链接:</h4>
                  <div v-for="(link, index) in questionForm.translations[lang.code].sidebarData.relatedResources" :key="`${lang.code}-rel-${index}`" class="dynamic-list-item">
                     <el-form-item :label="`链接 ${index + 1} 文本`" :prop="`translations.${lang.code}.sidebarData.relatedResources.${index}.text`" :rules="formRules.sidebarLinkText">
                       <el-input v-model="link.text" placeholder="显示的链接文字" />
                     </el-form-item>
                     <el-form-item :label="`链接 ${index + 1} 路径 (To)`" :prop="`translations.${lang.code}.sidebarData.relatedResources.${index}.to`" :rules="formRules.sidebarLinkTo">
                       <el-input v-model="link.to" placeholder="例如: /blog/some-post 或 /questions/other-q" />
                     </el-form-item>
                     <div class="dynamic-list-actions">
                       <el-button type="danger" @click="removeRelatedResource(index)" :icon="Delete" circle />
                     </div>
                  </div>
                   <el-button @click="addRelatedResource" type="success" plain :icon="Plus">添加相关资源 ({{ lang.name }})</el-button>
        </div>

              <el-checkbox v-model="questionForm.translations[lang.code].sidebarData.includeFaqs" label="包含常见问题链接" size="large" style="margin-top: 15px;"/>
               <div v-if="questionForm.translations[lang.code].sidebarData.includeFaqs" class="sidebar-section-editor">
            <h4>常见问题链接:</h4>
                   <div v-for="(link, index) in questionForm.translations[lang.code].sidebarData.faqs" :key="`${lang.code}-faq-${index}`" class="dynamic-list-item">
                     <el-form-item :label="`链接 ${index + 1} 文本`" :prop="`translations.${lang.code}.sidebarData.faqs.${index}.text`" :rules="formRules.sidebarLinkText">
                       <el-input v-model="link.text" placeholder="显示的链接文字" />
                     </el-form-item>
                     <el-form-item :label="`链接 ${index + 1} 路径 (To)`" :prop="`translations.${lang.code}.sidebarData.faqs.${index}.to`" :rules="formRules.sidebarLinkTo">
                       <el-input v-model="link.to" placeholder="例如: /questions/another-faq" />
                     </el-form-item>
                     <div class="dynamic-list-actions">
                       <el-button type="danger" @click="removeFaq(index)" :icon="Delete" circle />
                     </div>
                   </div>
                   <el-button @click="addFaq" type="success" plain :icon="Plus">添加常见问题 ({{ lang.name }})</el-button>
        </div>
              <!-- Add checkboxes and editors for other potential sidebar sections -->

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
import axios from 'axios';
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
const currentEditDbId = ref(null);
const isLoadingDetails = ref(false);

// --- Form Initial State & Data (RESTRUCTURED for Multi-language) ---
const getInitialTranslationState = () => ({
  list_title: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  navSections: [],
  sidebarData: {
  includeRelatedResources: false,
      relatedResources: [],
  includeFaqs: false,
      faqs: [],
  },
  content: ''
});

const getInitialFormState = () => {
    const initialState = {
        id: null,
        question_id: '',
        translations: {}
    };
    supportedLanguages.value.forEach(lang => {
        initialState.translations[lang.code] = getInitialTranslationState();
    });
    return initialState;
};

const questionForm = reactive(getInitialFormState());
const formRef = ref(null); 
const activeLangTab = ref(DEFAULT_LANG);

// --- Form Validation Rules (Adjusted for structure) ---
const formRules = reactive({
  question_id: [
      { required: true, message: '请输入 URL Slug (路径)', trigger: 'blur' },
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符 (-)', trigger: 'blur' }
  ],
  defaultListTitle: [{ required: true, message: `请输入 ${DEFAULT_LANG} 列表标题`, trigger: 'blur' }],
  defaultContent: [{ required: true, message: `请输入 ${DEFAULT_LANG} 内容`, trigger: 'blur' }],
  navSectionId: [
      { required: true, message: '请输入导航项 ID', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_-]+$/, message: 'ID 只能包含字母、数字、下划线或连字符', trigger: 'blur' }
  ],
  navSectionTitle: [{ required: true, message: '请输入导航项标题', trigger: 'blur' }],
  sidebarLinkText: [{ required: true, message: '请输入链接文本', trigger: 'blur' }],
  sidebarLinkTo: [{ required: true, message: '请输入链接路径', trigger: 'blur' }], 
});

// --- Computed --- 
const dialogTitle = computed(() => isEditMode.value ? `编辑问题 (ID: ${currentEditDbId.value})` : '创建新问题');

// --- API Setup ---
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const adminApi = axios.create({ baseURL: apiBaseUrl });

adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('admin-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
     console.warn("Admin token not found in localStorage for API request.");
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Event Handlers ---

// --- Data Fetching ---
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  tableData.value = [];
  try {
    const response = await adminApi.get(`/admin/questions`);
    if (Array.isArray(response.data)) {
        tableData.value = response.data.map(item => {
            const defaultTranslation = item.translations?.find(t => t.language_code === DEFAULT_LANG);
            return {
                id: item.id,
                question_id: item.question_id,
                listTitle: defaultTranslation?.list_title || '(无标题)',
                translations: item.translations || []
            };
        });
         console.log("Fetched questions for admin:", tableData.value);
    } else {
      console.warn('Admin questions API response data is not an array:', response.data);
      tableData.value = [];
      errorMessage.value = '收到的数据格式无法处理。'
    }
  } catch (error) {
    console.error("Error fetching admin questions:", error);
    errorMessage.value = error.response?.data?.message || '加载问题列表失败';
    ElMessage.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
};

// --- Dialog Management ---
const resetForm = () => {
    Object.assign(questionForm, getInitialFormState());
    currentEditDbId.value = null;
    activeLangTab.value = DEFAULT_LANG;
    nextTick(() => {
  if (formRef.value) {
          formRef.value.clearValidate();
  }
    });
};

const openCreateDialog = () => {
    resetForm();
  isEditMode.value = false;
  isDialogVisible.value = true;
};

const handleEdit = (row) => {
    resetForm();
    isEditMode.value = true;
    currentEditDbId.value = row.id;

    questionForm.id = row.id;
    questionForm.question_id = row.question_id;

    const existingTranslations = row.translations || [];
    supportedLanguages.value.forEach(lang => {
        const existing = existingTranslations.find(t => t.language_code === lang.code);
        if (existing) {
            questionForm.translations[lang.code] = {
                list_title: existing.list_title || '',
                meta_title: existing.meta_title || '',
                meta_description: existing.meta_description || '',
                meta_keywords: existing.meta_keywords || '',
                navSections: existing.nav_sections || [],
                sidebarData: {
                    includeRelatedResources: !!(existing.sidebar_data?.relatedResources?.length > 0),
                    relatedResources: existing.sidebar_data?.relatedResources || [],
                    includeFaqs: !!(existing.sidebar_data?.faqs?.length > 0),
                    faqs: existing.sidebar_data?.faqs || [],
                },
                content: existing.content || ''
            };
        } else {
             questionForm.translations[lang.code] = getInitialTranslationState();
        }
    });

    activeLangTab.value = DEFAULT_LANG;
    isDialogVisible.value = true;
};

const closeDialog = () => {
  isDialogVisible.value = false;
};

// --- Dynamic List Management (Modified for Active Language Tab) ---
const addNavSection = () => {
  const currentLang = activeLangTab.value;
  if (questionForm.translations[currentLang]) {
     if (!Array.isArray(questionForm.translations[currentLang].navSections)) {
         questionForm.translations[currentLang].navSections = [];
     }
     questionForm.translations[currentLang].navSections.push({ id: '', title: '' });
  }
};
const removeNavSection = (index) => {
   const currentLang = activeLangTab.value;
   if (questionForm.translations[currentLang]?.navSections) {
       questionForm.translations[currentLang].navSections.splice(index, 1);
   }
};
const addRelatedResource = () => {
  const currentLang = activeLangTab.value;
   if (questionForm.translations[currentLang]) {
       if (!questionForm.translations[currentLang].sidebarData) questionForm.translations[currentLang].sidebarData = { relatedResources: [], faqs: [] };
       if (!Array.isArray(questionForm.translations[currentLang].sidebarData.relatedResources)) {
            questionForm.translations[currentLang].sidebarData.relatedResources = [];
       }
       questionForm.translations[currentLang].sidebarData.relatedResources.push({ text: '', to: '' });
       questionForm.translations[currentLang].sidebarData.includeRelatedResources = true;
   }
};
const removeRelatedResource = (index) => {
    const currentLang = activeLangTab.value;
    if (questionForm.translations[currentLang]?.sidebarData?.relatedResources) {
         questionForm.translations[currentLang].sidebarData.relatedResources.splice(index, 1);
         if (questionForm.translations[currentLang].sidebarData.relatedResources.length === 0) {
             questionForm.translations[currentLang].sidebarData.includeRelatedResources = false;
         }
    }
};
const addFaq = () => {
    const currentLang = activeLangTab.value;
    if (questionForm.translations[currentLang]) {
       if (!questionForm.translations[currentLang].sidebarData) questionForm.translations[currentLang].sidebarData = { relatedResources: [], faqs: [] };
        if (!Array.isArray(questionForm.translations[currentLang].sidebarData.faqs)) {
             questionForm.translations[currentLang].sidebarData.faqs = [];
        }
        questionForm.translations[currentLang].sidebarData.faqs.push({ text: '', to: '' });
        questionForm.translations[currentLang].sidebarData.includeFaqs = true;
    }
};
const removeFaq = (index) => {
     const currentLang = activeLangTab.value;
     if (questionForm.translations[currentLang]?.sidebarData?.faqs) {
          questionForm.translations[currentLang].sidebarData.faqs.splice(index, 1);
          if (questionForm.translations[currentLang].sidebarData.faqs.length === 0) {
              questionForm.translations[currentLang].sidebarData.includeFaqs = false;
          }
     }
};

// --- Form Submission --- 
const handleSubmit = async () => {
  if (!formRef.value) return;

  isSubmitting.value = true;
  try {
    const isValid = await formRef.value.validate();

    let translationsValid = true;
    const defaultTranslation = questionForm.translations[DEFAULT_LANG];
    if (!defaultTranslation.list_title || !defaultTranslation.meta_title || !defaultTranslation.meta_description || !defaultTranslation.content) {
        translationsValid = false;
        ElMessage.error(`请填写默认语言 (${DEFAULT_LANG}) 的必填翻译字段 (列表标题, Meta 标题, Meta 描述, 内容)。`);
    }

    if (!isValid || !translationsValid) {
         console.log('Form validation failed');
         ElMessage.warning('请检查表单输入是否完整且符合要求。');
         isSubmitting.value = false;
         return;
    }

    if (isEditMode.value && currentEditDbId.value) {
      console.log('Updating question:', currentEditDbId.value);

      const updatePromises = supportedLanguages.value.map(lang => {
          const langCode = lang.code;
          const translationData = questionForm.translations[langCode];
          const sidebarDataToSave = {
              relatedResources: translationData.sidebarData.includeRelatedResources ? translationData.sidebarData.relatedResources : [],
              faqs: translationData.sidebarData.includeFaqs ? translationData.sidebarData.faqs : []
          };

          const translationPayload = {
              list_title: translationData.list_title,
              meta_title: translationData.meta_title,
              meta_description: translationData.meta_description,
              meta_keywords: translationData.meta_keywords,
              nav_sections: translationData.navSections,
              sidebar_data: sidebarDataToSave,
              content: translationData.content,
          };
          console.log(`Updating translation for ${langCode}:`, translationPayload);
          return adminApi.put(`/admin/questions/${currentEditDbId.value}/translations/${langCode}`, translationPayload);
      });
      await Promise.all(updatePromises);
      ElMessage.success('问题更新成功！');

    } else {
      console.log('Creating new question');
      const translationsPayload = supportedLanguages.value.map(lang => {
            const langCode = lang.code;
            const translationData = questionForm.translations[langCode];
             const sidebarDataToSave = {
                relatedResources: translationData.sidebarData.includeRelatedResources ? translationData.sidebarData.relatedResources : [],
                faqs: translationData.sidebarData.includeFaqs ? translationData.sidebarData.faqs : []
             };
            return {
                language_code: langCode,
                list_title: translationData.list_title,
                meta_title: translationData.meta_title,
                meta_description: translationData.meta_description,
                meta_keywords: translationData.meta_keywords,
                nav_sections: translationData.navSections,
                sidebar_data: sidebarDataToSave,
                content: translationData.content,
            };
       }).filter(t => t.list_title || t.content);

       if (translationsPayload.length === 0) {
            ElMessage.error('至少需要为一种语言填写标题或内容。');
            isSubmitting.value = false;
            return;
       }

       const mainPayload = {
          question_id: questionForm.question_id,
          translations: translationsPayload
       };
       console.log("Creating with payload:", mainPayload);
       await adminApi.post(`/admin/questions`, mainPayload);
       ElMessage.success('新问题创建成功！');
    }

    closeDialog();
    await fetchData();

  } catch (error) {
    console.error("Error submitting question form:", error);
    const apiErrorMessage = error.response?.data?.message || (isEditMode.value ? '更新失败' : '创建失败');
    ElMessage.error(`操作失败: ${apiErrorMessage}`);
  } finally {
    isSubmitting.value = false;
  }
};

// --- Deletion --- 
const handleDelete = async (row) => {
  if (!row.id) {
      ElMessage.error('无法删除：缺少问题数据库 ID。');
      return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除问题 "${row.listTitle}" (ID: ${row.question_id}) 吗？`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    );
    await adminApi.delete(`/admin/questions/${row.id}`);
    ElMessage.success('问题删除成功！');
    await fetchData();
  } catch (error) {
      if (error !== 'cancel') {
        console.error(`Error deleting question ${row.id}:`, error);
        ElMessage.error(`删除失败: ${error.response?.data?.message || error.message}`);
      }
  }
};

// --- Lifecycle ---
onMounted(() => {
  fetchData();
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