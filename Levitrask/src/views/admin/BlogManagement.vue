<template>
  <div> <!-- Root element -->
    <div class="main-header">
      <h2>博客管理</h2>
      <el-button type="primary" @click="openCreateDialog">创建博客</el-button>
    </div>

    <div v-if="isLoading" class="loading-area">加载中...</div>
    <div v-else-if="errorMessage" class="error-area">{{ errorMessage }}</div>
    <el-table v-else :data="tableData" stripe style="width: 100%">
      <el-table-column prop="blog_id" label="Slug" width="200" />
      <el-table-column label="列表图片" width="100">
        <template #default="scope">
          <img 
              v-if="scope.row.listImageSrc" 
              :src="scope.row.listImageSrc" 
              :alt="scope.row.listImageAlt || '列表图片'" 
              style="width: 60px; height: auto; object-fit: contain;" 
          />
          <span v-else>N/A</span>
        </template>
      </el-table-column>
      <el-table-column prop="listTitle" :label="`标题 (${DEFAULT_LANG})`" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleEdit(scope.row)" :icon="Edit">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create/Edit Blog Dialog -->
    <el-dialog 
      v-model="isDialogVisible" 
      :title="dialogTitle" 
      width="80%"  
      top="5vh" 
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <div v-if="isLoadingDetails" class="loading-area">加载详情中...</div>
      <el-form 
        v-else
        ref="formRef" 
        :model="blogForm" 
        :rules="formRules" 
        label-width="120px"
        label-position="top"
      >
        <!-- Row 1: Slug and Language -->
        <el-row :gutter="20"> 
          <el-col :span="12">
            <el-form-item label="URL Slug (路径)" prop="slug">
              <el-input v-model="blogForm.slug" placeholder="例如: my-first-blog-post" :disabled="isEditMode" />
              <div class="form-tip">创建后不可修改。必须唯一。</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
             <el-form-item label="编辑语言 (Language)" prop="languageCode">
               <el-select 
                 v-model="selectedLanguage" 
                 placeholder="选择语言" 
                 style="width: 100%"
                 :disabled="!isEditMode && supportedLanguages.length <= 1"
               >
                 <el-option
                   v-for="lang in supportedLanguages"
                   :key="lang.code"
                   :label="lang.name"
                   :value="lang.code"
                 />
               </el-select>
               <div v-if="!isEditMode" style="font-size: 12px; color: #999; margin-top: 5px;">
                   创建模式下，请先填写一种语言（如英语），其他语言可在保存后继续编辑。
               </div>
             </el-form-item>
          </el-col>
        </el-row>
        
        <!-- Row 2: List Title and List Date -->
        <el-row :gutter="20">
           <el-col :span="12">
            <el-form-item label="列表标题 (List Title - 当前语言)" prop="listTitle">
              <el-input v-model="blogForm.listTitle" />
            </el-form-item>
           </el-col>
           <el-col :span="12">
             <el-form-item label="列表日期 (List Date)" prop="listDate">
                <el-date-picker
                  v-model="blogForm.listDate"
                  type="date"
                  placeholder="留空则为当天日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :disabled="isEditMode"
                />
              </el-form-item>
           </el-col>
        </el-row>

        <!-- Row 3: List Image URL and Alt Text -->
        <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="列表图片 URL (List Image URL)" prop="listImageSrc">
               <el-input v-model="blogForm.listImageSrc" placeholder="请输入图片的完整 URL"></el-input> 
             </el-form-item>
          </el-col>
           <el-col :span="12">
             <el-form-item label="图片 Alt 文本 (当前语言)" prop="listImageAlt">
                <el-input v-model="blogForm.listImageAlt" placeholder="图片的简短描述 (用于 SEO 和可访问性)"></el-input>
             </el-form-item>
          </el-col>
        </el-row>

        <el-divider>翻译内容 (当前语言: {{ selectedLanguage }})</el-divider>

        <!-- Row 4: List Source (Full Width - Non-Translatable) -->
        <el-form-item label="列表来源/作者 (List Source)" prop="listSource">
           <el-input v-model="blogForm.listSource" :disabled="isEditMode" />
        </el-form-item>
        
        <!-- Row 5: List Description (Full Width - Translatable) -->
        <el-form-item label="列表描述 (List Description)" prop="listDescription">
           <el-input type="textarea" v-model="blogForm.listDescription" :rows="3" />
        </el-form-item>
        
        <el-divider>SEO Meta 信息 (当前语言: {{ selectedLanguage }})</el-divider>

        <el-form-item label="Meta 标题 (Meta Title)" prop="metaTitle">
           <el-input v-model="blogForm.metaTitle" />
        </el-form-item>
        <el-form-item label="Meta 描述 (Meta Description)" prop="metaDescription">
            <el-input type="textarea" v-model="blogForm.metaDescription" :rows="3" />
        </el-form-item>
        <el-form-item label="Meta 关键词 (Meta Keywords)" prop="metaKeywords">
            <el-input v-model="blogForm.metaKeywords" placeholder="请用英文逗号分隔"/>
        </el-form-item>

        <el-divider>左侧导航 (Nav Sections - 当前语言: {{ selectedLanguage }})</el-divider>
        <div v-for="(section, index) in blogForm.navSections" :key="index" class="dynamic-list-item">
           <el-row :gutter="10">
              <el-col :span="10">
                 <el-form-item 
                    :label="`导航项 ${index + 1} ID`" 
                    :prop="`navSections.${index}.id`" 
                    :rules="formRules.navSectionId"
                  >
                    <el-input v-model="section.id" placeholder="对应内容 section 标签的 ID" />
                 </el-form-item>
              </el-col>
              <el-col :span="10">
                 <el-form-item 
                    :label="`导航项 ${index + 1} 标题`" 
                    :prop="`navSections.${index}.title`" 
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
        <p class="form-hint">提示: 此处的 ID 必须与下方内容中使用的 section 标签的 ID 完全一致。</p>

        <el-divider>右侧边栏区块 (Sidebar Blocks - 当前语言: {{ selectedLanguage }})</el-divider>
        <div v-for="(block, index) in blogForm.sidebarData" :key="`sidebar-${index}`" class="dynamic-list-item sidebar-block-item">
           <el-row :gutter="10">
              <el-col :span="20"> <!-- Span adjusted for title/content -->
                 <el-form-item 
                    :label="`区块 ${index + 1} 标题 (可选)`" 
                    :prop="`sidebarData.${index}.title`" 
                    :rules="formRules.sidebarBlockTitle"  Optional rule 
                  >
                    <el-input v-model="block.title" placeholder="侧边栏区块的标题" />
                 </el-form-item>
                 <el-form-item 
                    :label="`区块 ${index + 1} 内容 (HTML)`" 
                    :prop="`sidebarData.${index}.html_content`" 
                    :rules="formRules.sidebarBlockContent"  Required rule 
                  >
                    <el-input 
                      type="textarea" 
                      v-model="block.html_content" 
                      :rows="5" 
                      placeholder="输入侧边栏区块的 HTML 内容"
                    />
                 </el-form-item>
                 <!-- Optional: Input for display_order if implemented -->
                 <!-- 
                 <el-form-item 
                    label="显示顺序" 
                    :prop="`sidebarData.${index}.display_order`"
                 >
                    <el-input-number v-model="block.display_order" :min="1" />
                 </el-form-item> 
                 -->
              </el-col>
              <el-col :span="4" class="dynamic-list-actions sidebar-block-actions">
                 <el-button type="danger" @click="removeSidebarBlock(index)" :icon="Delete" circle />
                 <!-- Optional: Add Up/Down buttons for ordering -->
                 <!-- 
                 <el-button @click="moveSidebarBlock(index, -1)" :disabled="index === 0" :icon="ArrowUpBold" circle plain/>
                 <el-button @click="moveSidebarBlock(index, 1)" :disabled="index === blogForm.sidebarData.length - 1" :icon="ArrowDownBold" circle plain/>
                  -->
              </el-col>
           </el-row>
           <el-divider v-if="index < blogForm.sidebarData.length - 1" style="margin-top: 0; margin-bottom: 15px;" />
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

        <el-divider>主要内容 (HTML - 当前语言: {{ selectedLanguage }})</el-divider>
        <el-form-item label="内容 (Content - HTML Source)" prop="content">
           <div class="form-hint" style="margin-bottom: 5px;">
             请确保使用 `<section id="..."></section>` 包裹主要内容块，并且 `id` 与上面定义的左侧导航 ID 对应。
           </div>
           <el-input 
             type="textarea" 
             v-model="blogForm.content" 
             :rows="20" 
             placeholder="在此处输入或粘贴 HTML 源码"
           />
        </el-form-item>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
            {{ isEditMode ? '更新博客 (所有语言)' : '创建博客' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div> <!-- Close root element -->
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, Plus, ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue';

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DEFAULT_LANG = 'en'; // Default language for table and fallback

// --- Reactive State ---
const tableData = ref([]);
const isLoading = ref(false);
const isLoadingDetails = ref(false); // Separate loading state for dialog details
const errorMessage = ref('');
const isSubmitting = ref(false);
const isDialogVisible = ref(false);
const isEditMode = ref(false); 
const currentEditDbId = ref(null); // Stores the blog_id (slug) being edited
const currentEditSlug = ref(null); // Stores the blog_id (slug) being edited
const selectedLanguage = ref(DEFAULT_LANG); // Language currently shown in the form

// Define supported languages
const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ru', name: 'Русский' } // Added Russian
];

// --- Form Definition ---
const getInitialFormState = () => ({
  slug: '',          // Non-translatable
  listDate: null,      // Non-translatable
  listImageSrc: '',  // Non-translatable
  listSource: '',      // Non-translatable - Moved from translation
  // Translatable fields
  listTitle: '',
  listImageAlt: '', 
  listDescription: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  navSections: [], // Array of { id: string, title: string }
  sidebarData: [], // Array of { title?: string, html_content: string }
  content: ''
});

// Holds data for the CURRENTLY selected language in the form
const blogForm = reactive(getInitialFormState());

// Stores data for ALL languages when editing/creating
const allLanguageData = reactive({}); // <-- Introduced storage for all languages

const formRef = ref(null); // Template ref for the form

// --- Form Validation Rules ---
// Note: Rules apply to the *current* language form
const formRules = reactive({
  slug: [
    { required: true, message: '请输入 URL Slug', trigger: 'blur' },
    { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符 (-)', trigger: 'blur' }
  ],
  listTitle: [{ required: true, message: '请输入列表标题', trigger: 'blur' }],
  listImageSrc: [{ required: true, message: '请输入列表图片 URL', trigger: 'blur' }],
  listImageAlt: [{ required: true, message: '请输入列表图片 Alt 文本', trigger: 'blur' }],
  listDescription: [{ required: true, message: '请输入列表描述', trigger: 'blur' }],
  metaTitle: [{ required: true, message: '请输入 Meta 标题', trigger: 'blur' }],
  metaDescription: [{ required: true, message: '请输入 Meta 描述', trigger: 'blur' }],
  metaKeywords: [{ required: true, message: '请输入 Meta 关键词', trigger: 'blur' }],
  content: [{ required: true, message: '请输入主要内容', trigger: 'blur' }],
  navSectionId: [
      { required: true, message: '导航项 ID 不能为空', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_-]+$/, message: 'ID 只能包含字母、数字、下划线或连字符', trigger: 'blur' }
  ],
  navSectionTitle: [{ required: true, message: '导航项标题不能为空', trigger: 'blur' }],
  // sidebarBlockTitle rule is optional, so no required: true
  sidebarBlockContent: [{ required: true, message: '侧边栏区块内容不能为空', trigger: 'blur' }],
});

// --- Computed Properties ---
const dialogTitle = computed(() => {
  const langName = supportedLanguages.find(l => l.code === selectedLanguage.value)?.name || selectedLanguage.value;
  return `${isEditMode.value ? '编辑' : '创建'}博客` + (isEditMode.value ? ` - ${langName}` : '');
});

// --- API Setup (Corrected) ---
const baseUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || '') : ''; 
const api = axios.create({ baseURL: baseUrl });
console.log(`[API Setup BlogMgmt] Axios configured with baseURL: '${baseUrl || '(empty for local proxy)'}'`);

