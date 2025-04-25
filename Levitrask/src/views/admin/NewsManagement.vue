<template>
  <div> <!-- Root element -->
    <div class="main-header">
      <h2>新闻管理</h2>
      <el-button type="primary" @click="openCreateDialog">创建新闻</el-button>
    </div>

    <div v-if="isLoading" class="loading-area">加载中...</div>
    <div v-else-if="errorMessage" class="error-area">{{ errorMessage }}</div>
    <el-table v-else :data="tableData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID / Slug" width="200" />
      <el-table-column label="列表图片" width="100">
         <template #default="scope">
            <img 
                v-if="scope.row.listImage?.src" 
                :src="scope.row.listImage.src" 
                alt="列表图片"
                style="width: 60px; height: auto; object-fit: contain;" 
            />
            <span v-else>-</span>
         </template>
      </el-table-column>
      <el-table-column prop="listTitle" label="标题 (默认语言)" />
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
             </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="URL Slug (路径)" prop="slug">
              <el-input v-model="newsForm.slug" placeholder="例如: my-first-news-article" :disabled="isEditMode" />
              <!-- Add a button to generate slug from title later -->
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="列表标题 (List Title - 当前语言)" prop="listTitle">
                <el-input v-model="newsForm.listTitle" />
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
                  :disabled="isEditMode && selectedLanguage !== 'en'" 
                />
              </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
           <el-col :span="12">
             <el-form-item label="列表来源 (List Source)" prop="listSource">
                <el-input v-model="newsForm.listSource" :disabled="isEditMode && selectedLanguage !== 'en'"/>
             </el-form-item>
           </el-col>
           <el-col :span="12">
             <el-form-item label="列表图片 URL (List Image URL)" prop="listImageSrc">
                <el-input v-model="newsForm.listImageSrc" placeholder="请输入图片的完整 URL" :disabled="isEditMode && selectedLanguage !== 'en'"/>
             </el-form-item>
           </el-col>
        </el-row>
        
        <!-- Image URL Input -->
        <el-row :gutter="20">
          <el-col :span="12"> 
            <el-form-item label="图片 Alt 文本 (当前语言)" prop="listImageAlt">
               <el-input v-model="newsForm.listImageAlt" placeholder="图片的简短描述 (用于 SEO 和可访问性)"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
             <el-form-item label="列表描述 (List Description - 当前语言)" prop="listDescription">
                <el-input type="textarea" v-model="newsForm.listDescription" :rows="3" />
             </el-form-item>
          </el-col>
        </el-row>

        <el-divider>SEO Meta 信息 (当前语言)</el-divider>

        <el-form-item label="Meta 标题 (Meta Title)" prop="metaTitle">
           <el-input v-model="newsForm.metaTitle" />
        </el-form-item>
        <el-form-item label="Meta 描述 (Meta Description)" prop="metaDescription">
            <el-input type="textarea" v-model="newsForm.metaDescription" :rows="3" />
        </el-form-item>
        <el-form-item label="Meta 关键词 (Meta Keywords)" prop="metaKeywords">
            <el-input v-model="newsForm.metaKeywords" placeholder="请用英文逗号分隔"/>
        </el-form-item>

         <el-divider>主要内容 (当前语言)</el-divider>

        <!-- Content Input Area - Always HTML Source -->
        <el-form-item label="内容 (Content - HTML Source)" prop="content">
          <el-input 
             type="textarea" 
             v-model="newsForm.content" 
             :rows="15" 
             placeholder="请在此处输入或粘贴 HTML 源码"
          />
        </el-form-item>

      </el-form>
      <template #footer>
         <!-- Footer buttons remain the same -->
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
            {{ isEditMode ? '更新 ' + selectedLanguage : '创建 ' + selectedLanguage }}
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
const currentEditId = ref(null); 
const selectedLanguage = ref('en'); // Default language for the form

// Define supported languages (adjust as needed)
const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文 (简体)' },
  // Add more languages here, e.g.:
  // { code: 'zh-TW', name: '中文 (繁體)' },
  // { code: 'ru', name: 'Русский' }, 
];

// --- Form Initial State --- 
const initialNewsFormState = {
  slug: '',
  // Language Code will be handled by selectedLanguage ref
  listTitle: '',
  listDate: null,
  listSource: '',
  listImageSrc: '',
  listImageAlt: '',
  listDescription: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  content: ''       
};

// --- Form Data --- 
const newsForm = reactive({ ...initialNewsFormState });

