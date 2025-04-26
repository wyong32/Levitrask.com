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
           <el-col :span="12">
              <el-form-item label="编辑语言 (Language)" prop="languageCode">
                   <el-select
                     v-model="selectedLanguage"
                     placeholder="选择语言"
                     style="width: 100%"
                     @change="loadLanguageForEdit"
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
import { ref, reactive, onMounted, watch, computed } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox, ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElTable, ElTableColumn, ElIcon, ElDivider, ElRow, ElCol } from 'element-plus';
import { Edit, Plus, Delete } from '@element-plus/icons-vue';

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
  // Add more languages here
];
const selectedLanguage = ref(DEFAULT_LANG);

// --- Form Data ---
const getInitialFormState = () => ({
  id: null,
  page_identifier: '',
  page_type: props.pageType,
  list_title: '',
  list_description: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  content: '',
  sidebar_data: [],
  nav_sections: []
});

const editForm = reactive(getInitialFormState());

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
  resetForm();
  isDialogVisible.value = true;
  isLoadingDetails.value = true;
  detailErrorMessage.value = '';

  try {
      const response = await api.get(`/managed-pages/admin/${props.pageType}/${row.page_identifier}`);
      const data = response.data;

      currentEditId.value = data.id;
      currentEditingIdentifier.value = data.page_identifier;

      editForm.id = data.id;
      editForm.page_identifier = data.page_identifier;
      editForm.page_type = data.page_type;

      if (data.translation && data.translation.language_code === DEFAULT_LANG) {
          console.log(`Populating form with ${DEFAULT_LANG} translation.`);
          editForm.list_title = data.translation.list_title || '';
          editForm.list_description = data.translation.list_description || '';
          editForm.meta_title = data.translation.meta_title || '';
          editForm.meta_description = data.translation.meta_description || '';
          editForm.meta_keywords = data.translation.meta_keywords || '';
          editForm.content = data.translation.content || '';
          editForm.sidebar_data = data.translation.sidebar_data || [];
          editForm.nav_sections = data.translation.nav_sections || [];
      } else {
          console.warn(`No ${DEFAULT_LANG} translation found for page ${data.id}. Form fields for translation will be empty.`);
          editForm.list_title = '';
          editForm.list_description = '';
          editForm.meta_title = '';
          editForm.meta_description = '';
          editForm.meta_keywords = '';
          editForm.content = '';
          editForm.sidebar_data = [];
          editForm.nav_sections = [];
      }

      console.log('Loaded data for editing (default lang):', editForm);
      console.log('Set currentEditId to:', currentEditId.value);

  } catch (error) {
      console.error(`Error fetching details for ${props.pageType}/${row.page_identifier}:`, error);
      detailErrorMessage.value = error.response?.data?.message || `加载页面 ${props.pageType}/${row.page_identifier} 的详情失败`;
      ElMessage.error(detailErrorMessage.value);
      closeDialog();
  } finally {
      isLoadingDetails.value = false;
  }
};

const closeDialog = () => {
  isDialogVisible.value = false;
};