// Add interceptor for token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('Admin auth token not found for API request in BlogManagement.');
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Core Logic Functions ---

// Fetch table data (default language)
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    // Add /api prefix
    const response = await api.get(`/api/blogs/admin`); // CORRECTED: Use Admin endpoint
    if (Array.isArray(response.data)) {
        // Adapt response structure if needed (assuming it matches News)
        tableData.value = response.data.map(item => {
             console.log('Processing admin item:', item);
             // Backend /admin returns: id (numeric), blog_id (slug), list_title (default lang), updated_at
             if (!item.id || !item.blog_id) { // Check both IDs
                 console.warn('Admin item found without numeric id or blog_id (slug):', item);
             }
             // Return the object
             return {
                 db_id: item.id,         // <-- Store numeric DB ID
                 blog_id: item.blog_id,  // <-- Store slug
                 listTitle: item.list_title || '(无标题)', // Use list_title from response
                 // Fetch listImageSrc separately if needed, or add to admin endpoint response
                 listImageSrc: '', // Placeholder, might need adjustment
                 listImageAlt: '', // Placeholder
             };
        });
        console.log('--- Processed Admin Table Data (with db_id and blog_id) ---');
        console.log(JSON.stringify(tableData.value, null, 2));
    } else {
        console.warn('Unexpected API response format for admin blogs list (expected array):', response.data);
        tableData.value = [];
    }

  } catch (error) {
    console.error('Error fetching admin blog list:', error);
    errorMessage.value = `获取博客列表失败: ${error.response?.data?.message || error.message}`;
  } finally {
    isLoading.value = false;
  }
};

