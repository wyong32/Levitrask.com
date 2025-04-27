<template>
  <div class="page-management-container">
    <div class="main-header">
      <h2>{{ pageTitle }}</h2>
      <el-button type="primary" @click="handleCreate">
         <el-icon><Plus /></el-icon> 创建新页面
      </el-button>
    </div>

    <p class="page-hint">{{ pageHint }}</p>

    <div v-if="isLoading" class="loading-area">加载页面列表中...</div>
    <div v-else-if="errorMessage" class="error-area">{{ errorMessage }}</div>

    <el-table v-else :data="managedPages" stripe style="width: 100%">
      <el-table-column prop="page_identifier" label="页面标识符 (Slug)" min-width="200" />
      <el-table-column prop="list_title" label="列表标题" min-width="250">
         <template #default="scope">
           {{ scope.row.list_title || '-' }}
         </template>
      </el-table-column>
      <el-table-column label="排序" width="100" header-align="center" align="center">
         <template #default="scope">
             <el-button 
               type="info" 
               :icon="ArrowUpBold" 
               circle 
               plain 
               size="small" 
               @click="moveItemUp(scope.$index)" 
               :disabled="scope.$index === 0" 
             />
             <el-button 
               type="info" 
               :icon="ArrowDownBold" 
               circle 
               plain 
               size="small" 
               @click="moveItemDown(scope.$index)" 
               :disabled="scope.$index === managedPages.length - 1" 
               style="margin-left: 5px;"
             />
         </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="最后更新时间" width="200">
         <template #default="scope">
            {{ formatTimestamp(scope.row.updated_at) }}
         </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" header-align="center" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleEdit(scope.row)">
             <el-icon><Edit /></el-icon> 编辑
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleDelete(scope.row)" 
            style="margin-left: 5px;">
             <el-icon><Delete /></el-icon> 删除 
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create/Edit Page Dialog -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <div v-if="isLoadingDetails" class="loading-area">加载页面详情中...</div>
      <div v-else-if="detailErrorMessage" class="error-area">{{ detailErrorMessage }}</div>
      <el-form
        v-else
        ref="formRef"
        :model="editForm"
        :rules="formRules"
        label-width="120px"
        label-position="top"
      >
        <el-row :gutter="20">
           <el-col :span="12">
        <el-form-item label="页面标识符 (Slug)" prop="page_identifier">
           <el-input v-model="editForm.page_identifier" :disabled="isEditMode" placeholder="例如: aspirin-info (小写字母/数字/连字符)"/>
           <div class="form-tip">页面标识符（通常来自 URL）在创建后不可修改。必须唯一。</div>
        </el-form-item>
           </el-col>
           <el-col :span="6">
             <el-form-item label="编辑语言 (Language)" prop="language_code">
                   <el-select
                     v-model="selectedLanguage"
                     placeholder="选择语言"
                     style="width: 100%"
                     @change="switchLanguage"
                     :disabled="!isEditMode"
                   >
                      <el-option
                        v-for="lang in supportedLanguages"
                        :key="lang.code"
                        :label="lang.name"
                        :value="lang.code"
                      />
                   </el-select>
                   <div class="form-tip" v-if="!isEditMode">创建页面时将使用此语言作为初始版本。</div>
                   <div class="form-tip" v-if="isEditMode">选择要编辑或创建的语言版本。</div>
               </el-form-item>
           </el-col>
        </el-row>

        <el-divider>列表与 Meta 信息 (当前语言: {{ selectedLanguage }})</el-divider>
        <el-row :gutter="20">
           <el-col :span="12">
             <el-form-item label="列表标题 (List Title)" prop="list_title">
               <el-input v-model="editForm.list_title" placeholder="用于导航下拉列表或页面列表显示"/>
             </el-form-item>
           </el-col>
           <el-col :span="12">
             <el-form-item label="列表描述 (List Description)" prop="list_description">
               <el-input type="textarea" :rows="2" v-model="editForm.list_description" placeholder="用于未来可能的页面列表显示"/>
             </el-form-item>
           </el-col>
        </el-row>
        <el-form-item label="Meta 标题 (Meta Title)" prop="meta_title">
           <el-input v-model="editForm.meta_title" />
        </el-form-item>
        <el-form-item label="Meta 描述 (Meta Description)" prop="meta_description">
            <el-input type="textarea" :rows="3" v-model="editForm.meta_description" />
        </el-form-item>
        <el-form-item label="Meta 关键词 (Meta Keywords)" prop="meta_keywords">
            <el-input v-model="editForm.meta_keywords" placeholder="请用英文逗号分隔"/>
        </el-form-item>

        <!-- === Editable Left Navigation (Translatable) === -->
        <el-divider>左侧导航 (Nav Sections - 当前语言: {{ selectedLanguage }})</el-divider>
        <div v-for="(section, index) in editForm.nav_sections" :key="index" class="dynamic-list-item">
           <el-row :gutter="10">
              <el-col :span="10">
                 <el-form-item 
                    :label="`导航项 ${index + 1} ID`" 
                    :prop="`nav_sections.${index}.id`" 
                    :rules="formRules.navSectionId"
                  >
                    <el-input v-model="section.id" placeholder="对应内容 section 标签的 ID" />
                 </el-form-item>
              </el-col>
              <el-col :span="10">
                 <el-form-item 
                    :label="`导航项 ${index + 1} 标题`" 
                    :prop="`nav_sections.${index}.title`" 
                    :rules="formRules.navSectionTitle"
                 >
                    <el-input v-model="section.title" placeholder="显示在导航中的文本" />
             </el-form-item>
              </el-col>
              <el-col :span="4" class="dynamic-list-actions">
                 <el-button type="danger" @click="removeNavSection(index)" :icon="Delete" circle />
              </el-col>
           </el-row>
        </div>
        <el-button 
          @click="addNavSection" 
          type="success" 
          plain 
          :icon="Plus"
          style="margin-bottom: 10px;"
        >
          添加导航项
        </el-button>
        <p class="form-hint">提示: 此处的 ID 必须与下方"主要内容"中使用的 section 标签的 ID 完全一致，用于页内跳转。</p>

        <!-- === Editable Right Sidebar (Translatable) === -->
        <el-divider>右侧边栏区块 (Sidebar Blocks - 当前语言: {{ selectedLanguage }})</el-divider>
        <div v-for="(block, index) in editForm.sidebar_data" :key="`sidebar-${index}`" class="dynamic-list-item sidebar-block-item">
           <el-row :gutter="10">
              <el-col :span="20">
                 <el-form-item 
                    :label="`区块 ${index + 1} 标题 (可选)`" 
                    :prop="`sidebar_data.${index}.title`" 
                    :rules="formRules.sidebarBlockTitle"
                  >
                    <el-input v-model="block.title" placeholder="侧边栏区块的标题" />
                 </el-form-item>
                 <el-form-item 
                    :label="`区块 ${index + 1} 内容 (HTML)`" 
                    :prop="`sidebar_data.${index}.html_content`" 
                    :rules="formRules.sidebarBlockContent"
                  >
                    <el-input 
                      type="textarea" 
                      v-model="block.html_content" 
                      :rows="5" 
                      placeholder="输入侧边栏区块的 HTML 内容"
                    />
             </el-form-item>
              </el-col>
              <el-col :span="4" class="dynamic-list-actions sidebar-block-actions">
                 <el-button type="danger" @click="removeSidebarBlock(index)" :icon="Delete" circle />
              </el-col>
           </el-row>
           <el-divider v-if="index < editForm.sidebar_data.length - 1" style="margin-top: 0; margin-bottom: 15px;" />
        </div>
        <el-button 
          @click="addSidebarBlock" 
          type="primary"
          plain 
          :icon="Plus" 
          style="margin-bottom: 10px;"
        >
          添加侧边栏区块
        </el-button>
        <p class="form-hint">提示: 内容区域支持输入 HTML 代码来自定义侧边栏区块的显示。</p>

        <!-- === Main Content (Translatable) === -->
        <el-divider>主要内容 (HTML - 当前语言: {{ selectedLanguage }})</el-divider>
        <el-form-item label="页面内容 (Content)" prop="content">
           <div class="form-hint" style="margin-bottom: 5px;">
             提示: 如果使用了左侧导航，请确保将内容用 `<section id="..."></section>` 包裹，并且 `id` 与上面定义的左侧导航 ID 对应。
           </div>
           <el-input
             type="textarea"
             v-model="editForm.content"
             :rows="20"
             placeholder="在此处输入或粘贴页面的 HTML 源码"
           />
        </el-form-item>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
            {{ isEditMode ? '保存 ' + selectedLanguage + ' 更改' : '创建页面 (' + selectedLanguage + ')' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox, ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElTable, ElTableColumn, ElIcon, ElDivider, ElRow, ElCol } from 'element-plus';
import { Edit, Plus, Delete, ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue';
import { cloneDeep } from 'lodash';

// --- Define Props ---
const props = defineProps({
  pageType: {
    type: String,
    required: true
  }
});

// --- Dynamic Title and Hint ---
const pageTitle = computed(() => {
  switch (props.pageType) {
    case 'drug': return '药物管理';
    case 'comparison': return '对比管理';
    case 'buy-online': return '药物在线管理';
    default: return '页面管理';
  }
});

const pageHint = computed(() => {
  switch (props.pageType) {
    case 'drug': return '管理在 "Drugs-In-This-Class" 下拉菜单中显示的页面内容。';
    case 'comparison': return '管理在 "药物比较" 下拉菜单中显示的页面内容。';
    case 'buy-online': return '管理在 "药物在线" 下拉菜单中显示的页面内容。';
    default: return '管理相关页面内容。';
  }
});

// --- Computed Dialog Title (UPDATED) ---
const dialogTitle = computed(() => {
    const typeName = pageTitle.value.replace('管理', '');
    const langName = supportedLanguages.find(l => l.code === selectedLanguage.value)?.name || selectedLanguage.value;
    const action = isEditMode.value ? '编辑' : '创建';
    return `${action} ${typeName} 页面内容 (${langName})`;
});

// --- State ---
const managedPages = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isDialogVisible = ref(false);
const isLoadingDetails = ref(false);
const detailErrorMessage = ref('');
const isSubmitting = ref(false);
const formRef = ref(null);
const currentEditingIdentifier = ref(null);
const currentEditId = ref(null);
const isEditMode = ref(false);

// NEW: Language state
const DEFAULT_LANG = 'en';
const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ru', name: 'Русский' },
  // Add more languages here
];
const selectedLanguage = ref(DEFAULT_LANG);

// NEW: Store for all language form data
const allLanguageData = reactive({});

// --- Add state for reordering --- 
const isReordering = ref(false);

// --- Initial State for one language ---
const getInitialLanguageState = (langCode) => ({
  language_code: langCode,
  list_title: '',
  list_description: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  // Ensure consistent snake_case naming
  nav_sections: [],
  sidebar_data: [],
  content: ''
});

// --- Form State ---
const editForm = reactive({
  id: null,
  project_id: null,
  page_type: props.pageType,
  page_identifier: '',
  sort_order: 100,
  // Fields for the CURRENTLY selected language
  language_code: DEFAULT_LANG,
  list_title: '',
  list_description: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  // Use consistent snake_case here to match template v-model
  nav_sections: [],
  sidebar_data: [],
  content: ''
});

// --- Form Rules (No major changes needed for now, but review specific field requirements) ---
const formRules = reactive({
  page_identifier: [
      { required: true, message: '页面标识符不能为空', trigger: 'blur' },
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  page_type: [
      { required: true, message: '页面类型是必需的', trigger: 'change' }
  ],
  list_title: [{ required: true, message: '列表标题不能为空', trigger: 'blur' }],
  meta_title: [{ required: true, message: 'Meta 标题不能为空', trigger: 'blur' }],
  meta_description: [{ required: true, message: 'Meta 描述不能为空', trigger: 'blur' }],
  meta_keywords: [{ required: true, message: 'Meta 关键词不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '页面内容不能为空', trigger: 'blur' }],
  navSectionId: [
    { required: true, message: '导航项 ID 不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9-_]+$/, message: 'ID 只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  navSectionTitle: [
    { required: true, message: '导航项标题不能为空', trigger: 'blur' }
  ],
  sidebarBlockTitle: [
    { required: false }
  ],
  sidebarBlockContent: [
    { required: true, message: '侧边栏区块内容不能为空', trigger: 'blur' }
  ]
});

// --- API Setup ---
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const api = axios.create({ baseURL: baseUrl });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
     console.warn(`Admin token not found for API request in ${pageTitle.value}.`);
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Fetch Data ---
const fetchManagedPages = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  managedPages.value = [];
  try {
    const response = await api.get(`/managed-pages/admin?type=${props.pageType}`);
    managedPages.value = response.data || [];
    console.log(`Fetched managed pages for admin (type: ${props.pageType}):`, managedPages.value);
  } catch (error) {
    console.error(`Error fetching managed pages (type: ${props.pageType}):`, error);
    errorMessage.value = error.response?.data?.message || `加载 ${pageTitle.value} 列表失败`;
    ElMessage.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
};

// --- Add/Remove Nav Sections ---
const addNavSection = () => {
  editForm.nav_sections.push({ id: '', title: '' });
};

const removeNavSection = (index) => {
  editForm.nav_sections.splice(index, 1);
};

// --- Add/Remove Sidebar Blocks ---
const addSidebarBlock = () => {
  editForm.sidebar_data.push({ title: '', html_content: '' });
};

const removeSidebarBlock = (index) => {
  editForm.sidebar_data.splice(index, 1);
};

// --- Dialog Actions ---
const handleCreate = () => {
    isEditMode.value = false;
    resetForm();
    isDialogVisible.value = true;
};

const handleEdit = async (row) => {
  console.log(`Editing page (type: ${props.pageType}):`, row.page_identifier);
  isEditMode.value = true;
  resetForm(); // Resets editForm, selectedLanguage, currentEditId, allLanguageData etc.
  isDialogVisible.value = true;
  isLoadingDetails.value = true;
  detailErrorMessage.value = '';

  // Clear previous multi-language data
  Object.keys(allLanguageData).forEach(key => delete allLanguageData[key]);

  try {
      // Step 1: Fetch base data + default translation 
      const baseResponse = await api.get(`/managed-pages/admin/${props.pageType}/${row.page_identifier}`);
      const baseData = baseResponse.data;
      console.log('Base data fetched:', baseData);

      if (!baseData || !baseData.id) {
           throw new Error('无法获取页面基础信息。');
      }

      currentEditId.value = baseData.id;
      currentEditingIdentifier.value = baseData.page_identifier;
      
      // Initialize allLanguageData structure with non-translatable fields (for reference if needed)
      // And prepare for translations
      supportedLanguages.forEach(lang => {
          allLanguageData[lang.code] = { 
              ...getInitialLanguageState(lang.code), // Get structure for translatable fields
              // Keep common non-translatable refs if needed elsewhere, though editForm is primary source
              // id: baseData.id, 
              page_identifier: baseData.page_identifier,
              page_type: baseData.page_type
          };
      });

      // Step 2: Populate default language data from base response
      if (baseData.translation && baseData.translation.language_code === DEFAULT_LANG) {
          console.log(`Populating ${DEFAULT_LANG} in allLanguageData.`);
          Object.assign(allLanguageData[DEFAULT_LANG], baseData.translation);
          // Ensure arrays are proper arrays, not null
          allLanguageData[DEFAULT_LANG].sidebar_data = baseData.translation.sidebar_data || [];
          allLanguageData[DEFAULT_LANG].nav_sections = baseData.translation.nav_sections || [];
      } else {
          console.warn(`No ${DEFAULT_LANG} translation found in base response.`);
      }

      // Step 3: Fetch translations for other languages concurrently
      const otherLanguages = supportedLanguages.filter(l => l.code !== DEFAULT_LANG);
      const fetchPromises = otherLanguages.map(lang => 
          api.get(`/managed-pages/admin/${currentEditId.value}/translations/${lang.code}`)
             .then(response => {
                 console.log(`Fetched translation for ${lang.code}:`, response.data);
                 Object.assign(allLanguageData[lang.code], response.data);
                 // Ensure arrays are proper arrays
                 allLanguageData[lang.code].sidebar_data = response.data.sidebar_data || [];
                 allLanguageData[lang.code].nav_sections = response.data.nav_sections || [];
             })
             .catch(error => {
                 if (error.response && error.response.status === 404) {
                     console.warn(`No translation found for ${lang.code}, keeping empty state.`);
                     // Empty state is already initialized, just log
                 } else {
                     console.error(`Error fetching translation for ${lang.code}:`, error);
                     // Optionally, store error per language or throw a combined error
                     // Throwing here might prevent the dialog from opening partially
                     throw new Error(`Failed to load translation for ${lang.code}: ${error.message}`);
                 }
             })
      );

      await Promise.all(fetchPromises);

      // Step 4: Load the default language data into the active form
      console.log('Loading default language data into editForm:', allLanguageData[DEFAULT_LANG]);
      Object.assign(editForm, allLanguageData[DEFAULT_LANG]); 
      // Also set the non-translatable fields in editForm (as it's the direct model for the form)
      editForm.id = baseData.id;
      editForm.page_identifier = baseData.page_identifier;
      editForm.page_type = baseData.page_type;

      console.log('Final editForm state after loading:', editForm);
      console.log('Final allLanguageData state:', allLanguageData);

  } catch (error) {
      console.error(`Error during handleEdit for ${props.pageType}/${row.page_identifier}:`, error);
      detailErrorMessage.value = error.response?.data?.message || `加载页面详情失败: ${error.message}`;
      ElMessage.error(detailErrorMessage.value);
      closeDialog(); // Close dialog if initial load fails badly
  } finally {
      isLoadingDetails.value = false;
  }
};

const closeDialog = () => {
  isDialogVisible.value = false;
};

const resetForm = () => {
   Object.assign(editForm, getInitialLanguageState(DEFAULT_LANG));
   currentEditingIdentifier.value = null;
   currentEditId.value = null;
   selectedLanguage.value = DEFAULT_LANG;
   if (formRef.value) {
       formRef.value.resetFields();
       editForm.page_type = props.pageType;
   }
   isLoadingDetails.value = false;
   detailErrorMessage.value = '';
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  // 1. Save the final state of the currently viewed language before submitting
  const currentLangCode = selectedLanguage.value;
  
  // --- CORRECTED SAVE LOGIC --- 
  // Ensure the entry for the current language exists in allLanguageData
  if (!allLanguageData[currentLangCode]) {
      console.warn(`Data structure for ${currentLangCode} missing in allLanguageData. Creating it.`);
      // Create the structure using getInitialLanguageState keys for translatable fields
      allLanguageData[currentLangCode] = {}; 
      const fieldsToInit = Object.keys(getInitialLanguageState(currentLangCode)).filter(k => k !== 'id' && k !== 'page_identifier' && k !== 'page_type');
      const initialState = getInitialLanguageState(currentLangCode);
      fieldsToInit.forEach(field => {
           allLanguageData[currentLangCode][field] = initialState[field]; // Initialize with default empty state
      });
  }
  
  // Now, always save the current editForm state to the (now guaranteed) existing entry
  console.log(`Saving final state for ${currentLangCode} before submit...`);
  const fieldsToSave = Object.keys(getInitialLanguageState(currentLangCode)).filter(k => k !== 'id' && k !== 'page_identifier' && k !== 'page_type');
  fieldsToSave.forEach(field => {
      if (Array.isArray(editForm[field])) {
          allLanguageData[currentLangCode][field] = JSON.parse(JSON.stringify(editForm[field]));
      } else {
          allLanguageData[currentLangCode][field] = editForm[field];
      }
  });
  console.log('Saved final state:', allLanguageData[currentLangCode]);
  // --- END CORRECTED SAVE LOGIC ---

  // 2. Validate the form (focus on current language, but could extend)
  formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      detailErrorMessage.value = ''; // Clear previous detail errors

      try {
        if (isEditMode.value) {
            // --- EDIT MODE --- 
            console.log(`Updating all translations for Page ID ${currentEditId.value}`);
            if (!currentEditId.value) {
                 throw new Error('无法更新，页面 ID 未知。');
            }

            const updatePromises = supportedLanguages.map(lang => {
                const langData = allLanguageData[lang.code];
                if (!langData) {
                    console.warn(`Skipping update for ${lang.code}: No data found in allLanguageData.`);
                    return Promise.resolve();
                }

                // --- Backend Validation Check --- 
                // Check if the essential fields required by the backend PUT endpoint have values.
                const hasRequiredFields = langData.meta_title && langData.meta_description && langData.content;

                if (!hasRequiredFields) {
                    // If the language is the default language OR if it has an ID (meaning it existed before),
                    // we might still want to send an update to potentially clear fields (if backend allows) 
                    // or update other non-required fields. However, the current backend *requires* these fields.
                    // Therefore, we *must* skip if these fields are missing to avoid a 400 error.
                    console.warn(`Skipping PUT for ${lang.code}: Missing required fields (meta_title, meta_description, or content).`);
                    // If you *want* to allow clearing fields, the backend validation needs to be relaxed.
                    return Promise.resolve(); 
                }
                // --- End Backend Validation Check --- 

                // Construct payload from allLanguageData for this language
            const payload = {
                    list_title: langData.list_title || '',
                    list_description: langData.list_description || '',
                    meta_title: langData.meta_title, // Already checked they exist
                    meta_description: langData.meta_description,
                    meta_keywords: langData.meta_keywords || '',
                    content: langData.content,
                    sidebar_data: langData.sidebar_data || [],
                    nav_sections: langData.nav_sections || []
                };

                // Send PUT request to update/create this language's translation
                console.log(`Sending PUT for ${lang.code}`, payload);
                return api.put(`/managed-pages/admin/${currentEditId.value}/translations/${lang.code}`, payload);
            });

            await Promise.all(updatePromises);
            ElMessage.success(`页面所有语言内容已更新！`);

        } else {
            // --- CREATE MODE --- 
             console.log(`Creating new page (type: ${props.pageType}) with identifier: ${editForm.page_identifier}`);
            const defaultLangData = allLanguageData[DEFAULT_LANG];
             if (!defaultLangData) {
                 throw new Error(`无法创建：缺少默认语言 (${DEFAULT_LANG}) 的数据。`);
             }

            // Step 1: Create the main page record + default translation
            const createPayload = {
                page_identifier: editForm.page_identifier, // From form (non-translatable)
                page_type: props.pageType, // From props (non-translatable)
                sort_order: editForm.sort_order,
                language_code: DEFAULT_LANG, // Explicitly set default language
                // Translatable fields for default language
                list_title: defaultLangData.list_title || '',
                list_description: defaultLangData.list_description || '',
                meta_title: defaultLangData.meta_title || '',
                meta_description: defaultLangData.meta_description || '',
                meta_keywords: defaultLangData.meta_keywords || '',
                content: defaultLangData.content || '',
                sidebar_data: defaultLangData.sidebar_data || [],
                nav_sections: defaultLangData.nav_sections || []
             };
            console.log('Sending initial POST request:', createPayload);
            const createResponse = await api.post('/managed-pages/admin', createPayload);
            // Corrected: Access the ID from the nested 'data' object in the response
            const newPageId = createResponse.data?.data?.id; 

            if (!newPageId) {
                throw new Error('创建页面后未能从 API 响应中获取新 ID。');
            }
            console.log(`Page created with ID: ${newPageId}`);

            // Step 2: Create translations for other languages if they have content
            const otherLanguages = supportedLanguages.filter(l => l.code !== DEFAULT_LANG);
            const translationPromises = [];

            otherLanguages.forEach(lang => {
                const langData = allLanguageData[lang.code];
                // Check if this language has meaningful data to save
                const hasContent = langData && (langData.list_title || langData.meta_title || langData.content); // Adjust check as needed
                
                if (hasContent) {
                     console.log(`Found content for ${lang.code}, creating translation...`);
                     const translationPayload = {
                        list_title: langData.list_title || '',
                        list_description: langData.list_description || '',
                        meta_title: langData.meta_title || '',
                        meta_description: langData.meta_description || '',
                        meta_keywords: langData.meta_keywords || '',
                        content: langData.content || '',
                        sidebar_data: langData.sidebar_data || [],
                        nav_sections: langData.nav_sections || []
                     };
                    console.log(`Sending PUT for ${lang.code} (creation flow)`, translationPayload);
                    translationPromises.push(
                         api.put(`/managed-pages/admin/${newPageId}/translations/${lang.code}`, translationPayload)
                    );
                } else {
                     console.log(`Skipping translation creation for ${lang.code}: No content found.`);
                }
            });
            
            if (translationPromises.length > 0) {
                await Promise.all(translationPromises);
                console.log('Additional language translations created.');
            }
            
            ElMessage.success(`新页面及提供的语言内容创建成功！`);
        }

        closeDialog();
        fetchManagedPages(); // Refresh list

      } catch (error) {
        console.error('Error submitting form:', error);
        let message = error.response?.data?.message || (isEditMode.value ? '更新页面失败' : '创建页面失败');
        // Handle specific conflict error on creation
        if (!isEditMode.value && error.response?.status === 409) {
             message = `创建失败：标识符 "${editForm.page_identifier}" 在类型 "${props.pageType}" 下已存在。`;
        }
        ElMessage.error(message);
        // Keep dialog open on error?
      } finally {
        isSubmitting.value = false;
      }
    } else {
      console.log('Form validation failed');
      ElMessage.warning('表单验证失败，请检查所有必填项和格式要求！');
      return false;
    }
  });
};

// --- Delete Action ---
const handleDelete = (row) => {
  const typeName = pageTitle.value;
  ElMessageBox.confirm(
    `确定要删除 ${typeName} 下的页面 "${row.page_identifier}" 吗？此操作不可撤销。`, 
    '确认删除', 
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      console.log(`Attempting to delete page (type: ${props.pageType}, id: ${row.page_identifier})`);
      try {
        await api.delete(`/managed-pages/admin/${props.pageType}/${row.page_identifier}`);
        ElMessage.success(`页面 "${row.page_identifier}" 删除成功！`);
        fetchManagedPages();
      } catch (error) {
        console.error(`Error deleting page ${props.pageType}/${row.page_identifier}:`, error);
        const message = error.response?.data?.message || '删除页面失败';
        ElMessage.error(message);
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除');
  });
};

// --- Helpers ---
const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        console.error("Error formatting timestamp:", timestamp, e);
        return timestamp;
    }
};

// --- Language Switching ---
const switchLanguage = (newLangCode) => {
  console.log(`Switching language to: ${newLangCode}`);
  // Save current edits before switching (important!)
  saveCurrentLanguageData();

  // --- Load data for the newly selected language ---
  const newData = allLanguageData[newLangCode] || getInitialLanguageState(newLangCode);
  console.log('Data for new language:', newData);

  // CHANGE: Explicitly assign properties using correct names
  editForm.language_code = newLangCode; // Update the language code in the form
  editForm.list_title = newData.list_title || '';
  editForm.list_description = newData.list_description || '';
  editForm.meta_title = newData.meta_title || '';
  editForm.meta_description = newData.meta_description || '';
  editForm.meta_keywords = newData.meta_keywords || '';
  // Access using snake_case from newData (assuming API returns snake_case)
  // Use cloneDeep for arrays/objects to avoid reference issues
  editForm.nav_sections = cloneDeep(newData.nav_sections || []); 
  editForm.sidebar_data = cloneDeep(newData.sidebar_data || []);
  editForm.content = newData.content || '';

  // Reset validation state for the new language
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// Helper to save the current editForm state back into allLanguageData
const saveCurrentLanguageData = () => {
  const currentLang = editForm.language_code;
  if (!allLanguageData[currentLang]) {
    allLanguageData[currentLang] = {}; // Initialize if not exists
  }
  // Save current form state back to the storage for this language
  Object.assign(allLanguageData[currentLang], {
      list_title: editForm.list_title,
      list_description: editForm.list_description,
      meta_title: editForm.meta_title,
      meta_description: editForm.meta_description,
      meta_keywords: editForm.meta_keywords,
      // Save using consistent snake_case
      nav_sections: cloneDeep(editForm.nav_sections),
      sidebar_data: cloneDeep(editForm.sidebar_data),
      content: editForm.content,
  });
  console.log(`Saved data for ${currentLang}:`, allLanguageData[currentLang]);
};

// --- Reordering API Call ---
const updateSortOrderOnBackend = async () => {
    if (isReordering.value) return; // Prevent concurrent requests
    isReordering.value = true;

    // Prepare the payload for the backend
    // Assign sort_order based on the current array index
    const orderedData = managedPages.value.map((page, index) => ({ 
        page_identifier: page.page_identifier,
        sort_order: index // Use index as the new sort order
    }));

    console.log('Updating sort order on backend with:', orderedData);

    try {
        await api.put('/managed-pages/admin/reorder', {
            pageType: props.pageType,
            orderedPages: orderedData
        });
        ElMessage.success('排序更新成功!');
        // Optionally refetch or assume local state is correct
        // await fetchPages(); // Refetch to confirm
    } catch (err) {
        console.error('Error updating sort order:', err);
        ElMessage.error(`排序更新失败: ${err.response?.data?.message || err.message}`);
        // Consider reverting the local swap if the API call fails
        // For simplicity, we might just refetch to get the old order back
        await fetchManagedPages(); 
    } finally {
        isReordering.value = false;
    }
};

// --- Sorting Methods ---
const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= managedPages.value.length) {
        return; // Out of bounds
    }

    // Swap items in the local array for immediate visual feedback
    const itemToMove = managedPages.value[index];
    managedPages.value.splice(index, 1);
    managedPages.value.splice(newIndex, 0, itemToMove);

    // Trigger backend update after a short delay to batch potential rapid clicks
    // Debounce or throttle this call in a real app for better performance
    // For now, just call it directly
    updateSortOrderOnBackend(); 
};

