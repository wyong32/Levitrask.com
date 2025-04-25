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
                v-if="scope.row.listImageSrc" 
                :src="scope.row.listImageSrc" 
                :alt="scope.row.listImageAlt || '列表图片'" 
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
              <el-input v-model="blogForm.slug" placeholder="例如: my-first-blog-post" :disabled="isEditMode" />
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

        <el-divider>右侧边栏区块 (Sidebar Blocks)</el-divider>
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
import { Plus, Delete } from '@element-plus/icons-vue'; // Removed UploadFilled, added ArrowUpBold, ArrowDownBold if using move buttons
// import { ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue';

// --- State --- 
const tableData = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isDialogVisible = ref(false);
const isEditMode = ref(false); 
const currentEditId = ref(null); 
const isLoadingDetails = ref(false); 

// --- Form Initial State (MODIFIED) --- 
const getInitialFormState = () => ({
  slug: '',
  listTitle: '',
  listDate: null, 
  listSource: '',
  listImageSrc: '', 
  listImageAlt: '', 
  listDescription: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  content: '',
  navSections: [],
  sidebarData: [] // Initialize sidebarData as empty array
  // REMOVED: includeRelatedPosts, relatedPosts, includeFaqs, faqs
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
  // REMOVED: sidebarLinkText, sidebarLinkTo
  // ADDED: Rules for new sidebar blocks
  sidebarBlockTitle: [], // Title is optional, so no required rule by default
  sidebarBlockContent: [{ required: true, message: '侧边栏区块内容不能为空', trigger: 'blur' }] // Content is required
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
    const responseData = response.data; 
    
    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
      tableData.value = Object.entries(responseData).map(([id, blog]) => ({
         ...blog, 
         id: id, 
        })); 
    } else {
      console.warn('API response data for blogs is not the expected object format:', responseData);
      if(Array.isArray(responseData)){
         tableData.value = responseData.map(blog => ({ 
           ...blog, 
           id: blog.blog_id || blog.id 
         }));
      } else {
          tableData.value = [];
          errorMessage.value = '收到的博客数据格式无法处理。'
      } 
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

const addSidebarBlock = () => {
  // Add a new empty block object
  blogForm.sidebarData.push({ title: '', html_content: '' /*, display_order: blogForm.sidebarData.length + 1 */ });
};

const removeSidebarBlock = (index) => {
  // Remove the block at the specified index
  blogForm.sidebarData.splice(index, 1);
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
            listImageSrc: blogForm.listImageSrc,
            listImageAlt: blogForm.listImageAlt,
            listDescription: blogForm.listDescription,
            metaTitle: blogForm.metaTitle,
            metaDescription: blogForm.metaDescription,
            metaKeywords: blogForm.metaKeywords,
            content: blogForm.content,
            navSections: blogForm.navSections,
            sidebarData: blogForm.sidebarData
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
          const createPayload = { ...payload };
          if (!createPayload.slug) createPayload.slug = blogForm.slug;
          const createUrl = `${apiBaseUrl}/api/blogs`;
          console.log(`Sending POST request to ${createUrl}`);
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
    
    // Directly assign image URL
    blogForm.listImageSrc = fetchedData.listImage?.src || fetchedData.listImageSrc || fetchedData.listImage || ''; 
    blogForm.listImageAlt = fetchedData.listImage?.alt || fetchedData.listImageAlt || '';
    blogForm.listDescription = fetchedData.listDescription || '';
    blogForm.metaTitle = fetchedData.metaTitle || '';
    blogForm.metaDescription = fetchedData.metaDescription || '';
    blogForm.metaKeywords = fetchedData.metaKeywords || '';
    blogForm.content = fetchedData.content || '';
    
    // Populate dynamic fields
    blogForm.navSections = Array.isArray(fetchedData.navSections) ? fetchedData.navSections : [];
    
    // Populate sidebar fields from sidebarData object
    const sidebarData = fetchedData.sidebarData || {};
    blogForm.sidebarData = Array.isArray(sidebarData) ? sidebarData : [];

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