// Open Dialog for Creating
const openCreateDialog = () => {
  isEditMode.value = false;
  currentEditDbId.value = null;
  currentEditSlug.value = null;
  selectedLanguage.value = DEFAULT_LANG; // Start with default language

  // Clear previous data and initialize storage for all languages
  Object.keys(allLanguageData).forEach(key => delete allLanguageData[key]);
  supportedLanguages.forEach(lang => {
    allLanguageData[lang.code] = getInitialFormState(); // Initialize empty state
  });

  // Reset the form to the initial state for the default language
  Object.assign(blogForm, allLanguageData[selectedLanguage.value]);

  isDialogVisible.value = true;
    nextTick(() => {
    formRef.value?.clearValidate();
    });
};

// Open Dialog for Editing - Modified to fetch all languages using Admin API
const handleEdit = async (row) => {
  // --- Use db_id (numeric) and blog_id (slug) from the row --- 
  if (!row || row.db_id === undefined || !row.blog_id) {
    ElMessage.error('无法编辑：缺少博客数字 ID 或 Slug。');
      return;
  }

  isEditMode.value = true;
  currentEditDbId.value = row.db_id; // <-- Store NUMERIC ID
  currentEditSlug.value = row.blog_id; // <-- Store slug
  isDialogVisible.value = true;
  isLoadingDetails.value = true;
  errorMessage.value = '';
  selectedLanguage.value = DEFAULT_LANG;

  try {
    // --- Step 1: Fetch base data + default translation using ADMIN endpoint ---
    console.log(`Fetching admin details for DB ID: ${currentEditDbId.value}`);
    // Add /api prefix
    const baseResponse = await api.get(`/api/blogs/admin/${currentEditDbId.value}`);
    const baseData = baseResponse.data;
    console.log('Admin Base Details Response:', baseData);

    if (!baseData || !baseData.slug) {
      throw new Error('从 Admin API 收到的博客基础数据无效。');
    }

    // Populate non-translatable fields and default translation into allLanguageData
    allLanguageData[DEFAULT_LANG] = {
        slug: baseData.slug,
      listDate: baseData.list_date || null,
      listImageSrc: baseData.list_image || '',
      listSource: baseData.translation?.list_source || '', // Get source from default translation if available
      listTitle: baseData.translation?.list_title || '',
      listImageAlt: baseData.translation?.list_image_alt || '',
      listDescription: baseData.translation?.list_description || '',
      metaTitle: baseData.translation?.meta_title || '',
      metaDescription: baseData.translation?.meta_description || '',
      metaKeywords: baseData.translation?.meta_keywords || '',
      navSections: baseData.translation?.nav_sections || [],
      sidebarData: baseData.translation?.sidebar_data || [],
      content: baseData.translation?.content || ''
    };

    // --- Step 2: Fetch other translations using ADMIN endpoint --- 
    const otherLanguages = supportedLanguages.filter(l => l.code !== DEFAULT_LANG);
    const fetchPromises = otherLanguages.map(async (lang) => {
      try {
        console.log(`Fetching admin translation for DB ID: ${currentEditDbId.value}, lang: ${lang.code}`);
        // Add /api prefix
        const response = await api.get(`/api/blogs/admin/${currentEditDbId.value}/translations/${lang.code}`);
        if (response.data) {
           // Assign fetched data to the correct language slot
           allLanguageData[lang.code] = {
             slug: currentEditSlug.value, // Keep slug consistent
             listDate: allLanguageData[DEFAULT_LANG]?.listDate, // Copy non-translatable
             listImageSrc: allLanguageData[DEFAULT_LANG]?.listImageSrc,
             listSource: allLanguageData[DEFAULT_LANG]?.listSource,
             // Translatable fields from response
             listTitle: response.data.list_title || '',
             listImageAlt: response.data.list_image_alt || '',
             listDescription: response.data.list_description || '',
             metaTitle: response.data.meta_title || '',
             metaDescription: response.data.meta_description || '',
             metaKeywords: response.data.meta_keywords || '',
             navSections: response.data.nav_sections || [],
             sidebarData: response.data.sidebar_data || [],
             content: response.data.content || ''
           };
        }
      } catch (fetchError) {
        if (fetchError.response && fetchError.response.status === 404) {
          console.warn(`No translation found for ${lang.code} (Blog ID: ${currentEditDbId.value}), initializing.`);
          // Initialize empty state for this language, keeping non-translatables
           allLanguageData[lang.code] = {
              ...(allLanguageData[DEFAULT_LANG] || getInitialFormState()), // Copy non-translatables from default
              slug: currentEditSlug.value,
              listTitle: '', listImageAlt: '', listDescription: '', metaTitle: '',
              metaDescription: '', metaKeywords: '', navSections: [], sidebarData: [], content: ''
           };
            } else {
          console.error(`Error fetching admin blog translation for ${lang.code}:`, fetchError);
          throw fetchError; // Propagate other errors
            }
        }
    });

    await Promise.all(fetchPromises);

    // Load the default language's data into the form initially
    if (allLanguageData[DEFAULT_LANG]) {
      Object.assign(blogForm, allLanguageData[DEFAULT_LANG]);
    } else {
      Object.assign(blogForm, getInitialFormState());
      blogForm.slug = currentEditSlug.value;
    }

  } catch (error) {
    console.error('Error fetching blog details for editing via Admin API:', error);
    errorMessage.value = `加载编辑数据失败: ${error.response?.data?.message || error.message}`;
      closeDialog(); 
    ElMessage.error(errorMessage.value);
  } finally {
      isLoadingDetails.value = false;
  }
};

