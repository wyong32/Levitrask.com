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
      <el-table-column prop="listTitle" label="标题" />
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
            <el-form-item label="URL Slug (路径)" prop="slug">
              <el-input v-model="newsForm.slug" placeholder="例如: my-first-news-article" />
              <!-- Add a button to generate slug from title later -->
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="列表标题 (List Title)" prop="listTitle">
              <el-input v-model="newsForm.listTitle" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
           <el-col :span="12">
             <el-form-item label="列表日期 (List Date)" prop="listDate">
                <el-date-picker
                  v-model="newsForm.listDate"
                  type="date"
                  placeholder="留空则为当天日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
           </el-col>
           <el-col :span="12">
             <el-form-item label="列表来源 (List Source)" prop="listSource">
                <el-input v-model="newsForm.listSource" />
             </el-form-item>
           </el-col>
        </el-row>
        
        <!-- Image Upload and Alt Text -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="列表图片 (List Image)" prop="listImageSrc">
              <el-upload
                class="news-image-uploader"
                action="#" 
                :show-file-list="false"
                :on-success="handleImageSuccess"
                :before-upload="beforeImageUpload"
                :http-request="mockHttpRequest"
              >
                <img v-if="newsForm.listImageSrc" :src="newsForm.listImageSrc" class="news-image-preview" alt="预览"/>
                <el-icon v-else class="el-icon--upload"><upload-filled /></el-icon>
                <div v-if="!newsForm.listImageSrc" class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
              </el-upload>
              <div class="el-upload__tip">
                只能上传 jpg/png 文件，且不超过 2MB
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图片 Alt 文本" prop="listImageAlt">
              <el-input v-model="newsForm.listImageAlt" placeholder="图片的简短描述 (必填)"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="列表描述 (List Description)" prop="listDescription">
           <el-input type="textarea" v-model="newsForm.listDescription" :rows="3" />
        </el-form-item>
        
        <el-divider>SEO Meta 信息</el-divider>

        <el-form-item label="Meta 标题 (Meta Title)" prop="metaTitle">
           <el-input v-model="newsForm.metaTitle" />
        </el-form-item>
        <el-form-item label="Meta 描述 (Meta Description)" prop="metaDescription">
            <el-input type="textarea" v-model="newsForm.metaDescription" :rows="3" />
        </el-form-item>
        <el-form-item label="Meta 关键词 (Meta Keywords)" prop="metaKeywords">
            <el-input v-model="newsForm.metaKeywords" placeholder="请用英文逗号分隔"/>
        </el-form-item>

         <el-divider>主要内容</el-divider>

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
import { UploadFilled } from '@element-plus/icons-vue'; // Import upload icon

// --- State --- 
const tableData = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isDialogVisible = ref(false);
const isEditMode = ref(false); 
const currentEditId = ref(null); 

// --- Form Initial State --- 
const initialNewsFormState = {
  slug: '',
  listTitle: '',
  listDate: null, // Use null for date picker initial value
  listSource: '',
  listImageSrc: '', // Will store the image URL
  listImageAlt: '',
  listDescription: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  content: ''       // Content from either editor
};

// --- Form Data --- 
const newsForm = reactive({ ...initialNewsFormState });

// --- Form Validation Rules --- 
const formRules = reactive({
  slug: [
      { required: true, message: '请输入 URL Slug', trigger: 'blur' },
      // Basic slug validation: only lowercase letters, numbers, and hyphens
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符 (-)', trigger: 'blur' }
  ],
  listTitle: [{ required: true, message: '请输入列表标题', trigger: 'blur' }],
  listImageSrc: [{ required: true, message: '请上传列表图片', trigger: 'change' }], // Trigger on change (after upload)
  listImageAlt: [{ required: true, message: '请输入列表图片 Alt 文本', trigger: 'blur' }], 
  listDescription: [{ required: true, message: '请输入列表描述', trigger: 'blur' }],
  metaTitle: [{ required: true, message: '请输入 Meta 标题', trigger: 'blur' }],
  metaDescription: [{ required: true, message: '请输入 Meta 描述', trigger: 'blur' }],
  metaKeywords: [{ required: true, message: '请输入 Meta 关键词', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }], // Basic validation, might need adjustment based on editor
  // listDate is optional, no required rule
  // listSource is optional
});
const formRef = ref(null); 

