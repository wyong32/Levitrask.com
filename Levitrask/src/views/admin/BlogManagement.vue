<template>
  <div> <!-- Root element -->
    <div class="main-header">
      <h2>博客管理</h2>
      <el-button type="primary" @click="openCreateDialog">创建博客</el-button>
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
      <el-table-column prop="listDate" label="日期" width="150" /> 
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
      @close="resetForm"
    >
      <el-form 
        ref="formRef" 
        :model="blogForm" 
        :rules="formRules" 
        label-width="120px"
        label-position="top"
      >
        <el-row :gutter="20"> 
          <el-col :span="12">
            <el-form-item label="URL Slug (路径)" prop="slug">
              <el-input v-model="blogForm.slug" placeholder="例如: my-first-blog-post" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="列表标题 (List Title)" prop="listTitle">
              <el-input v-model="blogForm.listTitle" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
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
           <el-col :span="12">
             <el-form-item label="列表来源/作者 (List Source)" prop="listSource">
                <el-input v-model="blogForm.listSource" />
             </el-form-item>
           </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="列表图片 (List Image)" prop="listImageSrc">
              <el-upload
                class="blog-image-uploader" 
                action="#" 
                :show-file-list="false"
                :on-success="handleImageSuccess" 
                :before-upload="beforeImageUpload"
                :http-request="mockHttpRequest" 
              >
                <img v-if="blogForm.listImageSrc" :src="blogForm.listImageSrc" class="blog-image-preview" alt="预览"/>
                <el-icon v-else class="el-icon--upload"><upload-filled /></el-icon>
                <div v-if="!blogForm.listImageSrc" class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
              </el-upload>
              <div class="el-upload__tip">
                只能上传 jpg/png 文件，且不超过 2MB
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="列表描述 (List Description)" prop="listDescription">
           <el-input type="textarea" v-model="blogForm.listDescription" :rows="3" />
        </el-form-item>
        
        <el-divider>SEO Meta 信息</el-divider>

        <el-form-item label="Meta 标题 (Meta Title)" prop="metaTitle">
           <el-input v-model="blogForm.metaTitle" />
        </el-form-item>
        <el-form-item label="Meta 描述 (Meta Description)" prop="metaDescription">
            <el-input type="textarea" v-model="blogForm.metaDescription" :rows="3" />
        </el-form-item>
        <el-form-item label="Meta 关键词 (Meta Keywords)" prop="metaKeywords">
            <el-input v-model="blogForm.metaKeywords" placeholder="请用英文逗号分隔"/>
        </el-form-item>

        <el-divider>左侧导航 (Nav Sections)</el-divider>
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
        <el-button @click="addNavSection" type="success" plain :icon="Plus">添加导航项</el-button>
        <p class="form-hint">提示: 此处的 ID 必须与下方内容中使用的 section 标签的 ID 完全一致。</p>

        <el-divider>右侧边栏内容 (Sidebar Data)</el-divider>
        <el-checkbox v-model="blogForm.includeRelatedPosts" label="包含相关博客链接" size="large" />
        <div v-if="blogForm.includeRelatedPosts" class="sidebar-section-editor">
            <h4>相关博客链接:</h4>
            <div v-for="(link, index) in blogForm.relatedPosts" :key="index" class="dynamic-list-item">
                <el-row :gutter="10">
                    <el-col :span="10">
                        <el-form-item :label="`链接 ${index + 1} 文本`" :prop="`relatedPosts.${index}.text`" :rules="formRules.sidebarLinkText">
                            <el-input v-model="link.text" placeholder="显示的链接文字" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                       <el-form-item :label="`链接 ${index + 1} 路径 (To)`" :prop="`relatedPosts.${index}.to`" :rules="formRules.sidebarLinkTo">
                            <el-input v-model="link.to" placeholder="例如: /blog/another-post" />
                       </el-form-item>
                    </el-col>
                    <el-col :span="4" class="dynamic-list-actions">
                        <el-button type="danger" @click="removeRelatedPost(index)" :icon="Delete" circle />
                    </el-col>
                </el-row>
            </div>
             <el-button @click="addRelatedPost" type="success" plain :icon="Plus">添加相关博客</el-button>
        </div>

        <el-checkbox v-model="blogForm.includeFaqs" label="包含常见问题链接" size="large" style="margin-top: 15px;"/>
         <div v-if="blogForm.includeFaqs" class="sidebar-section-editor">
            <h4>常见问题链接:</h4>
             <div v-for="(link, index) in blogForm.faqs" :key="index" class="dynamic-list-item">
                <el-row :gutter="10">
                     <el-col :span="10">
                        <el-form-item :label="`链接 ${index + 1} 文本`" :prop="`faqs.${index}.text`" :rules="formRules.sidebarLinkText">
                            <el-input v-model="link.text" placeholder="显示的链接文字" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                       <el-form-item :label="`链接 ${index + 1} 路径 (To)`" :prop="`faqs.${index}.to`" :rules="formRules.sidebarLinkTo">
                            <el-input v-model="link.to" placeholder="例如: /questions/some-faq" />
                       </el-form-item>
                    </el-col>
                    <el-col :span="4" class="dynamic-list-actions">
                        <el-button type="danger" @click="removeFaq(index)" :icon="Delete" circle />
                    </el-col>
                </el-row>
            </div>
             <el-button @click="addFaq" type="success" plain :icon="Plus">添加常见问题</el-button>
        </div>

        <el-divider>主要内容 (HTML)</el-divider>
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
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled, Plus, Delete } from '@element-plus/icons-vue'; // Import upload icon

