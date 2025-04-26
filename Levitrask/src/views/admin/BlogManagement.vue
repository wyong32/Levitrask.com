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
      <el-table-column prop="listTitle" label="标题 ({{ DEFAULT_LANG }})" />
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
                 @change="loadLanguageForEdit" 
                 :disabled="!isEditMode && !currentEditingData"
               >
                 <el-option
                   v-for="lang in supportedLanguages"
                   :key="lang.code"
                   :label="lang.name"
                   :value="lang.code"
                 />
               </el-select>
               <div class="form-tip" v-if="!isEditMode">创建博客时将使用默认语言 ({{ DEFAULT_LANG }})。</div>
               <div class="form-tip" v-if="isEditMode">选择要编辑的语言版本。切换语言会加载对应内容。</div>
             </el-form-item>
          </el-col>
        </el-row>
        
        <!-- Row 2: List Title and List Date -->
        <el-row :gutter="20">
           <el-col :span="12">
            <el-form-item label="列表标题 (List Title)" prop="listTitle">
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
                />
              </el-form-item>
           </el-col>
        </el-row>

        <!-- Row 3: List Image URL and Alt Text -->
        <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="列表图片 URL (List Image URL)" prop="listImageSrc">
               <el-input v-model="blogForm.listImageSrc" placeholder="请输入图片的完整 URL" />
             </el-form-item>
          </el-col>
           <el-col :span="12">
             <el-form-item label="图片 Alt 文本" prop="listImageAlt">
                <el-input v-model="blogForm.listImageAlt" placeholder="图片的简短描述 (用于 SEO 和可访问性)"/>
             </el-form-item>
          </el-col>
        </el-row>

        <el-divider>翻译内容 (当前语言: {{ selectedLanguage }})</el-divider>

        <!-- Row 4: List Source (Full Width) -->
        <el-form-item label="列表来源/作者 (List Source)" prop="listSource">
           <el-input v-model="blogForm.listSource" />
        </el-form-item>
        
        <!-- Row 5: List Description (Full Width) -->
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
            {{ isEditMode ? '更新' : '创建' }}
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
import { Edit, Delete, Plus, ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue';

// --- State --- 
const tableData = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isDialogVisible = ref(false);
const isEditMode = ref(false); 
const currentEditSlug = ref(null);
const isLoadingDetails = ref(false); 
const selectedLanguage = ref('');
const currentEditingData = ref(null);

// --- Constants --- 
const DEFAULT_LANG = import.meta.env.VITE_DEFAULT_LANG || 'en';
const SUPPORTED_LANGS_JSON = import.meta.env.VITE_SUPPORTED_LANGS || '[{"code":"en","name":"English"},{"code":"zh-CN","name":"简体中文"}]';
const supportedLanguages = JSON.parse(SUPPORTED_LANGS_JSON);

// --- API Base URL ---
// In development, proxy handles '/api'. In production, use the full BASE_URL.
// Let Axios use relative paths in dev, relying on the proxy.
const apiBaseUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || '') : '';

// Helper function to build API URLs correctly for dev (proxy) and prod
const buildApiUrl = (path) => {
    // Ensure path starts with /
    const ensuredPath = path.startsWith('/') ? path : `/${path}`;
    // If apiBaseUrl is set (production), prepend it. Otherwise (dev), use relative path.
    return apiBaseUrl ? `${apiBaseUrl}${ensuredPath}` : ensuredPath;
}

// --- Form Initial State (MODIFIED) --- 
const getInitialFormState = () => ({
  slug: '',
  listDate: null, 
  listImageSrc: '', 
  listTitle: '',
  listSource: '',
  listImageAlt: '', 
  listDescription: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  content: '',
  navSections: [],
  sidebarData: []
});

// --- Form Data (MODIFIED) --- 
const blogForm = reactive(getInitialFormState());
const formRef = ref(null); 