// --- Computed --- 
const dialogTitle = computed(() => isEditMode.value ? '编辑新闻' : '创建新新闻');

// --- API Base URL ---
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// --- Methods --- 
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await axios.get(`${apiBaseUrl}/api/news`);
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      tableData.value = Object.values(response.data);
    } else if (Array.isArray(response.data)) {
      tableData.value = response.data;
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
    formRef.value.resetFields(); // Resets validation state
  }
  // Reset reactive form manually to initial state
  Object.assign(newsForm, initialNewsFormState); 
  currentEditId.value = null; 
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm(); 
  isDialogVisible.value = true;
};

const handleEdit = async (row) => {
  isEditMode.value = true;
  resetForm(); 
  console.log("Editing row data:", JSON.parse(JSON.stringify(row))); // Log raw row data

  // Use nextTick to ensure the form DOM is updated after resetForm if needed,
  // although direct assignment to reactive object should work.
  // await nextTick(); 

  // Populate the form with data from the row
  // Use Object.assign carefully or set properties individually
  Object.assign(newsForm, {
      slug: row.id, // Assuming row.id contains the slug (news_id)
      listTitle: row.listTitle,
      listDate: row.listDate || null, // Handle potential null/undefined date
      listSource: row.listSource || '',
      listImageSrc: row.listImage?.src || '', // Handle potential missing image object or src
      listImageAlt: row.listImage?.alt || '', // Handle potential missing image object or alt
      listDescription: row.listDescription || '',
      metaTitle: row.metaTitle || '',       // Assuming these meta fields exist directly on the row object fetched by fetchData
      metaDescription: row.metaDescription || '',
      metaKeywords: row.metaKeywords || '',
      content: row.content || ''             // Assuming content field exists
  });
   // Note: If fetchData doesn't fetch all meta/content fields for the list view, 
   // you might need a separate API call here (e.g., GET /api/news/:id) to get full details.
   // For now, we assume the row object from the list contains enough info.

  currentEditId.value = row.id; // Store the ID (slug) for the PUT request
  console.log("Form populated for edit:", JSON.parse(JSON.stringify(newsForm)));
  isDialogVisible.value = true;
};

const handleDelete = async (row) => {
  // Confirm before deleting
  ElMessageBox.confirm(
    `确定要删除新闻 "${row.listTitle}" (ID: ${row.id}) 吗？此操作无法撤销。`,
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      console.log(`Attempting to delete news item with ID: ${row.id}`);
      // --- API Call to Delete News ---
      try {
         const token = localStorage.getItem('admin-auth-token');
         if (!token) {
             ElMessage({ type: 'error', message: '认证失败，请重新登录' });
             // Optionally redirect to login: router.push('/admin/login');
             return; 
         }

         const apiUrl = `${apiBaseUrl}/api/news/${row.id}`; // Use row.id (which is the slug/news_id)
         const config = {
             headers: { 
                 Authorization: `Bearer ${token}` 
             }
         };

         console.log(`Sending DELETE request to ${apiUrl}`);
         await axios.delete(apiUrl, config);
         
         ElMessage({ type: 'success', message: '删除成功' });
         await fetchData(); // Refresh list after successful deletion
      } catch (error) {
         console.error('删除新闻失败:', error);
         const message = error.response?.data?.message || error.message || '删除失败';
         ElMessage({ type: 'error', message: `删除失败: ${message}` });
      }
    })
    .catch(() => {
      // User cancelled the confirmation dialog
      ElMessage({ type: 'info', message: '已取消删除' });
    });
};