// --- State --- 
const tableData = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isDialogVisible = ref(false);
const isEditMode = ref(false); 
const currentEditId = ref(null); 
const isLoadingDetails = ref(false); 

// --- Form Initial State --- 
const getInitialFormState = () => ({
  slug: '',
  listTitle: '',
  listDate: null, // Use null for date picker initial value
  listSource: '',
  listImageSrc: '', // Will store the image URL or base64
  listDescription: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  content: '',
  navSections: [],
  includeRelatedPosts: false,
  relatedPosts: [],
  includeFaqs: false,
  faqs: []
});

// --- Form Data --- 
const blogForm = reactive(getInitialFormState());
const formRef = ref(null); 

// --- Form Validation Rules --- 
const formRules = reactive({
  slug: [
      { required: true, message: '请输入 URL Slug', trigger: 'blur' },
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符 (-)', trigger: 'blur' }
  ],
  listTitle: [{ required: true, message: '请输入列表标题', trigger: 'blur' }],
  listImageSrc: [{ required: true, message: '请上传列表图片', trigger: 'change' }],
  listDescription: [{ required: true, message: '请输入列表描述', trigger: 'blur' }],
  metaTitle: [{ required: true, message: '请输入 Meta 标题', trigger: 'blur' }],
  metaDescription: [{ required: true, message: '请输入 Meta 描述', trigger: 'blur' }],
  metaKeywords: [{ required: true, message: '请输入 Meta 关键词', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  navSectionId: [
      { required: true, message: '请输入导航项 ID', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_-]+$/, message: 'ID 只能包含字母、数字、下划线或连字符', trigger: 'blur' }
  ],
  navSectionTitle: [{ required: true, message: '请输入导航项标题', trigger: 'blur' }],
  sidebarLinkText: [{ required: true, message: '请输入链接文本', trigger: 'blur' }],
  sidebarLinkTo: [{ required: true, message: '请输入链接路径', trigger: 'blur' }], 
});

// --- Computed --- 
const dialogTitle = computed(() => isEditMode.value ? '编辑博客' : '创建新博客');

// --- API Base URL ---
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// --- Methods --- 
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await axios.get(`${apiBaseUrl}/api/blogs`);
     if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      tableData.value = Object.entries(response.data).map(([id, blog]) => ({ ...blog, id })); 
    } else if (Array.isArray(response.data)) {
      tableData.value = response.data; 
    } else {
      console.warn('API response data for blogs is not in the expected format:', response.data);
      tableData.value = [];
      errorMessage.value = '收到的博客数据格式无法处理。'
    }
  } catch (error) {
    console.error('获取博客列表失败:', error);
    errorMessage.value = `无法加载博客数据 (${error.message || '未知错误'})。`;
    tableData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields(); // Resets validation state
  }
  Object.assign(blogForm, getInitialFormState()); // Reset reactive form 
  currentEditId.value = null; 
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm(); 
  isDialogVisible.value = true;
};

