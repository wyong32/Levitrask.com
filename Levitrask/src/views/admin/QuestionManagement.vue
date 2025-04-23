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
      <el-table-column prop="listTitle" label="标题" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
        <!-- Basic Info -->
        <el-row :gutter="20">
           <el-col :span="12">
            <el-form-item label="URL Slug (路径)" prop="slug">
              <el-input v-model="questionForm.slug" placeholder="例如: why-levitra-unavailable" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="列表标题 (List Title)" prop="listTitle">
              <el-input v-model="questionForm.listTitle" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Meta Info -->
        <el-divider>SEO Meta 信息</el-divider>
        <el-form-item label="Meta 标题" prop="metaTitle">
          <el-input v-model="questionForm.metaTitle" />
        </el-form-item>
        <el-form-item label="Meta 描述" prop="metaDescription">
          <el-input type="textarea" v-model="questionForm.metaDescription" :rows="2" />
        </el-form-item>
        <el-form-item label="Meta 关键词" prop="metaKeywords">
          <el-input v-model="questionForm.metaKeywords" placeholder="请用英文逗号分隔"/>
        </el-form-item>

        <!-- Left Navigation Sections -->
        <el-divider>左侧导航 (Nav Sections)</el-divider>
        <div v-for="(section, index) in questionForm.navSections" :key="index" class="dynamic-list-item">
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

        <!-- Right Sidebar Data -->
        <el-divider>右侧边栏内容 (Sidebar Data)</el-divider>
        <el-checkbox v-model="questionForm.includeRelatedResources" label="包含相关资源链接" size="large" />
        <div v-if="questionForm.includeRelatedResources" class="sidebar-section-editor">
            <h4>相关资源链接:</h4>
            <div v-for="(link, index) in questionForm.relatedResources" :key="index" class="dynamic-list-item">
                <el-row :gutter="10">
                    <el-col :span="10">
                        <el-form-item :label="`链接 ${index + 1} 文本`" :prop="`relatedResources.${index}.text`" :rules="formRules.sidebarLinkText">
                            <el-input v-model="link.text" placeholder="显示的链接文字" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                       <el-form-item :label="`链接 ${index + 1} 路径 (To)`" :prop="`relatedResources.${index}.to`" :rules="formRules.sidebarLinkTo">
                            <el-input v-model="link.to" placeholder="例如: /blog/some-post 或 /questions/other-q" />
                       </el-form-item>
                    </el-col>
                    <el-col :span="4" class="dynamic-list-actions">
                        <el-button type="danger" @click="removeRelatedResource(index)" :icon="Delete" circle />
                    </el-col>
                </el-row>
            </div>
             <el-button @click="addRelatedResource" type="success" plain :icon="Plus">添加相关资源</el-button>
        </div>

        <el-checkbox v-model="questionForm.includeFaqs" label="包含常见问题链接" size="large" style="margin-top: 15px;"/>
         <div v-if="questionForm.includeFaqs" class="sidebar-section-editor">
            <h4>常见问题链接:</h4>
             <div v-for="(link, index) in questionForm.faqs" :key="index" class="dynamic-list-item">
                <el-row :gutter="10">
                     <el-col :span="10">
                        <el-form-item :label="`链接 ${index + 1} 文本`" :prop="`faqs.${index}.text`" :rules="formRules.sidebarLinkText">
                            <el-input v-model="link.text" placeholder="显示的链接文字" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                       <el-form-item :label="`链接 ${index + 1} 路径 (To)`" :prop="`faqs.${index}.to`" :rules="formRules.sidebarLinkTo">
                            <el-input v-model="link.to" placeholder="例如: /questions/another-faq" />
                       </el-form-item>
                    </el-col>
                    <el-col :span="4" class="dynamic-list-actions">
                        <el-button type="danger" @click="removeFaq(index)" :icon="Delete" circle />
                    </el-col>
                </el-row>
            </div>
             <el-button @click="addFaq" type="success" plain :icon="Plus">添加常见问题</el-button>
        </div>
        <!-- Add checkboxes and editors for other potential sidebar sections (drugStatus, quickSummary) if needed -->

        <!-- Main Content -->
        <el-divider>主要内容 (HTML)</el-divider>
        <el-form-item label="内容 (Content - HTML Source)" prop="content">
           <div class="form-hint" style="margin-bottom: 5px;">
             请确保使用 `<section id="..."></section>` 包裹主要内容块，并且 `id` 与上面定义的左侧导航 ID 对应。
           </div>
           <el-input 
             type="textarea" 
             v-model="questionForm.content" 
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
import { Plus, Delete } from '@element-plus/icons-vue'; // Import icons

// --- State --- 
const tableData = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isDialogVisible = ref(false);
const isEditMode = ref(false); 
const currentEditId = ref(null);
const isLoadingDetails = ref(false); // Add state for loading details in edit mode