const closeDialog = () => {
  isDialogVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
       isSubmitting.value = true;
       console.log("Form validation successful. Preparing payload..."); 
       
       // Prepare payload (structure remains the same)
       const payload = { 
         slug: newsForm.slug,
         listTitle: newsForm.listTitle,
         listDate: newsForm.listDate, 
         listSource: newsForm.listSource,
         listImage: { 
            src: newsForm.listImageSrc,
            alt: newsForm.listImageAlt
         },
         listDescription: newsForm.listDescription,
         metaTitle: newsForm.metaTitle,
         metaDescription: newsForm.metaDescription,
         metaKeywords: newsForm.metaKeywords,
         content: newsForm.content
       };
       console.log("Payload to send:", payload);

       try {
           let response;
           const config = {
               headers: { 
                   Authorization: `Bearer ${localStorage.getItem('admin-auth-token')}` 
               }
           };

           if (isEditMode.value) {
               // --- UPDATE Logic (PUT request) --- 
               const updateUrl = `${apiBaseUrl}/api/news/${currentEditId.value}`;
               console.log(`Sending PUT request to ${updateUrl}`);
               response = await axios.put(updateUrl, payload, config);
               console.log('Update response:', response);
           } else {
               // --- CREATE Logic (POST request) --- 
               const createUrl = `${apiBaseUrl}/api/news`;
               console.log(`Sending POST request to ${createUrl}`);
               response = await axios.post(createUrl, payload, config);
               console.log('Create response:', response);
           }
           
           ElMessage({ type: 'success', message: isEditMode.value ? '更新成功' : '创建成功' });
           closeDialog();
           await fetchData(); 
       } catch (error) { 
           console.error('Submit failed:', error);
           const message = error.response?.data?.message || error.message || (isEditMode.value ? '更新失败' : '创建失败');
           ElMessage({ type: 'error', message: `${isEditMode.value ? '更新' : '创建'}失败: ${message}` });
       } finally {
           isSubmitting.value = false;
       }

    } else {
      console.log('Form validation failed');
      ElMessage({ type: 'error', message: '请检查表单输入' });
      return false;
    }
  });
};

// --- Image Upload Handlers ---
const handleImageSuccess = (response, uploadFile) => {
  // This is where you would typically get the URL from the backend response
  // For now, we'll use a mock URL or the generated blob URL for preview
  const imageUrl = response?.data?.url || URL.createObjectURL(uploadFile.raw);
  console.log("Mock Image Upload Success. URL:", imageUrl);
  newsForm.listImageSrc = imageUrl; 
  // Manually trigger validation for listImageSrc after successful upload
  formRef.value?.validateField('listImageSrc'); 
};

const beforeImageUpload = (rawFile) => {
  const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png';
  const isLt2M = rawFile.size / 1024 / 1024 < 2;

  if (!isJpgOrPng) {
    ElMessage.error('上传图片只能是 JPG 或 PNG 格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

// Mock HTTP request to prevent actual upload for now
const mockHttpRequest = (options) => {
  console.log("Mock HTTP Request called for upload");
  // Simulate successful upload after a short delay
  setTimeout(() => {
    // Create a mock success response (adjust structure based on your expected backend response)
    const mockResponse = { data: { url: '/images/mock-uploaded-image.jpg' } }; 
    options.onSuccess(mockResponse, { raw: options.file }); // Call the success handler
  }, 500);
  // Return a promise that never resolves to prevent default upload behavior
  return new Promise(() => {});
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

/* Styles for Image Uploader */
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
  width: 178px; /* Adjust size as needed */
  height: 178px;
  text-align: center;
  line-height: 178px; /* Center icon vertically */
}

.news-image-preview {
  width: 178px; 
  height: 178px;
  display: block;
  object-fit: contain; /* Or cover, depending on desired preview */
}

</style> 