// Delete Blog Post
const handleDelete = (row) => {
  // Corrected: Check for numeric db_id instead of slug blog_id
  if (!row || row.db_id === undefined || row.db_id === null) { 
    ElMessage.error('无法删除：缺少博客数字 ID (db_id)。');
    return;
  }
  ElMessageBox.confirm(
    // Use listTitle (if available) or numeric ID for confirmation message
    `确定要删除博客 "${row.listTitle || '(ID: ' + row.db_id + ')'}" 吗？此操作将删除所有语言的翻译且无法撤销。`,
    '确认删除',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    isSubmitting.value = true;
    try {
      // Corrected: Use Admin API endpoint with numeric ID
      // Add /api prefix
      await api.delete(`/api/blogs/admin/${row.db_id}`); 
      ElMessage.success('博客删除成功');
      await fetchData(); // Refresh list
    } catch (error) {
      console.error('Error deleting blog:', error);
      ElMessage.error(`删除失败: ${error.response?.data?.message || error.message}`);
    } finally {
      isSubmitting.value = false;
    }
  }).catch(() => ElMessage.info('删除已取消'));
};


// Submit Form (Create or Update) - Modified for Multi-Language
const handleSubmit = async () => {
  if (!formRef.value) return;

  // Save current language state before submitting
  if (allLanguageData[selectedLanguage.value]) {
    const currentData = allLanguageData[selectedLanguage.value];
    currentData.slug = blogForm.slug;
    currentData.listDate = blogForm.listDate;
    currentData.listImageSrc = blogForm.listImageSrc;
    currentData.listSource = blogForm.listSource; // Added missing source save
    currentData.listTitle = blogForm.listTitle;
    currentData.listImageAlt = blogForm.listImageAlt;
    currentData.listDescription = blogForm.listDescription;
    currentData.metaTitle = blogForm.metaTitle;
    currentData.metaDescription = blogForm.metaDescription;
    currentData.metaKeywords = blogForm.metaKeywords;
    currentData.navSections = JSON.parse(JSON.stringify(blogForm.navSections || []));
    currentData.sidebarData = JSON.parse(JSON.stringify(blogForm.sidebarData || []));
    currentData.content = blogForm.content;
    console.log(`Saved final form data for ${selectedLanguage.value} before submit.`);
  }

  formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
         if (isEditMode.value) {
          // --- UPDATE ---
          console.log(`Updating blog post (DB ID: ${currentEditDbId.value})`);
          // Step 1: Update non-translatable data using PUT /admin/:id
          const nonTranslatablePayload = {
             // Include fields like slug (maybe?), listDate, listImageSrc, listSource
             // Make sure these come from the correct place (e.g., blogForm or base data)
             list_date: blogForm.listDate, // Assumes blogForm holds the latest
             list_image: blogForm.listImageSrc,
             list_source: blogForm.listSource,
             // Note: Slug (blog_id) typically shouldn't be changed in an update
          };
          console.log("Sending PUT to /api/admin/:id for non-translatable data:", nonTranslatablePayload);
          // Add /api prefix
          await api.put(`/api/blogs/admin/${currentEditDbId.value}`, nonTranslatablePayload);
 
          // Step 2: Update each translation via PUT /admin/:id/translations/:lang
          // Reuse the key conversion helper from the CREATE section
          const camelToSnake = (key) => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          const convertKeysToSnake = (obj) => {
              if (typeof obj !== 'object' || obj === null) return obj;
              if (Array.isArray(obj)) return obj.map(convertKeysToSnake); // Recursively convert arrays too if needed
              return Object.keys(obj).reduce((acc, key) => {
                  const snakeKey = camelToSnake(key);
                  acc[snakeKey] = convertKeysToSnake(obj[key]); // Recursively convert nested objects
                  // Special handling: Keep non-translatable keys as camelCase if they slipped in
                   if (['slug', 'listDate', 'listImageSrc', 'listSource'].includes(key)) {
                       delete acc[snakeKey];
                       acc[key] = obj[key];
                   }
                  return acc;
              }, {});
          };

          const translationUpdatePromises = supportedLanguages.map(lang => {
            const langCode = lang.code;
            const langData = allLanguageData[langCode];
            
            // --- ADD CHECK: Skip update if essential data is missing for this language ---
            // Check for title AND content as they are likely the most critical required fields based on backend error
            if (!langData || !langData.listTitle || !langData.content || !langData.metaTitle || !langData.metaDescription || !langData.listImageAlt) {
              console.warn(`Skipping translation update for ${langCode}: Missing required fields (title, content, meta, image alt) in local data.`);
              return Promise.resolve(); // Resolve immediately, don't send PUT
            }
            // --- END CHECK ---

            // Convert the language data keys to snake_case before sending
            const translationPayload = convertKeysToSnake(langData);
            // Remove non-translatable keys that shouldn't be in this payload
            delete translationPayload.slug;
            delete translationPayload.list_date;
            delete translationPayload.list_image_src; // Backend PUT uses list_image, so remove this if present
            delete translationPayload.list_source;
 
            console.log(`Sending PUT to /api/admin/:id/translations/${langCode}:`, translationPayload);
            // Add /api prefix
            return api.put(`/api/blogs/admin/${currentEditDbId.value}/translations/${langCode}`, translationPayload);
          });
 
          await Promise.all(translationUpdatePromises);
          ElMessage.success('博客更新成功 (所有语言)！');
 
         } else {
            // --- CREATE ---
            console.log('Creating new blog post...');
            const defaultLangData = allLanguageData[DEFAULT_LANG];
            // --- 添加调试日志 --- 
            console.log('--- DEBUG: Data for default language BEFORE payload creation ---');
            console.log(JSON.stringify(defaultLangData, null, 2));
            // --- 结束调试日志 ---
            if (!defaultLangData) throw new Error('Default language data is missing.');

            // --- CORRECTED Payload Structure for CREATE ---
            // Helper function to convert camelCase keys to snake_case
            const camelToSnake = (key) => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            const convertKeysToSnake = (obj) => {
                if (typeof obj !== 'object' || obj === null) return obj;
                if (Array.isArray(obj)) return obj.map(convertKeysToSnake); // Recursively convert arrays too if needed
                
                return Object.keys(obj).reduce((acc, key) => {
                    const snakeKey = camelToSnake(key);
                    acc[snakeKey] = convertKeysToSnake(obj[key]); // Recursively convert nested objects
                    // Handle specific known non-translatable keys within translation object if they exist
                    // (adjust based on actual allLanguageData structure)
                    if (['slug', 'listDate', 'listImageSrc', 'listSource'].includes(key)) {
                        delete acc[snakeKey]; // Remove snake_case version if it was a non-translatable camelCase key
                        acc[key] = obj[key];    // Keep the original camelCase non-translatable key
                    }
                    return acc;
                }, {});
            };

            // Convert keys in allLanguageData to snake_case for the translations part
            const snakeCaseTranslations = Object.keys(allLanguageData).reduce((acc, langCode) => {
                acc[langCode] = convertKeysToSnake(allLanguageData[langCode]);
                return acc;
            }, {});

            const createPayload = {
                slug: blogForm.slug,
                list_date: blogForm.listDate,
                list_image: blogForm.listImageSrc, // Use list_image as expected by backend
                translations: snakeCaseTranslations // Send the converted translations object
            };
            // --- End Corrected Payload ---
            
            console.log("Sending POST payload: ", JSON.stringify(createPayload, null, 2)); 
            // Add /api prefix
            // Make sure the endpoint is correct (should it be /api/blogs or /api/blogs/admin?)
            // Based on error, it seems to be /api/blogs/admin
            const postResponse = await api.post(`/api/blogs/admin`, createPayload);
            const createdBlogDbId = postResponse.data?.data?.id; // Adjust based on actual backend response structure
            const createdBlogSlug = postResponse.data?.data?.slug; // Adjust based on actual backend response structure

            // --- REMOVED unnecessary PUT calls for other languages during CREATE ---
            // The backend POST /admin now handles inserting all provided translations
            // const putPromises = supportedLanguages.filter(l => l.code !== DEFAULT_LANG).map(lang => { ... });
            // await Promise.all(putPromises);
            // --- End Removal ---

            ElMessage.success('博客创建成功！');
         }

         closeDialog();
        await fetchData(); // Refresh table

       } catch (error) { 
        console.error('Error submitting blog:', error);
        // Enhanced error logging
        let errorMessage = '提交失败';
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error Response Data:', error.response.data);
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Headers:', error.response.headers);
            errorMessage += `: ${error.response.status} - ${error.response.data?.message || '服务器未提供详细信息'}`;
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error Request:', error.request);
            errorMessage += ': 未收到服务器响应，请检查网络连接和后端服务。';
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error Message:', error.message);
            errorMessage += `: ${error.message}`;
        }
        ElMessage.error(errorMessage);
       } finally {
         isSubmitting.value = false;
       }
    } else {
      console.log('Form validation failed');
      ElMessage.warning('请检查当前语言的表单字段是否都有效。切换到其他语言选项卡检查。');
      return false;
    }
  }); // End validate callback
};