// --- Form Initial State & Data --- 
const getInitialFormState = () => ({
  slug: '',
  listTitle: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  navSections: [], // Array for left nav [{ id: '', title: '' }]
  // Sidebar related state
  includeRelatedResources: false,
  relatedResources: [], // Array for related links [{ text: '', to: '' }]
  includeFaqs: false,
  faqs: [], // Array for FAQ links [{ text: '', to: '' }]
  // Add flags/arrays for other sidebar sections if needed
  content: ''
});

const questionForm = reactive(getInitialFormState());
const formRef = ref(null); 

// --- Form Validation Rules --- 
const formRules = reactive({
  slug: [
      { required: true, message: '请输入 URL Slug', trigger: 'blur' },
      { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug 只能包含小写字母、数字和连字符 (-)', trigger: 'blur' }
  ],
  listTitle: [{ required: true, message: '请输入列表标题', trigger: 'blur' }],
  metaTitle: [{ required: true, message: '请输入 Meta 标题', trigger: 'blur' }],
  metaDescription: [{ required: true, message: '请输入 Meta 描述', trigger: 'blur' }],
  metaKeywords: [{ required: true, message: '请输入 Meta 关键词', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  // Rules for dynamic lists
  navSectionId: [
      { required: true, message: '请输入导航项 ID', trigger: 'blur' },
      // Add pattern validation for ID if needed (e.g., no spaces)
      { pattern: /^[a-zA-Z0-9_-]+$/, message: 'ID 只能包含字母、数字、下划线或连字符', trigger: 'blur' }
  ],
  navSectionTitle: [{ required: true, message: '请输入导航项标题', trigger: 'blur' }],
  sidebarLinkText: [{ required: true, message: '请输入链接文本', trigger: 'blur' }],
  sidebarLinkTo: [{ required: true, message: '请输入链接路径', trigger: 'blur' }], 
});

// --- Computed --- 
const dialogTitle = computed(() => isEditMode.value ? '编辑问题' : '创建新问题');

// --- API Base URL ---
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// --- Methods --- 
const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await axios.get(`${apiBaseUrl}/api/questions`); // Fetch questions
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      tableData.value = Object.values(response.data);
    } else if (Array.isArray(response.data)) {
      // Handle if API unexpectedly returns an array
      tableData.value = response.data;
    } else {
      console.warn('API response data is neither an object nor an array:', response.data);
      tableData.value = [];
      errorMessage.value = '收到的数据格式无法处理。'
    }
  } catch (error) {
    console.error('获取问题列表失败:', error);
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
  Object.assign(questionForm, JSON.parse(JSON.stringify(getInitialFormState())));
  currentEditId.value = null; 
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  isDialogVisible.value = true;
};

const handleEdit = async (row) => { 
    const questionId = row.question_id;
    if (!questionId) {
        ElMessage({ type: 'error', message: '无法获取问题 ID' });
        return;
    }
    
    isEditMode.value = true;
    resetForm(); // Reset form first
    currentEditId.value = questionId;
    isDialogVisible.value = true; // Open dialog immediately to show loading state
    isLoadingDetails.value = true; // Indicate loading details
    errorMessage.value = ''; // Clear previous errors

    console.log(`Attempting to fetch details for question ID: ${questionId}`);

    try {
        const apiUrl = `${apiBaseUrl}/api/questions/${questionId}`;
        // No need for auth token on GET request (usually)
        // If your GET /:id requires auth, add the config back
        const response = await axios.get(apiUrl);
        const details = response.data;

        if (!details) {
            throw new Error('Received empty data from API');
        }

        console.log('Fetched details:', details);

        // --- Populate Form --- 
        questionForm.slug = details.id || questionId; // Use the ID from data or param
        questionForm.listTitle = details.listTitle || '';
        questionForm.metaTitle = details.metaTitle || '';
        questionForm.metaDescription = details.metaDescription || '';
        questionForm.metaKeywords = details.metaKeywords || '';
        questionForm.content = details.content || '';

        // Parse and populate navSections
        try {
            questionForm.navSections = Array.isArray(details.navSections) 
                ? details.navSections 
                : (typeof details.navSections === 'string' ? JSON.parse(details.navSections) : []);
        } catch (e) {
            console.error("Error parsing navSections for edit:", e);
            questionForm.navSections = [];
        }
        
        // Parse and populate sidebarData and checkboxes
        let sidebarObj = {};
        try {
            sidebarObj = typeof details.sidebarData === 'object' && details.sidebarData !== null
                ? details.sidebarData
                : (typeof details.sidebarData === 'string' ? JSON.parse(details.sidebarData) : {});
        } catch (e) {
             console.error("Error parsing sidebarData for edit:", e);
             sidebarObj = {};
        }

        questionForm.relatedResources = Array.isArray(sidebarObj.relatedResources) ? sidebarObj.relatedResources : [];
        questionForm.includeRelatedResources = questionForm.relatedResources.length > 0;
        
        questionForm.faqs = Array.isArray(sidebarObj.frequentlyAskedQuestions) ? sidebarObj.frequentlyAskedQuestions : [];
        questionForm.includeFaqs = questionForm.faqs.length > 0;
        
        // Add population for other sidebar sections if they exist
        // e.g., questionForm.quickSummary = sidebarObj.quickSummary || '';
        //       questionForm.includeQuickSummary = !!questionForm.quickSummary;

        console.log('Form populated:', JSON.parse(JSON.stringify(questionForm))); // Log populated form state

    } catch (error) {
        console.error('Failed to fetch question details for editing:', error);
        errorMessage.value = `加载编辑数据失败: ${error.response?.data?.message || error.message || '未知错误'}`;
        ElMessage({ type: 'error', message: errorMessage.value });
        closeDialog(); // Close dialog if fetching details fails
    } finally {
        isLoadingDetails.value = false;
    }
 };

const handleDelete = async (row) => {
  const questionId = row.question_id; // Use the correct ID
  if (!questionId) {
      ElMessage({ type: 'error', message: '无法获取问题 ID' });
      return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除问题 "${row.listTitle || questionId}" 吗？此操作无法撤销。`,
      '确认删除',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // User confirmed
    console.log(`Attempting to delete question with ID: ${questionId}`);
    isSubmitting.value = true; // Reuse submitting state for loading indicator?

    try {
      const apiUrl = `${apiBaseUrl}/api/questions/${questionId}`;
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('admin-auth-token')}` } };
      
      await axios.delete(apiUrl, config);
      
      ElMessage({ type: 'success', message: '删除成功' });
      await fetchData(); // Refresh the table data

    } catch (apiError) {
      console.error('Delete failed:', apiError);
      const message = apiError.response?.data?.message || apiError.message || '删除失败';
      ElMessage({ type: 'error', message: `删除失败: ${message}` });
    } finally {
       isSubmitting.value = false; // Reset loading state
    }

  } catch (cancel) {
    // User clicked cancel in the confirmation dialog
    ElMessage({ type: 'info', message: '已取消删除' });
  }
};