// --- Form Validation Rules --- 
const formRules = reactive({
  slug: [
      { required: true, message: '请输入 URL Slug', trigger: 'blur' },
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符 (-)', trigger: 'blur' }
  ],
  // Add language validation if needed, though selection handles it
  listTitle: [{ required: true, message: '请输入列表标题', trigger: 'blur' }],
  listImageSrc: [
      { required: true, message: '请输入列表图片 URL', trigger: 'blur' },
  ], 
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
    return `${isEditMode.value ? '编辑' : '创建'}新闻 (${langName})`;
});

// --- API Base URL ---
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// --- Methods --- 
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await axios.get(`${apiBaseUrl}/api/news?lang=en`); // Fetching english for the table
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      tableData.value = Object.values(response.data).map(item => ({
        ...item,
        // Ensure listImageSrc is directly accessible for the preview in the table
        listImageSrc: item.listImage?.src || item.listImageSrc || '' 
      }));
    } else if (Array.isArray(response.data)) {
        // Adjust mapping if API returns array
        tableData.value = response.data.map(item => ({
          ...item,
          listImageSrc: item.listImage?.src || item.listImageSrc || ''
        }));
    } else {
      console.warn('API response data is neither an object nor an array:', response.data);
      tableData.value = [];
      errorMessage.value = '收到的数据格式无法处理。'
    }
  } catch (error) {
    console.error('获取新闻列表失败:', error);
    errorMessage.value = `无法加载数据 (${error.message || '未知错误'})。`;
    tableData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(newsForm, initialNewsFormState);
  currentEditId.value = null; 
  selectedLanguage.value = 'en'; // Reset language to default
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  isDialogVisible.value = true;
};

const handleEdit = async (row) => {
  isEditMode.value = true;
  resetForm(); 
  currentEditId.value = row.id; // Store the slug (news_id)
  selectedLanguage.value = 'en'; // Default to loading English first
  console.log(`Editing news with slug: ${currentEditId.value}, starting with lang: ${selectedLanguage.value}`);

  // --- Load data for the selected language --- 
  isLoading.value = true; // Use main loading indicator briefly?
  errorMessage.value = '';
  try {
      const apiUrl = `${apiBaseUrl}/api/news/${currentEditId.value}`;
      const response = await axios.get(apiUrl, { params: { lang: selectedLanguage.value } });
      const dataToEdit = response.data;
      
      // Populate the form with fetched data
      newsForm.slug = dataToEdit.id; // Slug comes from the main ID field now
      newsForm.listTitle = dataToEdit.listTitle || '';
      newsForm.listDate = dataToEdit.listDate; // Non-translatable
      newsForm.listSource = dataToEdit.listSource || ''; // Non-translatable
      newsForm.listImageSrc = dataToEdit.listImage?.src || ''; // Non-translatable
      newsForm.listImageAlt = dataToEdit.listImage?.alt || ''; // Translatable
      newsForm.listDescription = dataToEdit.listDescription || '';
      newsForm.metaTitle = dataToEdit.metaTitle || '';
      newsForm.metaDescription = dataToEdit.metaDescription || '';
      newsForm.metaKeywords = dataToEdit.metaKeywords || '';
      newsForm.content = dataToEdit.content || '';
      
      isDialogVisible.value = true;
      console.log('Form populated for editing.');

  } catch (error) {
       console.error(`获取新闻详情失败 (slug: ${currentEditId.value}, lang: ${selectedLanguage.value}):`, error);
       errorMessage.value = `无法加载编辑数据 (${error.response?.data?.message || error.message || '未知错误'})。`;
       ElMessage.error('加载编辑数据失败!');
       isEditMode.value = false; // Reset mode if load fails
       currentEditId.value = null;
  } finally {
       isLoading.value = false;
  }
};