const resetForm = () => {
   Object.assign(editForm, getInitialFormState());
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

  formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;

      try {
        if (isEditMode.value) {
            const payload = {
                list_title: editForm.list_title,
                list_description: editForm.list_description,
                meta_title: editForm.meta_title,
                meta_description: editForm.meta_description,
                meta_keywords: editForm.meta_keywords,
                content: editForm.content,
                sidebar_data: editForm.sidebar_data,
                nav_sections: editForm.nav_sections,
            };
            console.log(`Submitting updates for Page ID ${currentEditId.value}, Lang ${selectedLanguage.value}`);
            await api.put(`/managed-pages/admin/${currentEditId.value}/translations/${selectedLanguage.value}`, payload);
            ElMessage.success(`页面 ${selectedLanguage.value} 语言内容更新成功！`);

        } else {
            const payload = {
                page_identifier: editForm.page_identifier,
                page_type: props.pageType,
                languageCode: selectedLanguage.value,
                list_title: editForm.list_title,
                list_description: editForm.list_description,
                meta_title: editForm.meta_title,
                meta_description: editForm.meta_description,
                meta_keywords: editForm.meta_keywords,
                content: editForm.content,
                sidebar_data: editForm.sidebar_data,
                nav_sections: editForm.nav_sections,
             };
            console.log(`Submitting new ${payload.page_type} page: ${payload.page_identifier} with first translation in ${payload.languageCode}`);
            await api.post('/managed-pages/admin', payload);
            ElMessage.success(`新页面及 ${selectedLanguage.value} 语言内容创建成功！`);
        }
        closeDialog();
        fetchManagedPages();
      } catch (error) {
        console.error('Error submitting form:', error);
        let message = error.response?.data?.message || (isEditMode.value ? '更新页面失败' : '创建页面失败');
        if (!isEditMode.value && error.response?.status === 409) {
             message = `创建失败：标识符 "${editForm.page_identifier}" 在类型 "${props.pageType}" 下已存在。`;
        }
        ElMessage.error(message);
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

// NEW: Function to load different language content into the form when editing
const loadLanguageForEdit = async (newLangCode) => {
    console.log(`loadLanguageForEdit called with newLangCode: ${newLangCode}, current selectedLanguage: ${selectedLanguage.value}`); // Log entry and state

    // Only proceed if in edit mode and we have a page ID.
    // The @change event implies the language differs from the previous state.
    // The v-model already updated selectedLanguage.value to newLangCode.
    if (!isEditMode.value || !currentEditId.value) {
        console.log(`Exiting loadLanguageForEdit early: isEditMode=${isEditMode.value}, currentEditId=${currentEditId.value}`);
        return;
    }

    // If somehow the event fires with the same code (e.g., programmatic change), exit.
    // This check should happen *after* confirming we are in edit mode with an ID.
    // We need to compare newLangCode with the *previous* value, which is tricky.
    // Let's rely on the assumption @change only fires on actual user changes for now.
    // Or, maybe check if newLangCode IS DIFFERENT from the language JUST loaded into the form?
    // Simpler: Just proceed, the API call might be redundant but harmless if lang hasn't changed.

    // REMOVED: Redundant state update, v-model handles this.
    // selectedLanguage.value = newLangCode;

    console.log(`Attempting to load language '${newLangCode}' for page ID '${currentEditId.value}' into form.`);
    isLoadingDetails.value = true; // Indicate loading state
    detailErrorMessage.value = '';

    try {
        const response = await api.get(`/managed-pages/admin/${currentEditId.value}/translations/${newLangCode}`);
        const langData = response.data;
        console.log(`Received data for ${newLangCode}:`, JSON.stringify(langData)); // Log received data

        // Update only translatable fields in the form
        editForm.list_title = langData.list_title || '';
        editForm.list_description = langData.list_description || '';
        editForm.meta_title = langData.meta_title || '';
        editForm.meta_description = langData.meta_description || '';
        editForm.meta_keywords = langData.meta_keywords || '';
        editForm.content = langData.content || '';
        editForm.sidebar_data = langData.sidebar_data || [];
        editForm.nav_sections = langData.nav_sections || [];

        console.log('Form after update:', JSON.stringify(editForm)); // Log form state after update

        ElMessage.success(`已加载 ${newLangCode} 语言内容`);

        // Clear validation state for the loaded fields
        if (formRef.value) {
           formRef.value.clearValidate([
               'list_title', 'list_description', 'meta_title', 'meta_description',
               'meta_keywords', 'content', 'sidebar_data', 'nav_sections'
           ]);
        }

    } catch (error) {
        console.error(`加载语言内容失败 (ID: ${currentEditId.value}, lang: ${newLangCode}):`, error);
        if (error.response && error.response.status === 404) {
            ElMessage.info(`页面 ID ${currentEditId.value} 的 '${newLangCode}' 语言版本不存在，您可以填写新内容并保存以创建。`);
            editForm.list_title = '';
            editForm.list_description = '';
            editForm.meta_title = '';
            editForm.meta_description = '';
            editForm.meta_keywords = '';
            editForm.content = '';
            editForm.sidebar_data = [];
            editForm.nav_sections = [];
            
            if (formRef.value) {
                formRef.value.clearValidate([
                    'list_title', 'list_description', 'meta_title', 'meta_description',
                    'meta_keywords', 'content', 'sidebar_data', 'nav_sections'
                ]);
            }
        } else {
            detailErrorMessage.value = `加载 ${newLangCode} 内容失败: ${error.response?.data?.message || error.message}`;
            ElMessage.error(detailErrorMessage.value);
        }
    } finally {
        isLoadingDetails.value = false;
    }
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