// Close Dialog handler
const closeDialog = () => {
  isDialogVisible.value = false;
  // Reset logic is handled by @closed event
};

// Reset Form State (called by @closed event)
const resetForm = () => {
  Object.assign(blogForm, getInitialFormState());
  Object.keys(allLanguageData).forEach(key => delete allLanguageData[key]);
  currentEditDbId.value = null;
  currentEditSlug.value = null;
  selectedLanguage.value = DEFAULT_LANG;
  isEditMode.value = false;
  isSubmitting.value = false;
  isLoadingDetails.value = false;
  if (formRef.value) {
    formRef.value.resetFields(); // Also resets validation state
  }
  console.log("Form reset executed.");
};


// --- Dynamic List Management (Nav Sections) ---
const addNavSection = () => {
  blogForm.navSections = blogForm.navSections || []; // Ensure array exists
  blogForm.navSections.push({ id: '', title: '' });
};

const removeNavSection = (index) => {
  if (blogForm.navSections && blogForm.navSections.length > index) {
    blogForm.navSections.splice(index, 1);
  }
};

// --- Dynamic List Management (Sidebar Blocks) ---
const addSidebarBlock = () => {
  blogForm.sidebarData = blogForm.sidebarData || []; // Ensure array exists
  blogForm.sidebarData.push({ title: '', html_content: '' });
};