// TODO: Add function to load different language into the form when editing
const loadLanguageForEdit = async (langCode) => {
   if (!isEditMode.value || !currentEditId.value) return;
   selectedLanguage.value = langCode;
   console.log(`Attempting to load language '${langCode}' for slug '${currentEditId.value}' into form.`);
   // Similar fetch logic as in handleEdit, but only update translatable fields
   isSubmitting.value = true; // Use submitting indicator for loading language
   try {
      const apiUrl = `${apiBaseUrl}/api/news/${currentEditId.value}`;
      const response = await axios.get(apiUrl, { params: { lang: langCode } });
      const langData = response.data;

      // Update only translatable fields in the form
      newsForm.listTitle = langData.listTitle || '';
      newsForm.listImageAlt = langData.listImage?.alt || ''; 
      newsForm.listDescription = langData.listDescription || '';
      newsForm.metaTitle = langData.metaTitle || '';
      newsForm.metaDescription = langData.metaDescription || '';
      newsForm.metaKeywords = langData.metaKeywords || '';
      newsForm.content = langData.content || '';
      
      ElMessage.success(`已加载 ${langCode} 语言内容`);
      // Reset validation state for the loaded fields if needed
      await nextTick(); // Wait for DOM update
      if (formRef.value) {
           formRef.value.clearValidate(['listTitle', 'listImageAlt', 'listDescription', 'metaTitle', 'metaDescription', 'metaKeywords', 'content']);
      }

   } catch (error) {
        console.error(`加载语言内容失败 (slug: ${currentEditId.value}, lang: ${langCode}):`, error);
        // If language not found (404), maybe clear the fields?
        if (error.response && error.response.status === 404) {
            ElMessage.info(`新闻 '${currentEditId.value}' 的 '${langCode}' 语言版本不存在，请填写新内容。`);
            // Clear translatable fields
            newsForm.listTitle = '';
            newsForm.listImageAlt = ''; 
            newsForm.listDescription = '';
            newsForm.metaTitle = '';
            newsForm.metaDescription = '';
            newsForm.metaKeywords = '';
            newsForm.content = '';
        } else {
             ElMessage.error(`加载 ${langCode} 内容失败: ${error.response?.data?.message || error.message}`);
        }
        // Optionally switch back to default lang? Or let user fill it?
   } finally {
        isSubmitting.value = false;
   }
};

const handleDelete = async (row) => {
    const newsId = row.id; // Use slug (news_id) from the row data
     if (!newsId) {
         ElMessage.error('无法获取新闻 ID');
         return;
     }
    ElMessageBox.confirm(
        `确定要删除新闻 "${row.listTitle || newsId}" 吗？此操作将删除所有语言版本且无法撤销。`,
        '警告',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      .then(async () => {
          try {
              console.log(`Sending DELETE request for slug: ${newsId}`);
              const apiUrl = `${apiBaseUrl}/api/news/${newsId}`;
              await axios.delete(apiUrl);
              ElMessage.success('删除成功!');
              fetchData(); // Refresh table data
          } catch (error) {
              console.error('删除新闻失败:', error.response || error);
              ElMessage.error(`删除失败: ${error.response?.data?.message || error.message || '未知错误'}`);
          }
      })
      .catch(() => {
          // User cancelled
          ElMessage.info('删除已取消');
      });
};

const closeDialog = () => {
  isDialogVisible.value = false;
  // Reset form is handled by @close event on el-dialog
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      const payload = { 
          ...newsForm, // Include all form fields
          languageCode: selectedLanguage.value // Add the selected language code
      };
      // Ensure listDate is not empty string if it was null
      if (payload.listDate === null || payload.listDate === '') {
          delete payload.listDate; // Let backend handle default
      }
      
      try {
        let response;
        if (isEditMode.value) {
          // --- PUT Request (Update) ---
          console.log(`Sending PUT request for slug: ${currentEditId.value}, lang: ${payload.languageCode}`);
          const apiUrl = `${apiBaseUrl}/api/news/${currentEditId.value}`;
          response = await axios.put(apiUrl, payload);
          ElMessage.success('新闻更新成功!');
        } else {
          // --- POST Request (Create) ---
          console.log(`Sending POST request for slug: ${payload.slug}, lang: ${payload.languageCode}`);
          const apiUrl = `${apiBaseUrl}/api/news`;
          response = await axios.post(apiUrl, payload);
          ElMessage.success('新闻创建成功!');
        }
        console.log('API Response:', response.data);
        closeDialog();
        fetchData(); // Refresh table data
      } catch (error) {
        console.error('提交新闻失败:', error.response || error);
        ElMessage.error(`操作失败: ${error.response?.data?.message || error.message || '未知错误'}`);
      } finally {
        isSubmitting.value = false;
      }
    } else {
      console.log('表单验证失败!');
      ElMessage.warning('请检查表单输入项!');
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

.loading-area,
.error-area {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.error-area {
    color: #F56C6C;
}

/* Add other styles as needed */

/* Commented out Image Uploader specific styles */
/*
.news-image-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.news-image-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon--upload {
  font-size: 28px;
  color: #8c939d;
  width: 178px; 
  height: 178px;
  text-align: center;
  line-height: 178px; 
}

.news-image-preview {
  width: 178px; 
  height: 178px;
  display: block;
  object-fit: contain; 
}
*/
</style> 