// --- Form Rules (MODIFIED) --- 
const formRules = reactive({
  slug: [
      { required: true, message: 'URL Slug (路径) 不能为空', trigger: 'blur' },
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  listTitle: [{ required: true, message: '列表标题不能为空', trigger: 'blur' }],
  listImageSrc: [{ required: true, message: '列表图片 URL 不能为空', trigger: 'blur' }],
  listImageAlt: [{ required: true, message: '图片 Alt 文本不能为空', trigger: 'blur' }],
  metaTitle: [{ required: true, message: 'Meta 标题不能为空', trigger: 'blur' }],
  metaDescription: [{ required: true, message: 'Meta 描述不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '主要内容不能为空', trigger: 'blur' }],
  navSectionId: [{ required: true, message: '导航项 ID 不能为空', trigger: 'blur' }],
  navSectionTitle: [{ required: true, message: '导航项标题不能为空', trigger: 'blur' }],
  sidebarBlockContent: [{ required: true, message: '侧边栏区块内容不能为空', trigger: 'blur' }]
});

// --- Computed --- 
const dialogTitle = computed(() => isEditMode.value ? `编辑博客 (${selectedLanguage.value})` : '创建新博客');

// --- Methods --- 
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const token = localStorage.getItem('admin-auth-token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.get(buildApiUrl('/api/blogs/admin'), config); // Use admin endpoint
    const responseData = response.data;

    if (Array.isArray(responseData)) {
        tableData.value = responseData.map(blog => ({
            ...blog // Spread the backend data (contains numeric `id` and string `blog_id`)
        }));
        console.log('Fetched blog list (array format):', tableData.value);
    } else {
        console.error('API response data for admin blogs is not the expected array format:', responseData);
        tableData.value = [];
        errorMessage.value = '收到的博客数据格式无法处理。';
    }

  } catch (error) {
    console.error('获取博客列表失败:', error);
    errorMessage.value = `无法加载博客数据 (${error.response?.data?.message || error.message || '未知错误'})。`;
    tableData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const loadLanguageForEdit = (langCode) => {
    // +++ DEBUG LOG: Function entry +++
    console.log(`--- loadLanguageForEdit called for lang: ${langCode} ---`);
    if (!isEditMode.value || !currentEditingData.value) {
        console.log('loadLanguageForEdit: Not in edit mode or no currentEditingData.');
        selectedLanguage.value = langCode; 
        return;
    }

    selectedLanguage.value = langCode; 

    const dataToLoad = currentEditingData.value.translations?.[langCode] || {};
    const defaultData = currentEditingData.value.translations?.[DEFAULT_LANG] || {};
    const baseData = currentEditingData.value; 

    // +++ DEBUG LOG: Show data sources +++
    console.log('loadLanguageForEdit: Base Data:', JSON.stringify(baseData, null, 2));
    console.log(`loadLanguageForEdit: Data to Load (${langCode}):`, JSON.stringify(dataToLoad, null, 2));
    console.log(`loadLanguageForEdit: Default Data (${DEFAULT_LANG}):`, JSON.stringify(defaultData, null, 2));

    // Populate language-specific fields, falling back to default lang or empty if not found
    // Adding logs for clarity
    blogForm.listTitle = dataToLoad.list_title || defaultData.list_title || ''; // Backend sends snake_case
    console.log(`  - Setting listTitle: ${blogForm.listTitle}`);
    blogForm.listSource = dataToLoad.list_source || defaultData.list_source || ''; // Assuming list_source is snake_case too
    console.log(`  - Setting listSource: ${blogForm.listSource}`);
    blogForm.listImageAlt = dataToLoad.list_image_alt || defaultData.list_image_alt || ''; // Backend sends snake_case
    console.log(`  - Setting listImageAlt: ${blogForm.listImageAlt}`);
    blogForm.listDescription = dataToLoad.list_description || defaultData.list_description || ''; // Backend sends snake_case
    console.log(`  - Setting listDescription: ${blogForm.listDescription}`);
    blogForm.metaTitle = dataToLoad.meta_title || defaultData.meta_title || ''; // Backend sends snake_case
    console.log(`  - Setting metaTitle: ${blogForm.metaTitle}`);
    blogForm.metaDescription = dataToLoad.meta_description || defaultData.meta_description || ''; // Backend sends snake_case
    console.log(`  - Setting metaDescription: ${blogForm.metaDescription}`);
    blogForm.metaKeywords = dataToLoad.meta_keywords || defaultData.meta_keywords || ''; // Backend sends snake_case
    console.log(`  - Setting metaKeywords: ${blogForm.metaKeywords}`);
    blogForm.content = dataToLoad.content || defaultData.content || ''; // Backend sends camelCase here
    console.log(`  - Setting content: ${blogForm.content.substring(0, 50)}...`); // Log partial content
    blogForm.navSections = Array.isArray(dataToLoad.nav_sections) ? JSON.parse(JSON.stringify(dataToLoad.nav_sections)) : [];
    console.log(`  - Setting navSections (count): ${blogForm.navSections.length}`);
    blogForm.sidebarData = Array.isArray(dataToLoad.sidebar_data) ? JSON.parse(JSON.stringify(dataToLoad.sidebar_data)) : [];
    console.log(`  - Setting sidebarData (count): ${blogForm.sidebarData.length}`);

    // Populate common fields from base data (should only happen once really, but safe to repeat)
    blogForm.slug = baseData.slug || '';
    console.log(`  - Setting slug: ${blogForm.slug}`);
    blogForm.listDate = baseData.list_date || null;
    console.log(`  - Setting listDate: ${blogForm.listDate}`);
    blogForm.listImageSrc = baseData.list_image || ''; // Base data has list_image
    console.log(`  - Setting listImageSrc: ${blogForm.listImageSrc}`);

    // +++ DEBUG LOG: Show final blogForm state +++
    console.log('--- loadLanguageForEdit: Final blogForm state ---');
    console.log(JSON.stringify(blogForm, null, 2));

    // Trigger validation update if needed after loading new data
    nextTick(() => {
        if (formRef.value) {
           // Optional actions like clearing validation
        }
    });
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(blogForm, getInitialFormState());
  currentEditSlug.value = null; 
  currentEditingData.value = null;
  selectedLanguage.value = DEFAULT_LANG;
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm(); 
  selectedLanguage.value = DEFAULT_LANG;
  isDialogVisible.value = true;
};

const closeDialog = () => {
  isDialogVisible.value = false;
};

const addNavSection = () => {
  blogForm.navSections.push({ id: '', title: '' });
};

const removeNavSection = (index) => {
  blogForm.navSections.splice(index, 1);
};

const addSidebarBlock = () => {
  blogForm.sidebarData.push({ title: '', html_content: '' });
};

const removeSidebarBlock = (index) => {
  blogForm.sidebarData.splice(index, 1);
};

const handleEdit = async (row) => {
  console.log("Edit clicked for row:", row);
  // *** USE row.id (NUMERIC ID) for API calls ***
  const numericId = row.id; 
  const slug = row.blog_id; // Keep slug for informational purposes or if needed elsewhere

  // Check for NUMERIC ID
  if (numericId === undefined || numericId === null || isNaN(parseInt(numericId))) { // Added isNaN check
      console.error("Row data is missing or has invalid numeric ID required for editing.", row);
      ElMessage.error('无法编辑：缺少或博客的数字 ID 无效。'); // Updated error message
      return;
  }
  // Keep slug check as a warning if needed, but numeric ID is critical
  if (!slug) {
      console.warn("Row data is missing slug (blog_id), proceeding with numeric ID.", row); 
  }

  isEditMode.value = true;
  resetForm(); 
  currentEditSlug.value = slug; // Store slug, mainly informational now for edit

  isDialogVisible.value = true;
  isLoadingDetails.value = true;

  try {
    const token = localStorage.getItem('admin-auth-token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    // 1. Fetch main data + default translation using NUMERIC ID
    const adminDetailUrl = buildApiUrl(`/api/blogs/admin/${numericId}`); // USE numericId
    console.log(`Fetching base blog details from: ${adminDetailUrl}`);
    const baseResponse = await axios.get(adminDetailUrl, config);
    const baseData = baseResponse.data;
    console.log("Fetched base details:", baseData);

    if (!baseData || !baseData.slug) {
        throw new Error("收到的博客基础数据无效。");
    }
    const combinedData = {
        id: baseData.id,
        slug: baseData.slug,
        list_date: baseData.list_date,
        list_image: baseData.list_image, 
        created_at: baseData.created_at,
        updated_at: baseData.updated_at,
        translations: {}
    };
    if (baseData.translation) {
        combinedData.translations[DEFAULT_LANG] = {
            ...baseData.translation,
            nav_sections: baseData.translation.nav_sections || [],
            sidebar_data: baseData.translation.sidebar_data || []
        };
    }

    // 2. Fetch other translations using NUMERIC ID
    const otherLanguages = supportedLanguages.filter(lang => lang.code !== DEFAULT_LANG);
    const translationPromises = otherLanguages.map(async (lang) => {
        const translationUrl = buildApiUrl(`/api/blogs/admin/${numericId}/translations/${lang.code}`); // USE numericId
        console.log(`Fetching translation for lang ${lang.code} from: ${translationUrl}`);
        try {
            const response = await axios.get(translationUrl, config);
            combinedData.translations[lang.code] = {
                ...response.data,
                 nav_sections: response.data.nav_sections || [], 
                 sidebar_data: response.data.sidebar_data || []
            };
            console.log(`Successfully fetched translation for ${lang.code}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Translation not found for lang ${lang.code}, will use default or empty.`);
                combinedData.translations[lang.code] = null; 
            } else {
                console.error(`Error fetching translation for ${lang.code}:`, error);
            }
        }
    });
    await Promise.all(translationPromises);

    // 3. Store the combined data
    currentEditingData.value = combinedData;
    currentEditSlug.value = combinedData.slug; 
    // +++ DEBUG LOG: Show combined data +++
    console.log("Stored combined blog details with all translations:");
    console.log(JSON.stringify(currentEditingData.value, null, 2)); 

    // 4. Set initial language and load data into form
    selectedLanguage.value = DEFAULT_LANG;
    loadLanguageForEdit(DEFAULT_LANG); // Populate form with default language data
    // +++ DEBUG LOG: Show form state AFTER initial load +++
    console.log("Form populated after initial loadLanguageForEdit:");
    console.log(JSON.stringify(blogForm, null, 2));

  } catch (error) {
      console.error("Error during handleEdit process:", error);
      ElMessage.error(`加载编辑数据时出错: ${error.message}`);
      closeDialog(); 
  } finally {
      isLoadingDetails.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
         const numericId = currentEditingData.value?.id;
         const token = localStorage.getItem('admin-auth-token');
         if (!token) {
           ElMessage.error('认证令牌未找到，请重新登录。');
           isSubmitting.value = false;
           return;
         }
         const config = { headers: { Authorization: `Bearer ${token}` } };

         if (isEditMode.value) {
             if (!numericId) {
                 ElMessage.error('无法更新：缺少博客的数字 ID。');
                 isSubmitting.value = false;
                 return;
             }

             // --- Step 1: Update Translation (Send snake_case keys) --- 
             const updateTranslationUrl = buildApiUrl(`/api/blogs/admin/${numericId}/translations/${selectedLanguage.value}`);
             console.log(`Sending PUT request to ${updateTranslationUrl} for translation`);
             // Build payload with snake_case keys expected by backend helper
             const translationPayload = {
                 list_title: blogForm.listTitle,
                 list_description: blogForm.listDescription,
                 meta_title: blogForm.metaTitle,
                 meta_description: blogForm.metaDescription,
                 meta_keywords: blogForm.metaKeywords,
                 nav_sections: blogForm.navSections,
                 sidebar_data: blogForm.sidebarData,
                 content: blogForm.content, // Backend helper expects camelCase for this one
                 list_image_alt: blogForm.listImageAlt
                 // list_source: blogForm.listSource // Add if backend expects list_source
             };
             console.log("Translation Update Payload (snake_case):");
             console.log(JSON.parse(JSON.stringify(translationPayload))); // Log the actual payload
             
             const translationResponse = await axios.put(updateTranslationUrl, translationPayload, config);
             console.log('Translation update response:', translationResponse);
             ElMessage.success(`博客翻译 (${selectedLanguage.value}) 更新成功！`);

             // --- Step 2 (Optional): Update Common Fields ... remains the same ...
             const originalBaseData = currentEditingData.value || {};
             const dateChanged = originalBaseData.list_date !== blogForm.listDate;
             const imageChanged = originalBaseData.list_image !== blogForm.listImageSrc;
             if (dateChanged || imageChanged) {
                 const updateCommonUrl = buildApiUrl(`/api/blogs/admin/${numericId}`);
                 console.log(`Sending PUT request to ${updateCommonUrl} for common fields`);
                 const commonPayload = {};
                 if (dateChanged) commonPayload.listDate = blogForm.listDate;
                 if (imageChanged) commonPayload.listImage = blogForm.listImageSrc;
                 console.log("Common Fields Update Payload:", JSON.parse(JSON.stringify(commonPayload)));
                 try {
                     console.warn("Backend endpoint for updating common blog fields (PUT /api/blogs/admin/:id) not implemented or called.");
                     ElMessage.warning('翻译已保存，但列表日期或图片 URL 的更改无法保存（缺少后端支持）。');
                 } catch(commonError) {
                     console.error("Error updating common blog fields:", commonError);
                     ElMessage.error(`翻译更新成功，但基础信息（日期/图片）更新失败: ${commonError.response?.data?.message || commonError.message}`);
                 }
             }

         } else {
           // --- Create Blog (POST - Requires snake_case for translation part too!) ---
           // Backend POST expects specific fields, ensure names match extract helpers
            const createPayload = {
               slug: blogForm.slug,
               listDate: blogForm.listDate,
               listImageSrc: blogForm.listImageSrc, 
               languageCode: selectedLanguage.value,
               // Translatable fields with snake_case keys
               list_title: blogForm.listTitle,
               list_description: blogForm.listDescription,
               meta_title: blogForm.metaTitle,
               meta_description: blogForm.metaDescription,
               meta_keywords: blogForm.metaKeywords,
               nav_sections: blogForm.navSections,
               sidebar_data: blogForm.sidebarData,
               content: blogForm.content, // Keep as content
               list_image_alt: blogForm.listImageAlt
               // list_source: blogForm.listSource // Add if needed
           };
           if (!createPayload.slug) {
               ElMessage.error('创建时必须提供 Slug。');
               isSubmitting.value = false;
               return;
           }
           const createUrl = buildApiUrl('/api/blogs/admin'); 
           console.log(`Sending POST request to ${createUrl} for lang ${selectedLanguage.value}`);
           console.log("Create Payload (mixed case):");
           console.log(JSON.parse(JSON.stringify(createPayload))); // Log the actual payload
           const response = await axios.post(createUrl, createPayload, config);
           console.log('Create response:', response);
           ElMessage.success('博客创建成功！');
         }

         closeDialog();
         await fetchData();
       } catch (error) { 
         console.error('提交博客失败:', error);
         const errorMsg = error.response?.data?.message || 
                          (error.response?.status === 401 ? '认证失败或令牌已过期' : error.message) || 
                          '操作失败，请稍后重试';
         ElMessage.error(`${isEditMode.value ? '更新' : '创建'}失败 (${selectedLanguage.value}): ${errorMsg}`);
       } finally {
         isSubmitting.value = false;
       }
    } else {
      console.log('表单验证失败');
      ElMessage.warning('请检查表单输入项');
      return false;
    }
  });
};

const handleDelete = async (row) => {
  // *** USE row.id (NUMERIC ID) ***
  const numericId = row.id;
  const slugToDelete = row.blog_id; // Keep slug for display message
  const titleToDelete = row.list_title || slugToDelete || '未命名';

  // Check for NUMERIC ID
  if (numericId === undefined || numericId === null || isNaN(parseInt(numericId))) { // Added isNaN check
      console.error("Row data is missing or has invalid numeric ID required for deleting.", row);
      ElMessage.error('无法删除：缺少或博客的数字 ID 无效。'); // Updated error message
      return;
  }
  console.log(`Delete button clicked for ID: ${numericId} (Slug: ${slugToDelete})`);

  ElMessageBox.confirm(
    `确定要删除博客 "${titleToDelete}" (ID: ${numericId}, Slug: ${slugToDelete}) 吗？此操作将删除所有语言版本且无法撤销。`,
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      console.log(`Attempting to delete blog with ID: ${numericId}`);
      try {
         const token = localStorage.getItem('admin-auth-token');
         if (!token) {
             ElMessage.error('认证失败，请重新登录');
             return; 
         }
         // Use the Admin Delete Endpoint with numeric ID
         const apiUrl = buildApiUrl(`/api/blogs/admin/${numericId}`); // USE numericId
         const config = { headers: { Authorization: `Bearer ${token}` } };
         console.log(`Sending DELETE request to ${apiUrl}`);
         await axios.delete(apiUrl, config);
         ElMessage.success('博客删除成功！');
         await fetchData(); 
      } catch (error) { 
         console.error('删除博客失败:', error);
         const message = error.response?.data?.message || 
                         (error.response?.status === 401 ? '认证失败或令牌已过期' : error.message) || 
                         '删除操作失败';
         ElMessage.error(`删除失败: ${message}`);
      } 
    })
    .catch(() => {
      ElMessage.info('已取消删除');
    });
};

onMounted(() => {
  fetchData();
  selectedLanguage.value = DEFAULT_LANG;
});

</script>

<style scoped>
/* Basic styles */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.loading-area,
.error-area {
  padding: 20px;
  text-align: center;
  color: #909399;
}
.error-area {
  color: #f56c6c;
}

.dynamic-list-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f9fafc;
}

.dynamic-list-item:last-child {
   /* margin-bottom: 0; */ /* Keep margin for button spacing */
}

.dynamic-list-actions {
  display: flex;
  align-items: center; /* Vertically center buttons */
  justify-content: flex-end; /* Align buttons to the right */
  /* Add height or padding if needed to ensure vertical alignment */
   padding-top: 30px; /* Adjust based on label height */
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: -10px; /* Adjust spacing */
  margin-bottom: 10px;
}

/* Style for the new sidebar block section */
.sidebar-block-item .el-col:first-child { 
    /* Give more space to title/content inputs */
}

.sidebar-block-item .dynamic-list-actions {
   /* Adjust alignment if needed, inherited styles might be ok */
}

/* Ensure dialog content doesn't overflow vertically */
.el-dialog__body {
    max-height: 70vh; /* Adjust as needed */
    overflow-y: auto;
}
</style> 