const removeSidebarBlock = (index) => {
   if (blogForm.sidebarData && blogForm.sidebarData.length > index) {
      blogForm.sidebarData.splice(index, 1);
   }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchData(); // Fetch initial table data
});

// --- Watcher for Language Change ---
watch(selectedLanguage, (newLangCode, oldLangCode) => {
  console.log(`Language changed via watcher: from "${oldLangCode}" to "${newLangCode}"`);

  // Guard against initial undefined old value or no actual change
  if (oldLangCode === undefined || newLangCode === oldLangCode) {
      console.log('Watcher triggered for initial value or no change, skipping logic.');
    return;
  }

  // 1. Save current form state back to storage for the *previous* language (oldLangCode)
  if (allLanguageData[oldLangCode]) {
    const currentData = allLanguageData[oldLangCode];
    // Save translatable fields
    currentData.listTitle = blogForm.listTitle;
    currentData.listImageAlt = blogForm.listImageAlt;
    currentData.listDescription = blogForm.listDescription;
    currentData.metaTitle = blogForm.metaTitle;
    currentData.metaDescription = blogForm.metaDescription;
    currentData.metaKeywords = blogForm.metaKeywords;
    currentData.navSections = JSON.parse(JSON.stringify(blogForm.navSections || []));
    currentData.sidebarData = JSON.parse(JSON.stringify(blogForm.sidebarData || []));
    currentData.content = blogForm.content;
    // Also save non-translatable fields (especially important in create mode)
    currentData.slug = blogForm.slug;
    currentData.listDate = blogForm.listDate;
    currentData.listImageSrc = blogForm.listImageSrc;
    currentData.listSource = blogForm.listSource;
    console.log(`Saved form data for ${oldLangCode} via watcher.`);
  } else {
    console.warn(`Attempted to save data via watcher for non-existent language key: ${oldLangCode}`);
  }

  // 2. Load new language data (newLangCode) into the form
  console.log(`--- Loading data for language: ${newLangCode} via watcher ---`);
  console.log('Data found in allLanguageData:', JSON.stringify(allLanguageData[newLangCode], null, 2));
  if (allLanguageData[newLangCode]) {
    const newData = allLanguageData[newLangCode];
    // Load translatable fields
    blogForm.listTitle = newData.listTitle;
    blogForm.listImageAlt = newData.listImageAlt;
    blogForm.listDescription = newData.listDescription;
    blogForm.metaTitle = newData.metaTitle;
    blogForm.metaDescription = newData.metaDescription;
    blogForm.metaKeywords = newData.metaKeywords;
    blogForm.navSections = JSON.parse(JSON.stringify(newData.navSections || []));
    blogForm.sidebarData = JSON.parse(JSON.stringify(newData.sidebarData || []));
    blogForm.content = newData.content;
    // Ensure non-translatable fields remain consistent (use base lang's values or current edit ID)
    const baseData = allLanguageData[DEFAULT_LANG] || {};
    blogForm.slug = baseData.slug || currentEditSlug.value || '';
    blogForm.listDate = baseData.listDate || null;
    blogForm.listImageSrc = baseData.listImageSrc || '';
    blogForm.listSource = baseData.listSource || '';
    console.log(`Loaded form data for ${newLangCode} via watcher.`);
    console.log('blogForm state AFTER loading new language data via watcher:', JSON.stringify(blogForm, null, 2));
  } else {
    console.warn(`Data for language ${newLangCode} not found in watcher. Initializing.`);
    const baseData = allLanguageData[DEFAULT_LANG] || getInitialFormState();
    allLanguageData[newLangCode] = {
        ...baseData,
        slug: blogForm.slug, // Use current slug from form
        listTitle: '', listImageAlt: '', listDescription: '', metaTitle: '',
        metaDescription: '', metaKeywords: '', navSections: [], sidebarData: [], content: ''
    };
    Object.assign(blogForm, allLanguageData[newLangCode]);
  }

  // 3. Clear validation messages (selectedLanguage.value is already updated by v-model)
  nextTick(() => {
    formRef.value?.clearValidate();
  });
});