const closeDialog = () => {
  isDialogVisible.value = false;
  // No need to call resetForm here as it's called on @close event of dialog
};

const addNavSection = () => {
  blogForm.navSections.push({ id: '', title: '' });
};

const removeNavSection = (index) => {
  blogForm.navSections.splice(index, 1);
};

const addRelatedPost = () => {
  blogForm.relatedPosts.push({ text: '', to: '' });
};

const removeRelatedPost = (index) => {
  blogForm.relatedPosts.splice(index, 1);
};

const addFaq = () => {
  blogForm.faqs.push({ text: '', to: '' });
};

const removeFaq = (index) => {
  blogForm.faqs.splice(index, 1);
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        const payload = {
            slug: blogForm.slug,
            listTitle: blogForm.listTitle,
            listDate: blogForm.listDate,
            listSource: blogForm.listSource,
            listImage: {
                src: blogForm.listImageSrc,
            },
            listDescription: blogForm.listDescription,
            metaTitle: blogForm.metaTitle,
            metaDescription: blogForm.metaDescription,
            metaKeywords: blogForm.metaKeywords,
            content: blogForm.content,
            navSections: blogForm.navSections,
            includeRelatedPosts: blogForm.includeRelatedPosts,
            relatedPosts: blogForm.relatedPosts,
            includeFaqs: blogForm.includeFaqs,
            faqs: blogForm.faqs
        };
        
        const token = localStorage.getItem('admin-auth-token');
        console.log("Retrieved admin-auth-token:", token);
        
        if (!token) {
          ElMessage.error('认证令牌未找到，请重新登录。');
          isSubmitting.value = false;
          return;
        }
        const config = {
            headers: { 
                Authorization: `Bearer ${token}` 
            }
        };
        console.log("Request Config:", JSON.parse(JSON.stringify(config)));
        console.log("Request Payload for", isEditMode.value ? "Update" : "Create", ":", JSON.parse(JSON.stringify(payload)));

        if (isEditMode.value) {
          const updateUrl = `${apiBaseUrl}/api/blogs/${currentEditId.value}`;
          console.log(`Sending PUT request to ${updateUrl}`);
          const response = await axios.put(updateUrl, payload, config);
          console.log('Update response:', response);
          ElMessage.success('博客更新成功！');
        } else {
          const createUrl = `${apiBaseUrl}/api/blogs`;
          console.log(`Sending POST request to ${createUrl}`);
          const response = await axios.post(createUrl, payload, config);
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
        ElMessage.error(`${isEditMode.value ? '更新' : '创建'}失败: ${errorMsg}`);
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

const handleImageSuccess = (response, uploadFile) => {
    console.log("handleImageSuccess called, src should be set by mockHttpRequest", blogForm.listImageSrc);
    formRef.value?.validateField('listImageSrc');
};

const beforeImageUpload = (rawFile) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('图片只能是 JPG 或 PNG 格式!');
    return false;
  }
  if (rawFile.size > maxSize) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

const mockHttpRequest = ({ file, onSuccess, onError }) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    blogForm.listImageSrc = e.target.result; 
    onSuccess(true); 
    formRef.value?.validateField('listImageSrc'); 
  };
  reader.onerror = (e) => {
    console.error("File reading error:", e);
    ElMessage.error('图片读取失败。');
    onError(e);
  };
  reader.readAsDataURL(file);
};

onMounted(() => {
  fetchData();
});

