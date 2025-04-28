<template>
  <div class="sidebar-management">
    <h1>侧边栏内容管理</h1>

    <el-button type="primary" @click="handleAdd" style="margin-bottom: 20px;">
      <el-icon><Plus /></el-icon> 添加侧边栏配置
    </el-button>

    <el-table :data="sidebarList" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="page_identifier" label="页面标识符" min-width="150"></el-table-column>
      <el-table-column label="侧边栏标题" min-width="150">
        <template #default="scope">
          {{ scope.row.sidebar_content?.title || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="内容预览 (HTML)" min-width="200">
          <template #default="scope">
              <div class="html-preview" v-if="scope.row.sidebar_content?.content">
                  {{ truncateHtml(scope.row.sidebar_content.content, 100) }}
              </div>
               <span v-else>-</span>
          </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="最后更新时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">
             <el-icon><Edit /></el-icon> 编辑
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">
             <el-icon><Delete /></el-icon> 删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑 对话框 -->
    <el-dialog
      :title="isEditing ? '编辑侧边栏配置' : '添加侧边栏配置'"
      v-model="dialogVisible"
      width="60%"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form :model="formData" :rules="formRules" ref="sidebarFormRef" label-width="120px">
        <el-form-item label="页面标识符" prop="page_identifier">
          <el-input v-model="formData.page_identifier" placeholder="例如: Home, /about, /blog/post-slug"></el-input>
           <div class="form-tip">请使用 Vue Router 中的路由 name (推荐) 或 path。</div>
        </el-form-item>
        <el-form-item label="侧边栏标题" prop="title">
          <el-input v-model="formData.title" placeholder="显示在侧边栏顶部的标题 (可选)"></el-input>
        </el-form-item>
        <el-form-item label="侧边栏内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="10"
            placeholder="输入侧边栏的 HTML 内容, 例如 <ul><li><a href='...'>链接</a></li></ul>"
          ></el-input>
          <div class="form-tip">请确保 HTML 结构正确，链接有效。系统不会校验 HTML 的有效性。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelForm">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ isEditing ? '保存更改' : '确认添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue'
import axios from 'axios' // 或者你封装的 API 服务
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

// --- API Setup (Standardized) ---
const baseUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || '') : ''; 
const api = axios.create({ baseURL: baseUrl });
console.log(`[API Setup SidebarMgmt] Axios configured with baseURL: '${baseUrl || '(empty for local proxy)'}'`);

// Add interceptor for token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin-auth-token'); // Ensure this key is correct
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('Admin auth token not found for API request in SidebarManagement.');
    // Optionally handle missing token
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- State ---
const sidebarList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const sidebarFormRef = ref(null) // 表单引用

// 表单数据
const formData = reactive({
  page_identifier: '',
  title: '',       // 从 sidebar_content 中分离出来方便编辑
  content: '',     // 从 sidebar_content 中分离出来方便编辑
})

// 表单验证规则
const formRules = reactive({
  page_identifier: [
    { required: true, message: '页面标识符不能为空', trigger: 'blur' },
  ],
  // title 和 content 可以是可选的，根据需求调整
  // content: [
  //   { required: true, message: '侧边栏内容不能为空', trigger: 'blur' },
  // ],
})

// --- Helper Functions ---

// 格式化日期时间
function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString();
  } catch (e) {
    return isoString; // 返回原始字符串如果格式化失败
  }
}

// 截断 HTML (非常基础的实现，仅移除标签并截断)
function truncateHtml(htmlString, maxLength) {
  if (!htmlString) return ''
  const text = htmlString.replace(/<[^>]*>/g, ''); // 移除所有 HTML 标签
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// --- API Calls (Using api instance) ---

// 获取侧边栏列表
async function fetchSidebars() {
  loading.value = true
  try {
    const response = await api.get('/api/sidebars/admin'); // Use api instance, path already correct
    sidebarList.value = response.data || []; // Handle null response
    console.log('Fetched sidebars:', sidebarList.value)
  } catch (error) {
    console.error('Error fetching sidebars:', error)
    ElMessage.error('获取侧边栏列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// --- Event Handlers ---

// 添加
function handleAdd() {
  isEditing.value = false
  editingId.value = null
  // 重置表单（在对话框打开时进行）
  resetFormInternal(); 
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEditing.value = true
  editingId.value = row.id
  // 从 row 数据填充表单
  formData.page_identifier = row.page_identifier;
  formData.title = row.sidebar_content?.title || ''; // 从 JSON 中取值
  formData.content = row.sidebar_content?.content || ''; // 从 JSON 中取值
  dialogVisible.value = true
}

// 删除
async function handleDelete(id) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个侧边栏配置吗？此操作不可撤销。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 用户确认删除
    loading.value = true; // Can use table loading or separate delete loading
    await api.delete(`/api/sidebars/admin/${id}`); // Use api instance, path already correct
    ElMessage.success('删除成功！');
    await fetchSidebars(); // Reload list

  } catch (error) {
    // If user clicks cancel, it enters catch ('cancel')
    if (error !== 'cancel') {
      console.error('Error deleting sidebar:', error)
      ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
    }
  } finally {
      loading.value = false;
  }
}

// 提交表单 (创建或更新)
async function submitForm() {
  if (!sidebarFormRef.value) return;
  
  sidebarFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      
      // Prepare payload (sidebar_content JSON object)
      const payload = {
          page_identifier: formData.page_identifier,
          sidebar_content: {
              title: formData.title || null, // Send null if empty
              content: formData.content || null // Send null if empty
          }
      };

      try {
        if (isEditing.value && editingId.value) {
          // Update existing
          await api.put(`/api/sidebars/admin/${editingId.value}`, payload); 
          ElMessage.success('侧边栏配置更新成功！');
        } else {
          // Create new
          await api.post('/api/sidebars/admin', payload);
          ElMessage.success('侧边栏配置添加成功！');
        }
        dialogVisible.value = false;
        await fetchSidebars(); // Refresh list
      } catch (error) {
        console.error('Error saving sidebar config:', error);
        ElMessage.error('保存失败: ' + (error.response?.data?.message || error.message));
      } finally {
        submitting.value = false;
      }
    } else {
      console.log('Sidebar form validation failed');
      return false;
    }
  });
}

// 取消表单
function cancelForm() {
  dialogVisible.value = false;
  // 重置表单（在对话框关闭时也会调用 resetForm）
}

// 重置表单的内部方法
function resetFormInternal() {
    formData.page_identifier = '';
    formData.title = '';
    formData.content = '';
    editingId.value = null;
    // 清除验证状态
    nextTick(() => {
        if (sidebarFormRef.value) {
            sidebarFormRef.value.clearValidate();
        }
    });
}

// 对话框关闭时重置表单状态
function resetForm() {
    resetFormInternal();
}

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchSidebars() // 组件加载时获取数据
})

</script>

<style scoped>
.sidebar-management {
  padding: 20px;
}

.html-preview {
    max-height: 60px; /* 限制预览高度 */
    overflow: hidden;
    text-overflow: ellipsis;
    /* white-space: nowrap; */ /* 如果想单行显示省略号 */
    font-size: 0.85em;
    color: #6c757d;
    background-color: #f8f9fa;
    padding: 5px;
    border-radius: 3px;
    border: 1px solid #dee2e6;
}

.form-tip {
    font-size: 0.85em;
    color: #6c757d;
    margin-top: 5px;
}

.dialog-footer {
  text-align: right;
}
</style> 