const closeDialog = () => {
  isDialogVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
       isSubmitting.value = true;
       errorMessage.value = ''; // Clear previous errors
       
       // --- Prepare Payload --- 
       const sidebarDataPayload = {};
       if (questionForm.includeRelatedResources && questionForm.relatedResources.length > 0) {
           sidebarDataPayload.relatedResources = questionForm.relatedResources;
       }
       if (questionForm.includeFaqs && questionForm.faqs.length > 0) {
           sidebarDataPayload.frequentlyAskedQuestions = questionForm.faqs; 
       }

       // Base payload structure
       const basePayload = {
           listTitle: questionForm.listTitle,
           metaTitle: questionForm.metaTitle,
           metaDescription: questionForm.metaDescription,
           metaKeywords: questionForm.metaKeywords,
           navSections: questionForm.navSections,
           sidebarData: sidebarDataPayload, 
           content: questionForm.content,
       };

       // Add slug only for POST (create) requests
       const payload = isEditMode.value ? 
           { ...basePayload } : 
           { ...basePayload, slug: questionForm.slug }; 

       console.log("Payload to send:", payload);

       // --- API Call --- 
       try {
           const config = { headers: { Authorization: `Bearer ${localStorage.getItem('admin-auth-token')}` } };
           let response;

           if (isEditMode.value) {
               // PUT Request (Payload already excludes slug)
               const apiUrl = `${apiBaseUrl}/api/questions/${currentEditId.value}`;
               response = await axios.put(apiUrl, payload, config);
           } else {
               // POST Request (Payload now includes slug)
               const apiUrl = `${apiBaseUrl}/api/questions`;
               response = await axios.post(apiUrl, payload, config);
           }
           
           ElMessage({ type: 'success', message: isEditMode.value ? '更新成功' : '创建成功' });
           closeDialog();
           await fetchData(); // Refresh the table data
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

// --- Dynamic List Methods (Adding these back) ---
const addNavSection = () => {
  questionForm.navSections.push({ id: '', title: '' });
};
const removeNavSection = (index) => {
  questionForm.navSections.splice(index, 1);
};

const addRelatedResource = () => {
  questionForm.relatedResources.push({ text: '', to: '' });
};
const removeRelatedResource = (index) => {
  questionForm.relatedResources.splice(index, 1);
};

const addFaq = () => {
  questionForm.faqs.push({ text: '', to: '' });
};
const removeFaq = (index) => {
  questionForm.faqs.splice(index, 1);
};

// --- Lifecycle Hooks --- 
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
</style> 