</script>

<style scoped>
/* General Styles */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.loading-area, .error-area {
  padding: 20px;
  text-align: center;
  color: #909399;
}
.error-area {
  color: #F56C6C;
}

/* Dialog Styles */
.el-dialog__body {
    padding-bottom: 0; /* Reduce bottom padding if footer exists */
}
.dialog-footer {
  text-align: right;
  padding: 10px 20px;
  border-top: 1px solid #eee;
  margin-top: 10px;
}

/* Form Styles */
.el-form-item {
    margin-bottom: 22px; /* Standard spacing */
}
.form-tip {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  margin-top: 4px;
}
.form-hint {
   font-size: 0.9em;
   color: #666;
   margin-bottom: 15px;
}

/* Dynamic List Styles */
.dynamic-list-item {
  background-color: #f9f9f9;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 15px;
  position: relative;
}
.dynamic-list-actions {
  display: flex;
  align-items: center; /* Vertically center buttons */
  justify-content: center; /* Horizontally center button(s) */
  height: 100%; /* Allow vertical centering */
  padding-top: 30px; /* Align with input label approximately */
  box-sizing: border-box;
}
/* Adjust actions vertical alignment for sidebar blocks due to taller content */
.sidebar-block-item .dynamic-list-actions {
   padding-top: 5px; /* Reduce top padding */
   align-items: flex-start; /* Align to top */
}
.sidebar-block-item .el-divider {
   border-color: #e0e0e0; /* Make internal divider lighter */
}


/* Table Styles */
.el-table img {
   display: block; /* Prevent extra space below image */
   max-width: 100%;
   height: auto;
}
</style> 