const moveItemUp = (index) => {
    moveItem(index, -1);
};

const moveItemDown = (index) => {
    moveItem(index, 1);
};

// --- Lifecycle & Watch ---
onMounted(() => {
  console.log(`${pageTitle.value} mounted with pageType prop:`, props.pageType);
  fetchManagedPages();
});

watch(() => props.pageType, (newPageType, oldPageType) => {
  if (newPageType !== oldPageType) {
    console.log(`Page type changed from ${oldPageType} to ${newPageType}, re-fetching data.`);
    fetchManagedPages();
    resetForm();
    if (isDialogVisible.value) {
        closeDialog();
    }
  }
}, { immediate: false });

</script>

<style scoped>
.page-management-container {
  padding: 20px;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.page-hint {
    color: #606266;
    font-size: 14px;
    margin-bottom: 20px;
}

.loading-area, .error-area {
  padding: 20px;
  text-align: center;
  color: #909399;
}
.error-area {
    color: #f56c6c;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
}

.dialog-footer {
  text-align: right;
}

.el-divider {
    margin-top: 30px;
    margin-bottom: 20px;
}

.dynamic-list-item {
  background-color: #fbfbfb;
  padding: 15px;
  border: 1px solid #eee;
  margin-bottom: 15px;
  border-radius: 4px;
}

.dynamic-list-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 30px;
}

.sidebar-block-item {
    background-color: #f8f9fa;
}

.sidebar-block-actions {
     padding-top: 10px;
     align-items: flex-start;
}

.form-hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
}
</style> 