const handleEdit = async (row) => {
  console.log("Edit clicked for row:", row);
  isEditMode.value = true;
  resetForm(); // Reset form before fetching/populating
  currentEditId.value = row.id; // Set ID AFTER resetting form

  isDialogVisible.value = true; // Open dialog immediately
  isLoadingDetails.value = true; // Show loading state for details

  try {
    const token = localStorage.getItem('admin-auth-token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const detailUrl = `${apiBaseUrl}/api/blogs/${row.id}`;
    console.log(`Fetching blog details from: ${detailUrl}`);
    const response = await axios.get(detailUrl, config);
    const fetchedData = response.data;
    console.log("Fetched blog details:", fetchedData);

    // Populate the form with fetched data
    blogForm.slug = fetchedData.blog_id || fetchedData.id; // Use blog_id from fetched data
    blogForm.listTitle = fetchedData.listTitle || '';
    blogForm.listDate = fetchedData.listDate || null;
    blogForm.listSource = fetchedData.listSource || ''; // Assuming listSource exists in fetched data
    
    // Handle listImage - assuming fetchedData.listImage contains the Base64 string or URL
    blogForm.listImageSrc = fetchedData.listImage || ''; 
    blogForm.listDescription = fetchedData.listDescription || '';
    blogForm.metaTitle = fetchedData.metaTitle || '';
    blogForm.metaDescription = fetchedData.metaDescription || '';
    blogForm.metaKeywords = fetchedData.metaKeywords || '';
    blogForm.content = fetchedData.content || '';
    
    // Populate dynamic fields
    blogForm.navSections = Array.isArray(fetchedData.navSections) ? fetchedData.navSections : [];
    
    // Populate sidebar fields from sidebarData object
    const sidebarData = fetchedData.sidebarData || {};
    blogForm.includeRelatedPosts = sidebarData.includeRelatedPosts || false;
    blogForm.relatedPosts = Array.isArray(sidebarData.relatedPosts) ? sidebarData.relatedPosts : [];
    blogForm.includeFaqs = sidebarData.includeFaqs || false;
    blogForm.faqs = Array.isArray(sidebarData.faqs) ? sidebarData.faqs : [];

    console.log("Form populated for edit:", JSON.parse(JSON.stringify(blogForm)));

  } catch (error) {
      console.error("Error fetching blog details for edit:", error);
      ElMessage.error(`无法加载博客详情: ${error.response?.data?.message || error.message}`);
      // Close the dialog if details fail to load?
      // closeDialog(); 
  } finally {
      isLoadingDetails.value = false;
  }
};

const handleDelete = async (row) => {
  console.log(`Delete button clicked for row:`, row);
  // Confirm before deleting
  ElMessageBox.confirm(
    `确定要删除博客 "${row.listTitle || '未命名'}" (ID: ${row.id}) 吗？此操作无法撤销。`,
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      console.log(`Attempting to delete blog item with ID: ${row.id}`);
      // --- API Call to Delete Blog ---
      try {
         const token = localStorage.getItem('admin-auth-token');
         if (!token) {
             ElMessage.error('认证失败，请重新登录');
             // Optionally redirect to login: router.push('/admin/login');
             return; 
         }

         const apiUrl = `${apiBaseUrl}/api/blogs/${row.id}`; // Use row.id (which should be the blog_id/slug)
         const config = {
             headers: { 
                 Authorization: `Bearer ${token}` 
             }
         };

         console.log(`Sending DELETE request to ${apiUrl}`);
         await axios.delete(apiUrl, config);
         
         ElMessage.success('博客删除成功！');
         // Refresh list after successful deletion
         // Use await here if fetchData returns a promise (which it does)
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
      // User cancelled the confirmation dialog
      ElMessage.info('已取消删除');
    });
};

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
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.dynamic-list-actions {
    display: flex;
    align-items: center; /* Vertically center button */
    justify-content: flex-end; /* Align button to the right */
    height: 32px; /* Match input height for alignment */
    padding-top: 20px; /* Adjust based on label position (top) */
}

.sidebar-section-editor {
    margin-top: 10px;
    padding: 15px;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
}
.form-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}

/* Styles for image upload */
.blog-image-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.blog-image-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.el-icon--upload {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.blog-image-preview {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: contain; /* Ensure image fits within bounds */
}

/* Add style for loading details inside dialog if needed */
.dialog-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000; /* Ensure it's above dialog content */
}
</style> 